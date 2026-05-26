# NorthWake Platform Changelog

## May 2026

### May 26 | Full PWA, mobile safe areas, Correspondence section, Sync Quo | CRM,Landing,Mobile

- **Full PWA**: Installed `@ducanh2912/next-pwa` with Workbox service worker. Static assets (icons, brand, images) are CacheFirst 7-day. All `/pro` and `/api` routes are NetworkOnly so CRM data is never stale. Disabled in dev.
- **PWA manifest**: `public/manifest.webmanifest` with standalone display, navy theme color, pipeline start URL. Icons (192px, 512px, 180px apple-touch) generated from white logo on navy background via `scripts/generate-pwa-icons.mjs`.
- **Layout PWA metadata**: manifest link, apple-touch icon, `appleWebApp` meta for iOS standalone status bar, `themeColor`, and `maximumScale:1` on viewport.
- **iOS safe area insets**: ProShell main content uses `pt-[env(safe-area-inset-top)]` so content clears the status bar in standalone mode. Bottom tab bar uses `pb-[env(safe-area-inset-bottom)]` so icons sit above the home indicator. Main content bottom padding grows to `calc(4rem + env(safe-area-inset-bottom))`.
- **Contact action buttons safe area**: `MobileContactActionsSheet` fixed bar changed from `bottom-16` to `bottom-[calc(4rem+env(safe-area-inset-bottom))]`. Both bottom sheets updated from `pb-10` to `calc(2.5rem+env(safe-area-inset-bottom))`.
- **CSS touch refinements**: `-webkit-tap-highlight-color: transparent` added globally (removes gray tap flash). `.pro-shell { overscroll-behavior: none }` prevents rubber-band bounce on dashboard.
- **Landing page mobile hero reorder**: Lead form column now uses `order-1 md:order-2` so the form appears first on mobile, above the logo and tagline, improving conversion for dockside users.
- **MOBILE-UX-STANDARDS.md**: Persistent UX protocol file at project root covering viewport rules, touch targets, dashboard patterns, landing page patterns, PWA caching rules, and a regression checklist. Referenced in CLAUDE.md so it is enforced every session.
- **Correspondence section on contact page**: New dedicated card on contact profile for calls and texts, extracted from Activity Timeline. Shows phone/message icon, Inbound/Outbound/Missed/Voicemail direction badge, duration or SMS body, and recording playback link. Activity Timeline now excludes call/sms events (only system and lifecycle events remain).
- **Company field removed**: Company line removed from ContactDetailsCard on contact profile page.
- **Sync Quo button**: Per-contact Quo history sync added to desktop action bar and mobile More sheet. Calls `fetchCallsByPhone` and `fetchMessagesByPhone` on the OpenPhone API (new functions in `lib/openphone.ts`), deduplicates by `quo_call_id`/`quo_message_id`, and inserts any missing records with their original timestamps. Backfills correspondence missed while the webhook was down.

### May 24 | Remove Log Call button CRM-wide | CRM

- **Log Call removed**: Log Call button and sheet removed from contact detail page (desktop) and mobile bottom-sheet actions. Associated state, handler, and `logManualCall` import cleaned up from `MobileContactActionsSheet`. `LogCallModal.tsx` is now unused. Calls from Quo appear automatically via webhook.

### May 26 | Hero water photo, Quo webhook fixes, Lead buttons, team card order | Landing,CRM

