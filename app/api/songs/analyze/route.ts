import { NextRequest, NextResponse } from 'next/server'

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
 * Extrae y parsea limpiamente objetos JSON de las respuestas devueltas
 * por modelos con herramientas de búsqueda (grounding), eliminando delimitadores
 * markdown (```json ... ```) o texto conversacional.
 */
function extractAndParseJson(rawText: string): any {
  let cleaned = (rawText || '').trim()

  // 1. Extraer bloque markdown ```json ... ``` si existe
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim()
  } else {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
  }

  // 2. Extraer desde la primera '{' hasta la última '}'
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  return JSON.parse(cleaned)
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de la API Key en el entorno del servidor
    const rawApiKey = process.env.GEMINI_API_KEY
    const apiKey = rawApiKey
      ? rawApiKey.replace(/^["']|["']$/g, '').trim()
      : ''

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'La variable GEMINI_API_KEY no existe en el entorno del servidor Vercel.',
        },
        { status: 500 }
      )
    }

    const body: AnalyzeRequestBody = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'Debe proporcionar una URL válida de YouTube o Spotify' },
        { status: 400 }
      )
    }

    // 2. Normalización de URLs y extracción de metadatos oEmbed
    const trimmedUrl = url.trim()
    const ytVideoId = parseYouTubeVideoId(trimmedUrl)
    const normalizedUrl = ytVideoId
      ? `https://www.youtube.com/watch?v=${ytVideoId}`
      : trimmedUrl

    let cleanTitle = ''
    let authorName = ''

    try {
      if (trimmedUrl.includes('spotify.com')) {
        const spotifyRes = await fetch(
          `https://open.spotify.com/oembed?url=${encodeURIComponent(trimmedUrl)}`
        )
        if (spotifyRes.ok) {
          const sData = await spotifyRes.json()
          cleanTitle = sData.title || ''
          authorName = sData.author_name || ''
        }
      } else {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          normalizedUrl
        )}&format=json`
        const ytRes = await fetch(oembedUrl)
        if (ytRes.ok) {
          const ytData = await ytRes.json()
          cleanTitle = ytData.title || ''
          authorName = ytData.author_name || ''
        } else {
          const noembedRes = await fetch(
            `https://noembed.com/embed?url=${encodeURIComponent(normalizedUrl)}`
          )
          if (noembedRes.ok) {
            const noData = await noembedRes.json()
            cleanTitle = noData.title || ''
            authorName = noData.author_name || ''
          }
        }
      }
    } catch (oembedErr) {
      console.warn('Error al consultar oEmbed:', oembedErr)
    }

    if (!cleanTitle) {
      cleanTitle = trimmedUrl
    }
    if (!authorName) {
      authorName = 'No disponible'
    }

    // 3. Prompt musical riguroso con indicación de búsqueda web
    const promptText = `Actúa como un transcriptor y analista musical profesional.
Busca en la web la información armónica y métrica exacta de la canción en fuentes musicales reconocidas (LaCuerda, CifraClub, Chordify, SongBPM, MultiTracks, Ultimate-Guitar):
Título: "${cleanTitle}"
Artista / Canal: "${authorName}"
URL de referencia: "${normalizedUrl}"

Requisitos estrictos de búsqueda y análisis:
1. BPM / Tempo: Busca el tempo real de la grabación original o versión en vivo indicada (diferencia con precisión temas rápidos/upbeat de 120-135 BPM de baladas lentas de 65-75 BPM).
2. Tonalidad: Determina la tonalidad real distinguiendo explícitamente entre tonalidad Mayor y Menor (por ejemplo: "Em" si el centro tonal es Mi menor, "Am", "F#m", "Dm", "C", "G").
3. Compás: Indica el compás exacto (ej. "4/4 (Común)", "3/4", "6/8").
4. Estructura y Progresiones: Transcribe la secuencia real de secciones de la canción (Intro, Estrofa, Pre-Coro, Coro, Puente, Outro) con sus acordes exactos respetando la tonalidad encontrada.

Devuelve ÚNICAMENTE un objeto JSON válido (sin formato Markdown adicional, sin explicaciones ni comillas triples) con esta estructura exacta:
{
  "title": "${cleanTitle}",
  "artist": "${authorName}",
  "key": "Em",
  "timeSignature": "4/4 (Común)",
  "tempo": 128,
  "genre": "Género musical",
  "instruments": ["Batería", "Bajo", "Guitarras", "Teclados"],
  "sections": [
    { "type": "Intro 1", "chords": "Em - C - G - D" },
    { "type": "Estrofa 1", "chords": "Em - C - G - D" },
    { "type": "Coro 1", "chords": "C - D - G - Em" }
  ]
}`

    // 4. Llamada REST directa con Google Search Grounding
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`

    let googleRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    })

    // Si la API de Google rechaza responseMimeType al usarse junto a herramientas de búsqueda (error 400),
    // reintentar automáticamente con Google Search activo sin el campo generationConfig.
    if (!googleRes.ok && googleRes.status === 400) {
      const errClone = await googleRes.clone().text().catch(() => '')
      if (
        errClone.includes('response_mime_type') ||
        errClone.includes('responseMimeType') ||
        errClone.includes('tool') ||
        errClone.includes('generation_config')
      ) {
        googleRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            tools: [{ googleSearch: {} }],
          }),
        })
      }
    }

    if (!googleRes.ok) {
      const errorDetails = await googleRes.text()
      console.error('Detalle del error de Google:', errorDetails)
      return NextResponse.json(
        { error: `Google API Error (${googleRes.status}): ${errorDetails}` },
        { status: googleRes.status }
      )
    }

    const data = await googleRes.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    let rawText = ''
    for (const part of parts) {
      if (part.text) {
        rawText += part.text + '\n'
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: 'Google no devolvió contenido de texto en la respuesta' },
        { status: 500 }
      )
    }

    const parsedAnalysis = extractAndParseJson(rawText)

    // Determinar con precisión la tonalidad raíz y el modo (Mayor / Menor)
    const rawKey = (parsedAnalysis.key || 'C').toString().trim()
    const isMinor =
      parsedAnalysis.mode?.toLowerCase().includes('menor') ||
      parsedAnalysis.mode?.toLowerCase().includes('minor') ||
      /^[A-G][#b]?m(?!aj)/i.test(rawKey) ||
      (rawKey.endsWith('m') && !rawKey.toLowerCase().endsWith('maj'))

    const rootKey = rawKey.replace(/m$/i, '').replace(/minor$/i, '').replace(/menor$/i, '').trim()

    return NextResponse.json({
      ...parsedAnalysis,
      key: rawKey,
      rootKey: rootKey || 'C',
      mode: isMinor ? 'Menor' : 'Mayor',
      isMinor,
      data: {
        ...parsedAnalysis,
        key: rawKey,
        rootKey: rootKey || 'C',
        mode: isMinor ? 'Menor' : 'Mayor',
        isMinor,
      },
      success: true,
      rawOembed: { title: cleanTitle, author: authorName, videoId: ytVideoId },
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
