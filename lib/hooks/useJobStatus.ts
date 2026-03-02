/**
 * useJobStatus Hook
 * 
 * Poll job status and provide real-time updates
 */

import { useState, useEffect, useCallback } from 'react'

export interface Job {
  id: string
  user_id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress_percent: number
  progress_step?: string
  error_message?: string
  result_data?: Record<string, any>
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface UseJobStatusOptions {
  jobId?: string
  pollInterval?: number // milliseconds
  onComplete?: (job: Job) => void
  onError?: (job: Job) => void
  enabled?: boolean
}

export function useJobStatus(options: UseJobStatusOptions = {}) {
  const {
    jobId,
    pollInterval = 2000, // Default 2 seconds
    onComplete,
    onError,
    enabled = true,
  } = options

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch job status')
      }

      const data = await response.json()
      setJob(data.job)
      setError(null)

      // Call callbacks
      if (data.job.status === 'completed' && onComplete) {
        onComplete(data.job)
      } else if (data.job.status === 'failed' && onError) {
        onError(data.job)
      }

      return data.job
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch job status:', err)
      return null
    }
  }, [onComplete, onError])

  // Initial fetch
  useEffect(() => {
    if (jobId && enabled) {
      setLoading(true)
      fetchJobStatus(jobId).finally(() => setLoading(false))
    }
  }, [jobId, enabled, fetchJobStatus])

  // Polling
  useEffect(() => {
    if (!jobId || !enabled) {
      return
    }

    // Don't poll if job is in terminal state
    if (job?.status === 'completed' || job?.status === 'failed' || job?.status === 'cancelled') {
      return
    }

    const intervalId = setInterval(() => {
      fetchJobStatus(jobId)
    }, pollInterval)

    return () => clearInterval(intervalId)
  }, [jobId, enabled, job?.status, pollInterval, fetchJobStatus])

  const refresh = useCallback(() => {
    if (jobId) {
      return fetchJobStatus(jobId)
    }
    return Promise.resolve(null)
  }, [jobId, fetchJobStatus])

  return {
    job,
    loading,
    error,
    refresh,
    isComplete: job?.status === 'completed',
    isFailed: job?.status === 'failed',
    isProcessing: job?.status === 'processing',
    isPending: job?.status === 'pending',
  }
}
