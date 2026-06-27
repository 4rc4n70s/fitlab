'use client'

import Link from 'next/link'
import { useUI } from '@/hooks/use-ui'
import { useUser } from '@/hooks/use-user'
import { Menu, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function Navbar() {
  const { user, profile } = useUser()
  const { isSidebarOpen, setIsSidebarOpen, isMobileSidebarOpen, setIsMobileSidebarOpen, theme, setTheme, language, setLanguage } = useUI()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      alert(language === 'es' ? 'La aplicación ya está instalada o no está soportada en este navegador.' : 'The app is already installed or not supported by this browser.')
    }
  }

  interface UserProfile {
    boilerplate_credits?: number;
  }
  const credits = (profile as UserProfile | null)?.boilerplate_credits ?? 5

  return (
    <nav className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden p-2 rounded-full hover:bg-surface-soft transition-colors text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex p-2 rounded-full hover:bg-surface-soft transition-colors text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="font-semibold text-lg tracking-tight text-foreground">
          Tetsu App
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-terminal-yellow" /> : <Moon className="w-5 h-5 text-charcoal" />}
        </button>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full bg-surface-soft border border-border flex items-center justify-center text-sm font-semibold text-foreground hover:bg-surface transition-colors uppercase"
            >
              {user.email?.charAt(0) || 'U'}
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-border rounded-xl shadow-none py-1 flex flex-col">
                <div className="px-4 py-3 border-b border-border mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'es' ? `Créditos: ${credits}` : `Credits: ${credits}`}
                  </p>
                </div>
                <Link 
                  href="/main/billing"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-soft transition-colors"
                >
                  {language === 'es' ? 'Facturación y Créditos' : 'Billing & Credits'}
                </Link>
                <button 
                  onClick={handleInstallPWA}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-soft transition-colors"
                >
                  {language === 'es' ? 'Instalar App' : 'Install App'}
                </button>
                <button 
                  onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-soft transition-colors flex items-center justify-between"
                >
                  <span>{language === 'es' ? 'Idioma' : 'Language'}</span>
                  <span className="text-muted">{language === 'es' ? 'ES' : 'EN'}</span>
                </button>
                <div className="h-px bg-border my-1" />
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-soft transition-colors"
                >
                  {language === 'es' ? 'Cerrar Sesión' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary-hover transition-colors">
            {language === 'es' ? 'Entrar' : 'Sign In'}
          </Link>
        )}
      </div>
    </nav>
  )
}
