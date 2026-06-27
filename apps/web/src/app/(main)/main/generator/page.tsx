'use client'

import React, { useState } from 'react'
import { Save, RefreshCw, Upload, Image as ImageIcon, X, Sparkles, Trash2 } from 'lucide-react'

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
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPromptsModal, setShowPromptsModal] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState([
    "Studio lighting, high contrast, clean background",
    "Outdoor, natural sunlight, urban street style",
    "Cinematic lighting, dark mood, neon accents"
  ])

  const handleSavePrompt = () => {
    if (masterPrompt.trim() === '') {
      alert('Por favor escribe un prompt antes de guardar.')
      return
    }
    if (savedPrompts.includes(masterPrompt)) {
      alert('Este prompt ya está guardado.')
      return
    }
    setSavedPrompts([...savedPrompts, masterPrompt])
    alert('Prompt guardado con éxito.')
  }

  const handleDeletePrompt = (e: React.MouseEvent, promptToDelete: string) => {
    e.stopPropagation()
    setSavedPrompts(savedPrompts.filter(p => p !== promptToDelete))
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pb-24">
      <div className="flex flex-col gap-10 p-6 md:p-10 max-w-4xl mx-auto w-full flex-1">
        
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
          
          <div className="flex items-center gap-4 flex-wrap">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setSelectedRatio(ratio.label)}
                className={`flex flex-col items-center justify-center gap-2 w-24 h-24 rounded-xl border transition-all ${
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
            <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground">
              <ImageIcon className="w-4 h-4" /> Select from Library
            </button>
          </div>
          <p className="text-sm text-muted">Todas las prendas seleccionadas se aplicarán a los modelos.</p>
          
          <div className="w-full h-36 rounded-xl border-2 border-dashed border-border bg-surface-card flex flex-col items-center justify-center gap-3 text-muted hover:border-foreground/30 hover:text-foreground cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium">Sube tus prendas o arrástralas aquí</span>
              <span className="text-xs text-muted-foreground">Soporta PNG, JPG de hasta 10MB</span>
            </div>
          </div>
        </section>

        {/* 4. Model Selections */}
        <section className="flex flex-col gap-4 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Model Selections</h2>
            <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground">
              <ImageIcon className="w-4 h-4" /> Select from Library
            </button>
          </div>
          <p className="text-sm text-muted">Se generará una foto por cada modelo cargado, utilizando las prendas anteriores.</p>
          
          <div className="w-full h-36 rounded-xl border-2 border-dashed border-border bg-surface-card flex flex-col items-center justify-center gap-3 text-muted hover:border-foreground/30 hover:text-foreground cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium">Sube tus modelos o arrástralas aquí</span>
              <span className="text-xs text-muted-foreground">Soporta PNG, JPG de hasta 10MB</span>
            </div>
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
                onClick={() => {
                  setShowGenerateModal(false)
                  window.location.href = '/main/collections'
                }}
                className="w-full px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium"
              >
                Ir a Collections
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
    </div>
  )
}
