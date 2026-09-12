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

    // 3. Llamada REST directa a Gemini 2.5 Flash
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const promptText = `Eres un experto musical. Analiza este video de YouTube o canción:
Título: "${cleanTitle}"
Canal: "${authorName}"
URL: "${normalizedUrl}"

Devuelve ÚNICAMENTE un objeto JSON válido (sin formato Markdown, sin comillas triples) con esta estructura exacta:
{
  "title": "Nombre de la canción",
  "artist": "Artista",
  "key": "G",
  "timeSignature": "4/4",
  "tempo": 120,
  "genre": "Género",
  "instruments": ["Batería", "Bajo", "Piano"],
  "sections": [
    { "type": "intro", "chords": "G - Em - C - D" },
    { "type": "verse", "chords": "G - Em - C - D" },
    { "type": "chorus", "chords": "C - D - G - Em" }
  ]
}`

    const googleRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!googleRes.ok) {
      const errorDetails = await googleRes.text()
      console.error('Detalle del error de Google:', errorDetails)
      return NextResponse.json(
        { error: `Google API Error (${googleRes.status}): ${errorDetails}` },
        { status: googleRes.status }
      )
    }

    const data = await googleRes.json()
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawJson) {
      return NextResponse.json(
        { error: 'Google no devolvió contenido en la respuesta' },
        { status: 500 }
      )
    }

    let cleanedJson = rawJson.trim()
    if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()
    }
    const firstBrace = cleanedJson.indexOf('{')
    const lastBrace = cleanedJson.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1)
    }

    const parsedAnalysis = JSON.parse(cleanedJson)

    return NextResponse.json({
      ...parsedAnalysis,
      data: parsedAnalysis,
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
