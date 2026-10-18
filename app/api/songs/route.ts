import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { parseChords, detectKey } from '@/lib/chord-parser'
import { SongInputSchema } from '@/lib/validations/song'
import { isServerAdmin, getAdminUserId } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/songs: Público para cualquier visitante
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    const songs = await prisma.song.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { artist: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ songs })
  } catch (error) {
    console.error('Error fetching songs:', error)
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }
}

/**
 * POST /api/songs: Protegido exclusivamente para el Administrador
 */
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isServerAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Prohibido: se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    const adminUserId = await getAdminUserId()

    const body = await req.json()
    const data = SongInputSchema.parse(body)

    const rawText = data.content || data.lyrics || ''
    const parsedChords = rawText ? parseChords(rawText) : []
    const detectedKey = parsedChords.length > 0 ? detectKey(parsedChords) : 'C'

    const chordsValue = data.chords
      ? typeof data.chords === 'string'
        ? data.chords
        : JSON.stringify(data.chords)
      : JSON.stringify(parsedChords)

    const song = await prisma.song.create({
      data: {
        title: data.title,
        artist: data.artist || '',
        content: data.content || data.lyrics || '',
        lyrics: data.lyrics || '',
        chords: chordsValue,
        key: data.key || detectedKey || 'C',
        timeSignature: data.timeSignature || '4/4',
        tempo: data.tempo ?? 120,
        youtubeUrl: data.youtubeUrl || null,
        genre: data.genre || null,
        instruments: data.instruments !== undefined ? (data.instruments as any) : undefined,
        sections: data.sections !== undefined ? (data.sections as any) : undefined,
        tags: data.tags || [],
        isFavorite: data.isFavorite ?? false,
        userId: adminUserId,
      },
    })

    return NextResponse.json({ song }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating song:', error)
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 })
  }
}
