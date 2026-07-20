# NorthWake Platform Changelog

## July 2026

### July 20 | Site Editor carousel upload fixes | Site,Infrastructure

- **Production Supabase env vars restored**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` had been cleared to empty strings in Vercel's production environment, breaking every carousel upload (and any other Supabase call reading these at runtime). Values restored from Supabase's API Keys page; the URL was also corrected to the bare project URL (a `/rest/v1/` suffix had been pasted in by mistake).
- **Upload spinner no longer hangs forever on failure**: `CarouselManager`'s upload handler had no error handling, so any failed request (bad response, network drop) left the "Uploading…" spinner stuck indefinitely with no feedback. It now always clears and shows a visible error message per failed file.
- **Large photos no longer fail with 413**: carousel uploads were routed through a Next.js API route, which Vercel caps at ~4.5MB per request, so full-resolution phone photos were rejected. Uploads now go directly from the browser to Supabase Storage via a signed upload URL, with the API route only handling the small JSON request to get the URL and record the image afterward.

### July 20 | Technical SEO and AI-discoverability audit fixes | SEO,Site

- **Fixed sitewide title-doubling bug**: the layout's title template was silently appending "| NorthWake Marine" a second time on nearly every page (About, Services, Contact, Socials, and every service/location/airport detail page), because each page's own title string already included the company name. All page titles now embed the brand exactly once.
- **Deleted conflicting robots.txt**: a stale static `public/robots.txt` (wrong domain, dead `/admin`/`/dashboard` rules) was competing with the correct dynamic `robots.ts` route. The dynamic, config-driven version is now the only source.
- **Trimmed oversized meta titles and descriptions**: home, services, locations, and airports pages had titles/descriptions running 80-250 characters, well past Google's truncation point. All trimmed to SERP-safe lengths.
- **Unique meta descriptions for 13 services**: services without a hand-written description were falling back to an identical generic sentence. Each now has unique, factual copy.
- **BreadcrumbList schema added** to location and airport detail pages, matching the pattern services pages already had.
- **New /locations and /airports hub pages**: previously these were "orphan" pages reachable only via sitemap, with no on-site links. Both now have an index page linked from the footer, plus an Airports column added to the services page coverage list.
- **Per-service FAQ content and FAQPage schema** added to every service detail page (previously only the Contact page had FAQ content).
- **Custom branded 404 page** replacing the bare Next.js default.
- **Homepage logo alt text and intro copy fixed**: alt text was stuffing the entire meta description into an image tag; a redundant duplicate sentence in the hero intro was removed.

### July 20 | Aviation location pages and homepage/services redesign | Site

- **Airport-specific landing pages**: added 7 NE Florida airports (Fernandina Beach to St. Augustine/Palm Coast) with dedicated `/airports/[slug]` pages for aircraft detailing, mirroring the existing yacht `/locations/[slug]` pattern.
- **Homepage services section redesigned**: flat service grid replaced with expandable Yacht / Aviation / RV & Auto category boxes.
- **Services page redesigned**: same category-box pattern applied to the full 21-service catalog; the long marinas/waterways/communities list is now collapsed behind a "View Full Coverage List" toggle.
- **Homepage hero and testimonials copy refresh**: hero tagline resized with a new services subline, trust bar removed, reviews truncate with a "Read more" toggle, testimonials heading updated.

### July 9 | Lead conversion note migration | CRM

- **Lead notes now transfer on conversion**: when a lead is converted to a contact, all timeline notes tied to that lead (by `lead_id`) are migrated to the new contact record. Previously, notes written on the lead profile were orphaned after conversion.
- **Orphaned note recovery by phone**: notes written before a lead record existed (logged via phone lookup with no `lead_id`) are matched by phone number and re-linked to the new contact on conversion.
- **Original inquiry preserved as timeline note**: the lead's initial message, service requested, and referral source are written as a permanent "Original inquiry" note on the contact timeline so the full context is always visible from the contact profile.

### July 7 | Not Qualified leads tab | CRM

- **"Not Qualified" replaces "Delete" on leads**: leads can no longer be permanently deleted. The action button now marks the lead `not_qualified` (reversible) instead of removing the row from the database.
- **Not Qualified tab with live count**: leads list now has two tabs: Active and Not Qualified. Each tab shows a live count badge. Disqualified leads are filtered out of the Active tab and displayed in Not Qualified.
- **Restore button**: each row in the Not Qualified tab has a "Restore" button that moves the lead back to active status. The lead detail page also shows a banner with a Restore link and hides the Convert and Add to Pipeline actions while a lead is not qualified.

### July 3 | Invoice claim list and Sync All fixes | CRM + Integrations

- **Sync All invoice URL fix**: QuickBooks "Sync All" was generating null invoice URLs for every imported invoice due to a camelCase/snake_case mismatch (`realmId` vs `realm_id`) when reading QB tokens. Fixed; all imported invoices now carry correct QB deep links.
- **Invoice claim list no longer drops QB-synced rows**: `getContactInvoices` was filtering out any invoice row that had no doc number and no invoice URL. Rows with a `qb_txn_id` are now always included, so invoices synced before the URL fix are visible and claimable.
- **Unnumbered invoices show date in title**: invoices without a QB DocNumber now display their transaction date in the title (e.g. "Maintenance Wash Jul 2") so they are identifiable in the claim list.

### July 2 | Drive uploads, waiver linking, and photo compression | CRM

- **Waiver PDF saved and linked in CRM**: signed waiver PDFs are now uploaded to the customer's Google Drive folder immediately on submission. The CRM Documents section shows an "Open" button linking directly to the PDF. Previously the upload result was discarded.
- **Waiver no longer overwrites contact name or email**: if a customer types a name or email that differs from what is already in the CRM, the existing values are kept. Only blank fields are patched. Address and waiver status always update.
- **iPhone photo compression**: large photos (5-10 MB) are compressed client-side using the Canvas API before upload, keeping all files under 1 MB. This resolves the 413 "Request Entity Too Large" error that was causing iPhone uploads to fail silently with a JSON parse error.
- **Open Folder button visible after first upload**: the Drive folder link now appears immediately once the first file is uploaded, without requiring a page refresh.
- **Drive files accessible without a Google account**: all uploaded files and newly created customer folders are set to "anyone with the link can view." Employees can open documents from the CRM without being signed in to Google.

### July 20 | QuickBooks email validation fix | Integrations

- **Sync All no longer 400s on contacts with placeholder emails**: QB API rejects values like "NA" as invalid RFC 822 email addresses. `findOrCreateQbCustomer` and the inline contact-field QB update now validate the email matches a real address pattern before sending `PrimaryEmailAddr`. Contacts with bad email values are synced without an email field instead of failing.

### July 1 | Cron invoice DocNumber fix | CRM + Integrations

- **Cron invoices now show correct invoice numbers**: QB-generated invoices were appearing as "Invoice (Draft)" in the CRM because the QB API create response does not always echo back the DocNumber. Fixed by pre-assigning the next sequential DocNumber before the API call (safe since cron requests run one at a time) and using it as the stored value.

## June 2026

### June 24 | Monthly recurring invoice cron, calendar billing setup, and contact linking | CRM + Integrations

- **Maintenance invoice cron fixed** (`/api/maintenance-invoices`): cron was only generating 1 invoice instead of all recurring customers. Root cause: stored `gcal_event_id` was an instance ID (e.g. `abc123_20260601T...`) instead of the series base ID, so July instances never matched. Fixed by storing `event.recurringEventId ?? event.id` on all new links. Added `linkByExtractedBase` fallback map using regex to match legacy stored instance IDs against new recurring instances.
- **Debug mode added to cron** (`?debug=1`): returns a full breakdown of all auto-invoice links, GCal events in the target month window, match type (exact / recurringId / extractedBase / none), and matched contact name per event. Used to diagnose the 30-link/22-match discrepancy.
- **QuickBooks invoice product lookup fixed**: `findQbItem` was called with the full formatted description string ("Maintenance Wash - Vessel Name - July 14, 2026") which never matched a QB product. Now passes `itemName: link.serviceLabel` (e.g. "Maintenance Wash") separately so the correct product/service is selected.
- **QuickBooks invoice description fixed**: CRM template checklist was being used as the invoice line description. Now uses the QB item's own description field, with the CRM formatted label as the fallback.
- **Duplicate invoice guard**: cron checks `timeline_events` for existing `gcal_event_id` in metadata before creating; skips any event already invoiced to prevent double-billing on re-runs.
- **`createServiceEvent` action fixed** (New+ global button recurring service flow): removed `event_type` from `calendar_contact_links` insert (column does not exist, was causing silent failure). Changed `billing_frequency` from RRULE string to `"monthly"` (satisfies check constraint). Added error surfacing so billing link failures now return an error instead of silently closing the modal.
- **Calendar store series base ID on link and invoice forms**: `CalendarClient` now stores `event.recurringEventId ?? event.id` when linking or invoicing from the event detail panel, so all future recurring instances match correctly.
- **Billing setup from event detail panel**: linked events now show a "Set Up Billing" button (or "Edit" if already configured). Billing form supports template, qty, rate, discount, and auto-invoice toggle. Saves via `linkCalendarEvent` upsert.
- **New+ service form includes contact link and billing**: the "Recurring Service" and "One-Time Invoice" flows in the New+ modal now link the created GCal event to the selected contact and persist billing details in `calendar_contact_links` in the same action.
- **Service Label field removed everywhere**: the visible "Service Label" input was removed from the billing form in `LinkedPanel`, the `EventModal`, and `NewPlusModal`. The template name is used automatically as the service label via hidden input.
- **Calendar event window extended**: now fetches from July 1, 2025 (fixed start) through 18 months ahead (rolling), so full history and future recurring series are always visible.
- **CRON_SECRET**: new secret `nwm-cron-2026` set in Vercel for protected cron endpoint access.

### June 23 | Lead source selection and converted lead filtering | CRM

- **Lead source dropdown on New Lead modal**: "New Lead" button now includes a Lead Source selector (Quo, Google, Meta, Website). Selected value is saved to the `source` column on insert. Previously hardcoded to "website".
- **Inline source editor on lead detail page**: Lead Source card in the right panel now has an "Edit Source" link. Clicking it reveals a dropdown with all source types. Saving updates the DB and refreshes the page so the badge reflects the change immediately.
- **Converted leads hidden from leads list**: `/pro/leads` now filters out rows where `status = "converted"`. Converted contacts continue to appear under Contacts.
- **sourceConfig expanded**: `"meta"` and `"google"` source keys added to both the leads list badge config and the lead detail page config. Previously unknown source values fell back silently to "Website Form".

### June 23 | Crew tab bar, calendar color picker, invite flow, and waiver PDF | CRM

- **Waiver PDF download**: after a customer submits the liability waiver, the success screen now shows a "Download Your Copy (PDF)" button. POSTs to new `/api/waiver-pdf` endpoint which generates the same PDF the CRM receives and returns it as an attachment download.
- **Employee invite set-password flow**: clicking "Accept Invite" in the invite email now lands on `/pro/set-password` instead of the login page. New page parses the Supabase implicit-flow hash tokens from the URL, calls `setSession()` directly (no timing dependency), then lets the user set their password. Routes to `/pro/pipeline` (admin) or `/pro/contacts` (crew) on success. Shows a "Link Expired" error screen if tokens are absent or invalid.
- **Invite emails via Resend**: `inviteTeamMember` now uses `supabase.auth.admin.generateLink({ type: "invite" })` + `sendTeamInviteEmail` via Resend instead of `inviteUserByEmail`. Bypasses Supabase's mailer rate limits. From: `info@northwakemarine.com`.
- **Delete and Resend Invite on settings page**: team members table on `/pro/settings` now has an Actions column. Admins can delete any member (with confirm dialog; cannot remove themselves). Unconfirmed members show a "Pending" amber badge and a "Resend Invite" button that turns to "Sent" after clicking.
- **Crew calendar color filter**: field crew only see events in three color groups: Recurring Work (Blueberry, colorId 9), One Off Work (Lavender, colorId 1), and Time Block (Grape, colorId 3). Filter checks `event.colorId` and falls back to `linkMap` colorId for linked events. Admin sees all events unfiltered.
- **Event type color picker**: admin new/edit event modal now has a visual dropdown replacing the hidden `color_id` input. Each option shows a colored dot and event type label. 9 types: Recurring Work, One Off Work, Time Block, Sales, Boat Shows, Other Events, Service Outreach, Reminders, Payment Date. New events default to Recurring Work. Events created in the CRM now appear in the correct Google Calendar color group.
- **Admin mobile tab bar fix**: Calendar was dropped off the tab bar when too many tabs were present. Pinned tabs are now Pipeline (admin), Calendar (admin + crew), Contacts (admin + crew). Everything else (Leads, Calls, Vessels, Services, Integrations, Site Editor, Settings, Release Notes) moves to the More drawer.
- **Crew tab bar (no More button)**: crew's mobile tab bar shows exactly 3 pinned tabs: Calendar, Contacts, Vessels. More button is hidden for crew since there is nothing in their drawer.

### June 23 | Outboard service copy restricted to Yamaha-only | Marketing

- **Tagline**: removed "All Brands Welcome." — now reads "Yamaha Certified." only.
- **Description**: updated to reference "your Yamaha outboard" and removed "all outboard brands" tail.
- **Schema description**: updated from "for all outboard brands" to "for Yamaha outboards."

### June 21 | Meta Lead Ads integration | Integrations

- **Meta Lead Ads webhook** (`POST /api/webhooks/meta-leads`): receives leadgen notifications from Meta, fetches lead data from Graph API using Page Access Token, inserts into `leads` table tagged `source: meta_ads`, and mirrors to contacts + OpenPhone via `ingestContact`. Signature-verified via `X-Hub-Signature-256` using `META_APP_SECRET`. GET handler responds to Meta's verification handshake using `META_VERIFY_TOKEN`.
- **Zapier fallback endpoint** (`POST /api/webhooks/meta-leads-zapier`): alternate endpoint accepting Zapier's flat JSON format if the direct Meta webhook path is not used. Secured via `?secret=ZAPIER_WEBHOOK_SECRET` query param.
- **Env vars added**: `META_VERIFY_TOKEN`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN` (permanent system user token). Meta app ID: `1502991310922795`.
- **Setup**: Meta Business App "NorthWake Marine CRM" created; Page webhook configured for `leadgen` field; system user token generated for non-expiring page access. App must be switched to Live mode to receive production leads (currently Development).

