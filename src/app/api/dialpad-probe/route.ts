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

async function dp(path: string, token: string) {
  const res = await fetch(`${DP_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, path, body };
}

export async function GET() {
  let token: string;
  try { token = await getToken(); } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }

  const results = await Promise.allSettled([
    dp("/contacts?type=company&limit=5", token),
    dp("/contacts?type=local&limit=5", token),
    dp("/contacts?type=shared&limit=5", token),
    dp("/offices", token),
    dp("/company", token),
  ]);

  const output = results.map((r) =>
    r.status === "fulfilled" ? r.value : { error: r.reason?.message }
  );

  // If we got offices back, probe the first one for contacts
  const officesResult = output[3] as { status?: number; body?: { items?: { id: string }[] } };
  const officeItems = officesResult?.body?.items ?? [];
  const officeProbes = await Promise.allSettled(
    officeItems.slice(0, 3).map((o: { id: string }) =>
      dp(`/offices/${o.id}/contacts?limit=5`, token)
    )
  );

  return NextResponse.json({
    contacts_company:  output[0],
    contacts_local:    output[1],
    contacts_shared:   output[2],
    offices:           output[3],
    company:           output[4],
    office_contacts:   officeProbes.map((r) => r.status === "fulfilled" ? r.value : { error: (r as PromiseRejectedResult).reason?.message }),
  }, { status: 200 });
}
