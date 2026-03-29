# ⛳ Golf Performance Tracker

A full-featured golf round tracker built with React + Vite + Tailwind CSS.

## Features
- **Round Log** — Log every round with score, putts, GIR, fairways, reflections
- **Hole-by-Hole** — Per-round 18-hole detail with clubs, mistakes, thought process
- **Stats Dashboard** — Auto-calculated averages, trends, score history chart
- **Club & Mistake Log** — Dropdown-driven mistake tracker with status & priority
- **Mistake Summary** — Visual bar charts showing your most problematic clubs & patterns

All data saves to **localStorage** — works offline, no backend needed.

---

## Deploy to Vercel (5 minutes)

### Option A — GitHub + Vercel (recommended)

1. **Upload to GitHub**
   - Go to [github.com](https://github.com) → New repository → name it `golf-tracker`
   - Upload all files from this folder (drag & drop in the GitHub UI)
   - Click "Commit changes"

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com) → Sign up with GitHub
   - Click "Add New Project"
   - Import your `golf-tracker` repository
   - Vercel auto-detects Vite — just click **Deploy**
   - Done! You get a URL like `golf-tracker.vercel.app`

### Option B — Vercel CLI

```bash
npm install -g vercel
npm install
vercel
```

Follow the prompts — it deploys in under a minute.

---

## Run Locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

---

## Build for Production

```bash
npm run build
```

Output goes to `/dist` folder — ready to deploy anywhere.
