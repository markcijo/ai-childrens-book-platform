# AI Children's Book Platform

Create illustrated children's books with AI - from story idea to complete book with consistent characters and narration.

## Session 1: Foundation ✅

This is the foundational setup with:
- Next.js 14 App Router + TypeScript + Tailwind
- Supabase integration (database + auth)
- Database schema (User, Project, Book, Page, Job)
- Auth flow (email/password signup & login)
- Basic project CRUD (create & list projects)
- Simple dashboard layout

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
```

3. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Testing the MVP

1. Go to http://localhost:3000
2. Click "Sign Up" and create an account
3. You'll be redirected to the dashboard
4. Create a new project (name + description)
5. See your projects list on the dashboard

## Database Schema

- **profiles**: User profiles (extends Supabase auth.users)
- **projects**: User's book projects/universes
- **books**: Individual books within projects
- **pages**: Pages within books (text + images)
- **jobs**: Async job tracking (for future AI generation)

See `supabase/migrations/` for the complete schema.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   └── auth/signout/       # Sign out route
├── components/             # React components
│   ├── CreateProjectForm   # Project creation form
│   └── ProjectsList        # Projects list display
├── lib/
│   ├── supabase/           # Supabase client utilities
│   └── types/              # TypeScript types
├── supabase/
│   └── migrations/         # Database migrations
└── docs/                   # Documentation
```

## Next Steps (Future Sessions)

- [ ] Story generation wizard
- [ ] Character bible creation
- [ ] Page illustration generation
- [ ] PDF layout and export
- [ ] Audio narration
- [ ] Job queue processing

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **ORM**: Supabase JS Client

## Development Notes

- All TypeScript is in strict mode
- Row Level Security (RLS) enabled on all tables
- Server and client components properly separated
- Environment variables required for Supabase connection
