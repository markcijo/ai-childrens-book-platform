# Session 5 Quick Start — Character Consistency & Storage

## What's New in Session 5?

✨ **Character Consistency** - Characters look the same across all pages!  
💾 **Permanent Storage** - Images stored forever (not temporary 24h URLs)  
🎨 **Character Bible** - Detailed character descriptions extracted automatically  
🔄 **Page Regeneration** - Regenerate individual pages with consistent characters

---

## Setup (5 minutes)

### 1. Run Database Migration

```bash
# Using Supabase CLI (recommended)
cd ~/shared/web-dev/ai-childrens-book-platform
supabase db push
```

Or run SQL manually in Supabase Dashboard:
- Open `supabase/migrations/20260302133100_add_characters_and_storage.sql`
- Copy and paste into Supabase SQL Editor
- Run

### 2. Install Dependencies

```bash
npm install @aws-sdk/client-s3
```

### 3. Set Up Cloudflare R2 (Optional but Recommended)

**Why R2?**
- S3-compatible storage
- Cheaper than AWS S3
- Free egress (no bandwidth costs)
- Fast CDN

**Quick Setup**:

1. **Create R2 Bucket**:
   - Go to https://dash.cloudflare.com
   - Click R2
   - Create bucket: `ai-childrens-books`
   - Enable public access

2. **Create API Token**:
   - R2 > Manage R2 API Tokens
   - Create token with Read & Write
   - Copy: Account ID, Access Key, Secret Key

3. **Add to .env.local**:
```bash
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=r8_your-access-key-here
R2_SECRET_ACCESS_KEY=your-secret-key-here
R2_BUCKET_NAME=ai-childrens-books
R2_PUBLIC_URL=https://your-domain.com  # Optional: custom domain
```

**Note**: App works without R2 (uses temp URLs), but R2 is recommended for production.

### 4. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## How It Works (User Flow)

### 1. Create Book & Generate Story
- Create a new book as usual
- Generate story (Session 3)
- Story creates pages with image prompts

### 2. Generate Images
- Click "Generate Images" button
- **First page** generates normally (FLUX schnell, fast)
- **Characters auto-extract** from first page using Claude Vision
- **Remaining pages** use character reference for consistency

### 3. View Character Bible
- After images generate, "Extract Characters" button appears
- Click to manually extract (or it happens automatically)
- View Character Bible section with:
  - Character names and roles
  - Detailed appearance descriptions
  - Reference images
  - Color palettes, features, clothing

### 4. Regenerate Pages (Optional)
- Click "Regenerate" button on any page
- System uses character reference automatically
- New scene with same consistent characters!

---

## Technical Flow

```
Generate Story (Session 3)
    ↓
Generate First Page Image
    ├→ FLUX schnell (fast, 2-3 seconds)
    └→ Store in R2 (if configured)
    ↓
Extract Characters (Automatic)
    ├→ Claude Vision analyzes first page
    ├→ Extracts character details (appearance, colors, features)
    └→ Stores character bible in database
    ↓
Generate Remaining Pages
    ├→ FLUX dev img2img (with character reference)
    ├→ Uses main character from bible as reference
    ├→ Enhanced prompts with character details
    └→ Store in R2
    ↓
Result: Consistent Characters! 🎉
```

---

## API Endpoints

### Extract Characters
```bash
POST /api/books/:id/extract-characters
```
Analyzes first page and extracts character descriptions.

**Response**:
```json
{
  "success": true,
  "characters": [
    {
      "name": "Luna",
      "role": "main_character",
      "description": "A young bunny with soft white fur...",
      "appearance_details": {
        "species": "rabbit",
        "hair_color": "white",
        "eye_color": "brown",
        "clothing": "blue dress",
        "distinctive_features": ["floppy ears", "pink nose"],
        "colors": ["white", "blue", "pink"]
      }
    }
  ]
}
```

### Get Characters
```bash
GET /api/books/:id/extract-characters
```
Returns characters for a book.

### Regenerate Page
```bash
POST /api/books/:id/pages/:pageId/regenerate
Body: { "useCharacterReference": true }
```
Regenerates a single page image with character consistency.

---

## Components

