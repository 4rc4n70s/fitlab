'use client'

import React, { useState } from 'react'
import { Search, Grid, List, Folder, Upload, MoreVertical, Edit2, Download, Trash2, Tag, ChevronRight } from 'lucide-react'

// Dummy Data
const FOLDERS = [
  { id: 'f1', name: 'Campaña Verano 26', itemCount: 12 },
  { id: 'f2', name: 'Modelos Base', itemCount: 5 },
  { id: 'f3', name: 'Prendas Deportivas', itemCount: 8 },
]

const ITEMS = [
  { id: 'img1', name: 'Remera Negra Oversize', type: 'clothes', url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=400', date: '2026-06-25', folderId: 'f1' },
  { id: 'img2', name: 'Modelo Carlos', type: 'model', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', date: '2026-06-26', folderId: 'f2' },
  { id: 'img3', name: 'Short Deportivo', type: 'clothes', url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=400', date: '2026-06-27', folderId: 'f3' },
  { id: 'img4', name: 'Modelo Ana', type: 'model', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', date: '2026-06-27', folderId: 'f2' },
]

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'clothes' | 'model'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)

  const filteredItems = ITEMS.filter(item => {
    const matchFolder = currentFolder ? item.folderId === currentFolder : true
    const matchType = filterType === 'all' ? true : item.type === filterType
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFolder && matchType && matchSearch
  })

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Toolbar */}
      <div className="flex flex-col gap-6 p-6 md:px-10 md:py-8 border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-semibold text-foreground">Library</h1>
            <p className="text-muted text-sm">Gestiona tus prendas y modelos de referencia.</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium">
            <Upload className="w-4 h-4" /> Subir Imagen
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                className="w-full pl-9 pr-4 py-2 text-sm bg-surface-card border border-border rounded-lg text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface-card text-foreground focus:outline-none focus:border-foreground/50"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">Todos los tipos</option>
              <option value="clothes">Solo Prendas</option>
              <option value="model">Solo Modelos</option>
            </select>
          </div>

          <div className="flex items-center gap-2 p-1 bg-surface-card border border-border rounded-lg self-end md:self-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-soft text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface-soft text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        {currentFolder && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <button onClick={() => setCurrentFolder(null)} className="hover:text-foreground transition-colors">Library</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{FOLDERS.find(f => f.id === currentFolder)?.name}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8">
        
        {/* Folders Section (Only show if not inside a folder) */}
        {!currentFolder && filterType === 'all' && !searchQuery && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Carpetas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {FOLDERS.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface-card hover:border-foreground/30 cursor-pointer transition-colors group"
                >
                  <div className="p-2.5 rounded-lg bg-surface-soft text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-foreground truncate">{folder.name}</span>
                    <span className="text-xs text-muted">{folder.itemCount} elementos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
            {currentFolder ? 'Contenido de la carpeta' : 'Todos los archivos'}
          </h2>
          
          {filteredItems.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2 bg-surface-card border border-border rounded-xl border-dashed">
              <Search className="w-8 h-8 text-muted mb-2" />
              <p className="text-foreground font-medium">No se encontraron resultados</p>
              <p className="text-sm text-muted">Intenta cambiar los filtros o el término de búsqueda.</p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="group flex flex-col gap-2 relative">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-surface-card">
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    
                    {/* Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md">
                      <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                        {item.type === 'clothes' ? 'Prenda' : 'Modelo'}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors" title="Descargar">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors" title="Opciones">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col px-1">
                    <span className="text-sm font-medium text-foreground truncate" title={item.name}>{item.name}</span>
                    <span className="text-xs text-muted">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="flex flex-col gap-2">
              {filteredItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-card hover:bg-surface-soft transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className="text-xs text-muted">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                      item.type === 'clothes' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {item.type === 'clothes' ? 'Prenda' : 'Modelo'}
                    </span>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-border transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-border transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-500/70 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
