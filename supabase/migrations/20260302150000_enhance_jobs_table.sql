-- Enhance jobs table for production job queue system
-- Add idempotency key, progress tracking, retry logic, and metadata

-- Add new columns to existing jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_step TEXT,
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS result_data JSONB;

-- Update status enum values (keep existing + add new)
-- Status values: pending, processing, completed, failed, cancelled
COMMENT ON COLUMN jobs.status IS 'Job status: pending, processing, completed, failed, cancelled';

-- Add constraints
ALTER TABLE jobs
ADD CONSTRAINT check_progress_percent CHECK (progress_percent >= 0 AND progress_percent <= 100),
ADD CONSTRAINT check_max_attempts CHECK (max_attempts > 0 AND max_attempts <= 10);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_idempotency_key ON jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_jobs_type_status ON jobs(type, status);

-- Add comment on columns
COMMENT ON COLUMN jobs.idempotency_key IS 'Unique key to prevent duplicate job creation';
COMMENT ON COLUMN jobs.progress_percent IS 'Job progress percentage (0-100)';
COMMENT ON COLUMN jobs.progress_step IS 'Current step description (e.g., "Generating page 3 of 10")';
COMMENT ON COLUMN jobs.max_attempts IS 'Maximum number of retry attempts (default 3)';
COMMENT ON COLUMN jobs.last_attempt_at IS 'Timestamp of last attempt';
COMMENT ON COLUMN jobs.metadata IS 'Additional job metadata (e.g., config, options)';
COMMENT ON COLUMN jobs.result_data IS 'Job result data (e.g., generated URLs, counts)';

-- Function to clean up old completed/failed jobs (run via cron)
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete completed jobs older than 24 hours
  DELETE FROM jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
  AND completed_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_jobs() TO authenticated;

COMMENT ON FUNCTION cleanup_old_jobs IS 'Clean up completed/failed jobs older than 24 hours';
