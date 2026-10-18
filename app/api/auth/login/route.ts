import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { ADMIN_COOKIE_NAME, ADMIN_EMAIL, createAdminToken } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const password = body.password?.trim()
    const email = (body.email?.trim() || ADMIN_EMAIL).toLowerCase()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'La contraseña es requerida' },
        { status: 400 }
      )
    }

    const envAdminPassword = process.env.ADMIN_PASSWORD || 'tu_clave_segura_aqui'
    let isValid = false

    // 1. Verificación directa contra variable de entorno
    if (password === envAdminPassword) {
      isValid = true
    }

    // 2. Si no coincide con la variable, verificar si coincide con la contraseña hasheada en DB
    if (!isValid) {
      try {
        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: 'insensitive',
            },
          },
        })

        if (user?.password) {
          isValid = await compare(password, user.password)
        }
      } catch (dbError) {
        console.error('Error verificando contraseña en base de datos:', dbError)
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Credenciales de administrador incorrectas' },
        { status: 401 }
      )
    }

    // Generar token de administrador cifrado/firmado
    const token = createAdminToken(ADMIN_EMAIL)

    const response = NextResponse.json({
      success: true,
      isAdmin: true,
      user: {
        email: ADMIN_EMAIL,
        name: 'Abel',
      },
    })

    // Establecer cookie HTTP-only segura
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    return response
  } catch (error) {
    console.error('Error en login de administrador:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno en el servidor de autenticación' },
      { status: 500 }
    )
  }
}
