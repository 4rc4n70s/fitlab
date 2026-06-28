import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, ImagePlus, Images, Library, FileText, ArrowRight } from 'lucide-react'
import { getDictionary } from '@/lib/get-dictionary'

export default async function MainPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dict = await getDictionary()

  await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heading font-semibold text-foreground">{dict.main.title}</h1>
        <p className="text-muted text-base">{dict.main.description}</p>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Generator */}
        <Link href="/main/generator" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <ImagePlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">{dict.main.generator.title} <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">{dict.main.generator.description}</p>
          </div>
        </Link>

        {/* Collections */}
        <Link href="/main/collections" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <Images className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">{dict.main.collections.title} <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">{dict.main.collections.description}</p>
          </div>
        </Link>

        {/* Library */}
        <Link href="/main/library" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">{dict.main.library.title} <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">{dict.main.library.description}</p>
          </div>
        </Link>

        {/* Descriptions */}
        <Link href="/main/descriptions" className="group rounded-xl border border-border bg-surface-card p-6 flex flex-col gap-4 hover:border-foreground/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-surface-soft flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">{dict.main.descriptions.title} <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /></h3>
            <p className="text-sm text-muted mt-1">{dict.main.descriptions.description}</p>
          </div>
        </Link>
      </div>

      {/* Banner */}
      <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 flex gap-4 items-start mt-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-amber-600 dark:text-amber-500">{dict.main.retention_warning.title}</h4>
          <p className="text-sm text-amber-600/80 dark:text-amber-500/80">{dict.main.retention_warning.description}</p>
        </div>
      </div>

    </div>
  )
}
