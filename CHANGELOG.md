# NorthWake Platform Changelog

## May 2026

### May 13 | Vendor/customer separation, contact page layout overhaul, Dialpad phone fix | CRM,Integrations

- Contacts list now has Customers / Vendors / All tab toggle; vendor contacts hide pipeline, fleet, and waiver UI
- Vendor contact page shows a Description field; company name field added and syncs to QB and Dialpad
- QB vendor name collision (error 6240) silently skips and reports in the sync panel
- Contact page: Notes moved to its own card, Household box removed, Documents to left column
- Dialpad phone fix: `primary_phone` string and `phone_numbers` array both normalized throughout sync

### May 12 | CRM contacts overhaul, bidirectional QB/Dialpad sync, asset editing | CRM,Integrations

- Contacts list: Vessel/Length columns merged into a single Asset column; No Fleet and Info Incomplete badges added
- Asset cards now have inline Edit and Delete (with confirm) actions
- Vessel data syncs bidirectionally via QB customer Notes field; CRM to QB and QB to CRM both update fleet records
- Dialpad caller ID now shows vessel info as last name for incoming call display on mobile
- Sync All is now bidirectional: CRM pushes to QB and Dialpad alongside inbound imports; wired into daily cron
- Dialpad prefix matching fixes contacts with old combined name+vessel format

### May 12 | Web services page polish, AI receptionist add-on, mobile UI cleanup | Site,WebServices

- Mobile typography and spacing tightened across all sections
- CTAs updated to "Book a Free Strategy Call"; trust badge pills added above pricing
- AI Receptionist add-on listed at +$249/mo with fulfillment runbook
- VS comparison table updated with competitor pricing callout and exclusivity row

### May 12 | Dialpad native webhooks, QB invoice import, contact detail improvements | CRM,Integrations

- Native Dialpad event subscriptions replace Zapier; Register Webhook button added to Integrations page
- QB invoice import pulls full invoice history to contact timelines with paid/partial/unpaid status
- Waiver checkbox added to Contact Details edit mode; standalone waiver button removed

### May 11 | Light mode UI, WCAG AA audit, Featured Work redesign | Site,UX

- All public pages converted from dark to light mode; header, footer, and Featured Work section stay dark
- Full WCAG 2.1 AA pass: body copy at 14px, text-gray-500 minimums, border-gray-500 on all form fields and ghost buttons
- Hero texture changed to navy dot grid; footer compacted to a single slim row
- "Marinas and Waterways We Serve" section added to Services page for local SEO
- Featured Work section tightened; chrome-stage border removed from carousel in showcase mode

### May 9 | Remove floating quote button | Site
The floating "Get a Free Quote" button was removed from all public pages. The site has enough quote entry points (hero form, footer CTA band, contact page) that the persistent button was redundant and covered footer content on scroll.

### May 9 | Performance, trust bar, and Pro portal KPIs | Site,Pro
5-Star Rated badge added to homepage trust bar. Carousel images cached server-side for 1 hour. Preconnect hints added for Supabase CDN and Google Fonts. Pipeline bar now shows 30-day client and conversion counts. Lead detail pages gained Call and Email action buttons.

### May 9 | UX and accessibility overhaul | UX,Site,Pro
- Public site: keyboard focus rings, inline form error messages, button loading states, arrow-key carousel nav
- Pipeline: card dismiss requires confirmation, empty columns show drop zone prompt, modals trap focus
- Unsaved inline edits trigger a leave-page warning; empty states have descriptive context

### May 9 | Calls log page | Integrations
A new Calls page in the sidebar lists all inbound and outbound activity logged from Dialpad: calls, missed calls, voicemails, and SMS. Shows contact name (linked to their dossier), direction, duration, and timestamp. A summary bar at the top shows total call and SMS counts.

### May 9 | Pipeline stats bar | Pipeline
The pipeline summary bar now includes two additional counters: new leads in the last 7 days and calls logged in the last 7 days, alongside the existing per-stage card counts and health flags.

### May 9 | Email alerts for website form submissions | Integrations
When a visitor submits a quote request form on the public site, an email notification is sent to the admin inbox with the lead name, contact info, service requested, and vessel details. Add GMAIL_USER and GMAIL_APP_PASSWORD to Vercel to activate.

