import Link from 'next/link'
import { LayoutDashboard, Settings, User } from 'lucide-react'

const sidebarLinks = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30 min-h-[calc(100vh-3.5rem)] hidden md:block">
      <div className="flex h-full max-h-screen flex-col gap-2 p-4">
        <div className="flex-1">
          <nav className="grid items-start gap-2 text-sm font-medium">
            {sidebarLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <Link
                  key={index}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />
                  {link.title}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