### June 21 | Aero, RV, and automotive detailing services | Marketing + SEO

- **3 new services** added to `clientConfig.services` under new "Aero & Vehicle" tier, positioned at slots 2-4 (after Yacht Management, before marine services):
  - **Aircraft Detailing** (`/services/aero-detailing`) — badge: Featured. Hangar-side service for piston singles, turboprops, and business jets. Targets Craig Airport (KCRG), Jacksonville Executive, and Cecil Field.
  - **RV Detailing** (`/services/rv-detailing`) — Class A/B/C motorhomes, fifth wheels, travel trailers. Mobile, comes to site or storage facility.
  - **Automotive Detailing** (`/services/automotive-detailing`) — full-service car, truck, and SUV detailing including paint correction and ceramic coating. Mobile.
- **SEO keywords expanded**: 16 new terms added including "aircraft detailing Jacksonville FL", "aviation detailing Jacksonville", "private jet detailing Jacksonville FL", "turboprop detailing Jacksonville", "hangar detailing Jacksonville", "RV detailing Jacksonville FL", "motorhome detailing Jacksonville", "auto detailing Jacksonville FL", "mobile auto detailing Jacksonville", "paint correction Jacksonville FL".
- **Custom meta descriptions** written for all 3 new service detail pages, targeting specific airports (Craig, Jacksonville Executive, Cecil) and asset types.
- **Home page services grid**: updated from `slice(0, 6)` to a curated 9-service filter showing 6 marine + 3 new aero/vehicle services. Heading changed from "Marine Services Built for Perfection" to "Services Built for Perfection".
- **About page**: metadata description and JSON-LD updated to include "aircraft, and vehicle care"; body paragraph updated to mention "marine vessels, aircraft, RVs, and automotive".
- **Asset type selectors**: "Aircraft", "Motorhome / RV", "Automobile / Truck" added to `clientConfig.assetTypes` (auto-populates QuoteForm) and hardcoded into HeroQuoteForm vessel type dropdown.
- **Both quote forms**: Aircraft Detailing, RV Detailing, Automotive Detailing added to service dropdown options.
- **Sitemap**: `lastModified` bumped to `2026-06-21`; 3 new service URLs auto-included.

