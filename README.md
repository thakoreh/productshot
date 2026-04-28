# ProductShot

Turn any product URL into a beautiful launch card. Perfect for Product Hunt, Twitter, and Indie Hackers launches.

**1200×630 PNG output** — optimized for Twitter cards and Product Hunt.

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Production

```bash
npm install
npm run build
./start.sh   # starts screenshot server + Next.js
```

## How it works

1. Paste your product URL
2. Customize name, tagline, and launch date
3. Download as PNG

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS 3
- Playwright (headless Chrome screenshot server)

## Architecture

- `app/` — Next.js frontend
- `screenshot-server.js` — Playwright headless browser sidecar (port 3008)
- `api/screenshot/route.js` — API route that calls the screenshot server
