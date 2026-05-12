# NorthWake Platform Changelog

## May 2026

### May 12 | Dialpad native webhooks, QB invoice import, contact detail improvements | CRM,Integrations
Native Dialpad event subscriptions replace Zapier for call and SMS logging. QB invoice history now imports to contact timelines. Contact detail edit mode now includes waiver checkbox.

**Dialpad native webhooks:** Replaced Zapier adapter with a two-step native registration: POST /webhooks to create an endpoint, then POST /subscriptions/call (hangup + voicemail states) and POST /subscriptions/sms (inbound). Register Webhook button added to /pro/integrations under the Dialpad card. Webhook handler updated to normalize both native format (state/external_number) and OAuth format (event/caller_number) so both paths work without code changes.

**QuickBooks invoice import:** New Import Invoices button in the Data Sync panel fetches all invoices per linked QB customer and writes them to contact timelines as invoice events with paid/partial/unpaid status, line item detail, and a direct link back to the QB invoice. Deduped by QB invoice ID so safe to re-run. BillAddr also now pulled and written to contact address field on QB customer import.

**Contact detail improvements:** Waiver signed checkbox added to the Contact Details edit section, saving alongside name/email/phone/address in one Save action. Standalone Mark Waiver Signed checkbox removed from the Documents card.

### May 11 | Light mode UI, WCAG AA audit, Featured Work redesign | Site,UX
Complete visual overhaul of all public landing pages from dark mode to light mode, followed by a full WCAG 2.1 AA accessibility audit and Featured Work section redesign.

**Light mode conversion:** All public pages (Home, About, Services, Contact, Socials) now use white/gray-50 backgrounds with dark text. Header and footer remain dark (bg-obsidian). Featured Work showcase stays black. Chrome/metallic effects carried over using a new `chrome-text-dark` CSS class (dark pewter gradient) for use on light backgrounds.

**Typography and legibility:** Body copy bumped from text-xs to text-sm (14px) and darkened to text-gray-700 across all pages. Form labels bumped to text-xs font-medium text-gray-700. All sub-12px text eliminated. Header and footer button text bumped to text-xs minimum.

**WCAG 2.1 AA audit:** Eyebrow labels bumped from text-gray-400 (2.5:1, fails) to text-gray-500 (4.6:1, passes) across all pages. Form field borders bumped from border-gray-300 (1.3:1) to border-gray-500 (4.6:1) on all inputs, selects, textareas, and checkboxes. Ghost button borders bumped to border-gray-500. Chrome-btn given a 1px #686a6c border for visibility on white. Both quote forms include a "Fields marked * are required." legend (1.4.1). About page heading hierarchy fixed with sr-only h2 bridging h1 to h3 team cards (1.3.1).

**Texture:** Hero crossing-line grid replaced with a navy dot pattern (class hero-grid). New accent-rule-dark CSS class added for chrome gradient dividers on dark backgrounds.

**Footer:** Compacted from tall multi-row layout into a single slim horizontal row: logo, nav links, phone and email, Get a Quote CTA. Bottom bar has copyright, Terms, Privacy, and NorthWake Pro links.

**Service areas:** Added "Marinas and Waterways We Serve" section to the Services page with three columns: approximately 50 marinas, 30 waterways, and 22 communities across the Jacksonville area for local SEO crawl value.

**Featured Work banner:** Compacted (pt-20 to pt-5), chrome-stage border removed from carousel in showcase mode (hero mode only now), white dot texture and chrome accent rule added to the black section.

### May 9 | Remove floating quote button | Site
The floating "Get a Free Quote" button was removed from all public pages. The site has enough quote entry points (hero form, footer CTA band, contact page) that the persistent button was redundant and covered footer content on scroll.

