'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JobProgress } from './JobProgress'

type GenerateStoryButtonProps = {
  bookId: string
  bookStatus: string
}

export default function GenerateStoryButton({ bookId, bookStatus }: GenerateStoryButtonProps) {
  const router = useRouter()
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsCreatingJob(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/${bookId}/generate-story`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create story generation job')
      }

      // Set job ID to start tracking
      setJobId(data.jobId)
    } catch (err) {
      console.error('Job creation error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreatingJob(false)
    }
  }

  const handleJobComplete = () => {
    // Refresh the page to show generated content
    router.refresh()
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
          💡 You can navigate away from this page. The story will continue generating in the background.
        </p>
      </div>
    )
  }

  // Don't show button if already complete
  if (bookStatus === 'complete' || bookStatus === 'generating') {
    return null
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isCreatingJob}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isCreatingJob ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Starting...
          </span>
        ) : (
          '✨ Generate Story'
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">Error: {error}</p>
        </div>
      )}
    </div>
  )
}
