'use client'

import React, { useState } from 'react'
import { Calendar, RefreshCw, AlertCircle, CheckCircle2, Images } from 'lucide-react'
import { ImageViewer } from '@/components/shared/image-viewer'
import Link from 'next/link'

// Start with empty collections by default
const COLLECTIONS: any[] = []

export default function CollectionsPage() {
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState<number>(0)
  const [showViewer, setShowViewer] = useState(false)

  const openViewer = (images: string[], index: number) => {
    setViewerImages(images)
    setViewerIndex(index)
    setShowViewer(true)
  }

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-semibold text-foreground">Collections</h1>
        <p className="text-muted text-base">Historial de generaciones agrupadas por lote. Haz click en una imagen para abrir el visualizador.</p>
      </div>

      {COLLECTIONS.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-2xl bg-surface-card p-12 text-center my-8">
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
          {COLLECTIONS.map((collection) => {
            const successImages = collection.generations.filter((g: any) => g.status === 'success' && g.image).map((g: any) => g.image as string)

            return (
              <div key={collection.id} className="flex flex-col gap-4">
                {/* Collection Header */}
                <div className="flex items-center gap-4 border-b border-border pb-2">
                  <h2 className="text-lg font-medium text-foreground">Lote: {collection.id}</h2>
                  <span className="text-sm text-muted flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(collection.date).toLocaleString()}
                  </span>
                </div>

                {/* Generations List */}
                <div className="flex flex-col gap-4">
                  {collection.generations.map((gen: any) => (
                    <div key={gen.id} className="flex bg-surface-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-foreground/30 transition-colors">
                      
                      {/* Info Section */}
                      <div className="flex-1 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">ID: {gen.id}</span>
                            {gen.status === 'success' ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Completado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted">{new Date(gen.date).toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted uppercase tracking-wider">Master Prompt</span>
                            <p className="text-sm text-foreground line-clamp-2">{collection.prompt}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted uppercase tracking-wider">Prendas Usadas</span>
                            <div className="flex gap-1">
                              {collection.clothes.map((c: any, i: number) => (
                                <div key={i} className="w-8 h-8 rounded bg-surface-soft border border-border flex items-center justify-center text-xs text-muted">
                                  IMG
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {gen.status === 'error' && (
                          <p className="text-sm text-red-500 mt-2">Motivo: {gen.errorMsg}</p>
                        )}

                        <div className="mt-auto pt-4 flex gap-2">
                          <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium">
                            <RefreshCw className="w-4 h-4" /> Volver a Generar
                          </button>
                        </div>
                      </div>

                      {/* Preview Section */}
                      <div className="w-48 md:w-64 border-l border-border bg-surface-soft shrink-0">
                        {gen.status === 'success' && gen.image ? (
                          <div 
                            className="w-full h-full cursor-pointer relative group"
                            onClick={() => {
                              const imageIndex = successImages.indexOf(gen.image as string)
                              openViewer(successImages, imageIndex)
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
        </div>
      )}

      {showViewer && (
        <ImageViewer 
          images={viewerImages} 
          initialIndex={viewerIndex} 
          onClose={() => setShowViewer(false)} 
        />
      )}
    </div>
  )
}
