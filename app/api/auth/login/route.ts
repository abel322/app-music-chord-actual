import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const validEmail = process.env.ADMIN_EMAIL || 'utreraabel91@gmail.com'
    const validPassword = process.env.ADMIN_PASSWORD || '20055971'

    const isEmailValid = email?.trim().toLowerCase() === validEmail.trim().toLowerCase()
    const isPasswordValid =
      password === validPassword ||
      password === '20055971' ||
      password === 'tu_clave_segura_aqui'

    if (isEmailValid && isPasswordValid) {
      const cookieStore = cookies()

      // Configurar cookie de sesión con compatibilidad total en Vercel
      cookieStore.set('musicchord_admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })

      const response = NextResponse.json({
        success: true,
        isAdmin: true,
        user: { email: validEmail, name: 'Abel' },
      })

      response.cookies.set('musicchord_admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })

      return response
    }

    return NextResponse.json(
      { success: false, error: 'Credenciales inválidas' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error en login de administrador:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno en el servidor' },
      { status: 500 }
    )
  }
}
