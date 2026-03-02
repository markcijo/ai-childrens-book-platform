# Session 6 - PDF Export & Audio Narration - Quick Start Guide

**Feature**: Export books as PDFs and audiobooks with professional narration  
**Status**: ✅ Ready for testing  
**Time to test**: 5-10 minutes

---

## What's New

### PDF Export
- Generate print-ready PDFs of complete books
- Professional cover page with title and image
- Three layout options (image-top, image-full, image-left)
- Download instantly or regenerate with different settings

### Audio Narration
- Natural-sounding narration with ElevenLabs AI voices
- Multiple voice options (Rachel, Domi, Bella, Nicole)
- Automatic silence gaps between pages
- Single MP3 file with all pages narrated

### Audiobook Format
- Separate audiobook file (MP3 format)
- Ready for audiobook apps
- Includes metadata
- M4B format coming in future update

---

## Quick Start (5 Minutes)

### 1. Set Up ElevenLabs API Key

```bash
# Get API key from https://elevenlabs.io/app/settings/api-keys
# Add to .env.local:
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

**Free Tier**: 10,000 characters/month (~16 short books)

### 2. Run Database Migration

```bash
# Apply the new migration for export fields
supabase db push

# Or run manually in Supabase Dashboard:
# supabase/migrations/20260302143200_add_exports.sql
```

### 3. Start Dev Server

```bash
npm install  # Install new dependencies (jspdf, elevenlabs SDK)
npm run dev
```

### 4. Test Exports

1. **Open existing book** or create a new one:
   - http://localhost:3000/books/[book-id]

2. **Complete the book** if not already:
   - Generate story
   - Generate images
   - Extract characters (optional but recommended)

3. **Find Export Section**:
   - Scroll down to "📦 Export Book" section
   - Three export options available

4. **Generate PDF**:
   - Click "Generate PDF"
   - Wait ~5-10 seconds
   - PDF opens in new tab
   - Verify cover page and all pages render correctly

5. **Generate Audio**:
   - Click "Generate MP3"
   - See estimated cost (~$0.60-$0.90 for 12 pages)
   - Wait ~30-60 seconds
   - MP3 downloads automatically
   - Play and verify narration

6. **Generate Audiobook**:
   - Click "Generate Audiobook"
   - Same process as MP3
   - Separate file for audiobook apps

---

## Testing Checklist

### PDF Export
- [ ] PDF generates successfully
- [ ] Cover page shows title, age range, genre, first page image
- [ ] All content pages have images and text
- [ ] Layout is professional and readable
- [ ] Page numbers appear (if enabled)
- [ ] Can regenerate with same settings
- [ ] "Download PDF" button works after generation

### Audio Narration
- [ ] ElevenLabs API key configured
- [ ] Cost estimate displays before generation
- [ ] MP3 generates without errors
- [ ] All pages are narrated in order
- [ ] Silence gaps between pages (~1.5 seconds)
- [ ] Voice sounds natural and clear
- [ ] Can play in any audio player
- [ ] "Download MP3" button works after generation

### Audiobook
- [ ] Generates separately from MP3 narration
- [ ] File is named differently (audiobook-*)
- [ ] Can be imported into audiobook apps
- [ ] "Download Audiobook" button works

### UI/UX
- [ ] Export section only visible when book is complete
- [ ] All pages must have images to export PDF
- [ ] Loading states show during generation
- [ ] Success messages appear after generation
- [ ] "Generated" badges show for existing exports
- [ ] Generation timestamps display correctly
- [ ] Error messages are clear and helpful

---

## Common Issues

### PDF Generation Fails

**Problem**: "Some pages are missing images"  
**Solution**: Generate images for all pages first

**Problem**: PDF is blank or missing content  
**Solution**: Check that permanent_image_url or image_url exists for all pages

### Audio Generation Fails

**Problem**: "ElevenLabs API key not configured"  
**Solution**: Add ELEVENLABS_API_KEY to .env.local

**Problem**: "Failed to generate narration"  
**Solution**: Check ElevenLabs API key is valid, check credit balance

**Problem**: Audio is too quiet or distorted  
**Solution**: Adjust stability/similarityBoost settings in API call

### Export Section Not Showing

**Problem**: Export buttons don't appear  
**Solution**: Book status must be 'complete' and have at least one page with images

---

## API Endpoints

### PDF Export
```bash
POST /api/books/[id]/export/pdf
{
  "layout": "image-top",      # image-top | image-full | image-left
  "fontSize": 14,             # Text size
  "includePageNumbers": true, # Show page numbers
  "includeCover": true        # Include cover page
}

