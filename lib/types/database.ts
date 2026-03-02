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
  status: 'draft' | 'generating' | 'generating_images' | 'complete' | 'partial' | 'published' | 'error'
  story_text: string | null
  characters_extracted: boolean
  character_extraction_status: 'pending' | 'extracting' | 'complete' | 'error'
  pdf_url: string | null
  audio_url: string | null
  audiobook_url: string | null
  pdf_generated_at: string | null
  audio_generated_at: string | null
  audiobook_generated_at: string | null
  export_metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export type Page = {
  id: string
  book_id: string
  page_number: number
  text: string
  narration_text: string | null
  scene_description: string | null
  image_url: string | null
  permanent_image_url: string | null
  image_prompt: string | null
  character_ids: string[] | null
  generation_metadata: Record<string, any> | null
  status: 'pending' | 'generating' | 'complete' | 'error'
  created_at: string
  updated_at: string
}

export type Character = {
  id: string
  book_id: string
  user_id: string
  name: string
  description: string
  reference_image_url: string | null
  permanent_image_url: string | null
  appearance_details: {
    species?: string
    age_appearance?: string
    hair_color?: string
    hair_style?: string
    eye_color?: string
    skin_tone?: string
    height?: string
    build?: string
    clothing?: string
    distinctive_features?: string[]
    colors?: string[]
  }
  personality: string | null
  role: 'main_character' | 'supporting' | 'background'
  first_seen_page: number
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
      characters: {
        Row: Character
        Insert: Omit<Character, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Character, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
