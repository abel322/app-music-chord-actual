'use client'

import React from 'react'

interface FilterBarProps {
  genres: string[]
  selectedGenre: string
  onSelectGenre: (genre: string) => void
  keys: string[]
  selectedKey: string
  onSelectKey: (key: string) => void
}

export function FilterBar({
  genres,
  selectedGenre,
  onSelectGenre,
  keys,
  selectedKey,
  onSelectKey
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Genres Scrollable Row */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedGenre === genre
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Keys Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="key-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Key:
        </label>
        <select
          id="key-select"
          value={selectedKey}
          onChange={(e) => onSelectKey(e.target.value)}
          className="bg-gray-100 dark:bg-gray-800 border-none rounded-md py-1 px-3 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="All">All Keys</option>
          {keys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
