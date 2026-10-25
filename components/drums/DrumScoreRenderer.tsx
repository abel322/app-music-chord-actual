'use client'

import React, { useMemo } from 'react'
import { DrumGrooveData, DrumHit, DONNER_DRUM_MAP, getDrumInfoByNote } from '@/types/drum'
import { drumSynth } from '@/lib/audio/drumSynth'
import { cn } from '@/lib/utils'

interface DrumScoreRendererProps {
  measureNumber: number
  groove?: DrumGrooveData | null
  timeSignature?: string
  isActive?: boolean
  currentBeat?: number // 1, 2, 3, 4
  showClef?: boolean
  width?: number
  height?: number
  className?: string
  onMeasureClick?: () => void
}

/**
 * Renderizador de Partituras de Percusión Compás por Compás con SVG.
 * Implementa notación estándar de batería (PAS): Clave neutral ||, platos con cabeza en x,
 * parches con cabezas ovaladas y plicas diferenciadas (manos hacia arriba, pies hacia abajo).
 */
export function DrumScoreRenderer({
  measureNumber,
  groove,
  timeSignature = '4/4',
  isActive = false,
  currentBeat = 1,
  showClef = true,
  width = 340,
  height = 135,
  className,
  onMeasureClick,
}: DrumScoreRendererProps) {
  // Configuración geométrica del pentagrama
  // 5 líneas: Línea 5 (arriba) a Línea 1 (abajo)
  const staffLineY = [30, 42, 54, 66, 78] // Y de líneas 5, 4, 3, 2, 1
  const clefWidth = showClef ? 46 : 14
  const measureEndPadding = 18
  const scoreAreaWidth = width - clefWidth - measureEndPadding

  // Extraer golpes de este compás (si el groove tiene 2 compases, compases impares toman 0-15 y pares 16-31)
  const isSecondBarInTwoBarGroove = groove && groove.barsCount === 2 && measureNumber % 2 === 0
  const stepOffset = isSecondBarInTwoBarGroove ? 16 : 0

  const measureHits = useMemo(() => {
    if (!groove || !groove.hits || groove.hits.length === 0) return []
    return groove.hits.filter(
      (h) => h.step >= stepOffset && h.step < stepOffset + 16
    )
  }, [groove, stepOffset])

  // Mapeo vertical Y según el instrumento de batería
  const getYCoordinateForPad = (padType: string): { y: number; isCross: boolean; stemUp: boolean; ledgerLine?: boolean } => {
    switch (padType) {
      case 'CRASH':
        return { y: 16, isCross: true, stemUp: true, ledgerLine: true } // Sobre la 5ta línea con línea adicional
      case 'RIDE':
        return { y: 30, isCross: true, stemUp: true } // En la 5ta línea
      case 'HIHAT_CLOSED':
      case 'HIHAT_OPEN':
        return { y: 22, isCross: true, stemUp: true } // Espacio superior sobre la 5ta línea
      case 'TOM_HIGH':
        return { y: 36, isCross: false, stemUp: true } // Espacio 4 (entre líneas 4 y 5)
      case 'TOM_MID':
        return { y: 42, isCross: false, stemUp: true } // Línea 4
      case 'SNARE':
      case 'SNARE_RIM':
        return { y: 48, isCross: false, stemUp: true } // Espacio 3 (entre líneas 3 y 4)
      case 'TOM_FLOOR':
        return { y: 60, isCross: false, stemUp: true } // Espacio 2 (entre líneas 2 y 3)
      case 'KICK':
        return { y: 72, isCross: false, stemUp: false } // Espacio 1 (entre línea 1 y 2 / borde inferior)
      case 'HIHAT_PEDAL':
        return { y: 90, isCross: true, stemUp: false, ledgerLine: true } // Bajo el pentagrama
      default:
        return { y: 48, isCross: false, stemUp: true }
    }
  }

  // Agrupar golpes por paso rítmico (0 a 15)
  const hitsByStep = useMemo(() => {
    const map = new Map<number, DrumHit[]>()
    measureHits.forEach((h) => {
      const normalizedStep = h.step - stepOffset
      if (!map.has(normalizedStep)) map.set(normalizedStep, [])
      map.get(normalizedStep)!.push(h)
    })
    return map
  }, [measureHits, stepOffset])

  return (
    <div
      onClick={onMeasureClick}
      className={cn(
        'relative bg-white dark:bg-slate-900/90 rounded-2xl border transition-all duration-150 select-none overflow-hidden p-2.5 shadow-sm',
        isActive
          ? 'border-purple-500 ring-2 ring-purple-400/50 dark:bg-purple-950/20 shadow-md shadow-purple-900/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
        onMeasureClick && 'cursor-pointer',
        className
      )}
    >
      {/* Cabecera del Compás */}
      <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
        <span
          className={cn(
            'font-mono px-2 py-0.5 rounded-lg border',
            isActive
              ? 'bg-purple-600 border-purple-500 text-white font-black'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          )}
        >
          C.{measureNumber}
        </span>

        {/* Indicador de Pulso Activo durante Reproducción */}
        {isActive && (
          <div className="flex items-center gap-1 text-[10px] text-purple-400 font-mono font-extrabold animate-pulse">
            <span>PULSO {currentBeat}</span>
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-400" />
          </div>
        )}
      </div>

      {/* Pentagrama SVG de Batería */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto text-slate-900 dark:text-slate-100"
      >
        {/* Fondo del cursor del pulso activo */}
        {isActive && (
          <rect
            x={clefWidth + (currentBeat - 1) * (scoreAreaWidth / 4)}
            y="10"
            width={scoreAreaWidth / 4}
            height={height - 20}
            fill="currentColor"
            className="text-purple-500/10 dark:text-purple-500/15"
            rx="6"
          />
        )}

        {/* 5 Líneas del Pentagrama */}
        {staffLineY.map((yVal, idx) => (
          <line
            key={idx}
            x1="8"
            y1={yVal}
            x2={width - 8}
            y2={yVal}
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-slate-300 dark:text-slate-700"
          />
        ))}

        {/* Barra Inicial y Clave Neutral de Percusión (||) */}
        {showClef ? (
          <g className="text-slate-700 dark:text-slate-300">
            {/* Clave de Percusión: 2 barras verticales gruesas */}
            <rect x="18" y="42" width="4.5" height="24" fill="currentColor" rx="1" />
            <rect x="25.5" y="42" width="4.5" height="24" fill="currentColor" rx="1" />

            {/* Métrica 4 / 4 */}
            <text
              x="37"
              y="51"
              fontSize="16"
              fontWeight="900"
              fontFamily="monospace"
              fill="currentColor"
              textAnchor="middle"
            >
              4
            </text>
            <text
              x="37"
              y="75"
              fontSize="16"
              fontWeight="900"
              fontFamily="monospace"
              fill="currentColor"
              textAnchor="middle"
            >
              4
            </text>
          </g>
        ) : null}

        {/* Barra Final del Compás */}
        <line
          x1={width - 8}
          y1="30"
          x2={width - 8}
          y2="78"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-500 dark:text-slate-400"
        />

        {/* Rejilla de Subdivisión Rítmica de Fondo (16 semicorcheas) */}
        {Array.from({ length: 4 }).map((_, beatIdx) => {
          const beatX = clefWidth + beatIdx * (scoreAreaWidth / 4)
          return (
            <line
              key={beatIdx}
              x1={beatX}
              y1="28"
              x2={beatX}
              y2="80"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeDasharray="2,2"
              className="text-slate-200 dark:text-slate-800"
            />
          )
        })}

        {/* Dibujar Notas de Batería */}
        {Array.from({ length: 16 }).map((_, stepIdx) => {
          const stepHits = hitsByStep.get(stepIdx) || []
          const noteX = clefWidth + (stepIdx + 0.5) * (scoreAreaWidth / 16)

          if (stepHits.length === 0) return null

          // Separar manos (plica arriba) y pies (plica abajo)
          const handHits = stepHits.filter((h) => getYCoordinateForPad(h.pad).stemUp)
          const footHits = stepHits.filter((h) => !getYCoordinateForPad(h.pad).stemUp)

          return (
            <g key={stepIdx}>
              {/* NOTAS DE MANOS (Hi-Hat, Caja, Platos, Toms) - Plica Hacia Arriba */}
              {handHits.map((hit, hIdx) => {
                const { y, isCross, ledgerLine } = getYCoordinateForPad(hit.pad)
                return (
                  <g
                    key={`hand-${hIdx}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      drumSynth.playHit(hit.pad, hit.velocity)
                    }}
                    className="cursor-pointer hover:scale-125 transition-transform"
                  >
                    {/* Línea adicional si está fuera del pentagrama */}
                    {ledgerLine && (
                      <line
                        x1={noteX - 7}
                        y1={y}
                        x2={noteX + 7}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1.2"
                        className="text-slate-400 dark:text-slate-500"
                      />
                    )}

                    {/* Cabeza de la Nota */}
                    {isCross ? (
                      /* Cabeza en X para platos / hi-hat */
                      <g stroke="currentColor" strokeWidth="2.2" className="text-amber-500 dark:text-amber-400">
                        <line x1={noteX - 4.5} y1={y - 4.5} x2={noteX + 4.5} y2={y + 4.5} />
                        <line x1={noteX - 4.5} y1={y + 4.5} x2={noteX + 4.5} y2={y - 4.5} />
                      </g>
                    ) : (
                      /* Cabeza ovalada para caja y toms */
                      <ellipse
                        cx={noteX}
                        cy={y}
                        rx="5"
                        ry="3.8"
                        transform={`rotate(-20 ${noteX} ${y})`}
                        fill="currentColor"
                        className="text-purple-600 dark:text-purple-400"
                      />
                    )}

                    {/* Plica Hacia Arriba */}
                    <line
                      x1={noteX + 4.5}
                      y1={y}
                      x2={noteX + 4.5}
                      y2={Math.min(y - 24, 12)}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-slate-700 dark:text-slate-300"
                    />
                  </g>
                )
              })}

              {/* NOTAS DE PIES (Bombo, Pedal Hi-Hat) - Plica Hacia Abajo */}
              {footHits.map((hit, fIdx) => {
                const { y, isCross, ledgerLine } = getYCoordinateForPad(hit.pad)
                return (
                  <g
                    key={`foot-${fIdx}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      drumSynth.playHit(hit.pad, hit.velocity)
                    }}
                    className="cursor-pointer hover:scale-125 transition-transform"
                  >
                    {ledgerLine && (
                      <line
                        x1={noteX - 7}
                        y1={y}
                        x2={noteX + 7}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1.2"
                        className="text-slate-400 dark:text-slate-500"
                      />
                    )}

                    {/* Cabeza del Bombo (Óvalo lleno) */}
                    {isCross ? (
                      <g stroke="currentColor" strokeWidth="2" className="text-amber-500">
                        <line x1={noteX - 4} y1={y - 4} x2={noteX + 4} y2={y + 4} />
                        <line x1={noteX - 4} y1={y + 4} x2={noteX + 4} y2={y - 4} />
                      </g>
                    ) : (
                      <ellipse
                        cx={noteX}
                        cy={y}
                        rx="5"
                        ry="3.8"
                        transform={`rotate(-20 ${noteX} ${y})`}
                        fill="currentColor"
                        className="text-rose-600 dark:text-rose-400"
                      />
                    )}

                    {/* Plica Hacia Abajo */}
                    <line
                      x1={noteX - 4.5}
                      y1={y}
                      x2={noteX - 4.5}
                      y2={Math.max(y + 24, 96)}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-slate-700 dark:text-slate-300"
                    />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Silencio vacío si no hay notas grabadas */}
        {measureHits.length === 0 && (
          <g className="text-slate-400 dark:text-slate-600">
            {/* Silencio de redonda estándar centrado */}
            <rect
              x={clefWidth + scoreAreaWidth / 2 - 8}
              y="54"
              width="16"
              height="6"
              fill="currentColor"
              rx="1"
            />
            <text
              x={clefWidth + scoreAreaWidth / 2}
              y="102"
              fontSize="10"
              fontWeight="bold"
              fill="currentColor"
              textAnchor="middle"
            >
              Compás vacío (Sin groove)
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