- **Hero water photo**: Replaced white background with `water-hero.jpg` full-bleed photo behind the particle effect. White wash removed. Logo switched to white PNG, all hero text lightened to white/white-with-opacity. Waves at bottom removed.
- **AntigravityBackground transparent**: Scene background set to `null` so the water hero photo shows through the particle canvas.
- **Quo webhook payload fix**: OpenPhone wraps events under a top-level `object` key in some payloads and at the root in others. Handler now correctly unwraps both shapes, was silently dropping every event since launch.
- **Quo webhook signature fix**: Signature header parser now splits on the first `=` only, preventing digest truncation when the hex value contains `=`. Added null guard for missing signature header.
- **Trigger search_path fix**: `ALTER FUNCTION ... SET search_path = ''` from the May 24 security hardening broke the `update_contact_last_contact` trigger (referenced `contacts` without schema prefix). Rewrote as `CREATE OR REPLACE` with `public.contacts`, all timeline inserts were failing since May 24.
- **Quo webhook array phone fix**: `extractPhone()` helper added to handle OpenPhone sending `from`/`to` as either a string or array depending on event type.
- **Calls page limit**: Raised from 200 to 500 rows.
- **Create Lead button**: Unknown-number rows on the Calls page now show an inline "Lead" button. Clicking it creates a lead from the caller's number if one does not already exist. Button shows "Added" once created or if number is already a lead.
- **New Lead button**: Leads page header now has a "+ New Lead" button. Opens a modal to manually create a lead from a phone number with an optional name field.
- **Team card order**: Ian now appears as the left card and Alexander as the right card on the About page, matching their photo positions. Initials avatar boxes removed since the team photo is present.
- **About photo aspect ratio**: Team photo changed from 4:3 to 16:9, crop anchor changed to `object-center`.

### May 24 | About page photo polish | Landing

- **Team card initials removed**: "I" and "A" avatar boxes removed from Ian and Alex member cards now that the photo is present.
- **Photo aspect ratio**: About page team photo changed from 4:3 to 16:9 to reduce height; crop anchor changed from `object-top` to `object-center`.
- **Team card order swapped**: Ian now appears as the left card and Alexander as the right card, matching their left-to-right positions in the photo.

### May 24 | Antigravity ambient particle background, About team photo | Landing

