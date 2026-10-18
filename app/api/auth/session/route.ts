import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, ADMIN_EMAIL, verifyAdminToken } from '@/lib/admin-auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // 1. Revisar cookie de sesión de administrador
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value
    const adminPayload = verifyAdminToken(cookie)

    if (adminPayload) {
      return NextResponse.json({
        isAdmin: true,
        user: {
          email: adminPayload.email,
          name: 'Abel',
        },
      })
    }

    // 2. Revisar sesión de NextAuth para compatibilidad
    const nextAuthSession = await getServerSession(authOptions)
    if (nextAuthSession?.user?.email) {
      const isEmailAdmin = nextAuthSession.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      return NextResponse.json({
        isAdmin: isEmailAdmin,
        user: {
          email: nextAuthSession.user.email,
          name: nextAuthSession.user.name || (isEmailAdmin ? 'Abel' : 'Usuario'),
        },
      })
    }

    // 3. Visitante invitado (no autenticado / Read-Only)
    return NextResponse.json({
      isAdmin: false,
      user: null,
    })
  } catch (error) {
    console.error('Error obteniendo sesión:', error)
    return NextResponse.json({
      isAdmin: false,
      user: null,
    })
  }
}
