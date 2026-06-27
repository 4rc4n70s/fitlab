'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, User, X, CreditCard, ImagePlus, Library, Images, FileText } from 'lucide-react'
import { useUI } from '@/hooks/use-ui'

const sidebarLinks = [
  {
    title: { es: 'Principal', en: 'Main' },
    href: '/main',
    icon: LayoutDashboard,
  },
  {
    title: { es: 'Generador', en: 'Generator' },
    href: '/main/generator',
    icon: ImagePlus,
  },
  {
    title: { es: 'Colecciones', en: 'Collections' },
    href: '/main/collections',
    icon: Images,
  },
  {
    title: { es: 'Librería', en: 'Library' },
    href: '/main/library',
    icon: Library,
  },
  {
    title: { es: 'Descripciones', en: 'Descriptions' },
    href: '/main/descriptions',
    icon: FileText,
  },
  {
    title: { es: 'Facturación', en: 'Billing' },
    href: '/main/billing',
    icon: CreditCard,
  },
  {
    title: { es: 'Perfil', en: 'Profile' },
    href: '/main/profile',
    icon: User,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, isMobileSidebarOpen, setIsMobileSidebarOpen, language } = useUI()

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 md:top-14 left-0 z-50 h-[100dvh] md:h-[calc(100dvh-3.5rem)]
          bg-surface-card border-r border-border
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
          ${isSidebarOpen ? 'md:translate-x-0 md:w-64' : 'md:-translate-x-full md:w-0 md:overflow-hidden'}
        `}
      >
        <div className="flex flex-col h-full justify-between">
          
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border h-14 shrink-0">
            <span className="font-semibold text-lg tracking-tight text-foreground">Tetsu App</span>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)} 
              className="p-1.5 -mr-1.5 rounded-full hover:bg-surface-soft transition-colors text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link, index) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={index}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-surface-soft text-foreground' 
                      : 'text-muted hover:bg-surface-soft hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.title[language]}
                </Link>
              )
            })}
          </nav>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-4 p-4 border-t border-border mt-auto">
            <Link
              href="/main/settings"
              className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/main/settings'
                  ? 'bg-surface-soft text-foreground'
                  : 'text-muted hover:bg-surface-soft hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
              {language === 'es' ? 'Configuración' : 'Settings'}
            </Link>

            <div className="h-px bg-border -mx-4" />

            <div className="text-center">
              <a 
                href="https://tetsustudio.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-muted hover:text-foreground transition-colors font-medium"
              >
                tetsustudio.com
              </a>
            </div>
          </div>

        </div>
      </aside>
    </>
  )
}
