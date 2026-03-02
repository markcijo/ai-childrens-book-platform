/**
 * JobProgress Component
 * 
 * Display job progress with progress bar and status updates
 */

'use client'

import { useJobStatus } from '@/lib/hooks/useJobStatus'
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'

interface JobProgressProps {
  jobId: string
  onComplete?: () => void
  onError?: (error: string) => void
  className?: string
}

export function JobProgress({ jobId, onComplete, onError, className = '' }: JobProgressProps) {
  const { job, loading, error, isComplete, isFailed, isProcessing, isPending } = useJobStatus({
    jobId,
    onComplete: (job) => {
      if (onComplete) {
        onComplete()
      }
    },
    onError: (job) => {
      if (onError && job.error_message) {
        onError(job.error_message)
      }
    },
  })

  if (loading && !job) {
    return (
      <div className={`flex items-center gap-2 p-4 bg-gray-50 rounded-lg ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-sm text-gray-600">Loading job status...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-4 bg-red-50 rounded-lg ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Failed to load job status: {error}</span>
      </div>
    )
  }

  if (!job) {
    return null
  }

  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Status Icon and Message */}
      <div className="flex items-center gap-3 mb-3">
        {isPending && (
          <>
            <Loader2 className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Queued</p>
              <p className="text-xs text-gray-500">Waiting to start...</p>
            </div>
          </>
        )}

        {isProcessing && (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Processing</p>
              {job.progress_step && (
                <p className="text-xs text-gray-500">{job.progress_step}</p>
              )}
            </div>
          </>
        )}

        {isComplete && (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-900">Complete</p>
              <p className="text-xs text-green-600">Job finished successfully</p>
            </div>
          </>
        )}

        {isFailed && (
          <>
            <XCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-900">Failed</p>
              {job.error_message && (
                <p className="text-xs text-red-600">{job.error_message}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {(isPending || isProcessing) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{job.progress_percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${job.progress_percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Job Type Badge */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {job.type.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  )
}
