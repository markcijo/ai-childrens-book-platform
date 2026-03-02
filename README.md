# AI Children's Book Platform

Create illustrated children's books with AI - from story idea to complete book with consistent characters and narration.

## Progress

### Session 1: Foundation ✅
- Next.js 14 App Router + TypeScript + Tailwind
- Supabase integration (database + auth)
- Database schema (User, Project, Book, Page, Job)
- Auth flow (email/password signup & login)
- Basic project CRUD (create & list projects)
- Simple dashboard layout

### Session 2: Book Creation Workflow ✅
- Book creation wizard (3-step flow)
- Story input form (title, story idea, age range, genre, page count)
- Book detail page with metadata display
- Full navigation flow (Dashboard → Projects → Books → Book Detail)

### Session 3: Story Generation & Storyboard ✅
- **Story generation service** using Anthropic Claude 3.5 Sonnet
- **Age-appropriate content** (3-5, 6-8, 9-12, 13+ age ranges)
- **API endpoint** for story generation
- **Generate Story button** with loading states
- **Storyboard display** showing all generated pages
- Each page includes: narration text, scene description, image prompt

### Session 4: Image Generation Integration ✅
- **Image generation service** using Replicate FLUX schnell
- **API endpoint** for batch image generation
- **Generate Images button** with real-time progress
- **Professional children's book styling** auto-applied to all images
- **Sequential generation** to respect rate limits
- **Real-time storyboard updates** as images complete
- **Error handling** with graceful degradation

### Session 5: Character Consistency & Storage ✅
- **Character extraction service** using Claude Vision to analyze images
- **Character bible** with detailed appearance descriptions
- **Character-aware image generation** using img2img with reference images
- **Permanent image storage** (Cloudflare R2 / AWS S3 compatible)
- **Page regeneration** with character consistency
- **Character display UI** showing character details, colors, and features
- **Automatic character extraction** after first page generation
- **Enhanced prompts** with character appearance details

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Supabase CLI installed: `npm install -g supabase`

### Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up Supabase:**

Option A - Use Supabase Cloud:
- Create a project at https://supabase.com
- Get your project URL and anon key from Settings → API
- Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI Story Generation (required for Session 3+)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# AI Image Generation (required for Session 4+)
REPLICATE_API_TOKEN=r8_your-token-here

# Permanent Image Storage (optional but recommended for Session 5+)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=ai-childrens-books
R2_PUBLIC_URL=https://your-custom-domain.com  # Optional
```

- Apply migrations to your Supabase project:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Option B - Use Local Supabase (recommended for development):

```bash
# Start local Supabase
npx supabase start

