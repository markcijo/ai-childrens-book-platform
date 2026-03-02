-- Add export URLs to books table
ALTER TABLE books
ADD COLUMN pdf_url TEXT,
ADD COLUMN audio_url TEXT,
ADD COLUMN audiobook_url TEXT,
ADD COLUMN pdf_generated_at TIMESTAMPTZ,
ADD COLUMN audio_generated_at TIMESTAMPTZ,
ADD COLUMN audiobook_generated_at TIMESTAMPTZ;

-- Add export metadata
ALTER TABLE books
ADD COLUMN export_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX idx_books_exports ON books(pdf_url, audio_url, audiobook_url) WHERE pdf_url IS NOT NULL OR audio_url IS NOT NULL OR audiobook_url IS NOT NULL;

-- Add narration text field to pages (for storing the narration script, which may differ from display text)
ALTER TABLE pages
ADD COLUMN narration_text TEXT;

-- Comment on new columns
COMMENT ON COLUMN books.pdf_url IS 'URL to generated PDF export';
COMMENT ON COLUMN books.audio_url IS 'URL to generated MP3 narration';
COMMENT ON COLUMN books.audiobook_url IS 'URL to generated M4B audiobook';
COMMENT ON COLUMN books.pdf_generated_at IS 'Timestamp when PDF was last generated';
COMMENT ON COLUMN books.audio_generated_at IS 'Timestamp when audio was last generated';
COMMENT ON COLUMN books.audiobook_generated_at IS 'Timestamp when audiobook was last generated';
COMMENT ON COLUMN books.export_metadata IS 'Metadata about exports (voice settings, layout options, etc.)';
COMMENT ON COLUMN pages.narration_text IS 'Narration script (may differ from display text for better audio flow)';