### May 9 | SEO and entity links | SEO,Site
Added X (Twitter), LinkedIn, Yelp, MapQuest, and Florida Sunbiz registration to the JSON-LD sameAs array. Added link rel=me tags in the site head for X, LinkedIn, and Instagram. These signals help AI search engines and crawlers identify NorthWake Marine across the web.

### May 9 | Google Reviews carousel on homepage | Site
Testimonials section pulls live reviews from Google Places API, cycles every 5 seconds, and shows star rating and review count. Falls back to handwritten testimonials if none are available. Cached for 24 hours.

### May 9 | OAuth-only Dialpad, dead code removed | Fix,Integrations
Removed the DIALPAD_API_KEY fallback from all Dialpad API calls. OAuth is now the only connection path. Deleted the unused ProNav component that was replaced by ProShell.

### May 7 | Dialpad local-to-shared contact promotion | Integrations,Fix
Sync All now shows fetched-vs-matched counts. "Promote Local to Shared" button pushes personal userline contacts to company-shared so the whole team and API can see them. Phone normalization updated to handle all common formats.

### May 7 | Dialpad API pagination fix | Fix,Integrations
Dialpad's contacts and calls endpoints cap the `limit` parameter at 100. All API calls now page through results in batches of 100 (up to 500 total) instead of sending an oversized limit that caused a 400 error on Sync All.

### May 7 | Sync images from Supabase Storage | Site
A "Sync images from Supabase Storage" link in the Site Editor scans the carousel bucket and automatically creates DB records for any images uploaded directly to Supabase, without going through the upload zone.

### May 7 | Carousel image manager | Site
Homepage Carousel section in Site Editor: drag-and-drop upload, instant preview, focal point editor, hide/show, delete, and drag-to-reorder.

### May 7 | GA4 analytics tracking | Site
GA4 event tracking added site-wide: nav, CTAs, phone/email taps, form lifecycle, carousel, and scroll depth. Analytics reference page in the pro portal. Activate with NEXT_PUBLIC_GA_MEASUREMENT_ID.

### May 7 | Dialpad contact import via Sync All | Integrations
Sync All now surfaces Dialpad contacts that have no matching CRM record, with one-click Import and Import All buttons to bring them into the CRM. Previously Sync All only matched existing contacts by phone; now it can also create new CRM records from Dialpad.

### May 7 | Site Editor + sidebar tooltips | Site,Fix
The CMS Editor was renamed to Site Editor. In collapsed sidebar mode, hovering any nav icon now shows a tooltip with the page name so navigation is clear without expanding the sidebar.

### May 7 | Sidebar no-flash avatar | Fix
The user avatar and name at the bottom of the sidebar no longer flash a different user's name when switching pages. Client state is initialized from localStorage before paint using a lazy useState initializer, eliminating the SSR hydration mismatch.

### May 6 | Mobile pipeline board | Pipeline,Mobile
Pipeline works on phones: scrollable stage tab bar shows one column at a time. Cards have chevron buttons to move stages and an X to remove, no drag required.

### May 6 | Clickable rows in Leads and Contacts lists | CRM
VIEW button removed; full row click navigates to the detail page. DELETE moved to the detail page top bar with a confirm step.

### May 6 | Add to Pipeline button on contacts and leads | Pipeline,CRM
Contact and lead detail pages have an Add to Pipeline button with stage picker. Already-on-board contacts show their current stage as a badge instead.

### May 6 | Delete any timeline event | CRM
Previously only notes could be deleted from the activity timeline. Now every event type (stage changes, calls, invoices, etc.) has a trash icon that appears on hover. A confirm prompt prevents accidental deletions.

### May 6 | Text legibility improvements across the site | Site,Fix
The steel gray text colors were too dark against black backgrounds, failing contrast standards. The steel palette was brightened: --color-steel went from #686A6C to #a0a2a4 and --color-steel-light from #8a8c8e to #c2c4c6. All pages update automatically through CSS variables.

