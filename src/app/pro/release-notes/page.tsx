export const dynamic = "force-dynamic";

import { readFileSync } from "fs";
import { join } from "path";
import ProShell from "@/components/ProShell";

const TAG_COLORS: Record<string, string> = {
  CRM:          "bg-blue-50 text-blue-600 border-blue-200",
  Pipeline:     "bg-[#000080]/10 text-[#000080] border-[#000080]/20",
  Mobile:       "bg-purple-50 text-purple-600 border-purple-200",
  Integrations: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Site:         "bg-amber-50 text-amber-600 border-amber-200",
  Fix:          "bg-slate-100 text-slate-500 border-slate-200",
  SEO:          "bg-green-50 text-green-600 border-green-200",
};

type Entry = { date: string; headline: string; detail: string; tags: string[] };
type Month = { label: string; entries: Entry[] };

function parseChangelog(): Month[] {
  const raw = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
  const months: Month[] = [];
  let current: Month | null = null;

  for (const line of raw.split("\n")) {
    const monthMatch = line.match(/^## (.+)/);
    if (monthMatch) {
      current = { label: monthMatch[1].trim(), entries: [] };
      months.push(current);
      continue;
    }

    const entryMatch = line.match(/^### (.+?) \| (.+?) \| (.+)/);
    if (entryMatch && current) {
      current.entries.push({
        date: entryMatch[1].trim(),
        headline: entryMatch[2].trim(),
        tags: entryMatch[3].split(",").map((t) => t.trim()),
        detail: "",
      });
      continue;
    }

    // Append body lines to the last entry
    if (current && current.entries.length > 0 && line.trim()) {
      const last = current.entries[current.entries.length - 1];
      last.detail = last.detail ? `${last.detail} ${line.trim()}` : line.trim();
    }
  }

  return months;
}

export default function ReleaseNotesPage() {
  const months = parseChangelog();

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Release Notes</h1>
          <p className="text-slate-400 text-xs mt-0.5">Platform updates, features, and fixes in reverse chronological order.</p>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-3xl flex flex-col gap-12">

            {months.map((month) => (
              <section key={month.label} aria-labelledby={`month-${month.label.replace(/\s/g, "-")}`}>

                <h2
                  id={`month-${month.label.replace(/\s/g, "-")}`}
                  className="text-[10px] tracking-[0.35em] uppercase font-semibold text-slate-400 mb-5 pb-2 border-b border-slate-100"
                >
                  {month.label}
                </h2>

                <ol className="flex flex-col gap-8">
                  {Object.entries(
                    month.entries.reduce<Record<string, Entry[]>>((acc, e) => {
                      (acc[e.date] ??= []).push(e);
                      return acc;
                    }, {})
                  ).map(([date, entries]) => (
                    <li key={date} className="flex gap-5">

                      <time
                        dateTime={date}
                        className="text-[11px] text-slate-400 font-medium whitespace-nowrap w-12 pt-0.5 shrink-0"
                      >
                        {date}
                      </time>

                      <div className="flex-1 min-w-0 flex flex-col gap-5">
                        {entries.map((entry, i) => (
                          <article key={i}>
                            <div className="flex items-start gap-3 flex-wrap mb-1.5">
                              <h3 className="text-slate-800 text-sm font-semibold leading-snug">
                                {entry.headline}
                              </h3>
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
                            </div>
                            <p className="text-slate-500 text-xs leading-relaxed">
                              {entry.detail}
                            </p>
                          </article>
                        ))}
                      </div>

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