### May 9 | Performance, trust bar, and Pro portal KPIs | Site,Pro
Homepage trust bar now includes a 5-Star Rated Service badge. Carousel images are cached server-side for 1 hour, eliminating a DB query on every page load. Preconnect hints added for the Supabase CDN and Google Fonts to cut connection setup time. Pipeline summary bar expanded with total client count and conversions in the last 30 days alongside the existing 7-day counters. Lead detail pages now have prominent Call and Email action buttons in the top bar.

### May 9 | UX and accessibility overhaul | UX,Site,Pro
Comprehensive UX pass across the public site and Pro portal.

Public site: all interactive elements show a keyboard focus ring, quote forms display per-field inline error messages, placeholder text lightened for readability, submission buttons show a spinner and dim the form during pending state, hero carousel responds to left/right arrow keys when focused. Chrome button shimmer respects prefers-reduced-motion. Hero carousel loading state shows a shimmer skeleton. Reviews carousel resumes auto-advance 8 seconds after a manual interaction.

Pro portal: pipeline card dismiss requires a confirmation step, empty columns show a dashed drop zone prompt, Log Call and Schedule Appointment modals trap focus and close on Escape, the all-day toggle is a proper accessible switch, unsaved inline edits trigger a browser leave-page warning, leads and contacts empty states include descriptive context.

### May 9 | Calls log page | Integrations
A new Calls page in the sidebar lists all inbound and outbound activity logged from Dialpad: calls, missed calls, voicemails, and SMS. Shows contact name (linked to their dossier), direction, duration, and timestamp. A summary bar at the top shows total call and SMS counts.

### May 9 | Pipeline stats bar | Pipeline
The pipeline summary bar now includes two additional counters: new leads in the last 7 days and calls logged in the last 7 days, alongside the existing per-stage card counts and health flags.

### May 9 | Email alerts for website form submissions | Integrations
When a visitor submits a quote request form on the public site, an email notification is sent to the admin inbox with the lead name, contact info, service requested, and vessel details. Add GMAIL_USER and GMAIL_APP_PASSWORD to Vercel to activate.

### May 9 | SEO and entity links | SEO,Site
Added X (Twitter), LinkedIn, Yelp, MapQuest, and Florida Sunbiz registration to the JSON-LD sameAs array. Added link rel=me tags in the site head for X, LinkedIn, and Instagram. These signals help AI search engines and crawlers identify NorthWake Marine across the web.

### May 9 | Google Reviews carousel on homepage | Site
The testimonials section now pulls real reviews from Google Places API and cycles through them automatically every 5 seconds. Pauses on hover. Shows star rating, overall rating score, and review count. Falls back to handwritten testimonials if no reviews are available yet. Includes a link to leave a review on Google. Reviews are cached for 24 hours.

### May 9 | OAuth-only Dialpad, dead code removed | Fix,Integrations
Removed the DIALPAD_API_KEY fallback from all Dialpad API calls. OAuth is now the only connection path. Deleted the unused ProNav component that was replaced by ProShell.

### May 7 | Dialpad local-to-shared contact promotion | Integrations,Fix
Sync All now shows how many contacts were fetched from Dialpad (before matching) so you can tell if the API returned zero vs. matching failed. A new "Promote Local to Shared" button copies personal userline contacts into company-shared contacts in Dialpad so the whole team can see them and the API can sync them. Phone normalization now handles all common formats (parentheses, dashes, 10-digit, 11-digit) using libphonenumber-js.

### May 7 | Dialpad API pagination fix | Fix,Integrations
Dialpad's contacts and calls endpoints cap the `limit` parameter at 100. All API calls now page through results in batches of 100 (up to 500 total) instead of sending an oversized limit that caused a 400 error on Sync All.

### May 7 | Sync images from Supabase Storage | Site
A "Sync images from Supabase Storage" link in the Site Editor scans the carousel bucket and automatically creates DB records for any images uploaded directly to Supabase, without going through the upload zone.

### May 7 | Carousel image manager | Site
A new Homepage Carousel section in the Site Editor lets you drag-and-drop or browse to upload photos directly to the site. Images appear instantly. Each photo has Preview, Edit (focal point), Hide/Show, and Delete actions. Drag to reorder. Photos are never zoomed or cropped unless you manually set a focal point.

