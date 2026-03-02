'use client'

/**
 * Extract Characters Button Component
 * 
 * Triggers character extraction from the book's story and first image
 * Creates a character bible for consistency across pages
 */

import { useState } from 'react'

interface ExtractCharactersButtonProps {
  bookId: string
  hasImages: boolean
  charactersExtracted: boolean
  onSuccess?: () => void
}

export default function ExtractCharactersButton({
  bookId,
  hasImages,
  charactersExtracted,
  onSuccess,
}: ExtractCharactersButtonProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExtractCharacters = async () => {
    try {
      setIsExtracting(true)
      setError(null)

      const response = await fetch(`/api/books/${bookId}/extract-characters`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract characters')
      }

      console.log('Characters extracted:', data.characters)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Extract characters error:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract characters')
    } finally {
      setIsExtracting(false)
    }
  }

  if (!hasImages) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
      >
        Generate Images First
      </button>
    )
  }

  if (charactersExtracted) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-green-100 text-green-700 rounded-lg cursor-default flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Characters Extracted
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleExtractCharacters}
        disabled={isExtracting}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {isExtracting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Extracting Characters...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Extract Characters
          </>
        )}
      </button>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
