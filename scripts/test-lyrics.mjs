import * as cheerio from 'cheerio'

async function test() {
  const artist = 'Alex Campo'
  const title = 'Tu Poeta'

  // Step 1: Search
  const q = encodeURIComponent(`${artist} ${title}`)
  const searchRes = await fetch(`https://genius.com/api/search?q=${q}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
    }
  })
  const json = await searchRes.json()
  const songUrl = json?.response?.hits?.[0]?.result?.url
  console.log('Song URL:', songUrl)

  if (!songUrl) {
    console.log('No URL found')
    return
  }

  // Step 2: Scrape
  const res = await fetch(songUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    }
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  const containers = $('[data-lyrics-container="true"]')
  console.log('Lyrics containers found:', containers.length)

  let lyrics = ''
  containers.each((_, el) => {
    $(el).find('br').replaceWith('\n')
    lyrics += $(el).text().trim() + '\n\n'
  })

  if (lyrics.length > 50) {
    console.log('\n=== LYRICS (first 500 chars) ===')
    console.log(lyrics.substring(0, 500))
    console.log('Total length:', lyrics.length)
  } else {
    console.log('Lyrics too short or empty:', lyrics)
  }
}

test().catch(console.error)