### May 7 | GA4 analytics tracking | Site
Full Google Analytics 4 event tracking was added across the site: nav clicks, CTA clicks, phone and email taps, form start/submit/success/error, carousel navigation, and scroll depth (25/50/75/100%). An Analytics reference page in the pro portal lists every tracked event, page coverage, and recommended GA4 conversion goals. Add NEXT_PUBLIC_GA_MEASUREMENT_ID to Vercel to activate.

### May 7 | Dialpad contact import via Sync All | Integrations
Sync All now surfaces Dialpad contacts that have no matching CRM record, with one-click Import and Import All buttons to bring them into the CRM. Previously Sync All only matched existing contacts by phone; now it can also create new CRM records from Dialpad.

### May 7 | Site Editor + sidebar tooltips | Site,Fix
The CMS Editor was renamed to Site Editor. In collapsed sidebar mode, hovering any nav icon now shows a tooltip with the page name so navigation is clear without expanding the sidebar.

### May 7 | Sidebar no-flash avatar | Fix
The user avatar and name at the bottom of the sidebar no longer flash a different user's name when switching pages. Client state is initialized from localStorage before paint using a lazy useState initializer, eliminating the SSR hydration mismatch.

### May 6 | Mobile pipeline board | Pipeline,Mobile
The pipeline board now works on phones. A scrollable stage tab bar replaces the kanban columns on small screens, showing one stage at a time. Each card has a chevron button to move it to a different stage and an X to remove or dismiss it, all without drag-and-drop.

### May 6 | Clickable rows in Leads and Contacts lists | CRM
The VIEW button has been removed from both list pages. Clicking anywhere on a row now navigates to the detail page. Email and phone links still work independently. The DELETE button moved into each detail page's top bar, with a confirm step before deleting.

### May 6 | Add to Pipeline button on contacts and leads | Pipeline,CRM
Every contact dossier now has an Add to Pipeline button in the top bar with a dropdown to pick the starting stage. If the contact is already on the board, their current stage is shown as a badge instead. Unconverted lead detail pages get the same button.

### May 6 | Delete any timeline event | CRM
Previously only notes could be deleted from the activity timeline. Now every event type (stage changes, calls, invoices, etc.) has a trash icon that appears on hover. A confirm prompt prevents accidental deletions.

### May 6 | Text legibility improvements across the site | Site,Fix
The steel gray text colors were too dark against black backgrounds, failing contrast standards. The steel palette was brightened: --color-steel went from #686A6C to #a0a2a4 and --color-steel-light from #8a8c8e to #c2c4c6. All pages update automatically through CSS variables.

### May 6 | SEO and AI discoverability pass | SEO,Site
Added FAQPage JSON-LD schema to the contact page, a WebSite schema with dateModified, and a screen-reader-only direct-answer paragraph on the home page to improve extraction by AI search engines. Expanded LocalBusiness sameAs links to include YouTube, TikTok, and Google Reviews. Unblocked AI crawlers (GPTBot, Claude-Web, etc.) in robots.ts.

### May 6 | Google Ads leads: cleaned up message field | Integrations,Fix
The raw Lead ID hex string was being stored in the lead message field. It has been removed. The campaign name and form name are now stored in the Referral Source field instead. Existing leads with the raw data have it stripped at display time automatically.

### May 6 | X button on lead-type pipeline cards | Pipeline,Fix
New Lead cards (unconverted leads that appear automatically in the pipeline) were missing the remove button. All pipeline cards now show the X. Clicking it on a lead card deletes the lead entirely; on a contact card it removes them from the board but keeps the contact record.

### May 4 | Contact details inline editing | CRM
A pencil icon on every contact dossier opens all fields (name, email, phone, address) for batch editing in place. Changes are saved together on confirm. Email and phone display as clickable mailto and tel links in read mode, with an edit history tracked in metadata.

