-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
-- No need to create users table - Supabase Auth handles it
-- We'll add a profiles table for additional user data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  credits INTEGER DEFAULT 100, -- Starting credits for MVP
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Projects table (a "universe" for characters/books)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Books table
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  age_range TEXT, -- e.g., "3-5", "6-8"
  moral TEXT,
  status TEXT DEFAULT 'draft', -- draft, generating, complete, published
  story_text TEXT, -- Generated story content
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Users can view own books" 
  ON books FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" 
  ON books FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" 
  ON books FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" 
  ON books FOR DELETE 
  USING (auth.uid() = user_id);

-- Pages table
CREATE TABLE pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  scene_description TEXT, -- For image generation
  image_url TEXT, -- S3/R2 URL
  image_prompt TEXT, -- Stored prompt for regeneration
  status TEXT DEFAULT 'pending', -- pending, generating, complete, error
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, page_number)
);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Pages policies (inherit from book ownership)
CREATE POLICY "Users can view pages of own books" 
  ON pages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = pages.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pages for own books" 
  ON pages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = pages.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages of own books" 
  ON pages FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = pages.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages of own books" 
  ON pages FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = pages.book_id 
      AND books.user_id = auth.uid()
    )
  );

-- Jobs table (for async operations)
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- storyboard_generate, page_image_generate, etc.
  status TEXT DEFAULT 'pending', -- pending, running, complete, error, cancelled
  related_id UUID, -- ID of book, page, etc.
  related_type TEXT, -- book, page, etc.
  input_data JSONB, -- Job inputs
  output_data JSONB, -- Job outputs
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Users can view own jobs" 
  ON jobs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" 
  ON jobs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_books_project_id ON books(project_id);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_pages_book_id ON pages(book_id);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_related ON jobs(related_id, related_type);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