- **AntigravityBackground component**: Three.js GPU particle simulation on the home page hero, using Poisson disk sampling and simplex noise. Particles gently glimmer in navy, pewter, and silver with no cursor interaction.
- **Cursor interaction removed**: Raycaster, raycast plane, and pointer event listener stripped. Ring is parked permanently off-screen so particles rest in ambient state only.
- **Color palette**: Black, navy (#000080), pewter (#686a6c) replaced original Google-reference blue/red/yellow.
- **Particle tuning**: Base noise contribution tuned to 0.75 for subtle glimmer; resting particles are small and non-intrusive behind logo and text.
- **About page team photo**: Ian and Alex photo (`Ian&Alex.jpeg`) added above the team member cards on the About page, cropped 4:3 with `object-cover object-top`.

### May 23 | Caller notes, Quo direction fix, lead webhook threshold | CRM,Pro

- **phone_notes table**: new DB table keyed by E.164 phone number; one note per number, independent of leads and contacts. Notes survive lead deletion and reappear if the number calls again.
- **Caller Note card** on lead detail page: textarea pre-filled with any existing note for that number, Save button; only shown for leads with a phone number.
- **Leads list amber dot**: small amber dot next to lead name (desktop + mobile) when a phone note exists for that number. Single batch query, indexed on phone.
- **On conversion**: phone note is carried into the contact's Notes field automatically (both `convertLead` and `mergeLead`). If the contact already has notes, the phone note is appended with a `---` separator.
- **`savePhoneNote` server action** added to actions.ts; uses upsert on phone conflict key.
- **Quo webhook direction bug fixed**: OpenPhone sends `direction: "incoming"` not `"inbound"`. Normalized to inbound/outbound before comparing — fixes wrong number (own number) being stored as caller, and ensures leads are created correctly.
- **Webhook threshold raised to 20s**: unknown inbound answered calls now require >20s duration to create a lead (was 5s), filtering out more pocket dials and quick hangups. Missed calls are unaffected.

### May 23 | Pipeline rename, Vessels page, QB sync fixes, vessel data cleanup | CRM,Pro

- Renamed /pro/dashboard route to /pro/pipeline throughout: directory moved, middleware updated, all revalidatePath calls updated, sidebar logo link updated, nav labels updated
- Added /pro/vessels page: 4 summary metric cards (Total, Overdue, Due Soon, Healthy), sortable vessel list (worst service health first), desktop table and mobile card stack, links to contact profile
- Vessels page and pipeline cards now display vessel as "Year - Make/Model - Length" format; vessel nickname shown as subtitle
- Anchor icon added to Vessels in sidebar nav; Vessels added to mobile More drawer
- Fixed QB webhook: pipeline card now only moves to done/invoiced when invoice is fully paid (was incorrectly moving on unpaid invoice create/update); invoice paid/unpaid status auto-updates on timeline via Invoice.Update webhook
- Deleted 9 junk vessel records from DB (bare dashes, bare numbers, bare lengths like "24ft -", "60ft -", "30"); tightened QB vessel parse filter to reject these patterns on future syncs
- length_ft now stored as plain number string in DB (no ft suffix); 54 existing records cleaned; ft appended only at display time on vessels page and in QB custom fields

### May 23 | Mobile CRM audit, documents UX, Kanban and timeline fixes | CRM,Mobile,Pro

- Kanban cards now show phone or email when contact name is missing instead of hardcoded "Unknown"; fix applied at data layer in pipeline.ts so the fallback chain is name > phone > email > null
- Contact documents card: multi-file upload (select several files at once; uploads sequentially with "Uploading X of N" progress); list capped at 5 rows with internal scroll; "Open Drive" renamed to "Open Folder"
- Google Drive: all customer files now route to a single shared contact folder; adding a vessel no longer creates a separate asset-named folder (createAssetFolder replaced with getOrCreateContactFolder which deduplicates by name)
- Activity timeline: Payment Received events hidden; only invoices (Paid/Unpaid) and other event types shown
- Mobile CRM audit: added viewport export with viewport-fit=cover for notched iPhones; global CSS forces 16px on all inputs/textareas/selects on mobile (fixes iOS auto-zoom); all modals converted to bottom-sheet pattern (LogCallModal, InvoiceDraftModal, ConvertButton, 3 CalendarClient modals); EditableField pencil icon always visible on mobile (was hover-only); Save/Cancel buttons and ContactDetailsCard edit controls have 44px minimum tap targets

### May 20 | Create Contact, hero background, Kanban cleanup | CRM,Landing,Pro

- Added Create Contact button to the contacts page header: opens a modal with Name, Email, Phone, Address, Type (Customer/Vendor), and Waiver fields; Company field only shown for vendors; redirects to new contact detail page on save
- `createContact` server action added to actions.ts; sets source: "manual", revalidates /pro/contacts
- Contacts page SearchBar is now full-width on mobile; New Contact button stretches full-width on mobile and the modal is a bottom sheet on small screens
- Hero background updated: navy dot grid (hero-grid) with radial fade mask + two-layer animated SVG sine wave at the bottom edge scrolling at different speeds
- Removed "Needs Attention" column from Kanban board; PipelineStage type and STAGE_LABELS entry kept for DB compatibility; health warning triangle on cards is unaffected (flag-driven)

### May 20 | Dialpad removed, full migration to Quo | CRM,Integrations

- Removed all Dialpad API integration: auth routes, webhook handler, probe endpoint, CSV export, and 7 server actions (syncDialpadCallsForContact, syncDialpadContacts, importDialpadContacts, registerDialpadWebhook, pushCrmToDialpad, promoteDialpadLocalToCompany, createContactFromDialpad)
- Renamed OpenPhone to Quo throughout the UI: integrations page, sync panel, calls page subtitle, source badge on leads
- OpenPhone server actions renamed: importOpenPhoneContacts, createContactFromOpenPhone, pushCrmToOpenPhone now use Quo naming
- SyncCallsButton removed: calls now arrive automatically via Quo webhook, no manual per-contact sync needed
- Contact detail mobile action sheet redesigned: Log Call and Pipeline buttons in a spacious 2-button grid; pipeline stage picker is a full slide-up sheet instead of a clipped dropdown; QB and Delete moved to a More sheet

### May 20 | Contact detail mobile action strip redesign | CRM,Mobile

- Replaced horizontal-scroll action strip on contact detail with a proper bottom sheet system
- Primary bar: Log Call (navy) + Pipeline button in a 2-column grid with 48px tap targets
- Log Call opens a slide-up sheet with direction toggle and notes field
- Pipeline opens a full slide-up sheet listing all 6 stages with large tap targets; current stage highlighted
- More sheet contains View QB / Sync to QB and Delete with confirmation
- Vendor contacts show Log Call + More only (no pipeline)

### May 20 | Pro portal mobile overhaul | CRM,Pro,Mobile

- Replaced fixed top nav bar with a native-style bottom tab bar (Dashboard, Leads, Contacts, Calls, More) for one-thumb field navigation
- More drawer slides up with Calendar, Integrations, Site Editor, and Release Notes links; auto-closes on navigation
- Contacts and Leads list pages: tables replaced with tap-friendly card rows on mobile (name, email, phone, status badge, vessel); tables remain on desktop
- Contact detail: action buttons (Log Call, Sync Calls, Add to Pipeline, View QB, Delete) moved to a scrollable sticky strip pinned above the bottom nav on mobile
- Lead detail: Call, Email, Add to Pipeline, Convert, and Delete actions in a scrollable sticky strip on mobile; back link updated to go to Leads instead of Dashboard
- Padding tightened to `px-4 md:px-8` across all /pro pages for proper mobile viewport fit
- Touch targets and font sizes bumped across all list and detail views

### May 20 | Pro dashboard performance audit and optimization | CRM,Pro

- Neumorphism reskin applied to all /pro routes: warm gray surface (#F1F2F5), soft extruded card shadows, compact density, dark sidebar unchanged
- runIntegrityCheck: replaced N+1 loop with single batch timeline_events fetch and pMap(10) concurrent updates; was 200+ sequential queries for 100 contacts
- syncDialpadContacts: replaced nested phone-lookup loop with single .in() batch query and pMap(10) concurrent updates; was 1000+ queries for 500 contacts
- checkDuplicateContact: email and phone lookups now run in parallel with Promise.all
- getPipelineBoard: removed redundant third leads query; 3 queries reduced to 2
- QB webhook: returns 200 immediately, processes entities async to prevent QB retries
- QB customer handler: vessel inserts batched into single call instead of per-vessel loop
- PipelineColumn wrapped with React.memo to skip re-renders on unchanged columns during drag
- Added Supabase migration with indexes on contacts(phone, email, qb_customer_id, pipeline_stage, contact_type), timeline_events(contact_id+event_type, created_at), vessels(owner_id), leads(status, email)

### May 19 | Real-time QB and OpenPhone webhooks, rate limit fixes, ghost vessel cleanup | CRM,Integrations

- QB webhook now handles Customer.Create/Update (links contact, fills missing fields, syncs vessel notes) and Invoice/SalesReceipt/CreditMemo Create/Update (upserts timeline events, moves pipeline stage)
- OpenPhone webhook now handles contact.created/contact.updated (fills missing name, phone, email, company on matched CRM contact)
- Dialpad and OpenPhone push concurrency lowered to 3; both clients retry on rate limit with exponential backoff
- Dialpad retries on HTTP 400 with rate_limit body (not standard 429); OpenPhone retries on 429
- Ghost vessel purge runs before each Sync All to prevent stale data entering QB notes sync
- Removed Clean QB Notes button (ghost bug is fixed; purge handles cleanup automatically)

### May 19 | Swap lead email notifications from Gmail/nodemailer to Resend | CRM,Integrations

- Replaced nodemailer + Gmail app password with Resend SDK for lead notification emails
- From address updated to crm@northwakemarine.com (verified domain)
- GMAIL_USER and GMAIL_APP_PASSWORD removed from Vercel; RESEND_API_KEY added
- Errors now surface as thrown exceptions (caught by fire-and-forget handler in actions.ts) instead of silently dropping

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
