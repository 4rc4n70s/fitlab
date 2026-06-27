import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, ImagePlus, Images, Library, FileText, ArrowRight } from 'lucide-react'

export default async function MainPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heading font-semibold text-foreground">Bienvenido a Fit Lab</h1>
        <p className="text-muted text-base">La plataforma de generación de imágenes con IA para tu marca de ropa. Explora las secciones a continuación para comenzar.</p>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Generator */}
        <Link href="/main/generator" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <ImagePlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">Generator <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">Genera nuevas imágenes de modelos utilizando tus prendas. Ajusta los prompts, selecciona modelos y dimensiones.</p>
          </div>
        </Link>

        {/* Collections */}
        <Link href="/main/collections" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <Images className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">Collections <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">Visualiza y gestiona las imágenes que has generado. Agrupadas por lote de generación. Recuerda descargarlas antes de 7 días.</p>
          </div>
        </Link>

        {/* Library */}
        <Link href="/main/library" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">Library <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">Tu galería personal. Sube, organiza y clasifica tus imágenes de prendas y modelos de referencia para usarlas en el generador.</p>
          </div>
        </Link>

        {/* Descriptions */}
        <Link href="/main/descriptions" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">Descriptions <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">Selecciona tus imágenes y genera descripciones persuasivas automáticamente usando IA (Próximamente).</p>
          </div>
        </Link>
      </div>

      {/* Banner */}
      <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 flex gap-4 items-start mt-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-amber-600 dark:text-amber-500">Aviso sobre retención de imágenes</h4>
          <p className="text-sm text-amber-600/80 dark:text-amber-500/80">Recuerda que todas las imágenes generadas se eliminarán automáticamente de nuestros servidores una semana (7 días) después de su creación. Asegúrate de descargar las que desees conservar.</p>
        </div>
      </div>

    </div>
  )
}
