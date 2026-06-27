import type { Metadata } from 'next'
import { Inter, Nunito, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { UIProvider } from '@/hooks/use-ui'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700'] })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
export const metadata: Metadata = {
  title: 'Fit Lab',
  description: 'Boilerplate escalable con Next.js 14 y Supabase',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fit Lab',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${nunito.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <UIProvider>
          {children}
        </UIProvider>
      </body>
    </html>
  )
}