### June 21 | Fix invite email linking to localhost | CRM

- **Supabase invite link fix**: `inviteTeamMember` now passes `redirectTo: ${NEXT_PUBLIC_SITE_URL}/pro/settings` to `inviteUserByEmail`. Previously the link in the email pointed to `localhost:3000` because Supabase fell back to the project's Site URL setting. The code-side fix is live; Supabase dashboard Site URL also needs to be set to the production domain under Authentication > URL Configuration.

### June 21 | Dedicated service sub-pages and SEO improvements | Marketing + SEO

- **19 new service detail pages** at `/services/[slug]` (statically generated): one page per service in the catalog. Each page has a unique H1 targeting `{Service} in Jacksonville, FL`, service-specific meta description, JSON-LD Service schema, breadcrumb schema, full description + includes section, Why NorthWake section, related services grid, and contact CTA.
- **Custom meta descriptions** written for high-value queries: marine-transport targets "boat transport Jacksonville FL," "yacht transport," "sailboat shipping," "boat haul"; outboard-engine-service and outboard-diagnostics target "boat mechanic Jacksonville FL" and "mercruiser mechanic near me"; maintenance-wash targets salt removal and boat wash queries.
- **Sitemap updated**: all `lastModified` dates corrected (was stuck at 2025-05-01); all 19 service pages added to sitemap at priority 0.9.
- **seoTitle and seoKeywords expanded**: title now mentions boat detailing, engine service, and vessel management; keywords expanded from 12 to 21 terms including "boat transport Jacksonville FL," "marine transport Jacksonville," "yacht transport Jacksonville," "salt removal boat wash," and "hull cleaning Jacksonville."
- **Services page cards updated**: each card now has a "Learn More" link pointing to the service detail page alongside the "Request Service" button, improving internal link signals to the new pages.
- **Indexing issues reviewed**: 8 "Page with redirect" entries are all legitimate redirect chains (www, http, .html) handled by next.config.ts — no code changes needed. 4 canonical URLs are `/contact?service=...` query params correctly pointing to /contact. 1 robots.txt block is intentional (/pro). 2 x 404s: /contact-us.html already has redirect in config (self-resolves); font file hash is an old Next.js build artifact (self-resolves).

### June 20 | Role-based access control and field crew permissions | CRM

- **Settings page** (`/pro/settings`): admin-only page listing all team members with inline role selectors. Supports two roles: Admin (full access) and Field Crew (contacts, calendar, vessels only).
- **Invite flow**: invite form sends a Supabase magic link and sets the role immediately. Role is stored in `app_metadata.role` (service-role-only write, tamper-proof).
- **Middleware enforcement**: crew users are redirected to `/pro/contacts` on login and blocked from pipeline, integrations, editor, settings, and all other admin-only routes.
- **Role-aware sidebar**: nav items in ProShell are filtered by role. Crew sees only Contacts, Calendar, and Vessels tabs. Admin sees everything including a new Settings gear item.
- **Dollar amounts hidden from Field Crew**: across all three CRM surfaces, crew users see no dollar figures.
  - Calendar event modal: "Create Invoice", "Claim to Invoice", and "Unlink" buttons hidden; auto-invoice status shows "Auto-invoice ON" without the amount.
  - Vessel detail page: Typical Price fields and monthly recurring service net amounts hidden.
  - Contact fleet panel: Typical Price fields, recurring service amounts, and "Create Invoice" button hidden.
- Role defaults to admin so existing users are unaffected until a role is explicitly assigned.

### June 20 | Outboard engine services added to landing site | Marketing + SEO

- **Homepage**: replaced "Captain and Crew Services" card with new "Outboard Engine Service" card (Yamaha Certified, All Brands Welcome). Captain and Crew card moved to services catalog only.
- **Services page**: two new mechanical service categories added: "Outboard Engine Service" (100/300-hr, oil changes, gear lube, spark plugs, fuel filter, impeller) and "Outboard Diagnostics and Repair" (troubleshooting all brands). Both flow from `client.ts` config and propagate to all 21 location pages and JSON-LD automatically.
- **About page**: "Continuous Certification" value card updated to call out Yamaha-certified outboard mechanic on staff.
- **SEO expanded**: `seoDescription` updated to include Yamaha-certified outboard service; `seoKeywords` expanded to 12 terms including "boat mechanic Jacksonville FL", "outboard engine service Jacksonville", "Yamaha outboard service Jacksonville", and "marine engine repair Jacksonville FL".
- **`public/llms.txt`**: new AI crawler reference file with Mechanical Services section, full 21-location service area list, and certifications (Yamaha-certified mechanic, USCG-licensed captains) so ChatGPT, Perplexity, and Claude surface NorthWake for boat mechanic queries.

### June 20 | Manual-only lead creation from Quo calls and texts | CRM

- **Quo calls and SMS no longer auto-create leads**: inbound calls and qualifying texts from unknown numbers no longer generate a Kanban card automatically. The `createQuoLead` function and its `TOLL_FREE_PREFIXES` constant are removed from the webhook. All communication is still logged to `timeline_events` with the phone in `metadata.caller_number` / `metadata.from_number` so nothing is lost.
- **History populates on manual lead creation**: when you use the "Add Lead" button and enter a phone number, `createLeadFromCall` now runs two update queries after inserting the lead, linking any orphaned `timeline_events` (where `lead_id IS NULL AND contact_id IS NULL`) that match that number via `caller_number` or `from_number`. The full call and chat history is already in the timeline the moment you save.
- Known contacts are unaffected: calls and texts from numbers already in CRM Contacts continue to resolve to `contact_id` as before.

### June 20 | Lead Activity de-duplication | CRM

- **Call/SMS no longer appear in Activity**: the Activity section on lead detail pages was showing all timeline events including calls and texts, which were already visible in Call Details. Activity now filters out `call` and `sms` event types so each section shows only its own data. No DB changes needed; the data was never duplicated, just rendered twice.
- **Activity filter hardened with title pattern fallback**: some older events in the DB had an unexpected `event_type` value (not `"call"` or `"sms"`) while still carrying titles like "Inbound SMS" or "Outbound SMS". Activity now also excludes events whose title matches `^(inbound|outbound) (call|sms|voicemail)` or `^missed call`, so they are suppressed regardless of what is stored in `event_type`.

### June 20 | Vessel detail page, calendar fixes, Quo improvements | CRM

