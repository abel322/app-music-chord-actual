import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

interface AnalyzeRequestBody {
  url?: string
}

/**
 * Extrae el ID de video de YouTube para URLs estándar, móviles (m.youtube.com),
 * acortadas (youtu.be), embebidas o shorts.
 */
function parseYouTubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)
    const hostname = url.hostname.toLowerCase()

    if (hostname.includes('youtube.com')) {
      if (url.searchParams.has('v')) {
        return url.searchParams.get('v')
      }
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (['shorts', 'embed', 'v'].includes(pathParts[0]) && pathParts[1]) {
        return pathParts[1]
      }
    }

    if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts[0]) {
        return pathParts[0]
      }
    }
  } catch {
    // Si no es una URL con protocolo estándar, intentar con regex
  }

  const match = rawUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  )
  return match ? match[1] : null
}

/**
 * Función auxiliar para invocar Gemini probando gemini-1.5-flash primero,
 * con fallback limpio a gemini-1.5-pro o gemini-2.0-flash si retorna 404.
 */
async function runGeminiAnalysis(
  genAI: GoogleGenerativeAI,
  prompt: string,
  generationConfig: any
) {
  // Modelos limpios sin prefijo "models/"
  const candidateModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']
  let lastError: any = null

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
      })

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      if (responseText) {
        return { data: JSON.parse(responseText), modelUsed: modelName }
      }
    } catch (err: any) {
      lastError = err
      const isNotFound =
        err?.status === 404 ||
        err?.message?.includes('404') ||
        err?.message?.includes('not found') ||
        err?.message?.includes('is not supported')

      if (isNotFound) {
        console.warn(`Modelo ${modelName} retornó 404. Intentando fallback...`)
        continue
      }
      // Si el error es de autenticación, cuota o sintaxis, lanzar inmediatamente
      throw err
    }
  }

  throw lastError
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'Debe proporcionar una URL válida de YouTube o Spotify' },
        { status: 400 }
      )
    }

    // 1. Validación estricta de la API Key
    const rawApiKey = process.env.GEMINI_API_KEY
    const cleanApiKey = rawApiKey
      ? rawApiKey.replace(/^["']|["']$/g, '').trim()
      : ''

    if (
      !cleanApiKey ||
      cleanApiKey === '' ||
      cleanApiKey === '""' ||
      cleanApiKey === "''"
    ) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY no está configurada o está vacía en el archivo .env. Por favor ingresa tu API Key de Google Gemini (ejemplo: GEMINI_API_KEY=AIzaSy... sin comillas) en el archivo .env y reinicia el servidor.',
        },
        { status: 500 }
      )
    }

    // 2. Normalización de URLs de YouTube (soporta m.youtube.com, youtu.be, shorts, etc.)
    const trimmedUrl = url.trim()
    const ytVideoId = parseYouTubeVideoId(trimmedUrl)
    const normalizedUrl = ytVideoId
      ? `https://www.youtube.com/watch?v=${ytVideoId}`
      : trimmedUrl

    let rawTitle = ''
    let rawAuthor = ''

    try {
      if (trimmedUrl.includes('spotify.com')) {
        const spotifyRes = await fetch(
          `https://open.spotify.com/oembed?url=${encodeURIComponent(trimmedUrl)}`
        )
        if (spotifyRes.ok) {
          const sData = await spotifyRes.json()
          rawTitle = sData.title || ''
        }
      } else {
        // Consultar con la URL normalizada canónica (resuelve problemas con m.youtube.com)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          normalizedUrl
        )}&format=json`
        const ytRes = await fetch(oembedUrl)
        if (ytRes.ok) {
          const ytData = await ytRes.json()
          rawTitle = ytData.title || ''
          rawAuthor = ytData.author_name || ''
        } else {
          // Fallback adicional con noembed
          const noembedRes = await fetch(
            `https://noembed.com/embed?url=${encodeURIComponent(normalizedUrl)}`
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

    // 3. Inicializar Gemini y configurar schema estructurado JSON
    const genAI = new GoogleGenerativeAI(cleanApiKey)

    const generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description:
              'Título limpio de la canción, sin etiquetas como Official Video o HD',
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
    }

    const prompt = `Analiza musicalmente esta canción a partir del enlace y los metadatos disponibles:
- URL del video: ${normalizedUrl}
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

    // 4. Ejecutar análisis con fallback de modelos
    const { data: analysisData, modelUsed } = await runGeminiAnalysis(
      genAI,
      prompt,
      generationConfig
    )

    return NextResponse.json({
      success: true,
      data: analysisData,
      modelUsed,
      rawOembed: { title: rawTitle, author: rawAuthor, videoId: ytVideoId },
    })
  } catch (error: any) {
    console.error('Error en análisis musical con Gemini:', error)

    if (
      error?.message?.includes('API_KEY_INVALID') ||
      error?.message?.includes('API key not valid')
    ) {
      return NextResponse.json(
        {
          error:
            'La GEMINI_API_KEY no es válida. Por favor verifica tu clave en https://aistudio.google.com/app/apikey y configúrala en el archivo .env sin comillas.',
        },
        { status: 401 }
      )
    }

    if (error?.status === 404 || error?.message?.includes('404')) {
      return NextResponse.json(
        {
          error:
            'Error 404: El modelo de Gemini no fue encontrado o tu API key no tiene acceso al servicio v1beta. Verifica que tu clave de Gemini esté activa en Google AI Studio.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Error al analizar la canción con Gemini',
      },
      { status: 500 }
    )
  }
}
