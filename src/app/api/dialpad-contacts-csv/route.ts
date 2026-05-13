import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
}

function escapeCSV(val: string | null | undefined): string {
  if (!val) return "";
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET() {
  const supabase = svc();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, phone")
    .eq("contact_type", "customer")
    .not("name", "is", null)
    .order("name");

  const contactIds = (contacts ?? []).map((c) => c.id);
  const vesselMap = new Map<string, string>();

  if (contactIds.length > 0) {
    const { data: vessels } = await supabase
      .from("vessels")
      .select("owner_id, year, make_model")
      .in("owner_id", contactIds)
      .order("created_at", { ascending: true });
    for (const v of vessels ?? []) {
      if (!vesselMap.has(v.owner_id)) {
        const parts = [v.year, v.make_model].filter(Boolean).join(" ");
        if (parts) vesselMap.set(v.owner_id, parts);
      }
    }
  }

  // Dialpad CSV format: First Name, Last Name, Email, Phones, Company, Role, URLs, Country
  const rows = ["First Name,Last Name,Email,Phones,Company,Role,URLs,Country"];

  for (const c of contacts ?? []) {
    const nameParts = (c.name ?? "").trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = [nameParts.slice(1).join(" "), vesselMap.get(c.id)].filter(Boolean).join(" ");

    rows.push([
      escapeCSV(firstName),
      escapeCSV(lastName),
      escapeCSV(c.email),
      escapeCSV(c.phone ?? ""),
      "",
      "",
      "",
      "",
    ].join(","));
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="dialpad-contacts.csv"`,
    },
  });
}
