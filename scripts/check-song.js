const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const songId = process.argv[2]
  
  if (!songId) {
    console.log('Uso: node scripts/check-song.js <song-id>')
    process.exit(1)
  }

  const song = await prisma.song.findUnique({
    where: { id: songId }
  })

  if (!song) {
    console.log('Canción no encontrada')
    process.exit(1)
  }

  console.log('=== DATOS DE LA CANCIÓN ===')
  console.log('ID:', song.id)
  console.log('Título:', song.title)
  console.log('Artista:', song.artist)
  console.log('Tonalidad:', song.key)
  console.log('Compás:', song.timeSignature)
  console.log('Tempo:', song.tempo)
  console.log('\n=== CONTENIDO ===')
  console.log(song.content)
  console.log('\n=== LONGITUD ===')
  console.log('Caracteres:', song.content.length)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
