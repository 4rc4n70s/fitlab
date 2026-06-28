const fs = require('fs');

let code = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');

// Replace imports
code = code.replace("import { get, set } from 'idb-keyval'", 
`import { db } from '@/services/db'
import { uploadImageToSupabase } from '@/services/storage'`);

// Replace init logic
code = code.replace(/const loadCollections = async \(\) => \{[\s\S]*?loadCollections\(\)\n  \}, \[\]\)/, 
`const loadCollections = async () => {
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

    loadCollections()

    const handleUpdate = () => loadCollections()
    window.addEventListener('fitlab_collections_updated', handleUpdate)
    return () => window.removeEventListener('fitlab_collections_updated', handleUpdate)
  }, [])`);

// Fix handleDeleteCollection
code = code.replace(/const handleDeleteCollection = \(\) => \{[\s\S]*?setDeleteModal\(null\)\n  \}/,
`const handleDeleteCollection = async () => {
    if (!deleteModal) return
    try {
      if (deleteModal.type === 'collection') {
        await db.collections.deleteCollection(deleteModal.id)
      } else {
        const col = collections.find(c => c.id === deleteModal.colId)
        if (col) {
          const updatedGens = col.generations.filter(g => g.id !== deleteModal.id)
          await db.collections.updateCollection(col.id, { generations: updatedGens })
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
      
      if (deleteModal.type === 'collection' && currentCollection?.id === deleteModal.id) {
        setCurrentCollection(null)
      } else if (currentCollection?.id === deleteModal.colId) {
        setCurrentCollection(prev => prev ? {...prev, generations: prev.generations.filter(g => g.id !== deleteModal.id)} : null)
      }
    } catch(err) {
      console.error(err)
    }
    setDeleteModal(null)
  }`);

// Fix handleRegenerate to update in DB instead of idb
code = code.replace(/const handleRegenerate = async \(gen: Generation\) => \{[\s\S]*?setIsRegenerating\(false\)\n  \}/,
`const handleRegenerate = async (gen: Generation) => {
    if (!currentCollection) return
    setIsRegenerating(true)
    setRegeneratingId(gen.id)
    
    // Set to pending first
    const pendingGens = currentCollection.generations.map(g => 
      g.id === gen.id ? { ...g, status: 'pending' as const, errorMsg: undefined } : g
    )
    setCurrentCollection({ ...currentCollection, generations: pendingGens })
    setCollections(prev => prev.map(c => c.id === currentCollection.id ? { ...c, generations: pendingGens } : c))

    try {
      const { processVirtualTryOn } = await import('@/actions/gemini')
      // Note: selectedModel was added to processVirtualTryOn but we don't have it here, we'll pass undefined to fallback
      const response = await processVirtualTryOn(currentCollection.prompt, currentCollection.modelImage, currentCollection.clothes)
      
      let finalGens = []
      if (response.success && response.base64) {
        try {
          const publicUrl = await uploadImageToSupabase(\`data:\${response.mimeType};base64,\${response.base64}\`, 'generations')
          finalGens = pendingGens.map(g => 
            g.id === gen.id ? { ...g, status: 'success' as const, image: publicUrl } : g
          )
        } catch(uploadErr) {
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
    }
    
    setIsRegenerating(false)
    setRegeneratingId(null)
  }`);

fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', code);
