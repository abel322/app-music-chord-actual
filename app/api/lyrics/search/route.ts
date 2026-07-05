import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

async function searchGeniusApi(artist: string, title: string): Promise<string | null> {
  const q = encodeURIComponent(`${artist} ${title}`)
  const res = await fetch(`https://genius.com/api/search?q=${q}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
  if (!res.ok) return null

  const json = await res.json()
  const hits = json?.response?.hits
  if (!hits || hits.length === 0) return null

  return hits[0].result.url as string
}

async function scrapeLyricsFromGenius(songUrl: string): Promise<string | null> {
  const res = await fetch(songUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    },
  })
  if (!res.ok) return null

  const html = await res.text()
  const $ = cheerio.load(html)

  // Seleccionar los contenedores de letra
  const containers = $('[data-lyrics-container="true"]')
  if (containers.length > 0) {
    let lyrics = ''
    containers.each((_, el) => {
      // Reemplazar <br> por saltos de línea
      $(el).find('br').replaceWith('\n')
      // Limpiar elementos de anuncios o "You might also like"
      $(el).find('aside, script, style, .referent, .InstrumentalSearch, .InreadAd').remove()
      
      lyrics += $(el).text() + '\n'
    })

    // Limpieza profunda del texto extraído
    let cleanLyrics = lyrics.trim()
      // Quitar el encabezado basura de Genius (ej: "2 ContributorsTu Poeta Lyrics")
      .replace(/^[0-9]+\sContributors.*Lyrics\n?/i, '')
      .replace(/^[0-9]+\sContributor.*Lyrics\n?/i, '')
      .replace(/^.*Lyrics\n/i, '')
      // Quitar etiquetas tipo [Letra de "..."] que Genius pone al inicio
      .replace(/^\[Letra de\s+[^\]]+\]\n+/i, '')
      // Quitar el botón de "Embed" que aparece al final
      .replace(/Embed$/i, '')
      .replace(/[0-9]*\s*Embed$/i, '')
      // Quitar frases de "You might also like"
      .replace(/You might also like/gi, '')
      // Corregir saltos de línea triples
      .replace(/\n{3,}/g, '\n\n')

    return cleanLyrics.trim()
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { title, artist } = await request.json()

    if (!title || !artist) {
      return NextResponse.json(
        { error: 'Título y artista son requeridos' },
        { status: 400 }
      )
    }

    // 1. Search Genius API for the song URL
    const songUrl = await searchGeniusApi(artist, title)
    if (songUrl) {
      const lyrics = await scrapeLyricsFromGenius(songUrl)
      if (lyrics && lyrics.length > 50) {
        return NextResponse.json({ lyrics, source: 'genius' })
      }
    }

    // 2. Fallback: lyrics.ovh (works for some songs)
    const ovhRes = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    if (ovhRes.ok) {
      const data = await ovhRes.json()
      if (data.lyrics && data.lyrics.length > 20) {
        return NextResponse.json({ lyrics: data.lyrics, source: 'lyrics.ovh' })
      }
    }

    return NextResponse.json(
      { error: 'No se encontró la letra de la canción' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error buscando letra:', error)
    return NextResponse.json(
      { error: 'Error al buscar la letra' },
      { status: 500 }
    )
  }
}
