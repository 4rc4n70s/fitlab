'use client'
import { dbClient as db } from '@/services/collectionsClient'
import { uploadImageToSupabase } from '@/services/storage'

import React, { useState, useEffect } from 'react'
import { Calendar, RefreshCw, AlertCircle, CheckCircle2, Images, Trash, Trash2, Download } from 'lucide-react'
import { ImageViewer } from '@/components/shared/image-viewer'
import Link from 'next/link'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Generation {
  id: string
  status: 'success' | 'error' | 'processing'
  date: string
  modelUrl?: string
  originalModelUrl?: string
  image?: string
  errorMsg?: string
}

interface Collection {
  id: string
  date: string
  prompt: string
  clothes: string[]
  modelImage?: string
  generations: Generation[]
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null)
  const [page, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [viewerImages, setViewerImages] = useState<{url: string, originalUrl?: string}[]>([])
  const [viewerIndex, setViewerIndex] = useState<number>(0)
  const [showViewer, setShowViewer] = useState(false)
  
  // Regenerate Modal state
  const [regenModal, setRegenModal] = useState<{ collectionId: string, genId: string, generation: Generation, prompt: string } | null>(null)
  const [regenBase, setRegenBase] = useState<'original' | 'result'>('original')
  const [deleteModal, setDeleteModal] = useState<{ type: 'collection' | 'photo', collectionId: string, genId?: string } | null>(null)
  
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Load from localStorage on mount and listen to updates
  useEffect(() => {
    const loadCols = async () => {
      try {
        const dbCols = await db.collections.getCollections()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    
    loadCols()
    
    window.addEventListener('fitlab_collections_updated', loadCols)
    const interval = setInterval(loadCols, 2000)
    
    return () => {
      window.removeEventListener('fitlab_collections_updated', loadCols)
      clearInterval(interval)
    }
  }, [])

  const openViewer = (generations: Generation[], index: number) => {
    const formatted = generations.map(g => ({
      url: g.image as string,
      originalUrl: g.originalModelUrl || g.modelUrl
    }))
    setViewerImages(formatted)
    setViewerIndex(index)
    setShowViewer(true)
  }

  const handleRegenerateSubmit = async () => {
    if (!regenModal || !currentCollection) return
    setIsRegenerating(true)
    
    const gen = regenModal.generation
    
    // Set to processing first
    const processingGens = currentCollection.generations.map(g => 
      g.id === gen.id ? { ...g, status: 'processing' as const, errorMsg: undefined } : g
    )
    setCurrentCollection({ ...currentCollection, generations: processingGens })
    setCollections(prev => prev.map(c => c.id === currentCollection.id ? { ...c, generations: processingGens } : c))

    try {
      const { processVirtualTryOn } = await import('@/actions/gemini')
      
      const response = await processVirtualTryOn(currentCollection.prompt, currentCollection.modelImage!, currentCollection.clothes, '3:4')
      
      let finalGens: Generation[] = []
      if (response.success && response.base64) {
        try {
          const publicUrl = await uploadImageToSupabase(`data:${response.mimeType};base64,${response.base64}`, 'generations')
          finalGens = processingGens.map(g => 
            g.id === gen.id ? { ...g, status: 'success' as const, image: publicUrl } : g
          )
        } catch {
          finalGens = processingGens.map(g => 
            g.id === gen.id ? { ...g, status: 'error' as const, errorMsg: 'Error al subir la imagen' } : g
          )
        }
      } else {
        finalGens = processingGens.map(g => 
          g.id === gen.id ? { ...g, status: 'error' as const, errorMsg: response.error || 'Failed to generate image' } : g
        )
      }
      
      await db.collections.updateCollection(currentCollection.id, { generations: finalGens })
      setCurrentCollection(prev => prev ? { ...prev, generations: finalGens } : null)
      setCollections(prev => prev.map(c => c.id === currentCollection.id ? { ...c, generations: finalGens } : c))
      
    } catch (err: unknown) {
      console.error('Error during regeneration', err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      const finalGens = processingGens.map(g => 
        g.id === gen.id ? { ...g, status: 'error' as const, errorMsg } : g
      )
      await db.collections.updateCollection(currentCollection.id, { generations: finalGens })
      setCurrentCollection(prev => prev ? { ...prev, generations: finalGens } : null)
      setCollections(prev => prev.map(c => c.id === currentCollection.id ? { ...c, generations: finalGens } : c))
    } finally {
      setIsRegenerating(false)
      setRegenModal(null)
    }
  }

  const handleDownloadImage = async (base64Url: string, name: string) => {
    try {
      const res = await fetch(base64Url)
      const blob = await res.blob()
      saveAs(blob, name)
    } catch (error: unknown) {
      console.error(error)
    }
  }

  const handleDownloadZip = async (collection: Collection) => {
    const zip = new JSZip()
    const successGens = collection.generations.filter(g => g.status === 'success' && g.image)
    if (successGens.length === 0) return
    
    for (let index = 0; index < successGens.length; index++) {
      const gen = successGens[index]
      if (!gen.image) continue
      try {
        const res = await fetch(gen.image)
        const blob = await res.blob()
        zip.file(`generacion_${index + 1}.jpg`, blob)
      } catch (err) {
        console.error('Error downloading image for ZIP', err)
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `coleccion_${collection.id}.zip`)
  }

  const handleDeleteConfirm = async () => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pb-24">
      <div className="flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto w-full flex-1">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-heading font-semibold text-foreground">Collections</h1>
          <p className="text-muted text-base">Historial de generaciones agrupadas por lote. Haz click en una imagen para abrir el visualizador.</p>
        </div>

      {collections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border bg-surface-card p-12 text-center my-8">
          <Images className="w-12 h-12 text-muted" />
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-lg font-medium text-foreground font-heading">No hay colecciones</h3>
            <p className="text-sm text-muted">Aún no has generado ninguna imagen. Ve a la sección del Generador para comenzar.</p>
          </div>
          <Link href="/main/generator" className="mt-2 px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium">
            Generar Imágenes
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {collections.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((collection) => {
            return (
              <div key={collection.id} className="flex flex-col gap-4">
                {/* Collection Header */}
                <div className="flex items-center gap-4 border-b border-border pb-2">
                  <h2 className="text-lg font-medium text-foreground">Colección: {collection.id.split('-')[0].toUpperCase()}</h2>
                  <span className="text-sm text-muted flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(collection.date).toLocaleString()}
                  </span>
                  
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => handleDownloadZip(collection)} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground font-medium">
                      <Download className="w-4 h-4" /> Descargar ZIP
                    </button>
                    <button 
                      onClick={() => setDeleteModal({ type: 'collection', collectionId: collection.id })}
                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Eliminar Colección"
                    >
                      <Trash className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>

                {/* Generations List */}
                <div className="flex flex-col gap-4">
                  {collection.generations.map((gen) => (
                    <div key={gen.id} className="flex bg-surface-card border border-border overflow-hidden shadow-sm hover:border-foreground/30 transition-colors">
                      
                      {/* Info Section */}
                      <div className="flex-1 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">ID: {gen.id}</span>
                            {gen.status === 'success' ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Completado
                              </span>
                            ) : gen.status === 'processing' ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Procesando...
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted">{new Date(gen.date || collection.date).toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted uppercase tracking-wider">Master Prompt</span>
                            <p className="text-sm text-foreground line-clamp-2">{collection.prompt}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted uppercase tracking-wider">Prendas Usadas</span>
                            <div className="flex gap-2">
                              {collection.clothes.map((cUrl, i) => (
                                <div key={i} className="w-10 h-10 bg-surface-soft border border-border overflow-hidden">
                                  <img src={cUrl} alt={`Prenda ${i}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {gen.status === 'error' && (
                          <p className="text-sm text-red-500 mt-2">Motivo: {gen.errorMsg}</p>
                        )}

                        <div className="mt-auto pt-4 flex gap-3">
                          {gen.status === 'success' && gen.image && (
                            <button onClick={() => handleDownloadImage(gen.image!, `foto_${gen.id}.jpg`)} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-surface-soft text-foreground hover:bg-border transition-colors font-medium">
                              <Download className="w-4 h-4" /> Descargar
                            </button>
                          )}
                          <button 
                            onClick={() => setRegenModal({ collectionId: collection.id, genId: gen.id, generation: gen, prompt: collection.prompt })}
                            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium"
                          >
                            <RefreshCw className="w-4 h-4" /> Volver a Generar
                          </button>
                          
                          <button 
                            onClick={() => setDeleteModal({ type: 'photo', collectionId: collection.id, genId: gen.id })}
                            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-colors font-medium"
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar Foto
                          </button>
                        </div>
                      </div>

                      {/* Preview Section */}
                      <div className="w-48 md:w-64 border-l border-border bg-surface-soft shrink-0">
                        {gen.status === 'success' && gen.image ? (
                          <div 
                            className="w-full h-full cursor-pointer relative group"
                            onClick={() => {
                              const successGens = collection.generations.filter(g => g.status === 'success' && g.image)
                              const imageIndex = successGens.findIndex(g => g.id === gen.id)
                              openViewer(successGens, Math.max(0, imageIndex))
                            }}
                          >
                            <img 
                              src={gen.image} 
                              alt={`Generation ${gen.id}`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                Ver Imagen
                              </span>
                            </div>
                          </div>
                        ) : gen.status === 'processing' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted p-4 text-center">
                            <RefreshCw className="w-8 h-8 opacity-50 animate-spin" />
                            <span className="text-xs font-medium">Generando imagen...</span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted p-4 text-center">
                            <AlertCircle className="w-8 h-8 opacity-50" />
                            <span className="text-xs">Imagen no disponible</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          
          {/* Pagination Controls */}
          {collections.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border bg-surface-card hover:bg-surface-soft disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium">
                Página {page} de {Math.ceil(collections.length / ITEMS_PER_PAGE)}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(collections.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={page === Math.ceil(collections.length / ITEMS_PER_PAGE)}
                className="p-2 rounded-lg border border-border bg-surface-card hover:bg-surface-soft disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {showViewer && (
        <ImageViewer 
          images={viewerImages} 
          initialIndex={viewerIndex} 
          onClose={() => setShowViewer(false)} 
        />
      )}

      {/* Regenerate Modal */}
      {regenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-lg p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-foreground">Regenerar Variante</h3>
              <button onClick={() => setRegenModal(null)} className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors">
                <Trash2 className="w-5 h-5 hidden" /> {/* spacer */}
                Cerrar
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Ajustar Master Prompt</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-xl border border-border bg-surface-card text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/50 resize-y"
                  value={regenModal.prompt}
                  onChange={(e) => setRegenModal({ ...regenModal, prompt: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Usar como imagen base:</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${regenBase === 'original' ? 'border-foreground bg-surface-soft' : 'border-border'}`}>
                    <input type="radio" className="hidden" checked={regenBase === 'original'} onChange={() => setRegenBase('original')} />
                    {(regenModal.generation.originalModelUrl || regenModal.generation.modelUrl) && (
                      <div className="w-full aspect-square bg-surface-card overflow-hidden">
                        <img src={(regenModal.generation.originalModelUrl || regenModal.generation.modelUrl)!} className="w-full h-full object-cover" alt="Original" />
                      </div>
                    )}
                    <span className="text-sm font-medium">Foto Original</span>
                  </label>
                  
                  <label className={`flex-1 flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${regenBase === 'result' ? 'border-foreground bg-surface-soft' : 'border-border'} ${!regenModal.generation.image ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="radio" className="hidden" disabled={!regenModal.generation.image} checked={regenBase === 'result'} onChange={() => setRegenBase('result')} />
                    {regenModal.generation.image ? (
                      <div className="w-full aspect-square bg-surface-card overflow-hidden">
                        <img src={regenModal.generation.image} className="w-full h-full object-cover" alt="Generada" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-surface-card border border-dashed flex items-center justify-center text-xs text-muted text-center p-2">
                        No hay imagen generada
                      </div>
                    )}
                    <span className="text-sm font-medium">Foto Generada</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleRegenerateSubmit}
                disabled={isRegenerating}
                className="w-full px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} /> 
                {isRegenerating ? 'Generando...' : 'Generar Variante'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-sm p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto" />
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-foreground">Confirmar eliminación</h3>
              <p className="text-sm text-muted">
                {deleteModal.type === 'collection' 
                  ? '¿Estás seguro de que deseas eliminar esta colección por completo?' 
                  : '¿Estás seguro de que deseas eliminar esta foto?'}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={() => setDeleteModal(null)}
                className="px-6 py-2 rounded-xl border border-border text-foreground hover:bg-surface-soft transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-6 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  )
}
