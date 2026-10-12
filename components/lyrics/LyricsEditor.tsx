'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Copy, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  Check, 
  Type, 
  Eye, 
  Edit3, 
  Sparkles,
  AlignLeft,
  Volume2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateSongAction } from '@/app/actions/songs'
import { cn } from '@/lib/utils'

interface SongData {
  id: string
  title: string
  artist: string | null
  key: string | null
  lyrics?: string | null
  content?: string | null
}

interface LyricsEditorProps {
  song: SongData
}

const STRUCTURE_TAGS = [
  '[Intro]',
  '[Estrofa 1]',
  '[Estrofa 2]',
  '[Pre-Coro]',
  '[Coro]',
  '[Puente]',
  '[Interludio]',
  '[Solo]',
  '[Outro]',
]

export function LyricsEditor({ song }: LyricsEditorProps) {
  const router = useRouter()

  // Extraer texto inicial de letras (priorizando lyrics, o limpiando content)
  const initialText = () => {
    if (song.lyrics && song.lyrics.trim().length > 0) {
      return song.lyrics
    }
    if (song.content && song.content.trim().length > 0) {
      // Limpiar posibles acordes entre corchetes si es texto crudo
      return song.content.replace(/\[[A-G][#b]?[^\]]*\]/g, '').replace(/\n{3,}/g, '\n\n').trim()
    }
    return `[Intro]\n\n[Estrofa 1]\nEscribe aquí la primera estrofa...\n\n[Coro]\nEscribe aquí el coro de la canción...\n\n[Outro]`
  }

  const [text, setText] = useState<string>(initialText)
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read')
  const [fontSize, setFontSize] = useState<number>(18) // px
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // Estados de Teleprompter / Auto-Scroll
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState<number>(2) // Pixels por tick
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Efecto de Auto-Scroll continuo (Teleprompter)
  useEffect(() => {
    if (!isAutoScrolling) return

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed
        // Si llega al final, detener
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        if (scrollTop + clientHeight >= scrollHeight - 2) {
          setIsAutoScrolling(false)
        }
      }
    }, 40)

    return () => clearInterval(interval)
  }, [isAutoScrolling, scrollSpeed])

  // Insertar tag de estructura en la posición del cursor en modo edición
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      setText((prev) => `${prev}\n\n${tag}\n`)
      return
    }

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const previousContent = text.substring(0, start)
    const afterContent = text.substring(end)

    const prefix = previousContent.endsWith('\n') || previousContent.length === 0 ? '' : '\n\n'
    const suffix = '\n'
    const insertion = `${prefix}${tag}${suffix}`

    const updated = `${previousContent}${insertion}${afterContent}`
    setText(updated)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + insertion.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  // Copiar letra limpia al portapapeles
  const handleCopyLyrics = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      alert('No se pudo copiar al portapapeles.')
    }
  }

  // Exportar a archivo de texto plano (.txt)
  const handleExportTxt = () => {
    const filename = `${song.title} - ${song.artist || 'MusicChord'} (Letra).txt`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Guardar letra en base de datos
  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await updateSongAction(song.id, {
        lyrics: text,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error al guardar letra:', err)
      alert('Hubo un error al guardar la letra.')
    } finally {
      setIsSaving(false)
    }
  }

  // Conteo de líneas y palabras
  const linesCount = text.split('\n').filter((l) => l.trim().length > 0).length
  const wordsCount = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/songs/lyrics">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Volver a Letras</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{song.title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Visor de Letras
              </span>
            </h1>
            <p className="text-xs text-slate-500">{song.artist || 'Artista no especificado'}</p>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Enlace directo a la vista de Acordes */}
          <Link href={`/dashboard/songs/chords/${song.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800/60">
              <Music className="w-3.5 h-3.5" />
              <span>Ver Acordes</span>
            </Button>
          </Link>

          {/* Toggle Modo Lectura / Edición */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('read')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                viewMode === 'read'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lectura / Prompter</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                viewMode === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor de Texto</span>
            </button>
          </div>

          {/* Guardar Letra */}
          <Button
            variant="gradient"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold gap-1.5 shadow-md shadow-purple-900/20"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Barra de Herramientas de Lectura y Teleprompter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
        {/* Controles de Teleprompter */}
        <div className="flex items-center gap-3">
          <Button
            variant={isAutoScrolling ? 'destructive' : 'default'}
            size="sm"
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className="gap-2 text-xs font-bold shrink-0 bg-purple-600 hover:bg-purple-700"
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoScrolling ? 'Pausar Teleprompter' : 'Iniciar Teleprompter'}</span>
          </Button>

          {/* Velocidad de Scroll */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
            <span className="text-[11px] font-semibold text-slate-400">Velocidad:</span>
            {[1, 2, 3, 5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setScrollSpeed(speed)}
                className={cn(
                  'px-2 py-0.5 rounded font-mono font-bold transition-colors',
                  scrollSpeed === speed ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Tamaño de Fuente y Utilidades de Copia/Exportación */}
        <div className="flex items-center gap-2.5 justify-end">
          {/* Selector de Tamaño de Fuente */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
            <Type className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold"
              title="Reducir fuente"
            >
              A-
            </button>
            <span className="w-8 text-center font-mono font-bold text-xs">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.min(36, prev + 2))}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold"
              title="Aumentar fuente"
            >
              A+
            </button>
          </div>

          {/* Copiar Letra */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLyrics}
            className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            title="Copiar letra al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar'}</span>
          </Button>

          {/* Exportar a Archivo .txt */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportTxt}
            className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            title="Descargar archivo de texto plano"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar .txt</span>
          </Button>
        </div>
      </div>

      {/* Barra de Tags Rápidos en Modo Edición */}
      {viewMode === 'edit' && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap animate-in fade-in">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Insertar Sección:
          </span>
          {STRUCTURE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleInsertTag(tag)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors shadow-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Área Principal de Visualización / Edición */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'rounded-2xl border transition-all p-6 sm:p-10 max-h-[68vh] overflow-y-auto scroll-smooth',
          viewMode === 'read'
            ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-purple-500/40 ring-1 ring-purple-500/20'
        )}
      >
        {viewMode === 'edit' ? (
          /* Modo Edición: Textarea Estructurado */
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ fontSize: `${fontSize}px` }}
              rows={22}
              placeholder="Escribe o pega aquí la letra de la canción..."
              className="w-full bg-transparent border-0 focus:outline-none resize-none font-serif leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        ) : (
          /* Modo Lectura / Escenario / Prompter */
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="font-serif leading-loose tracking-wide text-slate-800 dark:text-slate-100 select-text max-w-3xl mx-auto"
          >
            {text.split('\n').map((line, idx) => {
              const trimmed = line.trim()

              // Si es un tag de estructura como [Coro], [Estrofa 1], etc.
              if (/^\[[^\]]+\]$/.test(trimmed)) {
                return (
                  <div key={idx} className="my-5 pt-3 first:mt-0">
                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-sans font-extrabold uppercase tracking-widest bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm">
                      {trimmed.slice(1, -1)}
                    </span>
                  </div>
                )
              }

              // Línea vacía entre estrofas
              if (trimmed === '') {
                return <div key={idx} className="h-4" />
              }

              return (
                <p key={idx} className="my-0.5 leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen de Conteo en la parte inferior */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>
          <strong>{linesCount}</strong> líneas de verso • <strong>{wordsCount}</strong> palabras
        </span>
        <span>
          Modo actual: <strong className="text-slate-600 dark:text-slate-300 capitalize">{viewMode === 'read' ? 'Lectura Prompter' : 'Edición'}</strong>
        </span>
      </div>
    </div>
  )
}
