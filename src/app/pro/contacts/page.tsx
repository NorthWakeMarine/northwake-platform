export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import SearchBar from "./SearchBar";
import TypeFilter from "./TypeFilter";
import ClickableRow from "@/components/ClickableRow";

type Contact = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  vessel_type: string | null;
  vessel_length: string | null;
  waiver_signed: boolean | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function StatusBadges({ contact }: { contact: Contact }) {
  const badges: { label: string; cls: string }[] = [];
  if (!contact.waiver_signed) {
    badges.push({ label: "Waiver Missing", cls: "bg-red-50 text-red-600 border border-red-200" });
  }
  if (!contact.phone) {
    badges.push({ label: "Info Incomplete", cls: "bg-amber-50 text-amber-600 border border-amber-200" });
  }
  if (badges.length === 0) {
    badges.push({ label: "Complete", cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" });
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span key={b.label} className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium whitespace-nowrap ${b.cls}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

const SORTABLE_COLS: Record<string, string> = {
  Date: "created_at",
  Name: "name",
  Email: "email",
  Phone: "phone",
  Length: "vessel_length",
};

function SortableHeader({ label, field, currentSort, currentDir, baseParams }: {
  label: string;
  field: string | null;
  currentSort: string;
  currentDir: string;
  baseParams: Record<string, string>;
}) {
  if (!field) {
    return (
      <th className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
        {label}
      </th>
    );
  }
  const isActive = currentSort === field;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams({ ...baseParams, sort: field, dir: nextDir }).toString();
  return (
    <th className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
      <a href={`?${params}`} className={`flex items-center gap-1 hover:text-slate-600 transition-colors ${isActive ? "text-slate-600" : ""}`}>
        {label}
        {isActive && <span className="text-slate-400">{currentDir === "asc" ? "↑" : "↓"}</span>}
      </a>
    </th>
  );
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; type?: string; sort?: string; dir?: string }>;
}) {
  const { q, type, sort, dir } = (await searchParams) ?? {};
  const term = q?.trim() ?? "";
  const typeFilter = type?.trim() ?? "";
  const sortField = SORTABLE_COLS[Object.keys(SORTABLE_COLS).find((k) => SORTABLE_COLS[k] === (sort ?? "")) ?? ""] ? (sort ?? "created_at") : "created_at";
  const sortDir = dir === "asc" ? "asc" : "desc";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const COLS = "id, created_at, name, email, phone, vessel_type, vessel_length, waiver_signed";

  let contacts: Contact[] = [];
  let error: string | null = null;
  let searchHit = false;

  // Detect contacts sharing the same phone number
  const { data: phoneCounts } = await supabase
    .from("contacts")
    .select("phone, id, name")
    .not("phone", "is", null);

  const phoneMap = new Map<string, { id: string; name: string | null }[]>();
  for (const row of phoneCounts ?? []) {
    if (!row.phone) continue;
    const existing = phoneMap.get(row.phone) ?? [];
    existing.push({ id: row.id, name: row.name });
    phoneMap.set(row.phone, existing);
  }
  const duplicateGroups = [...phoneMap.values()].filter((g) => g.length > 1);

  if (term) {
    searchHit = true;

    // Direct contact matches
    let directQuery = supabase
      .from("contacts")
      .select(COLS)
      .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    if (typeFilter === "customer" || typeFilter === "vendor") {
      directQuery = directQuery.eq("contact_type", typeFilter);
    }
    const { data: direct } = await directQuery;

    // Linked contact matches
    const { data: linked } = await supabase
      .from("linked_contacts")
      .select("primary_contact_id")
      .or(`name.ilike.%${term}%,phone.ilike.%${term}%`);

    const linkedIds = linked?.map((l) => l.primary_contact_id).filter(Boolean) ?? [];

    // Vessel / asset name matches
    const { data: vessels } = await supabase
      .from("vessels")
      .select("owner_id")
      .ilike("name", `%${term}%`);

    const vesselOwnerIds = vessels?.map((v) => v.owner_id).filter(Boolean) ?? [];

    const allIds = [
      ...new Set([
        ...(direct?.map((c) => c.id) ?? []),
        ...linkedIds,
        ...vesselOwnerIds,
      ]),
    ];

    if (allIds.length > 0) {
      let q = supabase
        .from("contacts")
        .select(COLS)
        .in("id", allIds)
        .order(sortField, { ascending: sortDir === "asc" });
      if (typeFilter === "customer" || typeFilter === "vendor") {
        q = q.eq("contact_type", typeFilter);
      }
      const { data, error: err } = await q;
      contacts = (data ?? []) as Contact[];
      if (err) error = err.message;
    }
  } else {
    let q = supabase
      .from("contacts")
      .select(COLS)
      .order(sortField, { ascending: sortDir === "asc" });
    if (typeFilter === "customer" || typeFilter === "vendor") {
      q = q.eq("contact_type", typeFilter);
    }
    const { data, error: err } = await q;
    contacts = (data ?? []) as Contact[];
    if (err) error = err.message;
  }


  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-slate-900 text-xl font-bold tracking-tight">Contacts</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {term ? `Showing results for "${term}"` : "All contacts with status flags for missing waivers or incomplete info."}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <TypeFilter current={typeFilter} />
            <SearchBar initialQ={term} />
          </div>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">

          {/* Duplicate phone banner */}
          {duplicateGroups.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 flex flex-col gap-2">
              <p className="text-amber-700 text-xs font-semibold tracking-wide">
                {duplicateGroups.length === 1
                  ? "1 potential duplicate detected"
                  : `${duplicateGroups.length} potential duplicates detected`}
                : multiple contacts share the same phone number.
              </p>
              <div className="flex flex-col gap-1">
                {duplicateGroups.map((group, i) => (
                  <div key={i} className="flex flex-wrap gap-2 items-center">
                    <span className="text-amber-600 text-[10px] tracking-widest uppercase font-medium">Group {i + 1}:</span>
                    {group.map((c) => (
                      <Link
                        key={c.id}
                        href={`/pro/contacts/${c.id}`}
                        className="text-[10px] tracking-widest uppercase text-amber-700 underline hover:text-amber-900 font-medium"
                      >
                        {c.name || "Unnamed"}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Waiver Missing", cls: "bg-red-50 text-red-600 border border-red-200" },
              { label: "Info Incomplete", cls: "bg-amber-50 text-amber-600 border border-amber-200" },
              { label: "Complete",        cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
            ].map((b) => (
              <span key={b.label} className={`text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-medium ${b.cls}`}>
                {b.label}
              </span>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-slate-800 text-sm font-semibold">
                {term ? "Search Results" : "All Contacts"}
              </h2>
              <span className="text-slate-400 text-[11px]">
                {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
              </span>
            </div>

            {error ? (
              <p className="text-red-500 text-xs px-6 py-6">Failed to load contacts: {error}</p>
            ) : contacts.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                <p className="text-slate-400 text-sm">
                  {searchHit ? `No results found for "${term}".` : "No contacts yet."}
                </p>
                {!searchHit && (
                  <p className="text-slate-300 text-xs max-w-xs leading-relaxed">
                    Contacts are created automatically when a lead converts, or you can add them from a lead record.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {(["Date", "Name", "Email", "Phone", "Vessel", "Length", "Status"] as const).map((h) => (
                        <SortableHeader
                          key={h}
                          label={h}
                          field={SORTABLE_COLS[h] ?? null}
                          currentSort={sortField}
                          currentDir={sortDir}
                          baseParams={{ ...(term ? { q: term } : {}), ...(typeFilter ? { type: typeFilter } : {}) }}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <ClickableRow key={c.id} href={`/pro/contacts/${c.id}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="py-3 px-4 first:pl-6 text-slate-400 whitespace-nowrap">{fmt(c.created_at)}</td>
                        <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">{c.name || "—"}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {c.email
                            ? <a href={`mailto:${c.email}`} className="hover:text-blue-600 transition-colors">{c.email}</a>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {c.phone
                            ? <a href={`tel:${c.phone}`} className="hover:text-blue-600 transition-colors">{c.phone}</a>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{c.vessel_type || <span className="text-slate-300">—</span>}</td>
                        <td className="py-3 px-4 text-slate-500">{c.vessel_length ? `${c.vessel_length} ft` : <span className="text-slate-300">—</span>}</td>
                        <td className="py-3 px-4 last:pr-6"><StatusBadges contact={c} /></td>
                      </ClickableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProShell>
  );
}
