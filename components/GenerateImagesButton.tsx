'use client'

import { useState } from 'react'
import { JobProgress } from './JobProgress'

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
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsCreatingJob(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/${bookId}/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create image generation job')
      }

      // Set job ID to start tracking
      setJobId(data.jobId)
    } catch (err) {
      console.error('Error creating image generation job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setIsCreatingJob(false)
    }
  }

  const handleJobComplete = () => {
    // Call onComplete callback to refresh the page
    if (onComplete) {
      onComplete()
    }
    setJobId(null)
  }

  const handleJobError = (errorMessage: string) => {
    setError(errorMessage)
    setJobId(null)
  }

  // Show job progress if we have a job ID
  if (jobId) {
    return (
      <div className="space-y-4">
        <JobProgress
          jobId={jobId}
          onComplete={handleJobComplete}
          onError={handleJobError}
        />
        <p className="text-xs text-gray-500">
          💡 You can navigate away from this page. Images will continue generating in the background.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerate}
        disabled={disabled || isCreatingJob}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white
          transition-all duration-200
          ${isCreatingJob 
            ? 'bg-purple-400 cursor-not-allowed' 
            : disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
          }
        `}
      >
        {isCreatingJob ? (
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
            Starting...
          </span>
        ) : (
          '🎨 Generate Images'
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Information about image generation */}
      {!isCreatingJob && !jobId && (
        <div className="text-xs text-gray-500 max-w-md">
          <p>
            💡 This will generate images for all pages using AI. 
            The process takes about 2-3 minutes per page. 
            You can navigate away and come back later - images will continue generating in the background.
          </p>
        </div>
      )}
    </div>
  )
}
