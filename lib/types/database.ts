export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  credits: number
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  story_idea: string | null
  age_range: string | null
  genre: string | null
  page_count: number
  moral: string | null
  status: 'draft' | 'generating' | 'complete' | 'published'
  story_text: string | null
  created_at: string
  updated_at: string
}

export type Page = {
  id: string
  book_id: string
  page_number: number
  text: string
  scene_description: string | null
  image_url: string | null
  image_prompt: string | null
  status: 'pending' | 'generating' | 'complete' | 'error'
  created_at: string
  updated_at: string
}

export type Job = {
  id: string
  user_id: string
  type: string
  status: 'pending' | 'running' | 'complete' | 'error' | 'cancelled'
  related_id: string | null
  related_type: string | null
  input_data: Record<string, any> | null
  output_data: Record<string, any> | null
  error_message: string | null
  attempts: number
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      books: {
        Row: Book
        Insert: Omit<Book, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>
      }
      pages: {
        Row: Page
        Insert: Omit<Page, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Page, 'id' | 'created_at' | 'updated_at'>>
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