GET /api/books/[id]/export/pdf  # Check if PDF exists
```

### Audio Export
```bash
POST /api/books/[id]/export/audio
{
  "voiceName": "Rachel",          # Rachel | Domi | Bella | Nicole
  "voiceId": "...",               # Optional: use specific voice ID
  "modelId": "eleven_turbo_v2_5", # Model to use
  "stability": 0.5,               # 0-1, voice consistency
  "similarityBoost": 0.75,        # 0-1, clarity
  "silenceDuration": 1500         # Milliseconds between pages
}

GET /api/books/[id]/export/audio  # Check if audio exists
```

### Audiobook Export
```bash
POST /api/books/[id]/export/audiobook
{
  # Same parameters as audio export
}

GET /api/books/[id]/export/audiobook  # Check if audiobook exists
```

---

## Voice Options

| Voice | ID | Best For |
|-------|-----|----------|
| **Rachel** (default) | 21m00Tcm4TlvDq8ikWAM | General storytelling, calm tone |
| **Domi** | AZnzlk1XvdvUeBnXmlld | Energetic stories, adventure |
| **Bella** | EXAVITQu4vr4xnSDxMaL | Bedtime stories, gentle tone |
| **Nicole** | piTKgcLEGmPE4e6mEKli | Educational books, clear diction |

---

## Layout Examples

### image-top (Default)
```
┌─────────────────────────────────┐
│                                 │
│         [IMAGE 65%]             │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Centered text below image      │
│  Good for storytelling          │
│                                 │
└─────────────────────────────────┘
```

### image-full
```
┌─────────────────────────────────┐
│                                 │
│    [FULL PAGE BACKGROUND]       │
│                                 │
│                                 │
├─────────────────────────────────┤
│ Text overlay at bottom (90%)    │
└─────────────────────────────────┘
```

### image-left
```
┌──────────────┬──────────────────┐
│              │                  │
│   [IMAGE     │  Text on right   │
│    55%]      │  side            │
│              │  Good for longer │
│              │  text passages   │
└──────────────┴──────────────────┘
```

---

## Cost Breakdown

### PDF Export
- **Generation**: Free (computational only)
- **Storage**: ~$0.015/GB/month (R2)
- **Per book**: <$0.01 for typical 12-page PDF

### Audio Narration
- **Generation**: ~$0.30 per 1000 characters (ElevenLabs)
- **Storage**: ~$0.015/GB/month (R2)
- **Per 12-page book**: $0.60-$0.90 (2000-3000 chars)
- **Per 6-page book**: $0.30-$0.45 (1000-1500 chars)
- **Per 18-page book**: $0.90-$1.35 (3000-4500 chars)

### Total Cost
- **PDF only**: ~$0.01 per book
- **PDF + Audio**: ~$0.70 per book
- **All formats**: ~$0.80 per book

---

## Next Steps

After testing:

1. **Verify all formats work correctly**
   - PDFs render properly
   - Audio plays smoothly
   - Files are shareable

2. **Test with different scenarios**
   - Short books (6 pages)
   - Long books (18 pages)
   - Different layouts
   - Different voices

3. **User feedback**
   - Share with test users
   - Get feedback on PDF layout
   - Get feedback on voice quality

4. **Plan future enhancements**
   - M4B audiobook format
   - Custom narration scripts
   - Background job processing
   - More layout options

---

## Support

**Documentation**: See SESSION-6-COMPLETE.md for full details  
**API Docs**: Check route.ts files for endpoint specifications  
**Voice Samples**: https://elevenlabs.io/voice-library

---

**Status**: ✅ Ready for testing  
**Version**: 1.0.0  
**Date**: March 2, 2026