- **Vessel detail page** (`/pro/vessels/[id]`): clicking a vessel row now opens a dedicated page showing specs, editable service schedule (Mark Done, Edit, Add, Remove), recurring calendar services with Remove, and upcoming/past appointments grouped in an accordion.
- **Recurring service pricing corrected**: vessel detail page now computes gross as `rate * qty` (same formula as the calendar panel) instead of flat `invoice_amount`, so per-foot pricing (e.g. $5.50/ft * 30ft = $165 gross, $15 discount = $150 net) displays correctly everywhere.
- **Stale calendar links pruned on Sync All**: `GET /api/calendar-sync` now checks all `calendar_contact_links` rows against Google Calendar and deletes any whose events have been deleted. Previously stale links were only pruned when the vessel detail page loaded.
- **Service reminder leads cron** (`GET /api/service-reminder-leads`, Monday 9am): creates a `service_reminder` lead for any vessel service that is overdue by its interval. Lead detail page shows an orange "Service Due" banner. Skips numbers that already have an open reminder for that service.
- **QB Create Invoice opens QuickBooks directly**: the "Create Invoice" button on a calendar event modal now opens `https://app.qbo.intuit.com/app/invoice?customerId={id}` in a new tab with the customer pre-selected, instead of showing an in-app form. Falls back to the manual form if the contact has no linked QB customer ID.
- **OpenPhone keypad pre-fill fixed**: all `openphone://call?number=` links now wrap the phone number in `encodeURIComponent` so the `+` prefix is not silently dropped, fixing keypad pre-fill in Quo across leads list, lead detail, contacts list, contact detail card, and linked contacts.
- **Outbound SMS always logged**: `handleOutboundSms` in the Quo webhook now logs the timeline event even when no CRM contact is found (`contact_id: null`). Lead detail pages pull outbound SMS by `to_number` so they appear in call details regardless.
- **Vendor/Other contacts no longer create new leads**: `createQuoLead` now checks for a matching CRM contact before creating a lead. `handleContactUpsert` creates missing CRM contacts from Quo data (with name-based dedup fallback) so future calls/texts resolve to a contact instead of generating phantom leads.
- **Marketing opt-in SMS filtered**: inbound messages matching opt-in/opt-out boilerplate (Fundbox, National Funding, STOP/HELP compliance) are silently dropped by the Quo webhook and never create leads.
- **Vessels page server error fixed**: the `<tr onClick>` handler on the vessels list was in a Server Component, crashing at runtime. Replaced with `<Link>` wrappers on each cell so the full row is clickable without client-side JS.
- **Auto-cleanup of stale recurring links**: `getVesselRecurringLinks` calls `detectCalendarDiscrepancies` on load and auto-deletes any links whose Google Calendar series has been deleted, so the fleet panel stays clean without manual intervention.

### June 19 | Auto-sync leads to Quo as contacts | CRM + Integrations

- **Lead intake pushes to OpenPhone**: `ingestContact()` now creates an OpenPhone contact (role: "Lead") whenever a brand-new contact is created from a website form or Google Ads submission. The OpenPhone contact ID is stored on the contact record so future updates can reference it.
- **Google Ads leads mirror to contacts**: the Google Ads webhook previously only wrote to the `leads` table. It now also calls `ingestContact()` fire-and-forget, so Google Ads leads appear in Contacts and push to OpenPhone just like website form leads.
- **Conversion retagging**: `convertLead()` and `mergeLead()` both fire a background update to OpenPhone on conversion. The contact is retagged `role: "Customer"` and vessel type/length are written to the OpenPhone company field (e.g., "MasterCraft X24"), so the contact is findable by vessel in Quo.
- **CRM call buttons open Quo**: all `tel:` links inside the pro CRM (leads list, lead detail, contacts list, contact detail card, linked contacts) now use `openphone://call?number=` so clicking "Call" opens the Quo desktop/mobile app directly instead of the system dialer. Public landing pages keep `tel:`.

### June 17 | Other contacts tab with label tagging | CRM

- **New "Other" tab** on the Contacts page for misc contacts (interviewees, references, contractors, etc.) that should not appear in Customers or sync to QuickBooks.
- **Label field**: Other contacts use `company_name` as a freeform label (shown as a purple badge in the table and on mobile cards). Create modal shows a "Label" field with placeholder examples when type is set to Other.
- **QB isolation**: `createContact` skips the QuickBooks push for `contact_type = "other"`. Any contact reclassified to "other" via the Type dropdown on their detail page automatically inactivates and unlinks the QB customer profile in the background.
- **Type badge**: detail page now shows a purple "other" badge and the type dropdown includes Other as a selectable option.
- **LeadNotesSection ref fix**: refs (`prevSuccessRef`, `textareaRef`) were being accessed during render, which Next.js 15 ESLint now treats as a build error. Moved into a `useEffect` keyed on `state`.

### June 17 | Lead notes timeline | CRM

- **Caller Note replaced**: the single-field "Caller Note" box on lead detail pages is gone. In its place is a full multi-note section backed by `timeline_events` (same system contacts use).
- **DB migration** (`20260617_lead_timeline_notes.sql`): adds `lead_id uuid references leads(id) on delete set null` to `timeline_events`, plus indexes on `lead_id` and `metadata->>'lead_phone'` for orphan recovery.
- **Instant feedback**: new notes appear in the list immediately on save (action returns the created row; component appends it to local state). No page reload needed.
- **Edit and delete inline**: notes support in-place editing and one-step delete confirmation, same as the contact timeline.
- **Conversion carry-over**: `convertLead` and `mergeLead` both reassign lead notes (`lead_id → contact_id`) before writing the "Converted to client" event, so notes move seamlessly to the client profile.
- **Phone re-match**: `addLeadNote` stores `lead_phone`/`lead_email` in note metadata. If a lead is deleted (setting `lead_id = null` via cascade), its notes are recovered by phone number when a new lead comes in with the same number.
- **Pipeline card hierarchy**: vessel name moved below customer name and rendered smaller/lighter — customer name now reads first.

### June 17 | Stop established customers landing in New Leads | CRM

- **Root cause**: `runIntegrityCheck` (cron + Sync panel) overwrote a contact's `pipeline_stage` with `needs_attention` whenever it tripped a health flag, including `comms_gap` ("Unreturned Message") which fires on an inbound call/text with no reply. Because `needs_attention` is not in `STAGES` (no column), `groupByStage` dumped those cards into **New Leads**. So an existing customer who called/texted got yanked out of their real stage and surfaced as a new lead. This was also destructive: their prior stage (e.g. `paid`) was lost.
- **Fix (flag in place)**: `runIntegrityCheck` now writes `health_flags` only and never changes `pipeline_stage`. Flagged customers stay in their real column showing the amber warning icon (already rendered by `PipelineCard`). Nothing masquerades as a new lead and no pipeline position is lost.
- **One-time cleanup ran**: `POST /api/fix-needs-attention` re-derived a real stage for 3 stranded contacts (Jacob Leo, Bob Lenti, Tamara Slattery) from their QB timeline. `POST /api/backfill-phones` canonicalized 12 contact phones to E.164.
- **Phone matching hardened** (related, separate defect): known callers whose stored phone wasn't E.164 were missed by `findContactByPhone`, so Quo created duplicate "NEW LEAD + number" cards. Matching now falls back to a digit-suffix lookup and re-normalizes candidates, and the board dedup (`getPipelineBoard`) normalizes phones on both sides. New shared helper `src/lib/phone.ts`.
- **QB import default**: `createContactFromQb` now inserts `pipeline_stage: null` so a bulk QuickBooks import of established clients doesn't flood New Leads; they live in Contacts and are added to the board when there's real work.
- **Vendor reclassification**: `updateContactFields` now nulls `pipeline_stage` when `contact_type` changes to vendor/other, and calls `revalidatePath("/pro/pipeline")` so the board reflects the change without a manual reload.

### June 11 | Dark hero + web-services content moved to Propel OS site | Landing

