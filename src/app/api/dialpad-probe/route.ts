import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
}

const DP_BASE = "https://dialpad.com/api/v2";

async function getToken(): Promise<string> {
  const { getDialpadTokens } = await import("@/lib/dialpad");
  const tokens = await getDialpadTokens();
  if (tokens) return tokens.access_token;
  const apiKey = process.env.DIALPAD_API_KEY;
  if (apiKey) return apiKey;
  throw new Error("Dialpad not connected");
}

type DpContact = {
  id: string;
  display_name: string;
  primary_phone?: string;
  phone_numbers?: string[];
  emails?: string[];
  type?: string;
};

async function fetchAllContacts(token: string, type: string): Promise<DpContact[]> {
  const all: DpContact[] = [];
  let cursor: string | undefined;
  do {
    const params = new URLSearchParams({ type, limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`${DP_BASE}/contacts?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) break;
    const data = await res.json();
    all.push(...(data.items ?? []));
    cursor = data.cursor;
  } while (cursor && all.length < 1000);
  return all;
}

export async function GET() {
  let token: string;
  try { token = await getToken(); } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }

  const contacts = await fetchAllContacts(token, "company");

  const withPhone = contacts.filter(
    (c) => (c.phone_numbers?.length ?? 0) > 0 || (c.primary_phone && c.primary_phone.trim())
  );
  const withoutPhone = contacts.filter(
    (c) => (c.phone_numbers?.length ?? 0) === 0 && !c.primary_phone?.trim()
  );

  // Check CRM contacts for phone coverage
  const supabase = svc();
  const { data: crmContacts } = await supabase
    .from("contacts")
    .select("id, name, phone, dialpad_contact_id")
    .eq("contact_type", "customer")
    .not("name", "is", null);

  const crm = crmContacts ?? [];
  const crmWithPhone = crm.filter((c) => c.phone);
  const crmWithDialpad = crm.filter((c) => c.dialpad_contact_id);
  const crmWithBoth = crm.filter((c) => c.phone && c.dialpad_contact_id);
  const crmWithDialpadNoPhone = crm.filter((c) => c.dialpad_contact_id && !c.phone);

  return NextResponse.json({
    dialpad_contacts: { total: contacts.length, with_phone: withPhone.length, without_phone: withoutPhone.length },
    crm_contacts: {
      total: crm.length,
      with_phone: crmWithPhone.length,
      with_dialpad_link: crmWithDialpad.length,
      with_both_phone_and_dialpad: crmWithBoth.length,
      linked_to_dialpad_but_missing_phone: crmWithDialpadNoPhone.map((c) => ({ id: c.id, name: c.name })),
    },
  }, { status: 200 });
}
