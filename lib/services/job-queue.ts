/**
 * Job Queue Service
 * 
 * Manages async job creation, status updates, and polling.
 * Supports idempotency, retry logic, and progress tracking.
 */

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

export type JobType = 
  | 'story_generation'
  | 'image_generation'
  | 'pdf_export'
  | 'audio_export'
  | 'audiobook_export'
  | 'page_regeneration'
  | 'character_extraction'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface Job {
  id: string
  user_id: string
  type: JobType
  status: JobStatus
  related_id?: string
  related_type?: string
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  result_data?: Record<string, any>
  error_message?: string
  attempts: number
  max_attempts: number
  progress_percent: number
  progress_step?: string
  idempotency_key?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  completed_at?: string
  last_attempt_at?: string
}

export interface CreateJobParams {
  userId: string
  type: JobType
  relatedId?: string
  relatedType?: string
  inputData?: Record<string, any>
  metadata?: Record<string, any>
  idempotencyKey?: string
  maxAttempts?: number
}

export interface UpdateJobParams {
  status?: JobStatus
  progressPercent?: number
  progressStep?: string
  outputData?: Record<string, any>
  resultData?: Record<string, any>
  errorMessage?: string
  completedAt?: string
}

/**
 * Create a new job with idempotency support
 */
export async function createJob(
  params: CreateJobParams,
  supabase?: SupabaseClient
): Promise<Job> {
  const client = supabase || await createClient()
  
  // If idempotency key provided, check for existing job
  if (params.idempotencyKey) {
    const { data: existingJob } = await client
      .from('jobs')
      .select('*')
      .eq('idempotency_key', params.idempotencyKey)
      .single()
    
    if (existingJob) {
      console.log(`Job with idempotency key ${params.idempotencyKey} already exists`)
      return existingJob as Job
    }
  }
  
  // Create new job
  const jobData = {
    user_id: params.userId,
    type: params.type,
    related_id: params.relatedId,
    related_type: params.relatedType,
    input_data: params.inputData || {},
    metadata: params.metadata || {},
    idempotency_key: params.idempotencyKey,
    max_attempts: params.maxAttempts || 3,
    status: 'pending' as JobStatus,
    attempts: 0,
    progress_percent: 0,
  }
  
  const { data, error } = await client
    .from('jobs')
    .insert(jobData)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create job:', error)
    throw new Error(`Failed to create job: ${error.message}`)
  }
  
  return data as Job
}

/**
 * Update job status and progress
 */
export async function updateJob(
  jobId: string,
  updates: UpdateJobParams,
  supabase?: SupabaseClient
): Promise<Job> {
  const client = supabase || await createClient()
  
  const updateData: Record<string, any> = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  
  // If status is changing, increment attempts
  if (updates.status === 'processing') {
    const { data: currentJob } = await client
      .from('jobs')
      .select('attempts')
      .eq('id', jobId)
      .single()
    
    if (currentJob) {
      updateData.attempts = currentJob.attempts + 1
      updateData.last_attempt_at = new Date().toISOString()
    }
  }
  
  // Set completed_at if job is complete/failed
  if (updates.status === 'completed' || updates.status === 'failed') {
    updateData.completed_at = new Date().toISOString()
  }
  
  const { data, error } = await client
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to update job:', error)
    throw new Error(`Failed to update job: ${error.message}`)
  }
  
  return data as Job
}

/**
 * Get job by ID
 */
export async function getJob(
  jobId: string,
  supabase?: SupabaseClient
): Promise<Job | null> {
  const client = supabase || await createClient()
  
  const { data, error } = await client
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  if (error) {
    console.error('Failed to get job:', error)
    return null
  }
  
  return data as Job
}

/**
 * Get jobs by user and optional filters
 */
export async function getUserJobs(
  userId: string,
  filters?: {
    type?: JobType
    status?: JobStatus
    relatedId?: string
    limit?: number
  },
  supabase?: SupabaseClient
): Promise<Job[]> {
  const client = supabase || await createClient()
  
  let query = client
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.relatedId) {
    query = query.eq('related_id', filters.relatedId)
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Failed to get user jobs:', error)
    return []
  }
  
  return (data || []) as Job[]
}

/**
 * Get pending jobs (for worker to process)
 */
export async function getPendingJobs(
  limit: number = 10,
  supabase?: SupabaseClient
): Promise<Job[]> {
  const client = supabase || await createClient()
  
  const { data, error } = await client
    .from('jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Failed to get pending jobs:', error)
    return []
  }
  
  return (data || []) as Job[]
}

/**
 * Mark job as failed with retry logic
 */
export async function failJob(
  jobId: string,
  errorMessage: string,
  supabase?: SupabaseClient
): Promise<Job> {
  const client = supabase || await createClient()
  
  const job = await getJob(jobId, client)
  if (!job) {
    throw new Error('Job not found')
  }
  
  // Check if we should retry
  if (job.attempts < job.max_attempts) {
    // Reset to pending for retry
    return updateJob(jobId, {
      status: 'pending',
      errorMessage,
    }, client)
  } else {
    // Max attempts reached, mark as failed
    return updateJob(jobId, {
      status: 'failed',
      errorMessage: `Failed after ${job.max_attempts} attempts: ${errorMessage}`,
    }, client)
  }
}

/**
 * Generate idempotency key for job
 */
export function generateIdempotencyKey(
  userId: string,
  type: JobType,
  relatedId?: string
): string {
  const parts = [userId, type, relatedId || 'none', Date.now().toString()]
  return parts.join(':')
}

/**
 * Check if job should be retried based on exponential backoff
 */
export function shouldRetryJob(job: Job): boolean {
  if (!job.last_attempt_at) {
    return true
  }
  
  const lastAttempt = new Date(job.last_attempt_at).getTime()
  const now = Date.now()
  const timeSinceLastAttempt = now - lastAttempt
  
  // Exponential backoff: 1min, 2min, 4min, 8min, etc.
  const backoffMs = Math.pow(2, job.attempts) * 60 * 1000
  
  return timeSinceLastAttempt >= backoffMs
}