- **Hero converted to dark mode**: water photo replaced with `bg-[#0a0a18]` + new `.dot-grid-dark` texture utility. `HeroAmbientGlow` now reads cleanly over the dark base. Form card swapped from `chrome-stage-glass` (white) to `chrome-stage` (dark) with a navy-tinted drop shadow.
- **Hero typography**: headline bumped from `text-xl/2xl/3xl` to `text-3xl/4xl/5xl` and subhead from `text-base/lg/xl` to `text-lg/xl/2xl` so the copy reads as prominent as the logo. City line bumped from `text-xs` to `text-sm`.
- **HeroQuoteForm rebuilt for dark mode**: inputs `bg-white/[0.04] border-white/15 text-white`, focus state highlights with `border-navy-light`, labels `text-white/65`, required asterisks `text-navy-light`, error states use red-300/400, select dropdown options match `bg-[#0a0a18]`.
- **Header glass refined**: `bg-obsidian/90 border-steel-dark` → `bg-[#0a0a18]/75 border-white/[0.07]` for a subtler propel-aligned glass feel.
- **Web Services page removed**: `/web-services` route, `WebServicesForm` component, `submitWebServicesInquiry` server action, and `webServicesSchema` deleted from this repo. Its content (pricing tiers, add-ons, comparison table, FAQ, multiple CTAs, deep dives) now lives on `/Users/ianwilliams/Desktop/propel-os-marketing/` because it pitches Propel OS, not marine services.
- **Header nav cleaned**: "Web Services" link removed from primary navigation. Lead-source mapping for legacy `web_services` source rows in `/pro/leads` left intact so historical data still renders.

### June 10 | Propel OS template forked from this repo | Platform

- Forked the current `northwake-platform` state into a new master template at `/Users/ianwilliams/Desktop/propel-os-template`, branded as **Propel OS**.
- Template is the basis for white-label client deployments. Per-tenant builds will fork from there, not from this repo.
- Renamed package to `propel-os-template`, wrote tenant-onboarding docs (`README.md`, `CLAUDE.md`, `TENANT_SETUP.md`), preserved this changelog as `LEGACY_CHANGELOG.md` for feature reference, cleaned PWA build artifacts, and committed initial state (`7c97913`).
- The older `/Users/ianwilliams/Desktop/platform-template` (May 11) is now deprecated; the new fork supersedes it with 30 days of platform improvements (PWA, pdf-lib, resend, expanded `clientConfig`, framer-motion micro-interactions, dossier timeline, status glows).
- **Follow-up milestone:** `vessel` → `asset` vocabulary rename for cross-vertical generality. Tracked in the template's own changelog and `TENANT_SETUP.md` under "Vocabulary".

### June 10 | Vibe-code Round 3b: CRM polish | CRM

- **ProShell sidebar accents** (`ProShell.tsx`): logo block (`#000080` 36px square) and user avatar (28px circle) both gain a subtle chrome inset ring (`inset 0 0 0 1px rgba(160,163,166,0.4)`) so they feel forged rather than flat. Logo block adds a navy glow on hover (`shadow-[0_0_14px_rgba(80,100,255,0.5)]`).
- **ProShell active nav glow**: active nav item gains a navy inner glow via inline `box-shadow: inset 0 0 22px rgba(80,100,255,0.18)` so the current page reads as lit-up rather than just tinted. The existing white left border stays.
- **Vessels page health glows** (`vessels/page.tsx`): flat color dots (`bg-red-500`, `bg-amber-400`, etc.) replaced with the round-1 `.status-glow-*` utilities — overdue cards pulse red, due-soon cards have an amber halo, healthy cards have an emerald halo. Added a new `.status-glow-slate` variant for `unknown` health states.
- **Bespoke empty states** (`vessels/page.tsx`, `calls/page.tsx`): "No vessels on file" gets the navy compass-style anchor glyph + uppercase chrome eyebrow. "No calls logged yet" gets the chrome phone glyph + matching treatment. Helper text softened to `text-slate-400/70`.

### June 10 | Vibe-code Round 3a: landing polish | Landing

- **Services grid micro-interactions** (`page.tsx`, `services/page.tsx`): chrome icons scale to 110% on card hover (`origin-left` so they grow away from the edge, not from center). Card titles tint to navy on hover. ▸ bullet arrows nudge `translate-x-0.5` to the right so each item feels actionable. The gap-px gray grid stays intact (no card-level scale that would break the divider lines).
- **About page values + team cards** (`about/page.tsx`): same chrome icon scale + navy title tint applied to both the Values grid and the Team member cards. Team role text softens to `text-gray-700` on hover.
- **ReviewsCarousel chrome watermark** (`ReviewsCarousel.tsx`): each testimonial card now carries a large serif chrome quote glyph (`"`) in the upper-right at 25% opacity, brightening to 45% on desktop hover. Card content sits above it via `z-10`. Author name brightens to pure white on hover for a subtle reveal.

### June 10 | Vibe-code Round 2: dossier timeline + refined empty states | CRM

- **Activity Timeline dossier feel** (`ActivityTimeline.tsx`): vertical rail switched from flat `bg-slate-100` to a new `.dossier-rail` utility (chrome-tinted gradient: navy at top, steel in the middle, fading to transparent at the bottom). Event dots gained a 3px ring in the surface color so they sit above the rail like beads instead of being interrupted by the line.
- **Terminal eyebrow labels**: every event type label (`Note`, `Call`, `Invoice`, `Lead Created`, etc.) switched from `text-xs font-medium` to `text-[10px] tracking-[0.2em] uppercase font-semibold` for a command-terminal vibe.
- **Tabular timestamps**: all `fmtFull` timestamps now use `tabular-nums` (and bumped from `text-slate-300` to `text-slate-400`) so they align like a system log instead of drifting on proportional digits.
- **Bespoke timeline empty states**: "No activity yet" replaced with a chrome-tinted clock SVG + `AWAITING ACTIVITY` uppercase eyebrow. "No notes yet" replaced with a chrome document SVG + matching eyebrow treatment.
- **Contacts page empty state** (`contacts/page.tsx`): three bespoke variants — magnifier glyph for "No results for [term]", truck glyph for "No vendors yet", users glyph for "No customers yet", all chrome-tinted with uppercase tracking copy.
- **Leads page empty state** (`leads/page.tsx`): chrome inbox glyph + `AWAITING YOUR FIRST LEAD` eyebrow + softened helper copy + existing CTA preserved.

### June 10 | Vibe-code Round 1: pipeline motion + ambient hero glow | CRM + Landing

