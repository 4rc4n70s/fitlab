'use client'
import { dbClient as db } from '@/services/collectionsClient'
import { uploadImageToSupabase } from '@/services/storage'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RefreshCw, Upload, Image as ImageIcon, X, Sparkles, Trash2, Folder, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { processVirtualTryOn } from '@/actions/gemini'
import { getSavedPrompts, savePrompt, deletePrompt } from '@/actions/prompts'

const ASPECT_RATIOS = [
  { label: '1:1', icon: 'Square' },
  { label: '4:3', icon: 'Landscape' },
  { label: '3:4', icon: 'Portrait' },
  { label: '16:9', icon: 'Widescreen' },
  { label: '9:16', icon: 'Vertical' },
]

export default function GeneratorPage() {
  const [masterPrompt, setMasterPrompt] = useState('')
  const [selectedRatio, setSelectedRatio] = useState('3:4')
  const router = useRouter()
  
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPromptsModal, setShowPromptsModal] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState<'clothes' | 'model' | null>(null)
  
  // Model state
        
  interface LibraryItem {
    id: string
    name: string
    type: 'clothes' | 'model'
    url: string
    date: string
    folderId?: string
  }

    
    
  const [selectedClothes, setSelectedClothes] = useState<LibraryItem[]>([])
  const [selectedModels, setSelectedModels] = useState<LibraryItem[]>([])
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [libraryFolders, setLibraryFolders] = useState<{id: string, name: string}[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    const init = async () => {
      // Load saved prompts
      const prompts = await getSavedPrompts()
      setSavedPrompts(prompts)
    }
    init()
  }, [])

  React.useEffect(() => {
    if (showLibraryModal) {
      const load = async () => {
        try {
          const dbFolders = await db.library.getFolders()
          const dbItems = await db.library.getItems()
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setLibraryFolders(dbFolders.map((f: any) => ({ id: f.id, name: f.name })))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setLibraryItems(dbItems.map((i: any) => ({
            id: i.id,
            name: i.name,
            type: i.type as 'clothes' | 'model',
            url: i.url,
            date: i.created_at,
            folderId: i.folder_id || undefined
          })))
        } catch (error) {
          console.error("Error loading library from Supabase:", error)
        }
      }
      load()
      setCurrentFolder(null)
      setCurrentPage(1)
    }
  }, [showLibraryModal])

    const handleGenerate = async () => {
    if (selectedClothes.length === 0 || selectedModels.length === 0) {
      alert('Por favor selecciona al menos una prenda y un modelo.')
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
      const modelUrls = await Promise.all(modelsToProcess.map(m => uploadImageToSupabase(m.url, 'inputs')))
      
      // 2. Initial generation state (pending). One image per model.
      let generations = modelUrls.map((modelUrl, idx) => ({
        id: `gen-${Date.now()}-${idx}`,
        status: 'pending' as const,
        date: new Date().toISOString(),
        originalModelUrl: modelUrl,
        originalClothesUrls: clothesUrls
      }))

      // 3. Create a SINGLE collection for this batch in DB
      const newCollection = await db.collections.createCollection({
        prompt: masterPrompt,
        clothes: clothesUrls,
        model_image: modelUrls[0], // fallback for old schema
        generations
      })

      // Dispatch so UI updates instantly
      window.dispatchEvent(new Event('fitlab_collections_updated'))

      // 4. Process each generation sequentially in the background (fire and forget)
      const runGenerationsInBackground = async () => {
        for (let i = 0; i < modelUrls.length; i++) {
          try {
            const response = await processVirtualTryOn(masterPrompt, modelUrls[i], clothesB64s, selectedRatio)
          
          if (response.success && response.base64) {
            try {
              const publicUrl = await uploadImageToSupabase(`data:${response.mimeType};base64,${response.base64}`, 'generations')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              generations = generations.map((g: any, idx: number) => 
                idx === i ? { ...g, status: 'success', image: publicUrl } : g
              )
            } catch {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              generations = generations.map((g: any, idx: number) => 
                idx === i ? { ...g, status: 'error', errorMsg: 'Error al subir la imagen generada a Supabase' } : g
              )
            }
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            generations = generations.map((g: any, idx: number) => 
              idx === i ? { ...g, status: 'error', errorMsg: response.error || 'API Error' } : g
            )
          }

          await db.collections.updateCollection(newCollection.id, { generations })
          window.dispatchEvent(new Event('fitlab_collections_updated'))

        } catch (err: unknown) {
          console.error('Error generating image', err)
          const errorMessage = err instanceof Error ? err.message : 'Error de red inesperado.'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          generations = generations.map((g: any, idx: number) => 
            idx === i ? { ...g, status: 'error', errorMsg: errorMessage } : g
          )
          await db.collections.updateCollection(newCollection.id, { generations })
          window.dispatchEvent(new Event('fitlab_collections_updated'))
        }

          if (i < modelUrls.length - 1) {
            await new Promise(r => setTimeout(r, 1500))
          }
        }
      }

      runGenerationsInBackground()
    } catch(err) {
      console.error(err)
      alert("Hubo un error al preparar la generación")
      setIsGenerating(false)
      return
    }

    setIsGenerating(false)
    router.push('/main/collections')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'clothes' | 'model') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Url = event.target?.result as string
      const newItem: LibraryItem = {
        id: `local-${Date.now()}`,
        name: file.name,
        type,
        url: base64Url,
        date: new Date().toISOString()
      }
      if (type === 'clothes') {
        setSelectedClothes(prev => [...prev, newItem])
      } else {
        setSelectedModels(prev => [...prev, newItem])
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSavePrompt = async () => {
    if (masterPrompt.trim() === '') {
      return
    }
    if (savedPrompts.includes(masterPrompt)) {
      return
    }
    const previous = [...savedPrompts]
    setSavedPrompts([masterPrompt, ...savedPrompts])
    const res = await savePrompt(masterPrompt)
    if (!res.success) {
      setSavedPrompts(previous)
    }
  }

  const handleDeletePrompt = async (e: React.MouseEvent, promptToDelete: string) => {
    e.stopPropagation()
    const previous = [...savedPrompts]
    setSavedPrompts(savedPrompts.filter(p => p !== promptToDelete))
    const res = await deletePrompt(promptToDelete)
    if (!res.success) {
      setSavedPrompts(previous)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pb-24">
      <div className="flex flex-col gap-10 p-6 md:p-10 max-w-6xl mx-auto w-full flex-1">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-heading font-semibold text-foreground">Generator</h1>
          <p className="text-muted text-base">Configura tu prompt y selecciona las prendas y modelos para generar nuevas imágenes.</p>
        </div>

        {/* 1. Prompt Engineering */}
        <section className="flex flex-col gap-4 border-b border-border pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Prompt Engineering</h2>
            <button 
              onClick={() => setShowPromptsModal(true)}
              className="px-4 py-2 text-sm border border-border rounded-lg bg-surface-card text-foreground hover:bg-surface-soft transition-colors font-medium"
            >
              Saved Prompts ({savedPrompts.length})
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Master Prompt</label>
              <button 
                onClick={handleSavePrompt}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground"
              >
                <Save className="w-4 h-4" /> Save Prompt
              </button>
            </div>
            <textarea 
              className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-surface-card text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/50 resize-y"
              placeholder="Describe the scene, lightning and composition"
              value={masterPrompt}
              onChange={(e) => setMasterPrompt(e.target.value)}
            />
          </div>
        </section>

        {/* 2. Aspect Ratio */}
        <section className="flex flex-col gap-4 border-b border-border pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Aspect Ratio</h2>
            <button 
              onClick={() => setSelectedRatio('3:4')}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground"
            >
              <RefreshCw className="w-4 h-4" /> Reset to defaults
            </button>
          </div>
          <p className="text-sm text-muted">Select the output dimensions for your generation.</p>
          
          <div className="grid grid-cols-5 gap-2 md:gap-4 w-full">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setSelectedRatio(ratio.label)}
                className={`flex flex-col items-center justify-center gap-2 w-full aspect-square border transition-all ${
                  selectedRatio === ratio.label 
                    ? 'border-foreground bg-surface-soft text-foreground shadow-sm' 
                    : 'border-border bg-surface-card text-muted hover:border-foreground/30'
                }`}
              >
                <div className="flex items-center justify-center h-10 w-10">
                  <div className={`
                    border-2 border-current rounded-sm
                  `} style={{
                    width: ratio.label === '1:1' ? '26px' : ratio.label === '4:3' ? '34px' : ratio.label === '3:4' ? '26px' : ratio.label === '16:9' ? '34px' : '20px',
                    height: ratio.label === '1:1' ? '26px' : ratio.label === '4:3' ? '26px' : ratio.label === '3:4' ? '34px' : ratio.label === '16:9' ? '20px' : '34px'
                  }} />
                </div>
                <span className="text-xs font-semibold">{ratio.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Clothes Selections */}
        <section className="flex flex-col gap-4 border-b border-border pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Clothes Selections</h2>
            <button 
              onClick={() => setShowLibraryModal('clothes')}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground"
            >
              <ImageIcon className="w-4 h-4" /> Select from Library
            </button>
          </div>
          <p className="text-sm text-muted">Todas las prendas seleccionadas se aplicarán a los modelos.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <label className="col-span-full h-48 border-2 border-dashed border-border bg-surface-card flex flex-col items-center justify-center gap-3 text-muted hover:border-foreground/30 hover:text-foreground cursor-pointer transition-colors relative">
              <input type="file" accept="image/png, image/jpeg, image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'clothes')} />
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-center px-4">Subir o Arrastrar Prenda</span>
                <span className="text-xs text-muted-foreground">Soporta PNG, JPG de hasta 10MB</span>
              </div>
            </label>
            {selectedClothes.map(item => (
              <div key={item.id} className="relative aspect-square overflow-hidden border border-border">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedClothes(prev => prev.filter(i => i.id !== item.id))} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md hover:bg-red-500/80 backdrop-blur-md">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Model Selections */}
        <section className="flex flex-col gap-4 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Model Selections</h2>
            <button 
              onClick={() => setShowLibraryModal('model')}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground"
            >
              <ImageIcon className="w-4 h-4" /> Select from Library
            </button>
          </div>
          <p className="text-sm text-muted">Se generará una foto por cada modelo cargado, utilizando las prendas anteriores.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <label className="col-span-full h-48 border-2 border-dashed border-border bg-surface-card flex flex-col items-center justify-center gap-3 text-muted hover:border-foreground/30 hover:text-foreground cursor-pointer transition-colors relative">
              <input type="file" accept="image/png, image/jpeg, image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'model')} />
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-center px-4">Subir o Arrastrar Modelo</span>
                <span className="text-xs text-muted-foreground">Soporta PNG, JPG de hasta 10MB</span>
              </div>
            </label>
            {selectedModels.map(item => (
              <div key={item.id} className="relative aspect-square overflow-hidden border border-border">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedModels(prev => prev.filter(i => i.id !== item.id))} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md hover:bg-red-500/80 backdrop-blur-md">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* 5. Fixed Footer */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 border-t border-border bg-surface-card/80 backdrop-blur-md p-4 px-6 md:px-10 z-10 flex justify-end gap-4">
        <button className="px-6 py-2.5 rounded-xl border border-border bg-transparent text-foreground hover:bg-surface-soft transition-colors font-medium">
          Discard
        </button>
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate
        </button>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-md p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-foreground">Starting Generation</h3>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-muted text-sm">Tu solicitud de generación ha sido encolada. Se procesarán las prendas y modelos seleccionados.</p>
              <div className="bg-surface-soft p-4 rounded-xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-foreground animate-pulse" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50"
              >
                {isGenerating ? 'Procesando (Toma un momento)...' : 'Confirmar e Ir a Collections'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Prompts Modal */}
      {showPromptsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-lg p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-foreground">Saved Prompts</h3>
              <button 
                onClick={() => setShowPromptsModal(false)}
                className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              {savedPrompts.length === 0 ? (
                <p className="text-muted text-sm text-center py-6">No tienes prompts guardados.</p>
              ) : (
                savedPrompts.map((prompt, i) => (
                  <div 
                    key={i} 
                    className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-surface-soft hover:border-foreground/30 transition-colors cursor-pointer group"
                    onClick={() => {
                      setMasterPrompt(prompt)
                      setShowPromptsModal(false)
                    }}
                  >
                    <p className="text-sm text-foreground flex-1 break-words font-medium">{prompt}</p>
                    <button 
                      onClick={(e) => handleDeletePrompt(e, prompt)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Eliminar Prompt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Library Selection Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-4xl p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95 max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-xl font-medium text-foreground">
                Selecciona {showLibraryModal === 'clothes' ? 'Prenda' : 'Modelo'} desde tu Librería
              </h3>
              <button 
                onClick={() => setShowLibraryModal(null)}
                className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-8">
              
              {/* Breadcrumbs */}
              {currentFolder && (
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <button onClick={() => setCurrentFolder(null)} className="hover:text-foreground transition-colors">Library</button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-foreground">{libraryFolders.find(f => f.id === currentFolder)?.name}</span>
                </div>
              )}

              {/* Folders (only in root) */}
              {!currentFolder && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-medium text-foreground uppercase tracking-wider">Carpetas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {libraryFolders.map(folder => (
                      <div 
                        key={folder.id}
                        onClick={() => { setCurrentFolder(folder.id); setCurrentPage(1); }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-card hover:border-foreground/30 cursor-pointer transition-colors"
                      >
                        <Folder className="w-5 h-5 text-muted shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{folder.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-medium text-foreground uppercase tracking-wider">
                  {currentFolder ? 'Contenido de la carpeta' : 'Todos los archivos'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {(() => {
                    const filteredLibraryItems = libraryItems
                      .filter(item => item.type === showLibraryModal)
                      .filter(item => currentFolder ? item.folderId === currentFolder : !item.folderId)
                    
                    const totalPages = Math.max(1, Math.ceil(filteredLibraryItems.length / ITEMS_PER_PAGE))
                    const paginatedItems = filteredLibraryItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    
                    return (
                      <>
                        {paginatedItems.map(item => {
                          const isSelected = showLibraryModal === 'clothes' 
                            ? selectedClothes.some(i => i.id === item.id) 
                            : selectedModels.some(i => i.id === item.id)

                          return (
                            <div 
                              key={item.id} 
                              className="group cursor-pointer flex flex-col gap-2 relative"
                              onClick={() => {
                                if (showLibraryModal === 'clothes') {
                                  if (isSelected) setSelectedClothes(prev => prev.filter(i => i.id !== item.id))
                                  else setSelectedClothes(prev => [...prev, item])
                                } else {
                                  if (isSelected) setSelectedModels(prev => prev.filter(i => i.id !== item.id))
                                  else setSelectedModels(prev => [...prev, item])
                                }
                              }}
                            >
                              <div className={`relative aspect-square overflow-hidden border-2 transition-all ${isSelected ? 'border-foreground shadow-sm' : 'border-border group-hover:border-foreground/50'}`}>
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                {isSelected && (
                                  <div className="absolute top-2 right-2 bg-foreground text-background p-1.5 rounded-full shadow-md animate-in zoom-in">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-foreground truncate px-1">{item.name}</span>
                            </div>
                          )
                        })}
                        
                        {filteredLibraryItems.length === 0 && (
                          <div className="col-span-full py-8 text-center text-muted">
                            No tienes {showLibraryModal === 'clothes' ? 'prendas' : 'modelos'} en tu librería.
                          </div>
                        )}

                        {totalPages > 1 && (
                          <div className="col-span-full flex justify-center items-center gap-4 mt-4">
                            <button 
                              disabled={currentPage === 1} 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className="p-2 rounded-lg border border-border bg-surface-card hover:bg-surface-soft disabled:opacity-50 transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-foreground">
                              Página {currentPage} de {totalPages}
                            </span>
                            <button 
                              disabled={currentPage === totalPages} 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className="p-2 rounded-lg border border-border bg-surface-card hover:bg-surface-soft disabled:opacity-50 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-border mt-auto">
              <button 
                onClick={() => setShowLibraryModal(null)}
                className="px-8 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
