'use client'

import React, { useState } from 'react'
import { X, ZoomIn, ZoomOut, Maximize, RotateCcw, Download } from 'lucide-react'

interface ImageViewerProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setZoom(1)
    }
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setZoom(1)
    }
  }

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(prev => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(prev => Math.max(prev - 0.5, 1))
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(1)
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div 
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-background/20 backdrop-blur-md border border-white/10 rounded-full"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={handleZoomOut} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white/90 text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button onClick={handleReset} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <Maximize className="w-5 h-5" />
        </button>
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
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
        >
          <RotateCcw className="w-6 h-6 -rotate-90" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
        >
          <RotateCcw className="w-6 h-6 rotate-90" />
        </button>
      )}

      {/* Image Container */}
      <div 
        className="relative w-full max-w-5xl h-full max-h-[85vh] flex items-center justify-center p-12 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="relative transition-transform duration-200 ease-out flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <img 
            src={images[currentIndex]} 
            alt={`View ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
          />
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