- **framer-motion added** (`^12.40.0`) with `transpilePackages: ["framer-motion"]` in `next.config.ts` so Next 15 static gen doesn't crash on the home page prerender. Used sparingly — only where a spring lift adds tactile feel.
- **Pipeline cards** (`PipelineCard.tsx`): wrapped in `motion.div` with a 420/28 spring (`whileHover: { y: -2, scale: 1.01 }`, `whileTap: { scale: 0.99 }`). Motion is suppressed while a card is being dragged so dnd-kit's transform isn't fought. Heat dots replaced with new `.status-glow-red/amber/emerald` utilities (soft blurred halo + center dot, slow pulse on red, reduce-motion fallback). Source tag (`New lead`, vessel name, `Returning · Overdue`) hoisted into a chrome eyebrow row above the contact name. The × button is now `opacity-0 group-hover:opacity-100` to reduce visual noise at rest.
- **Pipeline columns** (`PipelineColumn.tsx`): bespoke empty states — each stage gets its own inline SVG glyph (chrome-tinted via `chrome-text-dark`) above stage-specific copy ("Awaiting new leads", "All clear", "No jobs scheduled", etc.) instead of the generic "Drag cards here." Drop-zone state adds a `ring-1 ring-[#000080]/15` for clearer targeting. Count badge softens to 50% when stage is empty.
- **Drag overlay** (`PipelineBoard.tsx`): replaced `shadow-xl ring-1 ring-[#000080]/20` with a layered chrome-tinted shadow (`0 20px 40px rgba(0,0,80,0.35)` + inner navy ring + 24px blue glow) so dragged cards feel lifted off the board with a premium glow trail.
- **Hero ambient glow** (new `HeroAmbientGlow.tsx`): slow-drifting radial navy orb behind the hero copy (`mix-blend-screen`, 75vw, 50px blur, `ambient-drift` keyframes, 24s loop, reduce-motion respected). Sits between the water photo and the content grid for warm depth behind the headline.
- **Hero typography**: city/year tracking bumped from `0.45em` to `0.5em`. All hero copy switched from Tailwind's `drop-shadow` to a new `.hero-text-shadow` utility (`0 2px 12px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.35)`) for richer legibility over the water photo.
- **Hero quote form card**: swapped from `chrome-stage-light bg-white/95 backdrop-blur-md` to a new `.chrome-stage-glass` utility — same chrome border, but with `backdrop-blur: 14px`, a faint inset highlight at the top (`inset 0 1px 0 rgba(255,255,255,0.7)`), and a soft navy outer shadow (`0 8px 32px rgba(0,0,80,0.08)`). Feels weightier and more glass-like.
- **Hero desktop CTAs** (new `HeroDesktopNav.tsx`): "View Services" / "About Us" wrapped in `motion.div` with the same 420/28 spring for `whileHover: { scale: 1.03 }`, `whileTap: { scale: 0.97 }`. Client component so the server-rendered home page stays static.

### June 10 | Automated SMS appointment reminders | CRM

- **2-day SMS reminder cron**: New `/api/send-reminders` Vercel cron runs daily at 9am ET (14:00 UTC). Queries `calendar_contact_links` for recurring jobs (`recurrence_rule IS NOT NULL`), fetches Google Calendar events 2 days out, matches instances to series via `ev.id` or `ev.recurringEventId`, and texts the customer: "NorthWake Marine: [First Name], Sending out a reminder that we will be out on [Month Day] for your scheduled work. Thank You."
- **sendSMS helper in `lib/openphone.ts`**: Posts to OpenPhone `/messages` with the customer's E.164 phone. Auto-resolves the OpenPhone phoneNumberId from `QUO_PHONE_NUMBER` env var (set to the actual NorthWake number, e.g. `+19046065454`) by calling `/phone-numbers` and matching — caches the ID for the function lifetime.
- **Dedup via timeline_events**: Each send is logged as `event_type: "sms"`, `created_by: "cron"`, `metadata.reminder_gcal_event_id`. Cron skips any event ID already in that set, so re-runs are idempotent and customers never get double-texted.
- **Activity timeline visibility**: Sent reminders appear on the contact's CRM activity timeline with title "Appointment Reminder Sent" so there's a record of every text. Summary upserted to `system_flags` under `sms_reminders_YYYY-MM-DD`.

### June 4-6 | Pipeline vendor dedup, QB invoice reconcile, cron schedule spread, mobile action strip fix | CRM

- **Pipeline vendor dedup by email and phone**: Leads were appearing in the pipeline board even when the same person already existed in contacts as a vendor. Root cause: the dedup set only pulled emails from `contact_type = 'customer'` contacts, so vendor emails slipped through. Fixed in `pipeline.ts` to fetch all contacts (any type) for dedup, and to also match by phone — not just email — so phone-only leads are excluded if a contact with that phone exists.
- **QB invoice reconcile**: New `reconcileQbInvoices` server action added to `actions.ts`. On Sync All, it fetches current QB transactions for all linked contacts and compares against CRM timeline events. Timeline entries whose `qb_txn_id` no longer exists in QB (deleted or voided) are deleted from the CRM. Entries with changed status or amount (e.g. Unpaid to Paid) are updated in place. Results shown in Sync All panel under "QB Invoice Reconcile" (removed count, updated count).
- **Cron schedule spread**: Vercel Hobby plan has a 1-hour flexible execution window per cron. `integrity-check` (8am) and `calendar-sync` (9am) were adjacent — their windows could overlap. Rescheduled: `integrity-check` stays at 8am, `calendar-sync` moved to 10am, `maintenance-invoices` moved to noon on the 15th. All gaps are now 2+ hours so windows can never collide.
- **Mobile action strip overlap on leads detail page**: The fixed action strip on `/pro/leads/[id]` was positioned at `bottom-16` (64px flat), which overlapped the ProShell tab bar on iOS devices with a home indicator (safe area ~34px). Fixed to `bottom-[calc(4rem+env(safe-area-inset-bottom))]` to match how the contact page action sheet was already positioned. Content bottom padding bumped from `pb-36` to `pb-48` on both the leads and contacts detail pages so last cards are not hidden behind the action strip.

### June 3 | Kanban paid column fix, column widths, QB invoice cross-contact bug | CRM

