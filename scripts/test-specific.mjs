import * as cheerio from 'cheerio'

async function testSong(artist, title) {
  console.log(`\n--- Probando: ${artist} - ${title} ---`)
  const q = encodeURIComponent(`${artist} ${title}`)
  const searchRes = await fetch(`https://genius.com/api/search?q=${q}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
    }
  })
  const json = await searchRes.json()
  const songUrl = json?.response?.hits?.[0]?.result?.url
  console.log('URL de Genius encontrada:', songUrl)

  if (!songUrl) return

  const res = await fetch(songUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  const containers = $('[data-lyrics-container="true"]')
  
  let lyrics = ''
  containers.each((_, el) => {
    $(el).find('br').replaceWith('\n')
    // EL SECRETO: Genius a veces pone la letra dentro de spans o divs anidados
    // que se pegan si no los manejamos con cuidado
    lyrics += $(el).text() + '\n'
  })

  let clean = lyrics.trim()
      .replace(/^[0-9]+\sContributors.*Lyrics\n?/i, '')
      .replace(/^[0-9]+\sContributor.*Lyrics\n?/i, '')
      .replace(/^.*Lyrics\n/i, '')
      .replace(/^\[Letra de\s+[^\]]+\]\n+/i, '')
      .replace(/[0-9]*\s*Embed$/i, '')
      .replace(/You might also like/gi, '')
      .replace(/\n{3,}/g, '\n\n')

  console.log('--- RESULTADO ---')
  console.log(clean.substring(0, 500) + '...')
  console.log('Longitud total:', clean.length)
}

testSong('Alex Campos', 'No puedo contar contigo').catch(console.error)
