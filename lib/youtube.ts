/**
 * Utilidades para manejo de enlaces y miniaturas de YouTube
 */

/**
 * Extrae el ID único de 11 caracteres de un video de YouTube desde múltiples formatos de URL
 * Soporta:
 * - https://www.youtube.com/watch?v=XXXXXXXXXXX
 * - https://youtu.be/XXXXXXXXXXX
 * - https://www.youtube.com/embed/XXXXXXXXXXX
 * - https://www.youtube.com/shorts/XXXXXXXXXXX
 * - https://www.youtube.com/v/XXXXXXXXXXX
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  )
  return match ? match[1] : null
}

/**
 * Obtiene la URL de la miniatura de alta calidad (hqdefault) de YouTube
 */
export function getYouTubeThumbnailUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url)
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
}

/**
 * Obtiene la miniatura en máxima resolución (maxresdefault) con fallback
 */
export function getYouTubeMaxResThumbnailUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url)
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null
}

/**
 * Verifica si una URL dada corresponde a un enlace de video de YouTube válido
 */
export function isValidYouTubeUrl(url?: string | null): boolean {
  return Boolean(getYouTubeVideoId(url))
}
