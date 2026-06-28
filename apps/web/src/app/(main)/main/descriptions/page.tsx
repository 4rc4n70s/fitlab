'use client'

import React from 'react'
import { FileText, Sparkles } from 'lucide-react'
import { useUI } from '@/hooks/use-ui'
import esDict from '@/dictionaries/es.json'
import enDict from '@/dictionaries/en.json'


export default function DescriptionsPage() {
  const { language } = useUI()
  const dict = language === 'es' ? esDict : enDict

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-3xl font-heading font-semibold text-foreground">{dict.pages.descriptions.title}</h1>
        <p className="text-muted text-base">{dict.pages.descriptions.description}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-border rounded-2xl bg-surface-card p-10 text-center">
        <div className="w-20 h-20 bg-surface-soft rounded-full flex items-center justify-center relative">
          <FileText className="w-10 h-10 text-foreground" />
          <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
        </div>
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="text-2xl font-semibold text-foreground">{dict.pages.descriptions.coming_soon}</h2>
          <p className="text-muted">
            {dict.pages.descriptions.in_development_message}
          </p>
        </div>
        <button className="px-6 py-2.5 mt-4 rounded-xl border border-border bg-transparent text-muted cursor-not-allowed font-medium">
          {dict.pages.descriptions.in_development_badge}
        </button>
      </div>
    </div>
  )
}
