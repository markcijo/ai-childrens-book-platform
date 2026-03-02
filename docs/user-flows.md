# User Flows

## Flow A — Parent creates first book (MVP)
1. Sign up / log in
2. Create **Project (Universe)**
   - Choose art style preset (watercolor, cartoon, manga-lite, etc.)
   - Define age band + reading level
3. Create **Characters**
   - Describe characters (name, traits, clothing, colors)
   - Generate character sheet
   - (Background) create consistency asset (LoRA or reference pack)
4. Create **Book**
   - Enter story idea + moral/theme + length (e.g., 12 or 24 pages)
   - Generate storyboard (page text + scene directions)
5. Generate illustrations
   - Auto-generate images per page
   - Review page grid; click into a page to regenerate / tweak
6. Generate narration
   - Pick voice + speed
   - Generate full narration
7. Export
   - Download PDF
   - Download audio (MP3/M4B)

## Flow B — Regenerate a single page
- From book overview → select page → change prompt knobs (mood, setting, pose) → regenerate
- System keeps same character LoRA/refs + style-lock.

## Flow C — Create a series (V1)
- Create Book 2 inside same Project
- Reuse characters + style
- Add new character if needed (train/update consistency asset)

## Flow D — Educator (classroom pack)
- Choose lesson objective (e.g., kindness, fractions)
- Generate story + comprehension questions
- Export PDF + teacher guide

