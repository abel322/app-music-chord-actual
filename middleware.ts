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
  '/api/songs',
  '/api/progressions',
  '/api/auth',
  '/login',
  '/register',
]

/**
 * Rutas privadas exclusivas del Administrador.
 * Si un visitante anónimo intenta ingresar manualmente, se le redirige a /dashboard/songs/chords.
 */
const ADMIN_ONLY_PATHS = [
  '/dashboard/routines',
  '/dashboard/settings',
  '/dashboard/songs/new',
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

  // 2. Redirección de protección para rutas privadas del Administrador
  const isAdminPath = ADMIN_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (isAdminPath) {
    const hasAdminCookie =
      request.cookies.has('musicchord_admin_session') ||
      request.cookies.has('next-auth.session-token') ||
      request.cookies.has('__Secure-next-auth.session-token')

    if (!hasAdminCookie) {
      // Redirigir amablemente al repertorio público de canciones
      return NextResponse.redirect(new URL('/dashboard/songs/chords', request.url))
    }
    return NextResponse.next()
  }

  // 3. Permitir todas las rutas públicas y sus sub-rutas dinámicas
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (isPublic) {
    return NextResponse.next()
  }

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
