'use client'

import { useState } from 'react'

type GenerateImagesButtonProps = {
  bookId: string
  onComplete?: () => void
  disabled?: boolean
}

export default function GenerateImagesButton({ 
  bookId, 
  onComplete,
  disabled = false 
}: GenerateImagesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setSuccessMessage(null)
    setProgress('Starting image generation...')

    try {
      const response = await fetch(`/api/books/${bookId}/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images')
      }

      // Show success message
      setSuccessMessage(data.message || 'Images generated successfully!')
      setProgress('')
      
      // Call onComplete callback to refresh the page
      if (onComplete) {
        setTimeout(() => {
          onComplete()
        }, 1000)
      }

    } catch (err) {
      console.error('Error generating images:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate images')
      setProgress('')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white
          transition-all duration-200
          ${isGenerating 
            ? 'bg-purple-400 cursor-not-allowed' 
            : disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
          }
        `}
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <svg 
              className="animate-spin h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating Images...
          </span>
        ) : (
          '🎨 Generate Images'
        )}
      </button>

      {/* Progress indicator */}
      {progress && (
        <div className="text-sm text-gray-600 animate-pulse">
          {progress}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <span className="text-lg">✅</span>
            <strong>{successMessage}</strong>
          </p>
        </div>
      )}

      {/* Information about image generation */}
      {!isGenerating && !successMessage && (
        <div className="text-xs text-gray-500 max-w-md">
          <p>
            💡 This will generate images for all pages using AI. 
            The process takes about 2-3 minutes per page. 
            Images will appear in the storyboard as they're generated.
          </p>
        </div>
      )}
    </div>
  )
}
