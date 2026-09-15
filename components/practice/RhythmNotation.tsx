import React from 'react'

export type SubdivType = 1 | 'off-beat' | 2 | 3 | 4 | 6 | 8 | 'galopa-inversa' | 'galopa' | 'sincopa'

interface RhythmNotationProps {
  subdivision: SubdivType
}

export function RhythmNotation({ subdivision }: RhythmNotationProps) {
  // SVG renders for each rhythmic figure
  const renderIcon = () => {
    switch (subdivision) {
      case 1:
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 text-current" fill="currentColor">
            {/* Negra: Notehead and stem */}
            <ellipse cx="14" cy="28" rx="4" ry="3" transform="rotate(-20 14 28)" />
            <rect x="17" y="8" width="1.5" height="20" />
          </svg>
        )
      case 'off-beat':
        return (
          <svg viewBox="0 0 60 40" className="w-12 h-8 text-current" fill="currentColor">
            {/* Silencio de corchea */}
            <path d="M12,14 C15,14 18,17 18,20 C18,21.5 17,23 15,23 C14,23 13,22 13,21 C13,19 15,18 16,18 C16.5,18 16.5,17.5 16,17 C15,16 13,16 11,18 L18,28 L17,29 L9,17 C9,15 10,14 12,14 Z" />
            {/* Corchea */}
            <ellipse cx="38" cy="28" rx="4" ry="3" transform="rotate(-20 38 28)" />
            <rect x="41" y="8" width="1.5" height="20" />
            <path d="M42.5,8 C48,10 52,14 52,20 C51,16 48,13 42.5,12 Z" />
          </svg>
        )
      case 2:
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 text-current" fill="currentColor">
            {/* Corcheas (2) */}
            <ellipse cx="10" cy="28" rx="4" ry="3" transform="rotate(-20 10 28)" />
            <rect x="13" y="10" width="1.5" height="18" />

            <ellipse cx="30" cy="28" rx="4" ry="3" transform="rotate(-20 30 28)" />
            <rect x="33" y="10" width="1.5" height="18" />

            <rect x="13" y="10" width="21.5" height="3" />
          </svg>
        )
      case 3:
        return (
          <svg viewBox="0 0 50 40" className="w-10 h-8 text-current" fill="currentColor">
            {/* Tresillos (3) */}
            <text x="25" y="8" fontSize="10" textAnchor="middle" fontWeight="bold">3</text>
            <path d="M10,8 L20,8 M30,8 L40,8" stroke="currentColor" strokeWidth="1" />

            <ellipse cx="10" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 10 32)" />
            <rect x="13" y="14" width="1.5" height="18" />

            <ellipse cx="25" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 25 32)" />
            <rect x="28" y="14" width="1.5" height="18" />

            <ellipse cx="40" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 40 32)" />
            <rect x="43" y="14" width="1.5" height="18" />

            <rect x="13" y="14" width="31.5" height="3" />
          </svg>
        )
      case 4:
        return (
          <svg viewBox="0 0 60 40" className="w-12 h-8 text-current" fill="currentColor">
            {/* Semicorcheas (4) */}
            <ellipse cx="10" cy="32" rx="3" ry="2" transform="rotate(-20 10 32)" />
            <rect x="12" y="10" width="1.5" height="22" />

            <ellipse cx="23" cy="32" rx="3" ry="2" transform="rotate(-20 23 32)" />
            <rect x="25" y="10" width="1.5" height="22" />

            <ellipse cx="36" cy="32" rx="3" ry="2" transform="rotate(-20 36 32)" />
            <rect x="38" y="10" width="1.5" height="22" />

            <ellipse cx="49" cy="32" rx="3" ry="2" transform="rotate(-20 49 32)" />
            <rect x="51" y="10" width="1.5" height="22" />

            <rect x="12" y="10" width="40.5" height="3" />
            <rect x="12" y="15" width="40.5" height="3" />
          </svg>
        )
      case 6:
        return (
          <svg viewBox="0 0 80 40" className="w-16 h-8 text-current" fill="currentColor">
            {/* Seisillos (6) */}
            <text x="40" y="8" fontSize="10" textAnchor="middle" fontWeight="bold">6</text>
            <path d="M15,8 L35,8 M45,8 L65,8" stroke="currentColor" strokeWidth="1" />

            {[10, 22, 34, 46, 58, 70].map((x) => (
              <React.Fragment key={x}>
                <ellipse cx={x} cy="32" rx="2.5" ry="1.8" transform={`rotate(-20 ${x} 32)`} />
                <rect x={x + 2} y="14" width="1.5" height="18" />
              </React.Fragment>
            ))}

            <rect x="12" y="14" width="60.5" height="2.5" />
            <rect x="12" y="18.5" width="60.5" height="2.5" />
          </svg>
        )
      case 8:
        return (
          <svg viewBox="0 0 100 40" className="w-20 h-8 text-current" fill="currentColor">
            {/* Fusas (8) */}
            {[10, 21, 32, 43, 54, 65, 76, 87].map((x) => (
              <React.Fragment key={x}>
                <ellipse cx={x} cy="32" rx="2.5" ry="1.8" transform={`rotate(-20 ${x} 32)`} />
                <rect x={x + 2} y="10" width="1.5" height="22" />
              </React.Fragment>
            ))}

            <rect x="12" y="10" width="76.5" height="2" />
            <rect x="12" y="14" width="76.5" height="2" />
            <rect x="12" y="18" width="76.5" height="2" />
          </svg>
        )
      case 'galopa-inversa':
        return (
          <svg viewBox="0 0 50 40" className="w-10 h-8 text-current" fill="currentColor">
            {/* Galopa Inversa: Corchea + 2 Semicorcheas */}
            <ellipse cx="10" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 10 32)" />
            <rect x="13" y="10" width="1.5" height="22" />

            <ellipse cx="26" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 26 32)" />
            <rect x="29" y="10" width="1.5" height="22" />

            <ellipse cx="42" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 42 32)" />
            <rect x="45" y="10" width="1.5" height="22" />

            {/* Barra corchea (toda) */}
            <rect x="13" y="10" width="33.5" height="3" />
            {/* Barra semicorchea (solo las ultimas 2) */}
            <rect x="29" y="15" width="17.5" height="3" />
          </svg>
        )
      case 'galopa':
        return (
          <svg viewBox="0 0 50 40" className="w-10 h-8 text-current" fill="currentColor">
            {/* Galopa: 2 Semicorcheas + Corchea */}
            <ellipse cx="10" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 10 32)" />
            <rect x="13" y="10" width="1.5" height="22" />

            <ellipse cx="26" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 26 32)" />
            <rect x="29" y="10" width="1.5" height="22" />

            <ellipse cx="42" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 42 32)" />
            <rect x="45" y="10" width="1.5" height="22" />

            {/* Barra corchea (toda) */}
            <rect x="13" y="10" width="33.5" height="3" />
            {/* Barra semicorchea (solo las primeras 2) */}
            <rect x="13" y="15" width="17.5" height="3" />
          </svg>
        )
      case 'sincopa':
        return (
          <svg viewBox="0 0 50 40" className="w-10 h-8 text-current" fill="currentColor">
            {/* Sincopa: Semicorchea + Corchea + Semicorchea */}
            <ellipse cx="10" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 10 32)" />
            <rect x="13" y="10" width="1.5" height="22" />

            <ellipse cx="26" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 26 32)" />
            <rect x="29" y="10" width="1.5" height="22" />

            <ellipse cx="42" cy="32" rx="3.5" ry="2.5" transform="rotate(-20 42 32)" />
            <rect x="45" y="10" width="1.5" height="22" />

            {/* Barra corchea (toda) */}
            <rect x="13" y="10" width="33.5" height="3" />
            {/* Barra semicorchea (primera) */}
            <rect x="13" y="15" width="6" height="3" />
            {/* Barra semicorchea (tercera) */}
            <rect x="39" y="15" width="7.5" height="3" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-2 shadow-sm text-gray-800 dark:text-gray-200 min-h-[48px]">
        {renderIcon()}
      </div>
    </div>
  )
}
