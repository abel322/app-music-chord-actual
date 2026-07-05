const fs = require('fs')
const content = fs.readFileSync('components/songs/song-editor.tsx', 'utf8')
const lines = content.split('\n')

const newLines = [
  '        {/* Letra de la cancion */}\r',
  '        <div className="space-y-4">\r',
  '          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">\r',
  '            <div className="flex items-center justify-between mb-4">\r',
  '              <h2 className="font-semibold text-lg">Letra de la Canci\u00f3n</h2>\r',
  '              <Button\r',
  '                variant="secondary"\r',
  '                size="sm"\r',
  '                isLoading={isLoading}\r',
  '                onClick={async () => {\r',
  '                  if (!title || !artist) {\r',
  '                    alert("La canci\u00f3n necesita t\u00edtulo y artista para buscar la letra")\r',
  '                    return\r',
  '                  }\r',
  '                  setIsLoading(true)\r',
  '                  try {\r',
  '                    const res = await fetch("/api/lyrics/search", {\r',
  '                      method: "POST",\r',
  '                      headers: { "Content-Type": "application/json" },\r',
  '                      body: JSON.stringify({ title, artist }),\r',
  '                    })\r',
  '                    if (res.ok) {\r',
  '                      const data = await res.json()\r',
  '                      setLyrics(data.lyrics)\r',
  '                      await fetch(`/api/songs/${song.id}`, {\r',
  '                        method: "PUT",\r',
  '                        headers: { "Content-Type": "application/json" },\r',
  '                        body: JSON.stringify({ title, artist, key, content, lyrics: data.lyrics }),\r',
  '                      })\r',
  '                    } else {\r',
  '                      alert("No se encontr\u00f3 la letra. Verifica el nombre del artista y la canci\u00f3n.")\r',
  '                    }\r',
  '                  } catch {\r',
  '                    alert("Error al buscar")\r',
  '                  } finally {\r',
  '                    setIsLoading(false)\r',
  '                  }\r',
  '                }}\r',
  '              >\r',
  '                \uD83D\uDD0D Buscar Letra\r',
  '              </Button>\r',
  '            </div>\r',
  '            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto">\r',
  '              {lyrics && lyrics.trim() ? (\r',
  '                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-700 dark:text-gray-300">\r',
  '                  {lyrics}\r',
  '                </pre>\r',
  '              ) : (\r',
  '                <div className="text-center py-8 space-y-2">\r',
  '                  <p className="text-gray-500">No hay letra disponible</p>\r',
  '                  <p className="text-xs text-gray-400">Haz clic en Buscar Letra para encontrarla autom\u00e1ticamente</p>\r',
  '                </div>\r',
  '              )}\r',
  '            </div>\r',
  '          </div>\r',
  '        </div>\r',
]

// 0-indexed: lines 763 to 780 (inclusive) = 1-indexed lines 764 to 781
const before = lines.slice(0, 763)
const after = lines.slice(781)

const result = [...before, ...newLines, ...after].join('\n')
fs.writeFileSync('components/songs/song-editor.tsx', result, 'utf8')
console.log('SUCCESS: Lyrics panel updated')
