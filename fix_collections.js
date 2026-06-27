const fs = require('fs')

let content = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8')

// 1. Imports
content = content.replace(
  "import { ImageViewer } from '@/components/shared/image-viewer'\nimport Link from 'next/link'",
  `import { ImageViewer } from '@/components/shared/image-viewer'
import Link from 'next/link'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { processVirtualTryOn } from '@/actions/gemini'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const urlToBase64 = async (url: string) => {
  if (url.startsWith('data:')) return url
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}`
)

// 2. State
content = content.replace(
  "const [deleteModal, setDeleteModal] = useState<{ type: 'collection' | 'photo', collectionId: string, genId?: string } | null>(null)",
  `const [deleteModal, setDeleteModal] = useState<{ type: 'collection' | 'photo', collectionId: string, genId?: string } | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [isRegenerating, setIsRegenerating] = useState(false)`
)

// 3. Functions
content = content.replace(
  "const handleRegenerateSubmit = () => {\n    if (!regenModal) return\n    setRegenModal(null)\n  }",
  `const handleRegenerateSubmit = async () => {
    if (!regenModal) return
    setIsRegenerating(true)
    
    try {
      const { collectionId, genId, generation, prompt } = regenModal
      const collection = collections.find(c => c.id === collectionId)
      if (!collection) return
      
      const clothesBase64s = await Promise.all(collection.clothes.map(url => urlToBase64(url)))
      const modelBase64 = await urlToBase64(regenBase === 'original' ? (generation.modelUrl || '') : (generation.image || ''))
      
      const currentCols = JSON.parse(localStorage.getItem('fitlab_collections') || '[]') as Collection[]
      const targetCol = currentCols.find((c: Collection) => c.id === collectionId)
      if (targetCol) {
        const targetGenIndex = targetCol.generations.findIndex((g: Generation) => g.id === genId)
        if (targetGenIndex >= 0) {
          targetCol.generations[targetGenIndex].status = 'processing'
          localStorage.setItem('fitlab_collections', JSON.stringify(currentCols))
          setCollections(currentCols)
        }
      }
      
      setRegenModal(null)
      
      const response = await processVirtualTryOn(prompt, modelBase64, clothesBase64s)
      
      const updatedCols = JSON.parse(localStorage.getItem('fitlab_collections') || '[]') as Collection[]
      const uCol = updatedCols.find((c: Collection) => c.id === collectionId)
      if (uCol) {
        const uGenIndex = uCol.generations.findIndex((g: Generation) => g.id === genId)
        if (uGenIndex >= 0) {
          uCol.generations[uGenIndex] = {
            ...uCol.generations[uGenIndex],
            status: response.success ? 'success' : 'error',
            image: response.success ? \`data:\${response.mimeType};base64,\${response.base64}\` : undefined,
            errorMsg: response.error
          }
          localStorage.setItem('fitlab_collections', JSON.stringify(updatedCols))
          setCollections(updatedCols)
        }
      }
    } catch (e: any) {
      console.error(e)
      const updatedCols = JSON.parse(localStorage.getItem('fitlab_collections') || '[]') as Collection[]
      const uCol = updatedCols.find((c: Collection) => c.id === regenModal.collectionId)
      if (uCol) {
        const uGenIndex = uCol.generations.findIndex((g: Generation) => g.id === regenModal.genId)
        if (uGenIndex >= 0) {
          uCol.generations[uGenIndex] = {
            ...uCol.generations[uGenIndex],
            status: 'error',
            errorMsg: 'Error al regenerar: ' + (e.message || '')
          }
          localStorage.setItem('fitlab_collections', JSON.stringify(updatedCols))
          setCollections(updatedCols)
        }
      }
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleDownloadImage = (base64Url: string, name: string) => {
    saveAs(base64Url, name)
  }

  const handleDownloadZip = async (collection: Collection) => {
    const zip = new JSZip()
    const successGens = collection.generations.filter(g => g.status === 'success' && g.image)
    if (successGens.length === 0) return
    
    successGens.forEach((gen, index) => {
      const base64Data = gen.image.split(',')[1]
      zip.file(\`generacion_\${index + 1}.jpg\`, base64Data, { base64: true })
    })
    
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, \`coleccion_\${collection.id}.zip\`)
  }`
)

// 4. Pagination Display
content = content.replace(
  "{collections.map((collection) => {",
  `{collections.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((collection) => {`
)

content = content.replace(
  `<button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground font-medium">
                      <Download className="w-4 h-4" /> Descargar ZIP
                    </button>`,
  `<button onClick={() => handleDownloadZip(collection)} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-border transition-colors text-foreground font-medium">
                      <Download className="w-4 h-4" /> Descargar ZIP
                    </button>`
)

content = content.replace(
  `<button className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-surface-soft text-foreground hover:bg-border transition-colors font-medium">
                              <Download className="w-4 h-4" /> Descargar
                            </button>`,
  `<button onClick={() => handleDownloadImage(gen.image!, \`foto_\${gen.id}.jpg\`)} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-surface-soft text-foreground hover:bg-border transition-colors font-medium">
                              <Download className="w-4 h-4" /> Descargar
                            </button>`
)

content = content.replace(
  `{isRegenerating ? 'Generando...' : 'Generar Variante'}</button>`, // oops, let's just replace the exact button text
  `` // I will use multi_replace directly for this button instead to avoid bad match
)

fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', content)
