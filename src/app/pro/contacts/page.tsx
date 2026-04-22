import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import SearchBar from "./SearchBar";

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

export default async function ContactsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const { q } = (await searchParams) ?? {};
  const term = q?.trim() ?? "";

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
    const { data: direct } = await supabase
      .from("contacts")
      .select(COLS)
      .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);

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
      const { data, error: err } = await supabase
        .from("contacts")
        .select(COLS)
        .in("id", allIds)
        .order("created_at", { ascending: false });
      contacts = (data ?? []) as Contact[];
      if (err) error = err.message;
    }
  } else {
    const { data, error: err } = await supabase
      .from("contacts")
      .select(COLS)
      .order("created_at", { ascending: false });
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
          <SearchBar initialQ={term} />
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
              <p className="text-slate-400 text-sm px-6 py-8">
                {searchHit ? `No results found for "${term}".` : "No contacts yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Date", "Name", "Email", "Phone", "Vessel", "Length", "Status", ""].map((h) => (
                        <th key={h} className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
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
                        <td className="py-3 px-4"><StatusBadges contact={c} /></td>
                        <td className="py-3 px-4 last:pr-6">
                          <Link
                            href={`/pro/contacts/${c.id}`}
                            className="text-[10px] tracking-widest uppercase text-blue-500 hover:text-blue-700 font-medium transition-colors whitespace-nowrap"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
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
