import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  cookieStore.delete('musicchord_admin_session')

  const response = NextResponse.json({ success: true, isAdmin: false, user: null })

  // Eliminar la cookie de sesión de administrador de forma compatible en Vercel
  response.cookies.set({
    name: 'musicchord_admin_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  // Eliminar variantes de cookies de NextAuth por si estuviesen activas
  const sessionCookies = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
  ]

  for (const cookieName of sessionCookies) {
    response.cookies.set({
      name: cookieName,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }

  return response
}
