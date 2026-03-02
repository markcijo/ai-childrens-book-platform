# Session 6 - Quick Start Guide 🚀

**PDF Export & Audio Narration** - Get Up and Running in 5 Minutes

---

## Prerequisites

- Completed Sessions 1-5 (story generation, images, character consistency)
- ElevenLabs account (free tier works): https://elevenlabs.io
- Cloudflare R2 bucket configured (from Session 5)

---

## 1. Install Dependencies ⚙️

```bash
cd ~/shared/web-dev/ai-childrens-book-platform
npm install
```

This installs:
- `jspdf` - PDF generation
- `@elevenlabs/elevenlabs-js` - Text-to-speech
- `@tailwindcss/postcss` - Tailwind v4 support

---

## 2. Get ElevenLabs API Key 🔑

1. Sign up at https://elevenlabs.io (free tier: 10,000 characters/month)
2. Go to **Settings** → **API Keys**
3. Click **Generate API Key**
4. Copy the key

---

## 3. Configure Environment 🌍

Edit `.env.local`:

```bash
# Add this line
ELEVENLABS_API_KEY=sk_your_elevenlabs_api_key_here
```

Make sure R2 is also configured (from Session 5):

```bash
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=ai-childrens-books
```

---

## 4. Run Database Migration 🗄️

```bash
# Using Supabase CLI
supabase db push

# Or manually: Run this SQL in Supabase Dashboard
# File: supabase/migrations/20260302143200_add_exports.sql
```

The migration adds:
- `pdf_url`, `audio_url`, `audiobook_url` to books table
- Generation timestamps
- Export metadata field
- `narration_text` field to pages

---

## 5. Start the App 🎬

```bash
npm run dev
```

Open http://localhost:3000 (or 3003 if 3000 is in use)

---

## 6. Test Exports 🧪

### Create or Open a Book

1. Navigate to a **completed book** (status = "complete", has images)
2. Scroll to the **"Export Book"** section

### Generate PDF

1. Click **"Generate PDF"** button
2. Wait ~10-30 seconds (depends on page count)
3. PDF downloads automatically
4. ✅ Success! Check the file in your Downloads folder

**PDF includes**:
- Professional cover page
- All pages with images and text
- Page numbers
- Print-ready quality

### Generate MP3 Narration

1. Click **"Generate MP3"** button
2. See estimated cost (e.g., ~$0.60 for 12 pages)
3. Wait ~30-60 seconds (2-3s per page)
4. MP3 downloads automatically
5. ✅ Success! Play the audio file

**Audio includes**:
- Natural voice narration (Rachel by default)
- 1.5 second pauses between pages
- High-quality MP3 output

### Generate Audiobook

1. Click **"Generate Audiobook"** button
2. Same process as MP3 (currently generates MP3 format)
3. Stored separately for audiobook apps
4. ✅ Success!

**Future**: M4B format with chapter markers and metadata

---

## 7. Verify Everything Works ✅

### Check Database

Open Supabase Dashboard → Books table:

- `pdf_url` should be set (R2 URL)
- `audio_url` should be set (R2 URL)
- `audiobook_url` should be set (R2 URL)
- Timestamps show when generated

### Check R2 Storage

Open Cloudflare Dashboard → R2:

```
Bucket: ai-childrens-books
└── {user_id}/
    └── {book_id}/
        └── exports/
            ├── {book-title}.pdf
            ├── {book-title}.mp3
            └── audiobook-{book-title}.mp3
```

### Re-download Existing

1. Refresh the book page
2. Export buttons now show **"Download"** (not "Generate")
3. Click **"Download PDF"** → instant download
4. Click **"Regenerate"** to create a new version

---

## Troubleshooting 🔧

### "ElevenLabs API key not configured"

- Check `.env.local` has `ELEVENLABS_API_KEY=sk_...`
- Restart dev server after adding env vars

### "Failed to upload to storage"

- Verify R2 credentials in `.env.local`
- Check bucket exists and has correct permissions

### "Some pages are missing images"

- Generate images first (click "Generate Images" button)
- All pages need images before PDF export

### Build errors

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### TypeScript errors

All fixed in Session 6! If you see errors, make sure you have the latest code:

```bash
git pull origin main
npm install
```

---

## Quick Reference 📚

### Available Voices

- **Rachel**: Warm, calm, friendly (default)
- **Domi**: Energetic, expressive
- **Bella**: Soft, gentle
- **Nicole**: Confident, clear

### PDF Layouts

- **image-top**: Image on top, text below (default)
- **image-full**: Full-page image with text overlay
- **image-left**: Side-by-side layout

### Cost Estimates

- **PDF**: FREE (only storage cost: ~$0.002/month per book)
- **Audio**: ~$0.30 per 1000 characters
  - 12-page book (~2000 chars) = ~$0.60
  - Free tier: 10,000 chars/month = ~5 books/month
- **Storage**: ~$0.003/month per book (PDF + audio)

---

## What's Next? 🎯

Now that exports work:

1. ✅ **Test with real books** - Generate stories and export them
2. ✅ **Try different voices** - Compare narration quality
3. ✅ **Test PDF layouts** - See which works best for your books
4. ✅ **Monitor costs** - Check ElevenLabs usage dashboard
5. ✅ **Share books** - Download and share with friends/family!

**Session 7 possibilities**:
- M4B audiobook format (with metadata)
- Voice customization UI
- PDF template options
- Progress tracking for exports
- Batch export (PDF + audio in one click)

---

## Need Help? 💬

- Check `SESSION-6-COMPLETE.md` for full documentation
- Review API endpoints: `app/api/books/[id]/export/*/route.ts`
- Check services: `lib/services/pdf-generator.ts` and `audio-narration.ts`
- Test in isolation: Use Postman/curl to call API endpoints directly

---

**Enjoy creating and exporting your children's books!** 📚🎧

*Generated by: Ethan (AI Sub-Agent)*  
*Session 6 - Quick Start Guide*
