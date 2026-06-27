'use client'

import React, { useState } from 'react'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, SplitSquareHorizontal, Image as ImageIcon, Sparkles } from 'lucide-react'

export interface ViewerImage {
  url: string
  originalUrl?: string
}

interface ImageViewerProps {
  images: ViewerImage[]
  initialIndex?: number
  onClose: () => void
}

export function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [viewMode, setViewMode] = useState<'result' | 'original' | 'split'>('result')
  
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }
  
  const resetView = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setViewMode('result')
  }

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.1, 0.1)
      if (newZoom === 1) setPosition({ x: 0, y: 0 })
      return newZoom
    })
  }


  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const currentImage = images[currentIndex]

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div 
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-background/40 backdrop-blur-md border border-white/10 rounded-full z-50"
        onClick={e => e.stopPropagation()}
      >
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white/90 text-sm font-medium w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {currentImage.originalUrl && (
          <>
            <div className="w-px h-6 bg-white/20 mx-1" />
            {/* View Mode Controls */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setViewMode('original')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === 'original' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <ImageIcon className="w-4 h-4" /> Original
              </button>
              <button 
                onClick={() => setViewMode('result')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === 'result' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <Sparkles className="w-4 h-4" /> Resultado
              </button>
              <button 
                onClick={() => setViewMode('split')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === 'split' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                title="Comparar lado a lado"
              >
                <SplitSquareHorizontal className="w-4 h-4" /> Comparar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50 bg-black/20"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50 bg-black/20"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image Container */}
      <div 
        className={`relative w-full h-full max-h-[100vh] flex items-center justify-center p-12 overflow-hidden ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onClick={e => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative transition-transform duration-75 ease-out flex items-center justify-center gap-8 w-full h-full"
          style={{ transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)` }}
        >
          {viewMode === 'split' ? (
            <div className="flex w-full h-full justify-center items-center gap-4 max-w-[90vw]">
              <div className="flex-1 flex flex-col items-center gap-2 max-h-full">
                <span className="text-white/70 text-xs font-medium uppercase tracking-wider bg-black/50 px-3 py-1 rounded-full backdrop-blur-md absolute top-4">Original</span>
                <img src={currentImage.originalUrl} alt="Original" className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl" />
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 max-h-full">
                <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider bg-black/50 px-3 py-1 rounded-full backdrop-blur-md absolute top-4">Resultado</span>
                <img src={currentImage.url} alt="Result" className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl" />
              </div>
            </div>
          ) : (
            <img 
              src={viewMode === 'original' && currentImage.originalUrl ? currentImage.originalUrl : currentImage.url} 
              alt="View"
              className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Image Info / Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm flex items-center gap-4">
        <span>Imagen {currentIndex + 1} de {images.length}</span>
        <button className="flex items-center gap-2 hover:text-white transition-colors">
          <Download className="w-4 h-4" /> Descargar
        </button>
      </div>
    </div>
  )
}
