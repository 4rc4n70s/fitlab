'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Theme = 'light' | 'dark'
type Language = 'es' | 'en'

interface UIContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
  isMobileSidebarOpen: boolean
  setIsMobileSidebarOpen: (isOpen: boolean) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  language: Language
  setLanguage: (lang: Language) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')
  const [language, setLanguage] = useState<Language>('es')

  useEffect(() => {
    // Detect theme
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark')
      setTheme('dark')
    } else {
      document.documentElement.classList.remove('dark')
      setTheme('light')
    }

    // Detect language
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang) {
      setLanguage(savedLang)
    }
  }, [])

  const handleSetTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    setTheme(newTheme)
  }

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem('language', lang)
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`
    setLanguage(lang)
    router.refresh()
  }

  return (
    <UIContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        theme,
        setTheme: handleSetTheme,
        language,
        setLanguage: handleSetLanguage,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