### May 4 | Push CRM data to Dialpad | Integrations
A Push to Dialpad button on the integrations page syncs all CRM customer records to Dialpad contacts, creating new Dialpad entries for any contacts not yet linked. Field mismatches between CRM and Dialpad (name, email, phone) are surfaced with per-field resolution controls.

### May 4 | Pipeline board UX refinements | Pipeline
Columns now fill the full page width using flex-1. The Needs Attention column has a red accent. Health flag warning icons show on cards with a tooltip listing the issues. Cards have a remove button that sets pipeline_stage to null while keeping the contact record intact.

### May 3 | QuickBooks customer import and sync panel | Integrations
A Sync All panel on the integrations page imports QB customers into the CRM, detects field mismatches, and shows unmatched records for one-click import. Company names in QB are parsed into vessel records (format: year make model length, comma-separated). A View in QB link appears on every linked contact.

### May 3 | Generate invoice draft from fleet asset | Integrations,CRM
Each asset in a contact's fleet now has a Generate Draft Invoice button. Clicking it creates a draft in QuickBooks, logs the action to the activity timeline, and opens a link to review the draft in QB.

## April 2026

### Apr 30 | Drag-and-drop Kanban pipeline board | Pipeline
The dashboard was rebuilt as a full Kanban board using @dnd-kit. Six columns: New Leads, Discovery, Needs Attention, Estimate Sent, Work Scheduled, and Done/Invoiced. Cards can be dragged between columns to update the pipeline stage in real time. Lead-type cards auto-convert to contacts on first move.

### Apr 30 | NorthWake favicon | Site
The NorthWake Marine anchor logo is now the browser tab icon and Apple touch icon across the entire site.

### Apr 27 | Google Calendar integration | Integrations
A live calendar page shows a week-grid view of all Google Calendar events. Events can be created, edited, and deleted from the pro portal. Webhook auto-renewal runs daily so the live-sync connection stays active. Descriptions render as HTML and support all-day and multi-day date ranges.

### Apr 27 | Google Ads lead webhook | Integrations
Leads submitted through Google Ads lead form extensions are automatically captured and routed into the CRM. The source is tagged as Google Ads and the campaign name is stored in the referral source field. Custom form questions (vessel type, service, message) map to the correct CRM fields.

### Apr 27 | Contact Documents panel with Google Drive | CRM,Integrations
Each contact dossier has a Documents panel that lists files from a linked Google Drive folder. Files can be uploaded directly from the dossier. Liability waivers are auto-saved to Drive on submission and appear in the documents list automatically.

### Apr 27 | Per-vessel service schedules | CRM
Each vessel in the fleet can have a custom service interval (in days). The integrity engine flags vessels as overdue when the interval has passed since last service. Overdue vessels surface on the dashboard and move the contact to Needs Attention.

### Apr 21 | Full CRM engine launched | CRM
The pro portal launched with lead tracking, contact dossiers, vessel fleet management, activity timelines, and linked contacts. Phone numbers are normalized on save. Duplicate phone detection surfaces a banner when two contacts share the same number. A health bar on each dossier shows completeness across email, phone, address, fleet, and waiver status.

### Apr 21 | QuickBooks and Dialpad OAuth flows | Integrations
OAuth connection routes were built for both QuickBooks Online and Dialpad. QB tokens are stored and auto-refreshed. Invoice creation, customer sync, and payment webhook handling are all wired up and live for QuickBooks.

### Apr 18 | Landing site completed | Site
All five public pages (Home, Services, About, Contact, Socials) are live at northwakemarine.com. The home page features an auto-loading hero carousel, a services grid, and quote forms. The site uses the full NorthWake chrome and navy design system with Tailwind.

### Apr 17 | Platform initialized | Site
The NorthWake platform was bootstrapped as a Next.js 15 App Router project with Tailwind CSS, Supabase, and Vercel. The luxury maritime design system (obsidian backgrounds, navy accents, chrome typography) was established in globals.css.
