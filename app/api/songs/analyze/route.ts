import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

interface AnalyzeRequestBody {
  url?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Debe proporcionar una URL válida' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY no está configurada en las variables de entorno (.env). Por favor agrega tu API key de Gemini.',
        },
        { status: 500 }
      )
    }

    // 1. Extraer título y canal mediante la API oEmbed pública de YouTube (o fallback)
    let rawTitle = ''
    let rawAuthor = ''

    try {
      if (url.includes('spotify.com')) {
        const spotifyRes = await fetch(
          `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
        )
        if (spotifyRes.ok) {
          const sData = await spotifyRes.json()
          rawTitle = sData.title || ''
        }
      } else {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        const ytRes = await fetch(oembedUrl)
        if (ytRes.ok) {
          const ytData = await ytRes.json()
          rawTitle = ytData.title || ''
          rawAuthor = ytData.author_name || ''
        } else {
          // Fallback con noembed si YouTube oEmbed directo no responde 200
          const noembedRes = await fetch(
            `https://noembed.com/embed?url=${encodeURIComponent(url)}`
          )
          if (noembedRes.ok) {
            const noData = await noembedRes.json()
            rawTitle = noData.title || ''
            rawAuthor = noData.author_name || ''
          }
        }
      }
    } catch (oembedErr) {
      console.warn('Error al consultar oEmbed:', oembedErr)
    }

    // 2. Inicializar Gemini y configurar schema estricto JSON
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            title: {
              type: SchemaType.STRING,
              description: 'Título limpio de la canción, sin etiquetas como Official Video o HD',
            },
            artist: {
              type: SchemaType.STRING,
              description: 'Nombre del artista o banda',
            },
            key: {
              type: SchemaType.STRING,
              description:
                'Tonalidad musical raíz (ej. C, C#, D, D#, E, F, F#, G, G#, A, A#, B)',
            },
            timeSignature: {
              type: SchemaType.STRING,
              description: 'Compás musical (ej. 4/4, 3/4, 6/8)',
            },
            tempo: {
              type: SchemaType.INTEGER,
              description: 'Tempo estimado en BPM (número entero)',
            },
            genre: {
              type: SchemaType.STRING,
              description: 'Género musical detectado',
            },
            instruments: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: 'Array con nombres de instrumentos detectados',
            },
            sections: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: {
                    type: SchemaType.STRING,
                    description:
                      'Tipo de sección: intro, verse, prechorus, chorus, bridge, instrumental, solo, outro',
                  },
                  chords: {
                    type: SchemaType.STRING,
                    description:
                      'Acordes de la sección separados por espacios (ej. C G Am F)',
                  },
                },
                required: ['type', 'chords'],
              },
              description:
                'Array de objetos { type, chords } con las secciones y acordes detectados',
            },
          },
          required: [
            'title',
            'artist',
            'key',
            'timeSignature',
            'tempo',
            'genre',
            'instruments',
            'sections',
          ],
        },
      },
    })

    const prompt = `Analiza musicalmente esta canción a partir del enlace y los metadatos disponibles:
- URL del video: ${url}
- Título extraído: ${rawTitle || 'No disponible'}
- Canal / Artista extraído: ${rawAuthor || 'No disponible'}

Instrucciones:
1. Extrae el título limpio de la canción ("title") y el nombre del artista ("artist").
2. Identifica la tonalidad musical fundamental ("key"). Debe ser una de: C, C#, D, D#, E, F, F#, G, G#, A, A#, B.
3. Determina el compás musical ("timeSignature", ej. "4/4", "3/4", "6/8").
4. Determina el tempo en BPM como un número entero ("tempo", ej. 120).
5. Detecta el género musical ("genre").
6. Enumera los instrumentos musicales principales presentes en la canción ("instruments").
7. Desglosa la estructura completa de la canción en secciones ("sections"). Para cada sección incluye "type" ('intro', 'verse', 'prechorus', 'chorus', 'bridge', 'instrumental', 'solo', 'outro') y la progresión armónica correspondiente ("chords", con acordes válidos separados por espacio, por ejemplo: "C G Am F").`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const analysisData = JSON.parse(responseText)

    return NextResponse.json({
      success: true,
      data: analysisData,
      rawOembed: { title: rawTitle, author: rawAuthor },
    })
  } catch (error: any) {
    console.error('Error en análisis musical con Gemini:', error)
    return NextResponse.json(
      {
        error: error.message || 'Error al analizar la canción con Gemini',
      },
      { status: 500 }
    )
  }
}