- **Kanban "Paid" column was reverting on drop**: Moving cards to the Paid column triggered a DB check constraint violation (`contacts_pipeline_stage_check` was missing `"paid"` as a valid value). The server action returned `ok: false`, the optimistic update reverted, and no error was surfaced to the user. Migration `20260601_fix_pipeline_stage_constraint.sql` drops and re-adds the constraint with all 8 stages including `"paid"`. Run in Supabase SQL editor to activate.
- **Kanban column widths**: Columns widened from `min-w-48` to `min-w-72` (288px) so full customer names are readable without truncation. Card name text now wraps (`break-words`) instead of clipping with ellipsis.
- **QB invoices appearing on wrong customer timelines**: `importQbInvoices` used a global dedup set keyed only by invoice ID. Once an invoice was imported under any contact, the dedup blocked it from being re-imported under the correct contact even if the first import was wrong. Dedup set is now keyed as `contactId:txnId` so each contact has an independent seen-set. To clean existing bad data: delete the misattributed timeline_events rows in Supabase, then re-run Sync All.
- **Removed "Clear QB Notes" button**: Removed from the Integrations sync panel as it is no longer needed. Handler, state, and result display all removed.
- **Supabase credentials wired up locally**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` populated in `.env.local` with the publishable key. Auth and DB queries now work in local dev.
- **Deploy rule hardened**: Added `git push` only deploy rule to `CLAUDE.md` to prevent the AI from running `vercel --prod` directly.

### June 1 | Kanban card revert fix, invoice picker deduplication | CRM

- **Kanban cards no longer revert on drop**: Moving cards between pipeline stages was snapping back to the original column on success. Root cause: `updatePipelineStage` called `revalidatePath("/pro/pipeline")` which triggered a Next.js router refresh; if that refresh read from the DB before the write fully committed (race condition), the board re-rendered with stale data. Removed the `revalidatePath` from `updatePipelineStage` — the board is fully optimistic and does not need a server-side refresh after a drag.
- **Move error banner**: If a pipeline stage update fails on the server, a red banner now appears at the top of the board for 4 seconds with the error message instead of silently reverting.
- **Invoice picker deduplication**: "Pick an existing invoice" on customer cards was showing duplicate entries (e.g., Invoice #379 twice) and stale entries for deleted QB invoices (e.g., Invoice #378). `getContactInvoices` now deduplicates by `doc_number` — keeping the entry with a QB URL (cron-created) over a bare import — and drops stale entries that have neither a `doc_number` nor an `invoice_url`.

## May 2026

### May 31 | Per-instance billing, qty/rate, QB item matching, CRM bug fixes | CRM

- **Per-GCal-instance invoicing**: Cron fires one invoice per GCal event occurrence in the next month window. Invoice frequency is controlled entirely by the Google Calendar recurrence (monthly, twice-monthly, every 6 weeks) — no extra field needed. Deduplicates by `gcal_event_id` in timeline metadata so re-runs are idempotent.
- **Billing frequency column**: `billing_frequency` column added to `calendar_contact_links` by `20260531_billing_frequency.sql` (with `invoice_qty` and `invoice_rate`). Column is present in DB but not exposed in UI — frequency is managed via GCal recurrence.
- **Qty and Rate fields**: Calendar event billing form shows Qty, Rate, and Discount side-by-side. Gross = Qty x Rate, Net = Gross - Discount. Net is the amount sent to QB. For per-foot templates, Qty auto-fills from vessel length and Rate from the template rate per foot.
- **Billing status net total**: Dollar amount shown next to the series label in the calendar event panel now shows the net total (qty x rate - discount) instead of the per-unit rate.
- **QB qty/rate on invoices**: Invoices now include `Qty` and `UnitPrice` in the QB line item so QB displays the breakdown correctly instead of a lump amount.
- **QB item name matching**: Service template name is now used as the QB item lookup key. The "QB Line Description" field has been removed from the services form. Template name must match the QB item name exactly for the line item to link correctly.
- **Hide Create/Claim buttons when invoice already linked**: Calendar event panel no longer shows "Create Invoice" or "Claim to Invoice" buttons if a linked invoice is already found. Shows the linked invoice chip and a "View in QB" button instead. `getLinkedInvoiceForEvent` verifies the QB invoice still exists and auto-clears the timeline link if QB returns 404/400.
- **Phone notes RLS fix**: `savePhoneNote` was blocked by RLS on `phone_notes`. Switched to service role client.
- **"Use CRM" sync fix**: `pushCrmFieldToQb` was calling `findOrCreateQbCustomer` which short-circuits for existing customers. Rewrote to do a proper sparse QB customer update (fetches `SyncToken`, patches only the changed field).
- **Kanban `needs_attention` cards**: Cards stored in `needs_attention` pipeline stage (not in the STAGES display array) were crashing the drag handler because `prev["needs_attention"]` was undefined. `groupByStage` now remaps those cards to `new_leads` including updating `card.stage` so all drag operations reference a valid column key.



### May 28 | Recurring billing, vessel picker, QB invoice fixes | CRM

- **Service Templates**: New `/pro/services` page for managing reusable service types. Each template has a name, QB line label, default price, and a per-foot toggle. When per-foot is on, invoice amount auto-calculates from the vessel's length when linking a billing config to a calendar event.
- **Recurring billing on linked calendar events**: "Set Up / Edit" billing config added directly to already-linked events in the calendar modal. Picks a service template, selects a vessel (auto-fills per-foot amount), sets a discount, and toggles auto-invoice monthly. Net = gross − discount is what gets sent to QB.
- **Discount field**: Billing form has Gross Amount and Discount ($) side-by-side. Net invoice amount shown in green. Both stored on `calendar_contact_links`; net is passed to QB.
- **Vessel picker in billing**: Opening the billing form lazy-loads vessels for the linked contact. Picking a vessel with a per-foot template auto-calculates the gross amount.
- **Recurring services in vessel modal**: Asset modal (Fleet) now shows a "Recurring Services" section between Service Schedule and Appointments. Lists active calendar billing links scoped to that specific vessel — service label, auto-invoice status, and net monthly amount. Hides if none configured.
- **QB item lookup by name**: `createQbInvoiceDraft` now searches QB for an active item matching the service label name. Uses that item's description automatically — no need to duplicate descriptions in the CRM. Falls back to item ID "1" if no match found.
- **QB invoice date from GCal event**: Cron and manual "Create Invoice" now pass `TxnDate` from the actual GCal event start date, so the invoice date matches when the service occurs rather than defaulting to today.
- **QB invoice auto-numbering**: Before creating each invoice, queries QB for the highest existing numeric DocNumber and passes `max + 1`. Fixes blank invoice numbers when QB has "Custom transaction numbers" enabled.
- **Fix: Invoice #undefined**: `DocNumber` from QB can be absent for certain invoice configurations. Timeline title now falls back to "Invoice (Draft)" and stores `null` instead of the string `"undefined"`.
- **Fix: Cron FK join failure**: Replaced `service_templates(description)` Supabase FK join in the cron with a separate follow-up query by ID. Prevents cron from failing when the FK isn't recognized in Supabase's schema cache.
- **Fix: Schedule Job button**: Now hidden on paid invoices (`status === "Paid"`) and invoices created before today. Previously showed on all historical invoices regardless of status or date.
- **New DB migrations**: `20260528_service_templates.sql` (service_templates table + calendar_contact_links columns), `20260528_service_templates_per_foot.sql` (is_per_foot column), `20260528_service_template_description_discount.sql` (description on templates, invoice_discount on links).

### May 29 | Liability waiver saves as full PDF to Google Drive; phone normalization | CRM

- **Waiver PDF**: Liability waiver submissions now save a branded 3-page PDF to the contact's Google Drive folder instead of a plain .txt file. PDF includes navy header, customer info box, all 14 legal sections, and a signature block with the customer's digital signature in italic navy type.
- **PDF library**: Uses `pdf-lib` with embedded standard fonts — no filesystem font dependencies, works in Vercel serverless.
- **Waiver sections shared**: Extracted waiver `SECTIONS` data to `src/lib/waiver-sections.ts` so both the form and the PDF generator stay in sync from one source.
- **Migration route**: `POST /api/migrate-waivers` retroactively converts existing `.txt` waiver files in Google Drive to PDFs using metadata stored in the timeline events. Run from the browser console while logged into the CRM.
- **Waiver contact update fix**: New contacts created from a waiver now correctly save `address`. Update errors are now logged. Fuzzy phone matching (last 10 digits) added so contacts with un-normalized stored phone numbers are found and updated instead of creating duplicates.
- **Phone normalization on save**: `createContact` and `updateContactFields` now run `normalizePhone()` before writing, converting any input format to E.164 (`+1XXXXXXXXXX`). Falls back to raw value if unparseable.
- **Bug fix**: `maintenance-invoices` cron route was using `SUPABASE_SERVICE_ROLE_KEY` (undefined) instead of `SUPABASE_SECRET_KEY` — fixed.

### May 28 | Lead field editing and Quo name backfill | CRM

- **Inline lead field editing**: Lead detail page fields (Name, Email, Phone, Vessel Type, Vessel Length, Service Requested) are now editable in place. Hover any field to reveal the pencil icon, click to open an inline input, Save or Escape to dismiss. Saves via new `updateLeadField` server action which revalidates both the detail page and the leads list.
- **Quo contact name backfill**: When a name is added or updated for a contact in OpenPhone (Quo), the `contact.updated` webhook now also writes the name to any matching `leads` row that still has no name (matched by phone number). Previously the webhook only updated the `contacts` table, leaving quo-sourced leads showing only a phone number even after the caller was identified.

### May 28 | Performance: Three.js removed, CMS caching, bundle splits | Perf

- **AntigravityBackground deleted**: Removed Three.js WebGL particle animation from the landing page hero. Three.js was ~150KB gzipped in the critical bundle and the primary cause of poor mobile FCP (3.12s) and LCP (3.82s). Hero section now shows the water background photo only.
- **getCMS() cached**: Home page CMS query now wrapped in `unstable_cache` with 1h revalidation, matching the existing carousel image cache. Eliminates one uncached Supabase round-trip per render.
- **PipelineBoard code-split**: Confirmed Next.js App Router already splits client components at the server/client boundary; `@dnd-kit` is in a separate chunk, not the critical path.

### May 28 | Waiver completion automation, calendar link fix, Kanban updates, QB paid status fix, vessel appointments | CRM

- **Waiver completion email**: When a customer submits the liability waiver, `crm@northwakemarine.com` sends a notification to `admin@northwakemarine.com` with subject "Waiver Signed: [Name]" containing name, email, phone, address, and vessel. Email goes only to admin, never to the customer.
- **Waiver profile auto-update**: Contact record is now updated with email and address from the waiver form (previously only name and phone were written). New fields: `email`, `address`.
- **Waiver QB auto-sync**: On waiver submission, `findOrCreateQbCustomer` fires in the background — creates or links the QB customer record automatically. Non-fatal if QB is not connected.
- **Waiver OpenPhone auto-sync**: On waiver submission, if the contact has an `openphone_contact_id`, pushes updated name/email/phone to OpenPhone in the background. Non-fatal.
- **Calendar contact-link bug fixed**: `fetchLinkMap()` in `pro/calendar/page.tsx` was referencing `SUPABASE_SERVICE_ROLE_KEY` which does not exist — actual var is `SUPABASE_SECRET_KEY`. Link map was always returning `{}`, so all events appeared unlinked. Now fixed.
- **Kanban "Paid" column**: New pipeline stage `paid` added between `done_invoiced` and `lost`. Accent: emerald-600 border. `checkIntegrity` now excludes both `done_invoiced` and `paid` contacts from health flag scans.
- **Kanban dot — stage-based timer**: Heat dot now tracks time-in-stage, not time-since-last-contact. Rules: `work_scheduled` and `paid` always green; `lost` always red; all other stages green for 0-24h, amber 24-48h, red after 48h. Timer resets to green on any drag-drop (including same-column). New DB column `stage_entered_at TIMESTAMPTZ DEFAULT now()` on contacts. `updatePipelineStage` stamps it on every move including lead conversions.
- **QB invoice "Paid" accuracy fix**: `Balance === 0` comparison replaced with `Balance < 0.01` to handle QuickBooks ledger rounding that returns tiny non-zero balances on fully paid invoices.
- **Vessel appointments section**: Asset modal (opened from Fleet card on contact profile) now has an "Appointments" section below the service schedule. Loads all calendar events linked to that contact via `calendar_contact_links`. Upcoming appointments show with a navy dot, title, date/time, and location. Past appointments collapse under a disclosure toggle at 50% opacity. New server action: `getContactCalendarEvents`. New Google Calendar helper: `getEventById`.
- **New DB migration**: `supabase/migrations/20260527_stage_entered_at.sql` — adds `stage_entered_at` column to contacts.

### May 27 | Household contacts, call log fixes, Quo sync, Kanban cleanup | CRM

- **Household section restored**: LinkedContacts card re-added to customer contact page (left column, below Documents). Stores spouse/family/assistant/associate contacts in CRM. NOT synced to QB as separate customers. Add, remove, relationship label, and "Authorized to Approve" toggle all functional.
- **New DB table**: `linked_contacts` (id, primary_contact_id, name, phone, email, relationship, authorized_to_approve, created_at). Run `supabase/migrations/20260527_linked_contacts.sql`. Phone index included for fast webhook lookup.
- **Linked contacts in call/SMS webhook**: `findContactByPhone` in Quo webhook now checks `linked_contacts` as a fallback. When a household member calls or texts, the event logs against the primary contact with the linked member's name in the title (e.g. "Inbound Call (Sarah Johnson)"). No new lead is created for household numbers.
- **SMS short code filter**: Ingest endpoint now rejects any phone number with fewer than 10 digits. Short codes (5-6 digit SMS codes) no longer create leads. If a short code arrives with a valid email it still creates the contact but drops the invalid phone.
- **Sync Quo button fixed**: Now upserts the contact into OpenPhone first (create if no `openphone_contact_id`, update if one exists) with name, company, phone, and email — then imports history as before. Vendor contacts and any contact with a company name will now appear in OpenPhone after clicking Sync Quo.
- **Auto-sync to OpenPhone on create**: New contacts created through the CRM (including vendors) auto-push to OpenPhone on save with full name and company fields. This was already in place; confirmed working for all contact types.
- **Kanban summary bar removed**: Stats bar (column counts, new leads, calls, total clients, converted) removed from pipeline board. Saves 4 DB queries on every pipeline page load.

### May 27 | Calendar month grid, maintenance wash invoicing system | CRM

- **Calendar month view**: Full Google Calendar-style month grid replaces the basic week view as default. Events span multiple columns across week boundaries (banner layout). Month/week toggle in header. Google Calendar color codes (all 11 colorIds) applied to event banners.
- **Calendar event-to-contact linking**: One-time claim flow on any GCal event. Open the event modal, click "Link to Contact", search for a contact by name (auto-filled from first segment of event title), pick a vessel, toggle "Link entire recurring series" (on by default if the event is recurring). Stored in `calendar_contact_links` table. Modified ("change this event only") occurrences inherit the link via `recurringEventId` fallback, so changing one occurrence never breaks the contact connection.
- **EventLinkPanel in calendar modal**: When an event is linked, the modal shows the contact name, vessel, "Create Invoice", "Claim to Invoice", and "Unlink" buttons. When unlinked, shows a dashed "Link to Contact" button that expands the search form.
- **Create Invoice from calendar event**: From the calendar event modal, when linked to a contact, "Create Invoice" pre-fills the service label from the event title and opens an amount field. Creates a QB draft invoice and logs it to the contact's activity timeline with `gcal_event_id` in metadata. Timeline entry shows a green "On Calendar" badge instead of "Schedule Job".
- **Claim calendar event to existing invoice**: "Claim to Invoice" button in the linked event modal lists all the contact's existing invoices. Clicking "Claim" writes `gcal_event_id` into that invoice's timeline metadata, activating date sync and replacing the "Schedule Job" button with "On Calendar".
- **vessel_services typical_price field**: New price field on service schedule records. Editable in both Add and Edit forms. Used as the pre-filled amount when creating an invoice from a vessel service.
- **Create Invoice from vessel service**: Each service schedule item now has a "Create Invoice" button next to "Mark Done". Clicking it creates a QB draft invoice using `typical_price` and marks the service as done.
- **Monthly maintenance invoice cron**: `GET /api/maintenance-invoices` runs on the 15th of each month at 8am UTC. Fetches next month's GCal events, matches them to linked contacts, looks up each contact's QB recurring invoice template (`RecurringTransaction` API), creates QB invoices from those templates with the event date as TxnDate, and logs each result to `timeline_events`. Results summary written to `system_flags`. pMap(5) concurrency. Added to `vercel.json` crons.
- **QB date sync on GCal event move**: GCal webhook extended to detect when a linked maintenance event is moved to a new date. Finds the linked QB invoice via `timeline_events.metadata.gcal_event_id`, fetches the full invoice (for SyncToken), then patches the QB `TxnDate` to match the new event date.
- **Schedule Job button logic**: "Schedule Job" on invoice timeline items is now hidden when the invoice was created from a calendar event (`gcal_event_id` in metadata) or when a job has already been scheduled. Legacy QB-imported invoices without a calendar connection still show it.
- **New DB table**: `calendar_contact_links` (gcal_event_id UNIQUE, contact_id, vessel_id). Run `supabase/migrations/20260526_calendar_contact_links.sql`.
- **New DB column**: `vessel_services.typical_price NUMERIC(10,2)`. Run `supabase/migrations/20260526_vessel_service_price.sql`.
- **New QB helpers**: `listQbRecurringInvoiceTemplates`, `createQbInvoiceFromTemplate`, `updateQbInvoiceTxnDate`, `getValidTokens` (exported).
- **New server actions**: `linkCalendarEvent`, `unlinkCalendarEvent`, `createInvoiceFromCalendarEvent`, `createMaintenanceInvoice`, `searchContactsByName`, `getVesselsByContactId`, `getContactInvoices`, `claimGcalEventToInvoice`.

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