### `<ExtractCharactersButton>`
Triggers character extraction.

```tsx
<ExtractCharactersButton
  bookId={bookId}
  hasImages={true}
  charactersExtracted={false}
  onSuccess={() => window.location.reload()}
/>
```

### `<BookCharacters>`
Displays character bible.

```tsx
<BookCharacters bookId={bookId} autoLoad={true} />
```

### `<RegeneratePageButton>`
Regenerates a single page.

```tsx
<RegeneratePageButton
  bookId={bookId}
  pageId={pageId}
  pageNumber={1}
  compact={true}
  onSuccess={() => refetchPages()}
/>
```

---

## Configuration Options

### Character Reference Strength

In `image-generator.ts`:
```typescript
generateImage({
  prompt: "...",
  referenceImage: characterImageUrl,
  referenceStrength: 0.6,  // 0-1 (0.6 = balanced)
})
```

**Lower** (0.3-0.5): More variation, less strict consistency  
**Higher** (0.7-0.9): Stricter consistency, less scene variation  
**Recommended**: 0.6 for good balance

### Storage Bucket Name

In `.env.local`:
```bash
R2_BUCKET_NAME=ai-childrens-books  # Change if needed
```

---

## Troubleshooting

### Characters Not Extracting
- Ensure first page has an image
- Check Anthropic API key is set
- Check browser console for errors
- Try manually clicking "Extract Characters"

### Images Not Uploading to R2
- Verify R2 credentials in `.env.local`
- Check R2 bucket exists and is public
- Check R2_ACCOUNT_ID matches your Cloudflare account
- App falls back to temp URLs if R2 fails

### Characters Not Consistent
- Check character extraction completed (Character Bible shows)
- Verify reference_image_url is set in characters table
- Try increasing referenceStrength to 0.7-0.8
- Regenerate problematic pages manually

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

---

## Testing Checklist

**Basic Flow**:
- [ ] Create book, generate story
- [ ] Generate images for all pages
- [ ] Characters auto-extract after first page
- [ ] View Character Bible section
- [ ] Characters look similar across pages
- [ ] Regenerate a single page
- [ ] Images show "Permanently stored" badge (if R2 configured)

**Edge Cases**:
- [ ] Test with 1-page book
- [ ] Test with 12+ page book
- [ ] Test without R2 configured
- [ ] Test with character extraction disabled
- [ ] Test regeneration during generation

---

## Performance

| Metric | Value |
|--------|-------|
| First Page Generation | 2-3 seconds |
| Character Extraction | 5-10 seconds |
| Subsequent Page Generation | 3-5 seconds (img2img) |
| Storage Upload | 1-2 seconds |
| Total Book (12 pages) | ~60-90 seconds |

**Cost**:
- First page: $0.003 (FLUX schnell)
- Character extraction: $0.01 (Claude Vision)
- Subsequent pages: $0.005 each (FLUX dev img2img)
- Storage: $0.015/GB/month (R2)
- **Total per book**: ~$0.08 (12 pages)

---

## What's Next?

**Session 6 Ideas**:
- LoRA training for perfect character consistency
- Character sheet generation (multiple angles/expressions)
- Multi-character scene handling
- Character library (reuse across books)
- PDF export with consistent characters
- ElevenLabs narration

---

## Resources

**Documentation**:
- [SESSION-5-COMPLETE.md](./SESSION-5-COMPLETE.md) - Full technical docs
- [CLAUDE.md](./CLAUDE.md) - Agent guidelines
- [README.md](./README.md) - Project overview

**Services**:
- [Replicate FLUX](https://replicate.com/black-forest-labs/flux-dev) - Image generation
- [Anthropic Claude](https://anthropic.com) - Character extraction
- [Cloudflare R2](https://developers.cloudflare.com/r2/) - Storage

**Tools**:
- [Supabase Dashboard](https://supabase.com/dashboard) - Database
- [Cloudflare Dashboard](https://dash.cloudflare.com) - R2 storage

---

**Questions?** Check SESSION-5-COMPLETE.md for detailed technical documentation.

---

*Session 5 Quick Start Guide*  
*AI Children's Book Platform*  
*March 2, 2026*
