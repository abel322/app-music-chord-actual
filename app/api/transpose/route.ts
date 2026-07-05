import { NextRequest, NextResponse } from 'next/server'
import { transposeSong, getSemitonesBetween } from '@/lib/transpose'
import { z } from 'zod'

const TransposeSchema = z.object({
  lyrics: z.string(),
  fromKey: z.string().optional(),
  toKey: z.string().optional(),
  semitones: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = TransposeSchema.parse(body)

    let semitones = data.semitones || 0

    if (data.fromKey && data.toKey) {
      semitones = getSemitonesBetween(data.fromKey, data.toKey)
    }

    const transposedLyrics = transposeSong(data.lyrics, semitones)

    return NextResponse.json({ 
      lyrics: transposedLyrics,
      semitones 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to transpose' }, { status: 500 })
  }
}
