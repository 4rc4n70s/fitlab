const fs = require('fs');

let code = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');

// Replace imports
code = code.replace("import { get, set } from 'idb-keyval'", 
`import { dbClient as db } from '@/services/collectionsClient'
import { uploadImageToSupabase } from '@/services/storage'`);

// Replace init logic
code = code.replace(/const init = async \(\) => \{[\s\S]*?init\(\)\n  \}, \[\]\)/, 
`const init = async () => {
      try {
        const dbCols = await db.collections.getCollections()
        setCollections(dbCols.map((c: any) => ({
          id: c.id,
          prompt: c.prompt,
          date: c.created_at,
          clothes: c.clothes,
          modelImage: c.model_image,
          generations: c.generations
        })))
      } catch (err) {
        console.error('Error fetching collections:', err)
      }
    }

    init()

    const handleUpdate = () => init()
    window.addEventListener('fitlab_collections_updated', handleUpdate)
    return () => window.removeEventListener('fitlab_collections_updated', handleUpdate)
  }, [])`);

// Fix handleDeleteConfirm
code = code.replace(/const handleDeleteConfirm = \(\) => \{[\s\S]*?setDeleteModal\(null\)\n  \}/,
`const handleDeleteConfirm = async () => {
    if (!deleteModal) return
    try {
      if (deleteModal.type === 'collection') {
        await db.collections.deleteCollection(deleteModal.collectionId)
      } else if (deleteModal.type === 'photo' && deleteModal.genId) {
        const col = collections.find(c => c.id === deleteModal.collectionId)
        if (col) {
          const updatedGens = col.generations.filter((g) => g.id !== deleteModal.genId)
          if (updatedGens.length === 0) {
            await db.collections.deleteCollection(deleteModal.collectionId)
          } else {
            await db.collections.updateCollection(col.id, { generations: updatedGens })
          }
        }
      }
      
      const dbCols = await db.collections.getCollections()
      setCollections(dbCols.map((c: any) => ({
        id: c.id,
        prompt: c.prompt,
        date: c.created_at,
        clothes: c.clothes,
        modelImage: c.model_image,
        generations: c.generations
      })))
      
      if (deleteModal.type === 'collection' && currentCollection?.id === deleteModal.collectionId) {
        setCurrentCollection(null)
      } else if (currentCollection?.id === deleteModal.collectionId) {
        setCurrentCollection(prev => prev ? {...prev, generations: prev.generations.filter(g => g.id !== deleteModal.genId)} : null)
      }
    } catch(err) {
      console.error(err)
    }
    setDeleteModal(null)
  }`);

// Fix handleRegenerateSubmit
code = code.replace(/const handleRegenerateSubmit = async \(\) => \{[\s\S]*?setRegenModal\(null\)\n    \}\n  \}/,
`const handleRegenerateSubmit = async () => {
    if (!regenModal || !currentCollection) return
    setIsRegenerating(true)
    
    const gen = regenModal.gen
    
    // Set to pending first
    const pendingGens = currentCollection.generations.map(g => 
      g.id === gen.id ? { ...g, status: 'pending' as const, errorMsg: undefined } : g
    )
    setCurrentCollection({ ...currentCollection, generations: pendingGens })
    setCollections(prev => prev.map(c => c.id === currentCollection.id ? { ...c, generations: pendingGens } : c))

    try {
      const { processVirtualTryOn, getAvailableModels } = await import('@/actions/gemini')
      const models = await getAvailableModels()
      const selectedModel = models.find((m: any) => m.name.toLowerCase().includes('nano banana'))?.id || models[0]?.id
      const response = await processVirtualTryOn(currentCollection.prompt, currentCollection.modelImage, currentCollection.clothes, selectedModel)
      
      let finalGens: any[] = []
      if (response.success && response.base64) {
        try {
          const publicUrl = await uploadImageToSupabase(\`data:\${response.mimeType};base64,\${response.base64}\`, 'generations')
          finalGens = pendingGens.map(g => 
            g.id === gen.id ? { ...g, status: 'success' as const, image: publicUrl } : g
          )
        } catch(e) {
          finalGens = pendingGens.map(g => 
            g.id === gen.id ? { ...g, status: 'error' as const, errorMsg: 'Error al subir la imagen' } : g
          )
        }
      } else {
        finalGens = pendingGens.map(g => 
          g.id === gen.id ? { ...g, status: 'error' as const, errorMsg: response.error || 'Failed to generate image' } : g
        )
      }
      
      await db.collections.updateCollection(currentCollection.id, { generations: finalGens })
      setCurrentCollection(prev => prev ? { ...prev, generations: finalGens } : null)
      setCollections(prev => prev.map(c => c.id === currentCollection.id ? { ...c, generations: finalGens } : c))
      
    } catch (err: unknown) {
      console.error('Error during regeneration', err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      const finalGens = pendingGens.map(g => 
        g.id === gen.id ? { ...g, status: 'error' as const, errorMsg } : g
      )
      await db.collections.updateCollection(currentCollection.id, { generations: finalGens })
      setCurrentCollection(prev => prev ? { ...prev, generations: finalGens } : null)
      setCollections(prev => prev.map(c => c.id === currentCollection.id ? { ...c, generations: finalGens } : c))
    } finally {
      setIsRegenerating(false)
      setRegenModal(null)
    }
  }`);

fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', code);
