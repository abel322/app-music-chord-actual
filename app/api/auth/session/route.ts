import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('musicchord_admin_session')

    if (session?.value === 'authenticated' || session?.value) {
      return NextResponse.json({
        isAdmin: true,
        user: {
          email: process.env.ADMIN_EMAIL || 'utreraabel91@gmail.com',
          name: 'Abel',
        },
      })
    }

    return NextResponse.json({ isAdmin: false, user: null })
  } catch (error) {
    console.error('Error obteniendo sesión:', error)
    return NextResponse.json({ isAdmin: false, user: null })
  }
}
