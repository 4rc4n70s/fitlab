import React from 'react'
import { getDictionary } from '@/lib/get-dictionary'

export default async function SettingsPage() {
  const dict = await getDictionary()
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pb-24">
      <div className="flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto w-full flex-1">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-heading font-semibold text-foreground">{dict.pages.settings.title}</h1>
        </div>
      </div>
    </div>
  )
}
