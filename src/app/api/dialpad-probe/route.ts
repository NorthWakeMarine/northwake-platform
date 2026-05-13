import { NextResponse } from "next/server";

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

  // Fetch full detail for Aaron Govil to see if phone appears on individual endpoint
  const sampleId = contacts.find((c) => c.display_name?.includes("Aaron Govil"))?.id ?? contacts[0]?.id;
  let sampleDetail: unknown = null;
  if (sampleId) {
    const res = await fetch(`${DP_BASE}/contacts/${sampleId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    sampleDetail = await res.json();
  }

  return NextResponse.json({
    total: contacts.length,
    with_phone: withPhone.length,
    without_phone: withoutPhone.length,
    sample_contact_detail: sampleDetail,
  }, { status: 200 });
}
