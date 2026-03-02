-- Add genre field to books table
ALTER TABLE books 
ADD COLUMN genre TEXT;

-- Add a comment describing common genres
COMMENT ON COLUMN books.genre IS 'Book genre (e.g., Adventure, Fantasy, Educational, Bedtime, Moral Tale, Animal Story, etc.)';
