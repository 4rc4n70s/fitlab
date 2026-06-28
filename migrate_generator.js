const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/(main)/main/generator/page.tsx', 'utf8');

// Replace imports
code = code.replace("import { get, set } from 'idb-keyval'", 
`import { db } from '@/services/db'
import { uploadImageToSupabase } from '@/services/storage'`);

// Replace handleGenerate
code = code.replace(/const handleGenerate = async \(\) => \{[\s\S]*?setIsGenerating\(false\)\n  \}/,
`const handleGenerate = async () => {
    if (selectedClothes.length === 0 || selectedModels.length === 0 || masterPrompt.trim() === '') {
      alert('Por favor selecciona al menos una prenda, un modelo y escribe un prompt.')
      return
    }

    setIsGenerating(true)

    // Calculate combinations (all clothes x all models)
    const modelsToProcess = []
    const clothesB64s = selectedClothes.map(c => c.url)
    
    for (const model of selectedModels) {
      modelsToProcess.push(model)
    }

    try {
      // 1. Upload input images to Supabase first so they are public URLs
      const clothesUrls = await Promise.all(clothesB64s.map(c => uploadImageToSupabase(c, 'inputs')))
      
      // We will create one collection per model, containing the generations for that model + clothes
      for (let i = 0; i < modelsToProcess.length; i++) {
        const modelUrl = await uploadImageToSupabase(modelsToProcess[i].url, 'inputs')
        
        // Initial generations state (pending)
        const generations = clothesUrls.map((_, idx) => ({
          id: \`gen-\${Date.now()}-\${idx}\`,
          status: 'pending' as const,
          originalModelUrl: modelUrl,
          originalClothesUrls: clothesUrls
        }))

        // Create collection in DB
        const newCollection = await db.collections.createCollection({
          prompt: masterPrompt,
          clothes: clothesUrls,
          model_image: modelUrl,
          generations
        })

        // Dispatch so UI updates instantly
        window.dispatchEvent(new Event('fitlab_collections_updated'))

        // Process generation
        try {
          const response = await processVirtualTryOn(masterPrompt, modelsToProcess[i].url, clothesB64s, selectedModel)
          
          let finalGens = [...generations]
          if (response.success && response.base64) {
            try {
              const publicUrl = await uploadImageToSupabase(\`data:\${response.mimeType};base64,\${response.base64}\`, 'generations')
              finalGens = generations.map(g => ({ ...g, status: 'success', image: publicUrl }))
            } catch(e) {
              finalGens = generations.map(g => ({ ...g, status: 'error', errorMsg: 'Error al subir la imagen generada a Supabase' }))
            }
          } else {
            finalGens = generations.map(g => ({ ...g, status: 'error', errorMsg: response.error || 'API Error' }))
          }

          await db.collections.updateCollection(newCollection.id, { generations: finalGens })
          window.dispatchEvent(new Event('fitlab_collections_updated'))

        } catch (err: unknown) {
          console.error('Error generating image', err)
          const errorMessage = err instanceof Error ? err.message : 'Error de red inesperado.'
          const finalGens = generations.map(g => ({ ...g, status: 'error', errorMsg: errorMessage }))
          await db.collections.updateCollection(newCollection.id, { generations: finalGens })
          window.dispatchEvent(new Event('fitlab_collections_updated'))
        }

        if (i < modelsToProcess.length - 1) {
          await new Promise(r => setTimeout(r, 1500))
        }
      }
    } catch(err) {
      console.error(err)
      alert("Hubo un error al preparar la generación")
    }

    setIsGenerating(false)
  }`);

fs.writeFileSync('apps/web/src/app/(main)/main/generator/page.tsx', code);
