import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Rutas públicas que cualquier visitante puede acceder libremente sin autenticación.
 * Nunca deben redirigir a /login ni a /register.
 */
const PUBLIC_PATHS = [
  '/',
  '/dashboard',
  '/dashboard/songs',
  '/dashboard/songs/chords',
  '/dashboard/songs/lyrics',
  '/dashboard/chords',
  '/dashboard/practice',
  '/dashboard/search',
  '/dashboard/routines',
  '/api/songs',
  '/api/progressions',
  '/api/auth',
  '/login',
  '/register',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Permitir siempre archivos estáticos, imágenes, favicon y rutas internas de Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. Verificar si la ruta solicitada coincide con las rutas públicas o sus sub-rutas dinámicas
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (isPublic) {
    // Permitir navegación libre sin interrupciones ni redirecciones a /login o /register
    return NextResponse.next()
  }

  // 3. Para cualquier otra ruta dentro de la aplicación, permitir acceso predeterminado
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplica el matcher a todas las rutas excepto archivos estáticos de Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
