export const dynamic = "force-dynamic";

import ProShell from "@/components/ProShell";

type Entry = {
  date: string;
  headline: string;
  detail: string;
  tags?: string[];
};

type Month = {
  label: string;
  entries: Entry[];
};

const TAG_COLORS: Record<string, string> = {
  CRM:        "bg-blue-50 text-blue-600 border-blue-200",
  Pipeline:   "bg-[#000080]/10 text-[#000080] border-[#000080]/20",
  Mobile:     "bg-purple-50 text-purple-600 border-purple-200",
  Integrations: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Site:       "bg-amber-50 text-amber-600 border-amber-200",
  Fix:        "bg-slate-100 text-slate-500 border-slate-200",
  SEO:        "bg-green-50 text-green-600 border-green-200",
};

const RELEASE_NOTES: Month[] = [
  {
    label: "May 2026",
    entries: [
      {
        date: "May 6",
        headline: "Mobile pipeline board",
        detail: "The pipeline board now works on phones. A scrollable stage tab bar replaces the kanban columns on small screens, showing one stage at a time. Each card has a chevron button to move it to a different stage and an X to remove or dismiss it, all without drag-and-drop.",
        tags: ["Pipeline", "Mobile"],
      },
      {
        date: "May 6",
        headline: "Clickable rows in Leads and Contacts lists",
        detail: "The VIEW button has been removed from both list pages. Clicking anywhere on a row now navigates to the detail page. Email and phone links still work independently. The DELETE button moved into each detail page's top bar, with a confirm step before deleting.",
        tags: ["CRM"],
      },
      {
        date: "May 6",
        headline: "Add to Pipeline button on contacts and leads",
        detail: "Every contact dossier now has an Add to Pipeline button in the top bar with a dropdown to pick the starting stage. If the contact is already on the board, their current stage is shown as a badge instead. Unconverted lead detail pages get the same button.",
        tags: ["Pipeline", "CRM"],
      },
      {
        date: "May 6",
        headline: "Delete any timeline event",
        detail: "Previously only notes could be deleted from the activity timeline. Now every event type (stage changes, calls, invoices, etc.) has a trash icon that appears on hover. A confirm prompt prevents accidental deletions.",
        tags: ["CRM"],
      },
      {
        date: "May 6",
        headline: "Text legibility improvements across the site",
        detail: "The steel gray text colors were too dark against black backgrounds, failing contrast standards. The steel palette was brightened: --color-steel went from #686A6C to #a0a2a4 and --color-steel-light from #8a8c8e to #c2c4c6. All pages update automatically through CSS variables.",
        tags: ["Site", "Fix"],
      },
      {
        date: "May 6",
        headline: "SEO and AI discoverability pass",
        detail: "Added FAQPage JSON-LD schema to the contact page, a WebSite schema with dateModified, and a screen-reader-only direct-answer paragraph on the home page to improve extraction by AI search engines. Expanded LocalBusiness sameAs links to include YouTube, TikTok, and Google Reviews. Unblocked AI crawlers (GPTBot, Claude-Web, etc.) in robots.ts.",
        tags: ["SEO", "Site"],
      },
      {
        date: "May 6",
        headline: "Google Ads leads: cleaned up message field",
        detail: "The raw Lead ID hex string was being stored in the lead message field. It has been removed. The campaign name and form name are now stored in the Referral Source field instead. Existing leads with the raw data have it stripped at display time automatically.",
        tags: ["Integrations", "Fix"],
      },
      {
        date: "May 6",
        headline: "X button on lead-type pipeline cards",
        detail: "New Lead cards (unconverted leads that appear automatically in the pipeline) were missing the remove button. All pipeline cards now show the X. Clicking it on a lead card deletes the lead entirely; on a contact card it removes them from the board but keeps the contact record.",
        tags: ["Pipeline", "Fix"],
      },
      {
        date: "May 4",
        headline: "Contact details inline editing",
        detail: "A pencil icon on every contact dossier opens all fields (name, email, phone, address) for batch editing in place. Changes are saved together on confirm. Email and phone display as clickable mailto and tel links in read mode, with an edit history tracked in metadata.",
        tags: ["CRM"],
      },
      {
        date: "May 4",
        headline: "Push CRM data to Dialpad",
        detail: "A Push to Dialpad button on the integrations page syncs all CRM customer records to Dialpad contacts, creating new Dialpad entries for any contacts not yet linked. Field mismatches between CRM and Dialpad (name, email, phone) are surfaced with per-field resolution controls.",
        tags: ["Integrations"],
      },
      {
        date: "May 4",
        headline: "Pipeline board UX refinements",
        detail: "Columns now fill the full page width using flex-1. The Needs Attention column has a red accent. Health flag warning icons show on cards with a tooltip listing the issues. Cards have a remove button that sets pipeline_stage to null while keeping the contact record intact.",
        tags: ["Pipeline"],
      },
      {
        date: "May 3",
        headline: "QuickBooks customer import and sync panel",
        detail: "A Sync All panel on the integrations page imports QB customers into the CRM, detects field mismatches, and shows unmatched records for one-click import. Company names in QB are parsed into vessel records (format: year make model length, comma-separated). A View in QB link appears on every linked contact.",
        tags: ["Integrations"],
      },
      {
        date: "May 3",
        headline: "Generate invoice draft from fleet asset",
        detail: "Each asset in a contact's fleet now has a Generate Draft Invoice button. Clicking it creates a draft in QuickBooks, logs the action to the activity timeline, and opens a link to review the draft in QB.",
        tags: ["Integrations", "CRM"],
      },
    ],
  },
  {
    label: "April 2026",
    entries: [
      {
        date: "Apr 30",
        headline: "Drag-and-drop Kanban pipeline board",
        detail: "The dashboard was rebuilt as a full Kanban board using @dnd-kit. Six columns: New Leads, Discovery, Needs Attention, Estimate Sent, Work Scheduled, and Done/Invoiced. Cards can be dragged between columns to update the pipeline stage in real time. Lead-type cards auto-convert to contacts on first move.",
        tags: ["Pipeline"],
      },
      {
        date: "Apr 30",
        headline: "NorthWake favicon",
        detail: "The NorthWake Marine anchor logo is now the browser tab icon and Apple touch icon across the entire site.",
        tags: ["Site"],
      },
      {
        date: "Apr 27",
        headline: "Google Calendar integration",
        detail: "A live calendar page shows a week-grid view of all Google Calendar events. Events can be created, edited, and deleted from the pro portal. Webhook auto-renewal runs daily so the live-sync connection stays active. Descriptions render as HTML and support all-day and multi-day date ranges.",
        tags: ["Integrations"],
      },
      {
        date: "Apr 27",
        headline: "Google Ads lead webhook",
        detail: "Leads submitted through Google Ads lead form extensions are automatically captured and routed into the CRM. The source is tagged as Google Ads and the campaign name is stored in the referral source field. Custom form questions (vessel type, service, message) map to the correct CRM fields.",
        tags: ["Integrations"],
      },
      {
        date: "Apr 27",
        headline: "Contact Documents panel with Google Drive",
        detail: "Each contact dossier has a Documents panel that lists files from a linked Google Drive folder. Files can be uploaded directly from the dossier. Liability waivers are auto-saved to Drive on submission and appear in the documents list automatically.",
        tags: ["CRM", "Integrations"],
      },
      {
        date: "Apr 27",
        headline: "Per-vessel service schedules",
        detail: "Each vessel in the fleet can have a custom service interval (in days). The integrity engine flags vessels as overdue when the interval has passed since last service. Overdue vessels surface on the dashboard and move the contact to Needs Attention.",
        tags: ["CRM"],
      },
      {
        date: "Apr 21",
        headline: "Full CRM engine launched",
        detail: "The pro portal launched with lead tracking, contact dossiers, vessel fleet management, activity timelines, and linked contacts. Phone numbers are normalized on save. Duplicate phone detection surfaces a banner when two contacts share the same number. A health bar on each dossier shows completeness across email, phone, address, fleet, and waiver status.",
        tags: ["CRM"],
      },
      {
        date: "Apr 21",
        headline: "QuickBooks and Dialpad OAuth flows",
        detail: "OAuth connection routes were built for both QuickBooks Online and Dialpad. QB tokens are stored and auto-refreshed. Invoice creation, customer sync, and payment webhook handling are all wired up and live for QuickBooks.",
        tags: ["Integrations"],
      },
      {
        date: "Apr 18",
        headline: "Landing site completed",
        detail: "All five public pages (Home, Services, About, Contact, Socials) are live at northwakemarine.com. The home page features an auto-loading hero carousel, a services grid, and quote forms. The site uses the full NorthWake chrome and navy design system with Tailwind.",
        tags: ["Site"],
      },
      {
        date: "Apr 17",
        headline: "Platform initialized",
        detail: "The NorthWake platform was bootstrapped as a Next.js 15 App Router project with Tailwind CSS, Supabase, and Vercel. The luxury maritime design system (obsidian backgrounds, navy accents, chrome typography) was established in globals.css.",
        tags: ["Site"],
      },
    ],
  },
];

