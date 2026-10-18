import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, ADMIN_EMAIL, verifyAdminToken } from '@/lib/admin-auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // 1. Revisar cookie de sesión de administrador exclusiva
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value
    const adminPayload = verifyAdminToken(cookie)

    if (adminPayload && adminPayload.isAdmin) {
      return NextResponse.json({
        isAdmin: true,
        user: {
          email: adminPayload.email,
          name: 'Administrador',
        },
      })
    }

    // 2. Visitante invitado (no autenticado / Read-Only por defecto)
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
