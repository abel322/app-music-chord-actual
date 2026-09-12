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
 * Limpia y parsea de forma segura respuestas JSON devueltas por modelos LLM,
 * soportando bloques markdown con o sin etiquetas (```json ... ```),
 * espacios en blanco o texto periférico.
 */
function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim()

  // Extraer contenido de bloques markdown si existen
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (markdownMatch && markdownMatch[1]) {
    cleaned = markdownMatch[1].trim()
  } else {
    // Si empieza o termina con comillas invertidas
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
  }

  // Aislar el primer { y el último } si hay texto alrededor
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  return JSON.parse(cleaned)
}

/**
 * Determina si un error corresponde a un modelo no encontrado (404)
 * o funcionalidad no soportada en la versión de la API utilizada.
 */
function isNotFoundError(err: any): boolean {
  const status =
    err?.status ||
    err?.statusCode ||
    (typeof err?.message === 'string' && err.message.includes('404') ? 404 : null)

  const msg = (err?.message || '').toLowerCase()
  return (
    status === 404 ||
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('not supported') ||
    msg.includes('unsupported') ||
    msg.includes('is not found')
  )
}

/**
 * Llamada HTTP directa vía REST a Google Generative Language API.
 * Infalible en entornos serverless como Vercel si el SDK arroja 404 en v1beta.
 */
async function callGeminiRest(
  apiKey: string,
  modelName: string,
  prompt: string,
  apiVersion: 'v1beta' | 'v1' = 'v1beta'
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    let parsedMessage = errorText
    try {
      const errorJson = JSON.parse(errorText)
      parsedMessage = errorJson?.error?.message || errorText
    } catch {
      // Usar texto plano
    }

    const err: any = new Error(
      `REST Gemini error (${apiVersion}/${modelName}) [${response.status}]: ${parsedMessage}`
    )
    err.status = response.status
    throw err
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error(`Respuesta vacía de Gemini vía REST (${apiVersion}/${modelName})`)
  }

  return text
}

/**
 * Ejecuta el análisis musical utilizando gemini-2.5-flash directamente,
 * con fallback secundario a gemini-2.5-pro si es necesario.
 *
 * Para cada modelo se intenta primero el SDK oficial (@google/generative-ai).
 * Si arroja 404 o incompatibilidad, se activa el fallback REST directo
 * (v1beta y luego v1).
 */
async function runGeminiAnalysis(
  apiKey: string,
  genAI: GoogleGenerativeAI,
  prompt: string,
  baseGenerationConfig: any
) {
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-pro']

  let lastError: any = null

  for (const modelName of candidateModels) {
    // 1. Intentar primero con SDK oficial
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: baseGenerationConfig,
      })

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      if (responseText) {
        const parsed = cleanJsonResponse(responseText)
        return { data: parsed, modelUsed: `${modelName} (SDK)` }
      }
    } catch (sdkErr: any) {
      lastError = sdkErr

      // Si es error de autenticación o cuota, no seguir probando modelos ciegamente
      const isAuthOrQuota =
        sdkErr?.status === 401 ||
        sdkErr?.status === 403 ||
        sdkErr?.status === 429 ||
        sdkErr?.message?.includes('API_KEY_INVALID') ||
        sdkErr?.message?.includes('API key not valid') ||
        sdkErr?.message?.includes('RESOURCE_EXHAUSTED')

      if (isAuthOrQuota) {
        throw sdkErr
      }

      console.warn(
        `[Gemini SDK] Modelo ${modelName} falló (${sdkErr?.status || sdkErr?.message}). Intentando fallback REST v1beta...`
      )
    }

    // 2. Fallback REST directo (v1beta)
    try {
      const restTextV1Beta = await callGeminiRest(
        apiKey,
        modelName,
        prompt,
        'v1beta'
      )
      const parsed = cleanJsonResponse(restTextV1Beta)
      return { data: parsed, modelUsed: `${modelName} (REST v1beta)` }
    } catch (restErr: any) {
      lastError = restErr

      const isAuthOrQuota =
        restErr?.status === 401 ||
        restErr?.status === 403 ||
        restErr?.status === 429 ||
        restErr?.message?.includes('API_KEY_INVALID') ||
        restErr?.message?.includes('API key not valid') ||
        restErr?.message?.includes('RESOURCE_EXHAUSTED')

      if (isAuthOrQuota) {
        throw restErr
      }

      console.warn(
        `[Gemini REST v1beta] Modelo ${modelName} falló (${restErr?.status || restErr?.message}). Intentando REST v1...`
      )
    }

    // 3. Fallback REST directo (v1)
    try {
      const restTextV1 = await callGeminiRest(apiKey, modelName, prompt, 'v1')
      const parsed = cleanJsonResponse(restTextV1)
      return { data: parsed, modelUsed: `${modelName} (REST v1)` }
    } catch (restV1Err: any) {
      lastError = restV1Err

      const isAuthOrQuota =
        restV1Err?.status === 401 ||
        restV1Err?.status === 403 ||
        restV1Err?.status === 429 ||
        restV1Err?.message?.includes('API_KEY_INVALID') ||
        restV1Err?.message?.includes('API key not valid') ||
        restV1Err?.message?.includes('RESOURCE_EXHAUSTED')

      if (isAuthOrQuota) {
        throw restV1Err
      }

      console.warn(
        `[Gemini REST v1] Modelo ${modelName} no disponible. Probando siguiente candidato...`
      )
    }
  }

  // Si se agotaron los modelos candidatos sin éxito
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
7. Desglosa la estructura completa de la canción en secciones ("sections"). Para cada sección incluye "type" ('intro', 'verse', 'prechorus', 'chorus', 'bridge', 'instrumental', 'solo', 'outro') y la progresión armónica correspondiente ("chords", con acordes válidos separados por espacio, por ejemplo: "C G Am F").

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA (sin markdown adicional, sin texto previo ni explicaciones):
{
  "title": "string",
  "artist": "string",
  "key": "C",
  "timeSignature": "4/4",
  "tempo": 120,
  "genre": "string",
  "instruments": ["string"],
  "sections": [
    { "type": "intro", "chords": "C G Am F" }
  ]
}`

    // 4. Ejecutar análisis con fallback de modelos y REST directa
    const { data: analysisData, modelUsed } = await runGeminiAnalysis(
      cleanApiKey,
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
            'Error 404: El modelo de Gemini (gemini-2.5-flash / gemini-2.5-pro) no fue encontrado o no está activo para tu API key en Google AI Studio (se probaron vía SDK y REST v1beta/v1). Verifica que la API Generative Language esté habilitada en tu proyecto de Google Cloud.',
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
