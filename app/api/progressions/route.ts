import { NextResponse } from 'next/server'
import { chordProgressions, ProgressionDef } from '@/lib/data/chordProgressions'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: chordProgressions,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener progresiones' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ProgressionDef>

    if (!body.name || !body.chords || !Array.isArray(body.chords) || body.chords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Título y al menos un acorde son requeridos' },
        { status: 400 }
      )
    }

    const newProgression: ProgressionDef = {
      id: body.id || `prog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: body.name,
      genre: body.genre || 'Personalizada',
      key: body.key || 'C',
      bpm: body.bpm || 120,
      chords: body.chords,
    }

    return NextResponse.json({
      success: true,
      data: newProgression,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al procesar la creación de la progresión' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<ProgressionDef>

    if (!body.id || !body.name || !body.chords || !Array.isArray(body.chords)) {
      return NextResponse.json(
        { success: false, error: 'Datos de progresión incompletos para actualizar' },
        { status: 400 }
      )
    }

    const updatedProgression: ProgressionDef = {
      id: body.id,
      name: body.name,
      genre: body.genre || 'Personalizada',
      key: body.key || 'C',
      bpm: body.bpm || 120,
      chords: body.chords,
    }

    return NextResponse.json({
      success: true,
      data: updatedProgression,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al procesar la actualización de la progresión' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de progresión requerido' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al procesar el borrado de la progresión' },
      { status: 500 }
    )
  }
}
