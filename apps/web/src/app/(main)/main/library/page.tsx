'use client'

import React, { useState, useEffect } from 'react'
import { Search, Grid, List, Folder, Upload, Edit2, Download, Trash2, ChevronRight, FolderPlus } from 'lucide-react'

interface FolderType {
  id: string
  name: string
  itemCount: number
}

interface ItemType {
  id: string
  name: string
  type: 'clothes' | 'model'
  url: string
  date: string
  folderId?: string
}

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'clothes' | 'model'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  
  // Stateful items and folders loaded from localStorage
  const [folders, setFolders] = useState<FolderType[]>([])
  const [items, setItems] = useState<ItemType[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const savedFolders = localStorage.getItem('fitlab_library_folders')
    const savedItems = localStorage.getItem('fitlab_library_items')
    
    if (savedFolders) {
      try { setFolders(JSON.parse(savedFolders)) } catch (e) { console.error(e) }
    } else {
      // Default initial mock folders if empty
      const defaultFolders: FolderType[] = [
        { id: 'f1', name: 'Campaña Verano 26', itemCount: 2 },
        { id: 'f2', name: 'Modelos Base', itemCount: 2 },
        { id: 'f3', name: 'Prendas Deportivas', itemCount: 0 },
      ]
      setFolders(defaultFolders)
      localStorage.setItem('fitlab_library_folders', JSON.stringify(defaultFolders))
    }

    if (savedItems) {
      try { setItems(JSON.parse(savedItems)) } catch (e) { console.error(e) }
    } else {
      // Default initial mock items if empty
      const defaultItems: ItemType[] = [
        { id: 'img1', name: 'Prenda 1', type: 'clothes', url: '/clothes/pexels-cottonbro-7716960.jpg', date: new Date().toISOString(), folderId: 'f1' },
        { id: 'img2', name: 'Prenda 2', type: 'clothes', url: '/clothes/pexels-enginakyurt-19995460.jpg', date: new Date().toISOString(), folderId: 'f1' },
        { id: 'img3', name: 'Prenda 3', type: 'clothes', url: '/clothes/pexels-enginakyurt-4554337.jpg', date: new Date().toISOString(), folderId: 'f3' },
        { id: 'img4', name: 'Prenda 4', type: 'clothes', url: '/clothes/pexels-marceloverfe-19895977.jpg', date: new Date().toISOString(), folderId: 'f3' },
        { id: 'img5', name: 'Prenda 5', type: 'clothes', url: '/clothes/pexels-mart-production-9558265.jpg', date: new Date().toISOString(), folderId: 'f3' },
        { id: 'img6', name: 'Prenda Mockup', type: 'clothes', url: '/clothes/pexels-mockupbee-221716013-12039633.jpg', date: new Date().toISOString(), folderId: undefined },
        { id: 'm1', name: 'Modelo Mens loose', type: 'model', url: '/models/mens-fashion-loose-cotton-shirt.jpg', date: new Date().toISOString(), folderId: 'f2' },
        { id: 'm2', name: 'Modelo Laughs', type: 'model', url: '/models/model-laughs-barefoot.jpg', date: new Date().toISOString(), folderId: 'f2' },
        { id: 'm3', name: 'Modelo Abaq', type: 'model', url: '/models/pexels-abaq-studio-1957487599-29119345.jpg', date: new Date().toISOString(), folderId: 'f2' },
        { id: 'm4', name: 'Modelo Eduardo', type: 'model', url: '/models/pexels-eduardo-vite-211353151-24286256.jpg', date: new Date().toISOString(), folderId: 'f2' },
        { id: 'm5', name: 'Modelo Er17', type: 'model', url: '/models/pexels-er17-16962545.jpg', date: new Date().toISOString(), folderId: undefined },
        { id: 'm6', name: 'Modelo Godisable', type: 'model', url: '/models/pexels-godisable-jacob-226636-794063.jpg', date: new Date().toISOString(), folderId: undefined },
        { id: 'm7', name: 'Modelo Gustavo', type: 'model', url: '/models/pexels-gustavo-fring-5622840.jpg', date: new Date().toISOString(), folderId: undefined },
        { id: 'm8', name: 'Modelo Krivitskiy', type: 'model', url: '/models/pexels-krivitskiy-6971165.jpg', date: new Date().toISOString(), folderId: undefined },
        { id: 'm9', name: 'Modelo Manzano', type: 'model', url: '/models/pexels-manzano-16924901.jpg', date: new Date().toISOString(), folderId: undefined },
        { id: 'm10', name: 'Modelo Belu', type: 'model', url: '/models/pexels-ph-belu-jurado-615194884-17561664.jpg', date: new Date().toISOString(), folderId: undefined },
        { id: 'm11', name: 'Modelo Rulomx', type: 'model', url: '/models/pexels-rulomx-11722289.jpg', date: new Date().toISOString(), folderId: undefined },
      ]
      setItems(defaultItems)
      localStorage.setItem('fitlab_library_items', JSON.stringify(defaultItems))
      
      // Update folder counts
      const counts: Record<string, number> = { 'f1': 2, 'f2': 4, 'f3': 3 }
      const updatedFolders = defaultFolders.map(f => ({ ...f, itemCount: counts[f.id] || 0 }))
      setFolders(updatedFolders)
      localStorage.setItem('fitlab_library_folders', JSON.stringify(updatedFolders))
    }
  }, [])

  const filteredItems = items.filter(item => {
    const matchFolder = currentFolder ? item.folderId === currentFolder : true
    const matchType = filterType === 'all' ? true : item.type === filterType
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFolder && matchType && matchSearch
  })

  // Handle Mock Upload
  const handleUploadImage = () => {
    const name = window.prompt('Introduce el nombre de la imagen:')
    if (!name) return

    const typeChoice = window.prompt('Introduce el tipo: "prenda" o "modelo":')
    const type = typeChoice?.toLowerCase() === 'modelo' ? 'model' : 'clothes'
    
    // Select a random image based on type
    const clothesImages = [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=400'
    ]
    const modelImages = [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400'
    ]
    const url = type === 'model' 
      ? modelImages[Math.floor(Math.random() * modelImages.length)] 
      : clothesImages[Math.floor(Math.random() * clothesImages.length)]

    const newItem: ItemType = {
      id: `img-${Date.now()}`,
      name,
      type,
      url,
      date: new Date().toISOString(),
      folderId: currentFolder || undefined
    }

    const updated = [newItem, ...items]
    setItems(updated)
    localStorage.setItem('fitlab_library_items', JSON.stringify(updated))

    // Update folder item count if inside a folder
    if (currentFolder) {
      const updatedFolders = folders.map(f => {
        if (f.id === currentFolder) {
          return { ...f, itemCount: f.itemCount + 1 }
        }
        return f
      })
      setFolders(updatedFolders)
      localStorage.setItem('fitlab_library_folders', JSON.stringify(updatedFolders))
    }
  }

  // Handle Mock Create Folder
  const handleCreateFolder = () => {
    const name = window.prompt('Nombre de la nueva carpeta:')
    if (!name) return

    const newFolder: FolderType = {
      id: `f-${Date.now()}`,
      name,
      itemCount: 0
    }

    const updated = [...folders, newFolder]
    setFolders(updated)
    localStorage.setItem('fitlab_library_folders', JSON.stringify(updated))
  }

  // Handle Delete Item
  const handleDeleteItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este archivo?')
    if (!confirmDelete) return

    const itemToDelete = items.find(i => i.id === itemId)
    const updated = items.filter(i => i.id !== itemId)
    setItems(updated)
    localStorage.setItem('fitlab_library_items', JSON.stringify(updated))

    // Decrement item count in its folder
    if (itemToDelete && itemToDelete.folderId) {
      const updatedFolders = folders.map(f => {
        if (f.id === itemToDelete.folderId) {
          return { ...f, itemCount: Math.max(0, f.itemCount - 1) }
        }
        return f
      })
      setFolders(updatedFolders)
      localStorage.setItem('fitlab_library_folders', JSON.stringify(updatedFolders))
    }
  }

  // Handle Delete Folder
  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta carpeta? Las imágenes dentro de ella quedarán huérfanas pero no se eliminarán.')
    if (!confirmDelete) return

    const updatedFolders = folders.filter(f => f.id !== folderId)
    setFolders(updatedFolders)
    localStorage.setItem('fitlab_library_folders', JSON.stringify(updatedFolders))

    // Unassign folderId from items inside that folder
    const updatedItems = items.map(item => {
      if (item.folderId === folderId) {
        return { ...item, folderId: undefined }
      }
      return item
    })
    setItems(updatedItems)
    localStorage.setItem('fitlab_library_items', JSON.stringify(updatedItems))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Toolbar */}
      <div className="flex flex-col gap-6 p-6 md:px-10 md:py-8 border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-semibold text-foreground">Library</h1>
            <p className="text-muted text-sm">Gestiona tus prendas y modelos de referencia.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCreateFolder}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-card hover:bg-surface-soft transition-colors font-medium text-sm"
            >
              <FolderPlus className="w-4 h-4" /> Nueva Carpeta
            </button>
            <button 
              onClick={handleUploadImage}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium text-sm"
            >
              <Upload className="w-4 h-4" /> Subir Imagen
            </button>
          </div>
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
              onChange={(e) => setFilterType(e.target.value as 'all' | 'clothes' | 'model')}
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
            <span className="text-foreground">{folders.find(f => f.id === currentFolder)?.name}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8">
        
        {/* Folders Section (Only show if not inside a folder) */}
        {!currentFolder && filterType === 'all' && !searchQuery && folders.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Carpetas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-card hover:border-foreground/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2.5 rounded-lg bg-surface-soft text-foreground group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-foreground truncate">{folder.name}</span>
                      <span className="text-xs text-muted">{folder.itemCount} elementos</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                    className="p-1 rounded text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="Eliminar Carpeta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
          
          {items.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface-card border border-border rounded-xl border-dashed">
              <Folder className="w-10 h-10 text-muted" />
              <p className="text-foreground font-semibold">Tu librería está vacía</p>
              <p className="text-sm text-muted max-w-sm">
                Comienza subiendo imágenes de tus prendas o modelos de referencia utilizando el botón de &quot;Subir Imagen&quot; arriba.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      <a 
                        href={item.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors" 
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors" 
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
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
                      <a 
                        href={item.url} 
                        download 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-border transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        className="p-2 text-red-500/70 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
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