### May 6 | SEO and AI discoverability pass | SEO,Site
FAQPage and WebSite JSON-LD schemas added. sameAs links expanded to YouTube, TikTok, and Google Reviews. AI crawlers unblocked in robots.ts.

### May 6 | Google Ads leads: cleaned up message field | Integrations,Fix
The raw Lead ID hex string was being stored in the lead message field. It has been removed. The campaign name and form name are now stored in the Referral Source field instead. Existing leads with the raw data have it stripped at display time automatically.

### May 6 | X button on lead-type pipeline cards | Pipeline,Fix
Lead cards were missing the remove button. All cards now show X. On lead cards it deletes the lead; on contact cards it removes from the board only.

### May 4 | Contact details inline editing | CRM
Pencil icon opens all contact fields (name, email, phone, address) for inline batch editing. Email and phone render as clickable links in read mode.

### May 4 | Push CRM data to Dialpad | Integrations
Push to Dialpad button syncs all CRM customers to Dialpad, creating entries for any not yet linked. Field mismatches surfaced with per-field resolution controls.

### May 4 | Pipeline board UX refinements | Pipeline
Columns now fill the full page width using flex-1. The Needs Attention column has a red accent. Health flag warning icons show on cards with a tooltip listing the issues. Cards have a remove button that sets pipeline_stage to null while keeping the contact record intact.

### May 3 | QuickBooks customer import and sync panel | Integrations
Sync All imports QB customers, detects field mismatches, and surfaces unmatched records for one-click import. QB company names parsed into vessel records. View in QB link on every linked contact.

### May 3 | Generate invoice draft from fleet asset | Integrations,CRM
Each asset in a contact's fleet now has a Generate Draft Invoice button. Clicking it creates a draft in QuickBooks, logs the action to the activity timeline, and opens a link to review the draft in QB.

## April 2026

### Apr 30 | Drag-and-drop Kanban pipeline board | Pipeline
Dashboard rebuilt as a 6-column Kanban board (dnd-kit). Cards drag between stages in real time. Lead cards auto-convert to contacts on first move.

### Apr 30 | NorthWake favicon | Site
The NorthWake Marine anchor logo is now the browser tab icon and Apple touch icon across the entire site.

### Apr 27 | Google Calendar integration | Integrations
Live week-grid calendar in the pro portal. Events can be created, edited, and deleted. Webhook auto-renewal keeps the sync active.

### Apr 27 | Google Ads lead webhook | Integrations
Leads submitted through Google Ads lead form extensions are automatically captured and routed into the CRM. The source is tagged as Google Ads and the campaign name is stored in the referral source field. Custom form questions (vessel type, service, message) map to the correct CRM fields.

### Apr 27 | Contact Documents panel with Google Drive | CRM,Integrations
Documents panel on each contact dossier lists and uploads files from a linked Drive folder. Liability waivers auto-save to Drive on submission.

### Apr 27 | Per-vessel service schedules | CRM
Each vessel in the fleet can have a custom service interval (in days). The integrity engine flags vessels as overdue when the interval has passed since last service. Overdue vessels surface on the dashboard and move the contact to Needs Attention.

### Apr 21 | Full CRM engine launched | CRM
Pro portal launched with lead tracking, contact dossiers, vessel fleet, activity timelines, and linked contacts. Duplicate phone detection, phone normalization, and a per-contact health bar.

### Apr 21 | QuickBooks and Dialpad OAuth flows | Integrations
OAuth connection routes were built for both QuickBooks Online and Dialpad. QB tokens are stored and auto-refreshed. Invoice creation, customer sync, and payment webhook handling are all wired up and live for QuickBooks.

### Apr 18 | Landing site completed | Site
All five public pages (Home, Services, About, Contact, Socials) are live at northwakemarine.com. The home page features an auto-loading hero carousel, a services grid, and quote forms. The site uses the full NorthWake chrome and navy design system with Tailwind.

### Apr 17 | Platform initialized | Site
The NorthWake platform was bootstrapped as a Next.js 15 App Router project with Tailwind CSS, Supabase, and Vercel. The luxury maritime design system (obsidian backgrounds, navy accents, chrome typography) was established in globals.css.