function fmt(dateStr: string) {
  return dateStr;
}

export default function ReleaseNotesPage() {
  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Release Notes</h1>
          <p className="text-slate-400 text-xs mt-0.5">Platform updates, features, and fixes in reverse chronological order.</p>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-3xl flex flex-col gap-12">

            {RELEASE_NOTES.map((month) => (
              <section key={month.label} aria-labelledby={`month-${month.label.replace(/\s/g, "-")}`}>

                <h2
                  id={`month-${month.label.replace(/\s/g, "-")}`}
                  className="text-[10px] tracking-[0.35em] uppercase font-semibold text-slate-400 mb-5 pb-2 border-b border-slate-100"
                >
                  {month.label}
                </h2>

                <ol className="flex flex-col gap-6" reversed>
                  {month.entries.map((entry, i) => (
                    <li key={i} className="flex gap-5">

                      <time
                        dateTime={entry.date}
                        className="text-[11px] text-slate-400 font-medium whitespace-nowrap w-12 pt-0.5 shrink-0"
                      >
                        {fmt(entry.date)}
                      </time>

                      <article className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap mb-1.5">
                          <h3 className="text-slate-800 text-sm font-semibold leading-snug">
                            {entry.headline}
                          </h3>
                          {entry.tags && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`text-[9px] tracking-widest uppercase font-medium px-2 py-0.5 rounded-sm border ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          {entry.detail}
                        </p>
                      </article>

                    </li>
                  ))}
                </ol>

              </section>
            ))}

          </div>
        </main>

      </div>
    </ProShell>
  );
}
