# NorthWake Platform Changelog

## May 2026

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
