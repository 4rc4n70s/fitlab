import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LoginSidebar } from './LoginSidebar'
import { Suspense } from 'react'
import { ThemeToggle } from './ThemeToggle'

import { InstallApp } from './InstallApp'

export async function Navbar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg">
            Fit Lab
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <InstallApp />
          <ThemeToggle />
          {user ? (
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">Cerrar Sesión</Button>
            </form>
          ) : (
            <Suspense fallback={<Button>Iniciar Sesión</Button>}>
              <LoginSidebar />
            </Suspense>
          )}
        </div>
      </div>
    </nav>
  )
}
