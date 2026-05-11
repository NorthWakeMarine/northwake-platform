# NorthWake Platform

A full-stack business engine for premium marine (and adaptable service) businesses. Includes a public landing site, lead capture forms, and a Pro CRM portal — all configurable via a single `client.ts` file.

## Stack
- **Framework:** Next.js 15 App Router
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (Postgres + Storage)
- **Hosting:** Vercel (auto-deploy from main branch)

## Spinning up a new client

1. Duplicate `src/config/client.ts` and fill in the company values.
2. Replace logo assets in `public/brand/` (white SVG, full black PNG).
3. Add a hero/carousel image to `public/images/` for local dev fallback.
4. Set Vercel env vars (see below).
5. Push to main — Vercel auto-deploys.

## Local dev

```bash
cp .env.example .env.local   # fill Supabase values from Supabase dashboard > Settings > API Keys > Legacy
npm install
npm run dev
```

If you hit webpack chunk errors: `rm -rf .next && npm run dev`.

Do NOT run `vercel --prod` manually — GitHub integration handles production deploys.

## Env vars (Vercel)

| Var | Required | Notes |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Yes | |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | |
| SUPABASE_SECRET_KEY | Yes | Service role key |
| NEXT_PUBLIC_SITE_URL | Yes | e.g. https://www.northwakemarine.com |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | Calendar | |
| GOOGLE_PRIVATE_KEY | Calendar | |
| GOOGLE_CALENDAR_ID | Calendar | primary |
| GOOGLE_CALENDAR_SUBJECT | Calendar | admin email |
| GOOGLE_WEBHOOK_TOKEN | Calendar | random secret |
| QB_CLIENT_ID | QuickBooks | |
| QB_CLIENT_SECRET | QuickBooks | |
| QB_REDIRECT_URI | QuickBooks | /api/auth/quickbooks/callback |
| QB_WEBHOOK_VERIFIER_TOKEN | QuickBooks | |
| DIALPAD_API_KEY | Dialpad | |
| GOOGLE_ADS_WEBHOOK_KEY | Google Ads | |
| INGEST_API_KEY | Integrity check cron | |
| CRON_SECRET | Cron routes | |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | Analytics | Add to activate GA4 |
| NEXT_PUBLIC_GOOGLE_PLACES_API_KEY | Reviews | Add to activate Google Reviews carousel |
| GMAIL_USER | Email alerts | Add to activate form submission emails |
| GMAIL_APP_PASSWORD | Email alerts | |

## UI design system

All public landing pages follow WCAG 2.1 AA standards. Key rules:

- **Light mode** on all public pages (white/gray-50 bg, dark text). Header + footer stay dark.
- **Minimum text:** body `text-sm text-gray-700`, labels `text-xs text-gray-500` — never `text-gray-400` on white (fails contrast).
- **Form borders:** `border-gray-500` minimum on all form fields (inputs, selects, textareas, checkboxes).
- **Ghost buttons:** `border-gray-500` minimum on white backgrounds.
- **Heading hierarchy:** h1 -> h2 -> h3, never skip levels, use `sr-only` headings to bridge gaps.
- **Textures:** dot grid via `hero-grid` class on light sections; inline white dot gradient on dark sections.

CSS utility classes live in `src/app/globals.css`: `chrome-text`, `chrome-text-dark`, `chrome-btn`, `chrome-stage`, `chrome-stage-light`, `badge-chrome`, `hero-grid`, `accent-rule`, `accent-rule-dark`.

## Release notes

The Pro portal release notes page (`/pro/release-notes`) reads `CHANGELOG.md` at render time. Update `CHANGELOG.md` and push to update the dashboard — no code changes needed.
