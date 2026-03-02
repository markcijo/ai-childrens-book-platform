-- Add characters table for character consistency
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL, -- Visual description for prompts
  reference_image_url TEXT, -- First appearance / reference image
  permanent_image_url TEXT, -- Stored in S3/R2
  appearance_details JSONB, -- Structured details (hair, eyes, clothing, etc.)
  personality TEXT, -- For narration/story context
  role TEXT, -- main_character, supporting, etc.
  first_seen_page INTEGER, -- Which page they first appear
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Characters policies (inherit from book ownership)
CREATE POLICY "Users can view characters of own books" 
  ON characters FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert characters for own books" 
  ON characters FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update characters of own books" 
  ON characters FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete characters of own books" 
  ON characters FOR DELETE 
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_characters_book_id ON characters(book_id);
CREATE INDEX idx_characters_user_id ON characters(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add permanent_image_url to pages table
ALTER TABLE pages 
ADD COLUMN permanent_image_url TEXT,
ADD COLUMN character_ids UUID[], -- Array of character IDs that appear on this page
ADD COLUMN generation_metadata JSONB; -- Store generation params for regeneration

-- Add character extraction status to books
ALTER TABLE books
ADD COLUMN characters_extracted BOOLEAN DEFAULT false,
ADD COLUMN character_extraction_status TEXT DEFAULT 'pending'; -- pending, extracting, complete, error

-- Create a view for book characters summary
CREATE OR REPLACE VIEW book_characters_view AS
SELECT 
  b.id as book_id,
  b.title as book_title,
  json_agg(
    json_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'reference_image_url', c.reference_image_url,
      'permanent_image_url', c.permanent_image_url,
      'role', c.role,
      'first_seen_page', c.first_seen_page
    ) ORDER BY c.first_seen_page
  ) as characters
FROM books b
LEFT JOIN characters c ON c.book_id = b.id
GROUP BY b.id, b.title;

-- Grant access to the view
GRANT SELECT ON book_characters_view TO authenticated;
