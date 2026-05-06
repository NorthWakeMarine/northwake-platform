export const dynamic = "force-dynamic";

import ProShell from "@/components/ProShell";

type EventDef = {
  event_name: string;
  trigger: string;
  parameters: { name: string; example: string }[];
};

type Category = {
  label: string;
  color: string;
  events: EventDef[];
};

const CATEGORIES: Category[] = [
  {
    label: "Navigation",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    events: [
      {
        event_name: "nav_click",
        trigger: "Any header or footer nav link clicked",
        parameters: [
          { name: "link_text", example: "Services" },
          { name: "link_url", example: "/services" },
          { name: "nav_location", example: "header | footer | mobile_menu" },
        ],
      },
    ],
  },
  {
    label: "CTAs",
    color: "bg-[#000080]/10 text-[#000080] border-[#000080]/20",
    events: [
      {
        event_name: "cta_click",
        trigger: "Any primary CTA button clicked",
        parameters: [
          { name: "cta_text", example: "Get a Free Quote" },
          { name: "cta_location", example: "header | footer_cta_band | floating_cta | carousel_overlay_desktop" },
        ],
      },
    ],
  },
  {
    label: "Contact",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    events: [
      {
        event_name: "phone_click",
        trigger: "Click on any tel: link",
        parameters: [
          { name: "click_location", example: "footer | footer_cta_band | contact_page" },
        ],
      },
      {
        event_name: "email_click",
        trigger: "Click on any mailto: link",
        parameters: [
          { name: "click_location", example: "footer | contact_page" },
        ],
      },
    ],
  },
  {
    label: "Forms",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    events: [
      {
        event_name: "quote_form_start",
        trigger: "First focus on any field in a quote form",
        parameters: [
          { name: "form_id", example: "hero_quote_form | quote-form" },
        ],
      },
      {
        event_name: "quote_form_submit",
        trigger: "Valid form submitted (before server response)",
        parameters: [
          { name: "form_id", example: "hero_quote_form | quote-form" },
          { name: "service_selected", example: "Ceramic Coating" },
        ],
      },
      {
        event_name: "quote_form_success",
        trigger: "Server confirms lead was saved",
        parameters: [
          { name: "form_id", example: "hero_quote_form | quote-form" },
          { name: "service_selected", example: "Monthly Maintenance Plan" },
        ],
      },
      {
        event_name: "quote_form_error",
        trigger: "Server returns an error on form submission",
        parameters: [
          { name: "form_id", example: "hero_quote_form | quote-form" },
          { name: "error_message", example: "Something went wrong. Please try again." },
        ],
      },
    ],
  },
  {
    label: "Scroll Depth",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    events: [
      {
        event_name: "scroll_depth",
        trigger: "User scrolls past 25%, 50%, 75%, or 100% of a page. Each depth fires once per page visit.",
        parameters: [
          { name: "depth_percent", example: "25 | 50 | 75 | 100" },
          { name: "page_path", example: "/ | /services | /about | /contact" },
        ],
      },
    ],
  },
  {
    label: "Carousel",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    events: [
      {
        event_name: "carousel_navigate",
        trigger: "User clicks prev or next arrow on the homepage carousel",
        parameters: [
          { name: "direction", example: "prev | next" },
        ],
      },
    ],
  },
];

const PAGES_TRACKED = [
  { path: "/", label: "Home", tracking: ["scroll_depth", "nav_click", "cta_click", "quote_form_*", "carousel_navigate", "phone_click"] },
  { path: "/services", label: "Services", tracking: ["scroll_depth", "nav_click", "cta_click"] },
  { path: "/about", label: "About", tracking: ["scroll_depth", "nav_click", "cta_click"] },
  { path: "/contact", label: "Contact", tracking: ["scroll_depth", "nav_click", "cta_click", "quote_form_*", "phone_click", "email_click"] },
];

export default function AnalyticsReferencePage() {
  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Analytics Reference</h1>
          <p className="text-slate-400 text-xs mt-0.5">All GA4 events tracked on this site. Use these names when building audiences or goals in Google Analytics.</p>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-4xl flex flex-col gap-10">

            {/* Setup status */}
            <section className="bg-amber-50 border border-amber-200 rounded-sm p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 text-sm font-bold">Setup Required</span>
              </div>
              <p className="text-amber-700 text-xs leading-relaxed">
                Add your GA4 Measurement ID to Vercel environment variables as{" "}
                <code className="bg-amber-100 px-1 rounded font-mono">NEXT_PUBLIC_GA_MEASUREMENT_ID</code>{" "}
                (e.g. <code className="bg-amber-100 px-1 rounded font-mono">G-XXXXXXXXXX</code>).
                The script loads automatically once the variable is set. No code changes needed.
              </p>
              <p className="text-amber-700 text-xs mt-1">
                In GA4, go to <strong>Admin → Data Streams → your stream → Enhanced Measurement</strong> and disable
                automatic scroll tracking to avoid double-counting with the custom{" "}
                <code className="bg-amber-100 px-1 rounded font-mono">scroll_depth</code> event.
              </p>
            </section>

            {/* Event catalog */}
            {CATEGORIES.map((cat) => (
              <section key={cat.label}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-sm border ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-slate-300 text-xs">{cat.events.length} event{cat.events.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="flex flex-col gap-4">
                  {cat.events.map((ev) => (
                    <div key={ev.event_name} className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex items-start justify-between gap-4">
                        <div>
                          <code className="text-slate-900 text-sm font-bold font-mono">{ev.event_name}</code>
                          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{ev.trigger}</p>
                        </div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2 w-40">Parameter</th>
                            <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2">Example value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ev.parameters.map((p) => (
                            <tr key={p.name} className="border-b border-slate-50 last:border-0">
                              <td className="px-5 py-2.5 font-mono text-[#000080] font-medium">{p.name}</td>
                              <td className="px-5 py-2.5 text-slate-500">{p.example}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Pages tracked */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-sm border bg-green-50 text-green-700 border-green-200">
                  Page Coverage
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2.5 w-32">Path</th>
                      <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2.5 w-28">Page</th>
                      <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2.5">Events active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAGES_TRACKED.map((page) => (
                      <tr key={page.path} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3 font-mono text-slate-500">{page.path}</td>
                        <td className="px-5 py-3 text-slate-700 font-medium">{page.label}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {page.tracking.map((t) => (
                              <code key={t} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm text-[10px] font-mono">{t}</code>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* GA4 setup guide */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-sm border bg-slate-100 text-slate-600 border-slate-200">
                  Recommended GA4 Goals
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2.5">Conversion name</th>
                      <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2.5">Based on event</th>
                      <th className="text-left text-[9px] tracking-widest uppercase text-slate-400 font-medium px-5 py-2.5">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "quote_submitted", event: "quote_form_success", why: "Primary lead capture — most valuable conversion" },
                      { name: "phone_call_intent", event: "phone_click", why: "High-intent signal, especially on mobile" },
                      { name: "email_contact", event: "email_click", why: "Secondary contact intent" },
                      { name: "quote_form_engaged", event: "quote_form_start", why: "Mid-funnel: user started but may not have submitted" },
                    ].map((row) => (
                      <tr key={row.name} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3 font-mono text-[#000080] font-medium">{row.name}</td>
                        <td className="px-5 py-3 font-mono text-slate-500">{row.event}</td>
                        <td className="px-5 py-3 text-slate-500 leading-relaxed">{row.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>

      </div>
    </ProShell>
  );
}
