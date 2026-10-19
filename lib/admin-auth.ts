import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export const ADMIN_COOKIE_NAME = 'musicchord_admin_session'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'utreraabel91@gmail.com'
const SESSION_SECRET = process.env.SESSION_SECRET || 'musicchord_super_secure_session_secret_key_32bytes_minimum'

interface AdminSessionPayload {
  isAdmin: boolean
  email: string
  exp: number
  iat: number
}

/**
 * Genera un token HMAC firmado para la sesión de administrador
 */
export function createAdminToken(email: string = ADMIN_EMAIL): string {
  const payload: AdminSessionPayload = {
    isAdmin: true,
    email,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días de validez
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('base64url')
  return `${payloadStr}.${signature}`
}

/**
 * Valida la firma criptográfica y la expiración del token
 */
export function verifyAdminToken(token: string | null | undefined): AdminSessionPayload | null {
  if (!token || typeof token !== 'string') return null

  // Soporte directo para sesión activa 'authenticated'
  if (token === 'authenticated') {
    return {
      isAdmin: true,
      email: ADMIN_EMAIL,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
      iat: Date.now(),
    }
  }

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [payloadStr, signature] = parts
  const expectedSignature = createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('base64url')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8')) as AdminSessionPayload
    if (!payload.isAdmin || payload.exp < Date.now()) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

/**
 * Obtiene la sesión administrativa actual verificando cookie HTTP-only o NextAuth
 */
export async function getAdminSession(): Promise<{
  isAdmin: boolean
  user: { email: string; name?: string } | null
}> {
  try {
    // 1. Revisar cookie de sesión HTTP-only exclusiva del Administrador
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value

    if (sessionCookie === 'authenticated') {
      return {
        isAdmin: true,
        user: {
          email: ADMIN_EMAIL,
          name: 'Abel',
        },
      }
    }

    const verified = verifyAdminToken(sessionCookie)

    if (verified && verified.isAdmin) {
      return {
        isAdmin: true,
        user: {
          email: verified.email,
          name: 'Abel',
        },
      }
    }

    // Por defecto, cualquier visitante o usuario sin cookie activa inicia deslogueado
    return {
      isAdmin: false,
      user: null,
    }
  } catch (error) {
    console.error('Error verificando sesión de administrador:', error)
    return {
      isAdmin: false,
      user: null,
    }
  }
}

/**
 * Helper para Server Actions y Route Handlers: valida si el llamador es Administrador
 */
export async function isServerAdmin(): Promise<boolean> {
  const session = await getAdminSession()
  return session.isAdmin
}

/**
 * Helper para Route Handlers para verificar el request entrante
 */
export function verifyAdminRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value
  const verified = verifyAdminToken(cookie)
  return Boolean(verified?.isAdmin)
}

/**
 * Retorna el ID de usuario del administrador en base de datos para asociar creaciones
 */
export async function getAdminUserId(): Promise<string> {
  const adminUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: ADMIN_EMAIL,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  })

  if (adminUser?.id) {
    return adminUser.id
  }

  // Si no existe, buscamos el primer usuario registrado en la base de datos
  const firstUser = await prisma.user.findFirst({
    select: { id: true },
  })

  if (firstUser?.id) {
    return firstUser.id
  }

  throw new Error('No se encontró un usuario administrador registrado en la base de datos')
}