# Copy the output values to .env.local
# API URL → NEXT_PUBLIC_SUPABASE_URL
# anon key → NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Your `.env.local` should look like:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI Story Generation (required for Session 3+)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# AI Image Generation (required for Session 4+)
REPLICATE_API_TOKEN=r8_your-token-here
```

3. **Get Anthropic API Key (for story generation):**

- Sign up at https://console.anthropic.com/
- Create an API key
- Add it to your `.env.local` as shown above
- **Cost**: ~$0.01-0.03 per book generation (very affordable)

4. **Get Replicate API Token (for image generation):**

- Sign up at https://replicate.com
- Go to https://replicate.com/account/api-tokens
- Create a new API token
- Add it to your `.env.local` as `REPLICATE_API_TOKEN`
- **Cost**: ~$0.003 per image (~$0.024-0.036 per book)

5. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003) to see the app.

> **Note**: Server runs on port 3003 if port 3000 is in use.

### Testing the Platform

#### Session 1-2: Project & Book Creation
1. Go to http://localhost:3003
2. Click "Sign Up" and create an account
3. You'll be redirected to the dashboard
4. Create a new project (name + description)
5. Click on a project to view details
6. Create a book using the 3-step wizard:
   - Enter story idea (e.g., "A brave little mouse goes on an adventure")
   - Set title, age range, genre, and page count
   - Review and create

#### Session 3: Story Generation
1. Open a book in "draft" status
2. Click the "✨ Generate Story" button
3. Wait 30-60 seconds for generation (loading spinner shows progress)
4. View the generated storyboard with all pages
5. Each page displays:
   - Scene description
   - Narration text
   - Image generation prompt
   - Image placeholder (before Session 4)

#### Session 4: Image Generation
1. Open a book with generated story (status: "complete")
2. Click the "🎨 Generate Images" button
3. Wait 2-3 minutes for all images to generate (progress shown)
4. Watch images appear in storyboard as they're created
5. Each page now shows:
   - Scene description
   - Narration text
   - Image generation prompt
   - **Generated illustration** (1024x1024 professional image)

## Database Schema

- **profiles**: User profiles (extends Supabase auth.users)
- **projects**: User's book projects/universes
- **books**: Individual books within projects
- **pages**: Pages within books (text + images)
- **jobs**: Async job tracking (for future AI generation)

See `supabase/migrations/` for the complete schema.

## Project Structure

```
├── app/                         # Next.js App Router pages
│   ├── api/books/[id]/          # API routes
│   │   ├── generate-story/      # Story generation endpoint
│   │   └── generate-images/     # Image generation endpoint (Session 4)
│   ├── books/[id]/              # Book detail page
│   ├── projects/[id]/           # Project detail page
│   ├── dashboard/               # Dashboard page
│   ├── login/                   # Login page
│   ├── signup/                  # Signup page
│   └── auth/signout/            # Sign out route
├── components/                  # React components
│   ├── BookWizard               # Book creation wizard
│   ├── CreateProjectForm        # Project creation form
│   ├── GenerateStoryButton      # Story generation button
│   ├── GenerateImagesButton     # Image generation button (Session 4)
│   ├── StoryboardPages          # Storyboard display (with images)
│   └── ProjectsList             # Projects list display
├── lib/
│   ├── services/                # Business logic services
│   │   ├── story-generator      # AI story generation service
│   │   └── image-generator      # AI image generation service (Session 4)
│   ├── supabase/                # Supabase client utilities
│   └── types/                   # TypeScript types
├── supabase/
│   └── migrations/              # Database migrations
└── docs/                        # Documentation
```

## Next Steps (Future Sessions)

- [x] Story generation wizard (Session 2)
- [x] Story generation with AI (Session 3)
- [x] Storyboard creation (Session 3)
- [x] Page illustration generation (Session 4)
- [ ] Character bible creation (Session 5)
- [ ] Character consistency (LoRA/reference-conditioning) (Session 5)
- [ ] S3/R2 permanent image storage (Session 5)
- [ ] Page regeneration controls (Session 5)
- [ ] PDF layout and export (Session 6)
- [ ] Audio narration with ElevenLabs (Session 6)
- [ ] Job queue processing for async operations (Session 6)

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **ORM**: Supabase JS Client
- **AI Story**: Anthropic Claude 3.5 Sonnet
- **AI Images**: Replicate FLUX schnell

## Features

### Current Features (Sessions 1-4)
- ✅ User authentication (sign up, login, logout)
- ✅ Project management (create, view projects)
- ✅ Book creation with metadata (title, story idea, age range, genre, page count)
- ✅ AI-powered story generation (Anthropic Claude)
- ✅ Age-appropriate content (3-5, 6-8, 9-12, 13+ years)
- ✅ AI image generation (Replicate FLUX)
- ✅ Professional children's book illustrations
- ✅ Storyboard view with all pages and images
- ✅ Real-time generation progress tracking

### Story Generation Features
- **Age-Appropriate Content**: Tailored vocabulary and themes for different age groups
- **Structured Output**: Each page includes:
  - Narration text (the story content)
  - Scene description (visual description)
  - Image prompt (detailed prompt for image generation)
- **Configurable Length**: 4-24 pages per book
- **Multiple Genres**: Adventure, Fantasy, Educational, Bedtime, and more
- **Fast Generation**: 30-60 seconds per book

### Image Generation Features
- **Professional Quality**: 1024x1024 resolution, print-ready
- **Children's Book Styling**: Auto-enhanced with whimsical, colorful aesthetics
- **Fast Generation**: 2-3 seconds per image
- **Real-Time Updates**: Images appear in storyboard as they're created
- **Error Handling**: Failed images don't block others
- **Affordable**: ~$0.003 per image (~$0.03 per book)
- **Sequential Processing**: Respects rate limits automatically

## Development Notes

- All TypeScript is in strict mode
- Row Level Security (RLS) enabled on all tables
- Server and client components properly separated
- Environment variables required for Supabase connection
