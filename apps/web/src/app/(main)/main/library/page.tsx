'use client'

import { dbClient } from '@/services/collectionsClient'
import { uploadFileToSupabase } from '@/services/storage'

import React, { useState, useEffect } from 'react'
import { Search, Grid, List, Folder, Upload, Edit2, Download, Trash2, ChevronRight, ChevronLeft, FolderPlus, X, Eye } from 'lucide-react'
import { ImageViewer } from '@/components/shared/image-viewer'

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
  
  const [folders, setFolders] = useState<FolderType[]>([])
  const [items, setItems] = useState<ItemType[]>([])

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<{id: string, file?: File, url: string, name: string, type: 'clothes'|'model'}[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<ItemType | null>(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditItems, setBulkEditItems] = useState<ItemType[]>([])
  const [deleteModal, setDeleteModal] = useState<{ type: 'folder' | 'item', id: string } | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [isLoadingStock, setIsLoadingStock] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, currentFolder])

  // Load from Supabase on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoadingLibrary(true)
        setLibraryError(null)
        const dbFolders = await dbClient.library.getFolders()
        const dbItems = await dbClient.library.getItems()
        // Auto-seed stock photos if library is empty and hasn't been seeded yet
        const hasSeeded = localStorage.getItem('fitlab_seeded_stock')
        if (dbFolders.length === 0 && dbItems.length === 0 && !hasSeeded) {
          await loadStockPhotosData()
          localStorage.setItem('fitlab_seeded_stock', 'true')
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFolders(dbFolders.map((f: any) => ({...f, itemCount: 0})))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setItems(dbItems.map((i: any) => ({
            id: i.id,
            name: i.name,
            type: i.type,
            url: i.url,
            date: i.created_at,
            folderId: i.folder_id
          })))
          
          // Update folder counts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newFolders = dbFolders.map((f: any) => ({
            id: f.id,
            name: f.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            itemCount: dbItems.filter((i: any) => i.folder_id === f.id).length
          }))
          setFolders(newFolders)
        }
      } catch (err) {
        console.error('Error fetching library from Supabase:', err)
        setLibraryError(err instanceof Error ? err.message : 'Error desconocido al cargar la librería.')
      } finally {
        setIsLoadingLibrary(false)
      }
    }
    init()
  }, [])

  const loadStockPhotosData = async () => {
    try {
      // 1. Create Stock Photos folder
      const newFolder = await dbClient.library.createFolder({
        name: 'Stock Photos',
        type: 'mixed'
      })
      
      const stockItems = [
        { name: 'Prenda 1', type: 'clothes' as const, url: '/clothes/pexels-cottonbro-7716960.jpg' },
        { name: 'Prenda 2', type: 'clothes' as const, url: '/clothes/pexels-enginakyurt-19995460.jpg' },
        { name: 'Prenda 3', type: 'clothes' as const, url: '/clothes/pexels-enginakyurt-4554337.jpg' },
        { name: 'Prenda 4', type: 'clothes' as const, url: '/clothes/pexels-marceloverfe-19895977.jpg' },
        { name: 'Prenda 5', type: 'clothes' as const, url: '/clothes/pexels-mart-production-9558265.jpg' },
        { name: 'Prenda Mockup', type: 'clothes' as const, url: '/clothes/pexels-mockupbee-221716013-12039633.jpg' },
        { name: 'Modelo Mens loose', type: 'model' as const, url: '/models/mens-fashion-loose-cotton-shirt.jpg' },
        { name: 'Modelo Laughs', type: 'model' as const, url: '/models/model-laughs-barefoot.jpg' },
        { name: 'Modelo Abaq', type: 'model' as const, url: '/models/pexels-abaq-studio-1957487599-29119345.jpg' },
        { name: 'Modelo Eduardo', type: 'model' as const, url: '/models/pexels-eduardo-vite-211353151-24286256.jpg' },
        { name: 'Modelo Er17', type: 'model' as const, url: '/models/pexels-er17-16962545.jpg' },
        { name: 'Modelo Godisable', type: 'model' as const, url: '/models/pexels-godisable-jacob-226636-794063.jpg' },
        { name: 'Modelo Gustavo', type: 'model' as const, url: '/models/pexels-gustavo-fring-5622840.jpg' },
        { name: 'Modelo Krivitskiy', type: 'model' as const, url: '/models/pexels-krivitskiy-6971165.jpg' },
        { name: 'Modelo Manzano', type: 'model' as const, url: '/models/pexels-manzano-16924901.jpg' },
        { name: 'Modelo Belu', type: 'model' as const, url: '/models/pexels-ph-belu-jurado-615194884-17561664.jpg' },
        { name: 'Modelo Rulomx', type: 'model' as const, url: '/models/pexels-rulomx-11722289.jpg' },
        { name: 'Modelo Rulomx 2', type: 'model' as const, url: '/models/pexels-rulomx-11722296.jpg' },
        { name: 'Modelo Rulomx 3', type: 'model' as const, url: '/models/pexels-rulomx-11882392.jpg' },
        { name: 'Modelo Sergio', type: 'model' as const, url: '/models/pexels-sergiolalala-22717318.jpg' },
        { name: 'Modelo Stephan', type: 'model' as const, url: '/models/pexels-stephanlouis-8414003.jpg' },
        { name: 'Modelo Pink', type: 'model' as const, url: '/models/pink-summer-outfit.jpg' }
      ]

      const newDbItems = await Promise.all(stockItems.map(item => 
        dbClient.library.createItem({
          name: item.name,
          type: item.type,
          url: item.url,
          folder_id: newFolder.id
        })
      ))

      const formatted = newDbItems.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        url: i.url,
        date: i.created_at,
        folderId: i.folder_id || undefined
      }))

      setFolders(prev => [...prev, { id: newFolder.id, name: newFolder.name, itemCount: formatted.length }])
      setItems(prev => [...formatted, ...prev])
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleLoadStockPhotos = async () => {
    setIsLoadingStock(true)
    try {
      await loadStockPhotosData()
      localStorage.setItem('fitlab_seeded_stock', 'true')
    } catch (err) {
      console.error(err)
      alert('Error cargando imágenes de stock.')
    } finally {
      setIsLoadingStock(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchFolder = currentFolder ? item.folderId === currentFolder : true
    const matchType = filterType === 'all' ? true : item.type === filterType
    const matchSearch = (item.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    return matchFolder && matchType && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleOpenUpload = () => {
    setUploadFiles([])
    setShowUploadModal(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const currentTotal = items.length + uploadFiles.length
    const availableSlots = 50 - currentTotal

    if (availableSlots <= 0) {
      alert("Has alcanzado el límite máximo de 50 imágenes en tu librería.")
      e.target.value = ''
      return
    }

    let filesToProcess = Array.from(files)
    if (filesToProcess.length > availableSlots) {
      alert(`Solo puedes subir ${availableSlots} imágenes más (límite de 50). Se han ignorado las imágenes sobrantes.`)
      filesToProcess = filesToProcess.slice(0, availableSlots)
    }

    const newUploads = filesToProcess.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      name: file.name.split('.')[0],
      type: 'clothes' as 'clothes' | 'model'
    }))
    
    setUploadFiles(prev => [...prev, ...newUploads])
    e.target.value = ''
  }

  const handleBulkUploadSubmit = async () => {
    setIsUploading(true)
    setUploadError(null)
    console.log("Starting bulk upload...")
    try {
      const newItems: ItemType[] = []
      let hasError = false
      let lastError = ""
      
      for (let i = 0; i < uploadFiles.length; i++) {
        const uf = uploadFiles[i]
        if (!uf.file) continue
        
        console.log(`Processing file ${i + 1}/${uploadFiles.length}: ${uf.name}`)
        
        console.log("Uploading file directly to Supabase Storage...")
        
        try {
          const publicUrl = await uploadFileToSupabase(uf.file, uf.type)
          console.log("Uploaded to storage. URL:", publicUrl)
          
          console.log("Creating database record...")
          const newItem = await dbClient.library.createItem({
            name: uf.name,
            type: uf.type,
            url: publicUrl,
            folder_id: currentFolder || null
          })
          console.log("Database record created:", newItem.id)
          
          newItems.push({
            id: newItem.id,
            name: newItem.name,
            type: newItem.type,
            url: newItem.url,
            date: newItem.created_at,
            folderId: newItem.folder_id || undefined
          })
        } catch (err: unknown) {
          console.error('Error uploading file to Supabase:', err)
          hasError = true
          const errorMsg = err instanceof Error ? err.message : String(err)
          lastError = errorMsg
        }
      }

      if (hasError) {
        console.warn("Upload finished with errors.")
        setUploadError("Hubo un error subiendo una o más imágenes: " + lastError + ". Revisa la consola para más detalles.")
      }

      console.log("Updating UI state with new items...")
      const updated = [...newItems, ...items]
      setItems(updated)
      updateFolderCounts(updated)
      if (!hasError) {
        setShowUploadModal(false)
      }
    } catch (globalErr: unknown) {
      console.error('Global error in upload:', globalErr)
      const errorMsg = globalErr instanceof Error ? globalErr.message : String(globalErr)
      setUploadError("Error crítico: " + errorMsg)
    } finally {
      console.log("Upload process finished.")
      setIsUploading(false)
    }
  }

  const updateFolderCounts = (currentItems: ItemType[]) => {
    const newFolders = folders.map(f => ({
      ...f,
      itemCount: currentItems.filter(i => i.folderId === f.id).length
    }))
    setFolders(newFolders)
    
  }

  const handleSaveEdit = async () => {
    if (!editItem) return
    try {
      await dbClient.library.updateItem(editItem.id, {
        name: editItem.name,
        type: editItem.type,
        folder_id: editItem.folderId || null
      })
      const updated = items.map(i => i.id === editItem.id ? editItem : i)
      setItems(updated)
      updateFolderCounts(updated)
      setEditItem(null)
    } catch (err) {
      console.error("Error updating item in DB:", err)
    }
  }

  const handleCreateFolder = () => {
    setNewFolderName('')
    setShowFolderModal(true)
  }

  const submitCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const newFolder = await dbClient.library.createFolder({
        name: newFolderName,
        type: 'models' // defaults
      })
      
      const folderType: FolderType = {
        id: newFolder.id,
        name: newFolder.name,
        itemCount: 0
      }
      const updated = [...folders, folderType]
      setFolders(updated)
      setShowFolderModal(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenBulkEdit = () => {
    setBulkEditItems([...filteredItems])
    setShowBulkEditModal(true)
  }

  const submitBulkEdit = async () => {
    try {
      // First update in DB
      for (const item of bulkEditItems) {
        await dbClient.library.updateItem(item.id, {
          name: item.name,
          type: item.type,
          folder_id: item.folderId || null
        })
      }
      
      // Then update local state
      const updated = items.map(item => {
        const edited = bulkEditItems.find(b => b.id === item.id)
        return edited || item
      })
      setItems(updated)
      updateFolderCounts(updated)
      setShowBulkEditModal(false)
    } catch (err) {
      console.error("Error updating items in DB:", err)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return

    try {
      if (deleteModal.type === 'item') {
        await dbClient.library.deleteItem(deleteModal.id)
        const updated = items.filter(i => i.id !== deleteModal.id)
        setItems(updated)
        updateFolderCounts(updated)
      } else if (deleteModal.type === 'folder') {
        await dbClient.library.deleteFolder(deleteModal.id)
        const updatedFolders = folders.filter(f => f.id !== deleteModal.id)
        setFolders(updatedFolders)

        const updatedItems = items.map(item => {
          if (item.folderId === deleteModal.id) {
            return { ...item, folderId: undefined }
          }
          return item
        })
        setItems(updatedItems)
      }
    } catch(err) {
      console.error(err)
    }
    setDeleteModal(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Toolbar */}
      <div className="border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex flex-col gap-6 p-6 md:px-10 md:py-8 max-w-6xl mx-auto w-full">
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
              onClick={handleOpenUpload}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium text-sm"
            >
              <Upload className="w-4 h-4" /> Subir Imagen
            </button>
            <button 
              onClick={handleOpenBulkEdit}
              disabled={filteredItems.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-card hover:bg-surface-soft transition-colors font-medium text-sm disabled:opacity-50"
            >
              <Edit2 className="w-4 h-4" /> Edición Masiva
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
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto w-full">
        
        {/* Folders Section (Only show if not inside a folder) */}
        {!currentFolder && !searchQuery && folders.length > 0 && (
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
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ type: 'folder', id: folder.id }) }}
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
          
          {isLoadingLibrary ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface-card border border-border rounded-xl border-dashed">
              <div className="w-8 h-8 rounded-full border-2 border-foreground border-t-transparent animate-spin mb-2" />
              <p className="text-foreground font-medium">Cargando librería...</p>
            </div>
          ) : libraryError ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-500 font-medium">Error: {libraryError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 mt-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface-card border border-border rounded-xl border-dashed">
              <Folder className="w-10 h-10 text-muted" />
              <p className="text-foreground font-semibold">Tu librería está vacía</p>
              <p className="text-sm text-muted max-w-sm mb-2">
                Comienza subiendo imágenes de tus prendas o modelos de referencia utilizando el botón de &quot;Subir Imagen&quot; arriba.
              </p>
              <button 
                onClick={handleLoadStockPhotos}
                disabled={isLoadingStock}
                className="px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoadingStock ? <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" /> : null}
                Cargar fotos de muestra (Stock Photos)
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2 bg-surface-card border border-border rounded-xl border-dashed">
              <Search className="w-8 h-8 text-muted mb-2" />
              <p className="text-foreground font-medium">No se encontraron resultados</p>
              <p className="text-sm text-muted">Intenta cambiar los filtros o el término de búsqueda.</p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paginatedItems.map((item, index) => (
                  <div key={item.id} className="group flex flex-col gap-2 relative">
                  <div className="relative aspect-square overflow-hidden border border-border bg-surface-card">
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    
                    {/* Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md">
                      <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                        {item.type === 'clothes' ? 'Prenda' : 'Modelo'}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      <button 
                        onClick={() => {
                          setViewerIndex((currentPage - 1) * ITEMS_PER_PAGE + index)
                          setShowViewer(true)
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors" 
                        title="Ver Imagen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditItem(item)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors" 
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteModal({ type: 'item', id: item.id }) }}
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
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
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
            </div>
          ) : (
            // List View
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {paginatedItems.map(item => (
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
                      <button 
                        onClick={() => setEditItem(item)}
                        className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-border transition-colors"
                      >
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
                        onClick={(e) => { e.stopPropagation(); setDeleteModal({ type: 'item', id: item.id }) }}
                        className="p-2 text-red-500/70 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
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
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-sm p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-foreground">Editar Información</h3>
              <button onClick={() => setEditItem(null)} className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="aspect-square w-32 mx-auto overflow-hidden border border-border">
                <img src={editItem.url} alt={editItem.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <input 
                  type="text" 
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="px-3 py-2 text-sm bg-surface-card border border-border rounded-lg focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <select 
                  value={editItem.type}
                  onChange={(e) => setEditItem({ ...editItem, type: e.target.value as 'clothes' | 'model' })}
                  className="px-3 py-2 text-sm bg-surface-card border border-border rounded-lg focus:outline-none focus:border-foreground/50 transition-colors"
                >
                  <option value="clothes">Prenda</option>
                  <option value="model">Modelo</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Carpeta</label>
                <select 
                  value={editItem.folderId || ''}
                  onChange={(e) => setEditItem({ ...editItem, folderId: e.target.value || undefined })}
                  className="px-3 py-2 text-sm bg-surface-card border border-border rounded-lg focus:outline-none focus:border-foreground/50 transition-colors"
                >
                  <option value="">Sin carpeta (Raíz)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-soft transition-colors font-medium">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-3xl p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-xl font-medium text-foreground">Subir Imágenes en Cantidad</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-4">
              <label className="w-full p-8 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-foreground/30 cursor-pointer transition-colors bg-surface-soft/50">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                <Upload className="w-8 h-8 text-muted" />
                <span className="text-sm font-medium">Haz clic aquí para seleccionar múltiples imágenes</span>
              </label>

              {uploadFiles.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-medium text-foreground">Archivos Seleccionados ({uploadFiles.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadFiles.map(uf => (
                      <div key={uf.id} className="flex flex-col gap-2 p-3 border border-border rounded-xl bg-surface-card relative group">
                        <button 
                          onClick={() => setUploadFiles(prev => prev.filter(p => p.id !== uf.id))}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="flex gap-3">
                          <img src={uf.url} alt="Vista previa de subida" className="w-16 h-24 object-cover rounded-md bg-surface-soft shrink-0" />
                          <div className="flex flex-col gap-2 flex-1">
                            <input 
                              type="text" 
                              value={uf.name}
                              onChange={(e) => setUploadFiles(prev => prev.map(p => p.id === uf.id ? { ...p, name: e.target.value } : p))}
                              className="w-full px-2 py-1 text-xs bg-surface-soft border border-border rounded focus:outline-none focus:border-foreground/50"
                              placeholder="Nombre"
                            />
                            <select 
                              value={uf.type}
                              onChange={(e) => setUploadFiles(prev => prev.map(p => p.id === uf.id ? { ...p, type: e.target.value as 'clothes'|'model' } : p))}
                              className="w-full px-2 py-1 text-xs bg-surface-soft border border-border rounded focus:outline-none focus:border-foreground/50"
                            >
                              <option value="clothes">Prenda</option>
                              <option value="model">Modelo</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border gap-4 items-center">
              {uploadError && (
                <div className="text-red-500 text-sm font-medium flex-1">
                  {uploadError}
                </div>
              )}
              <button 
                disabled={uploadFiles.length === 0 || isUploading}
                onClick={handleBulkUploadSubmit} 
                className="px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir {uploadFiles.length} {uploadFiles.length === 1 ? 'archivo' : 'archivos'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {showViewer && (
        <ImageViewer 
          images={filteredItems.map(i => ({ url: i.url }))}
          initialIndex={viewerIndex}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-sm p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto" />
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-foreground">Confirmar eliminación</h3>
              <p className="text-sm text-muted">
                {deleteModal.type === 'folder' 
                  ? '¿Estás seguro de que deseas eliminar esta carpeta? Las imágenes dentro de ella quedarán huérfanas pero no se eliminarán.' 
                  : '¿Estás seguro de que deseas eliminar este archivo?'}
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

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-sm p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-foreground">Nueva Carpeta</h3>
              <button onClick={() => setShowFolderModal(false)} className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Nombre de la carpeta</label>
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ej. Colección Verano"
                className="w-full px-3 py-2 text-sm bg-surface-card border border-border rounded-lg focus:outline-none focus:border-foreground/50 transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-soft transition-colors font-medium">
                Cancelar
              </button>
              <button onClick={submitCreateFolder} disabled={!newFolderName.trim()} className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-2xl w-full max-w-4xl p-6 flex flex-col gap-6 shadow-xl animate-in zoom-in-95 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-xl font-medium text-foreground">Edición Masiva ({bulkEditItems.length} elementos)</h3>
              <button onClick={() => setShowBulkEditModal(false)} className="p-1 rounded-lg hover:bg-surface-soft text-muted hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bulkEditItems.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 border border-border rounded-xl bg-surface-card">
                    <img src={item.url} alt={item.name} className="w-16 h-24 object-cover rounded-md bg-surface-soft shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => setBulkEditItems(prev => prev.map(p => p.id === item.id ? { ...p, name: e.target.value } : p))}
                        className="w-full px-2 py-1 text-xs bg-surface-soft border border-border rounded focus:outline-none focus:border-foreground/50"
                        placeholder="Nombre"
                      />
                      <select 
                        value={item.type}
                        onChange={(e) => setBulkEditItems(prev => prev.map(p => p.id === item.id ? { ...p, type: e.target.value as 'clothes'|'model' } : p))}
                        className="w-full px-2 py-1 text-xs bg-surface-soft border border-border rounded focus:outline-none focus:border-foreground/50"
                      >
                        <option value="clothes">Prenda</option>
                        <option value="model">Modelo</option>
                      </select>
                      <select 
                        value={item.folderId || ''}
                        onChange={(e) => setBulkEditItems(prev => prev.map(p => p.id === item.id ? { ...p, folderId: e.target.value || undefined } : p))}
                        className="w-full px-2 py-1 text-xs bg-surface-soft border border-border rounded focus:outline-none focus:border-foreground/50 mt-1"
                      >
                        <option value="">Sin carpeta</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-auto">
              <button onClick={() => setShowBulkEditModal(false)} className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-surface-soft transition-colors font-medium">
                Cancelar
              </button>
              <button onClick={submitBulkEdit} className="px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
