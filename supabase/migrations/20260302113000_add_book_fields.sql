-- Add story_idea and page_count fields to books table
ALTER TABLE books 
ADD COLUMN story_idea TEXT,
ADD COLUMN page_count INTEGER DEFAULT 12;

-- Add constraint for page count range (4-24 pages)
ALTER TABLE books 
ADD CONSTRAINT books_page_count_check 
CHECK (page_count >= 4 AND page_count <= 24);
