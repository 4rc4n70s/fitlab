import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(request: NextRequest) {
  // TODO: Integrar un servicio de Rate Limiting (ej. Vercel KV, Upstash Redis) 
  // para proteger rutas de mutación sensibles (login, registro, reseteo de password)
  // Ejemplo:
  // const rateLimitResponse = await rateLimiter(request.ip)
  // if (!rateLimitResponse.success) return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 })

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
