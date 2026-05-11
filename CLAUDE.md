# NorthWake Platform (Web-Only)
- Custom Business Engine for NorthWake Marine.
- Main Color Palette: #686A6C, #000000, #FFFFFF, #000080; It is okay to sometimes use other colors if its for visual effect like chrome.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS
- Database: Supabase
- Hosting: Vercel

## Writing Rules
- Never use em dashes (—) anywhere in copy, UI text, or code comments. Use a comma, colon, or rewrite the sentence instead.
- Never use the word "technician" or "technicians" in any customer-facing copy.
- NorthWake Marine was established in 2025.

## Core Logic
- Landing Site: High-end, luxury Jacksonville maritime aesthetic. Will have Home, About, Services, Contact, and Socials Pages. With funnels to fill a "contact us" form all over the landing site.
- CRM: Lead tracking, vessel management, and service interval logic.
- Integrations: Dialpad, Google Calendar, QuickBooks, Google Ads.

## Landing Site UI Standards (enforce on all pages)

### Color mode
- Public landing pages are LIGHT MODE: white/gray-50 backgrounds, dark text.
- Header and Footer stay dark (bg-obsidian). Featured Work showcase section stays bg-black.
- Chrome/metallic effects: use `chrome-text-dark` (dark pewter) on light backgrounds; `chrome-text` (silver) on dark backgrounds.
- Cards on dark sections use `bg-obsidian`, cards on light sections use `bg-white hover:bg-gray-50`.

### Typography minimums (WCAG 2.1 AA)
- Body copy: `text-sm` (14px) minimum, `text-gray-700` on white.
- Labels / eyebrows / fine print: `text-xs` (12px) minimum, `text-gray-500` on white (never text-gray-400 — fails 3:1).
- Headings: h1 40–60px, h2 24–32px, h3 14–16px. Never skip heading levels.
- Form labels: `text-xs font-medium text-gray-700`.

### Borders and contrast (WCAG 1.4.11 — 3:1 non-text contrast)
- Form field borders: `border-gray-500` minimum on white backgrounds (not border-gray-300/400).
- Ghost/outline buttons: `border-gray-500` minimum on white backgrounds.
- Decorative card borders and section dividers can use border-gray-200 (not interactive, not subject to 3:1).
- `chrome-btn` has a `border: 1px solid #686a6c` in globals.css — do not remove.

### Texture patterns
- Light sections (hero): dot grid via `radial-gradient(circle, rgba(0,0,128,0.13) 1px, transparent 1px)` — class `hero-grid`.
- Dark sections (Featured Work): dot grid via `radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)` inline style. Chrome rule via `.accent-rule-dark`.
- Never use crossing-line grid textures behind text.

### Forms
- Both forms (HeroQuoteForm, QuoteForm) include a "Fields marked * are required." legend.
- All interactive borders are `border-gray-500`.
- Focus state: `focus:border-navy` (defined in globals.css focus-visible rule).

### CSS utility classes (globals.css)
- `chrome-text` — silver metallic gradient, for dark backgrounds.
- `chrome-text-dark` — dark pewter metallic gradient, for light backgrounds.
- `chrome-btn` — silver gradient CTA button with shimmer hover; has 1px #686a6c border.
- `chrome-stage` — dark card with chrome gradient border (hero carousel in hero mode only).
- `chrome-stage-light` — white card with chrome gradient border (hero quote form card).
- `badge-chrome` / `badge-chrome-text` — navy chrome badge for Featured/Premium labels.
- `hero-grid` — navy dot texture for light hero sections.
- `accent-rule` — navy-to-steel gradient divider line for light sections.
- `accent-rule-dark` — steel chrome gradient divider line for dark sections.