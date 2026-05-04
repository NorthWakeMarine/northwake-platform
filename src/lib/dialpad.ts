import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export type DialpadTokenData = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
};

export async function getDialpadTokens(): Promise<DialpadTokenData | null> {
  const supabase = svc();
  const { data } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("provider", "dialpad")
    .maybeSingle();
  if (!data) return null;
  return data as DialpadTokenData;
}

export async function saveDialpadTokens(tokens: DialpadTokenData): Promise<void> {
  const supabase = svc();
  await supabase.from("oauth_tokens").upsert(
    {
      provider: "dialpad",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" }
  );
}

async function refreshDialpadTokens(tokens: DialpadTokenData): Promise<DialpadTokenData> {
  const res = await fetch("https://dialpad.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: process.env.DIALPAD_CLIENT_ID!,
      client_secret: process.env.DIALPAD_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) throw new Error(`Dialpad token refresh failed: ${res.status}`);
  const body = await res.json();

  const refreshed: DialpadTokenData = {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? tokens.refresh_token,
    expires_at: new Date(Date.now() + (body.expires_in ?? 3600) * 1000).toISOString(),
  };
  await saveDialpadTokens(refreshed);
  return refreshed;
}

async function getValidTokens(): Promise<DialpadTokenData> {
  const tokens = await getDialpadTokens();
  if (!tokens) throw new Error("Dialpad not connected. Visit /pro/integrations to authorize.");

  const expiresAt = new Date(tokens.expires_at).getTime();
  if (Date.now() > expiresAt - 60_000) {
    return refreshDialpadTokens(tokens);
  }
  return tokens;
}

const DP_BASE = "https://dialpad.com/api/v2";

async function dpRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = await getValidTokens();
  const res = await fetch(`${DP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dialpad API ${res.status}: ${body}`);
  }
  return res.json();
}

export type DialpadContact = {
  id: string;
  display_name: string;
  phone_numbers?: string[];
  emails?: string[];
};

export async function listDialpadContacts(limit = 100): Promise<DialpadContact[]> {
  type Resp = { items?: DialpadContact[] };
  const data = await dpRequest<Resp>(`/contacts?type=company&limit=${limit}`);
  return data.items ?? [];
}

export async function updateDialpadContact(
  dpId: string,
  data: { display_name?: string; emails?: string[]; phone_numbers?: string[] }
): Promise<void> {
  await dpRequest(`/contacts/${dpId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createDialpadContact(
  data: { display_name: string; emails?: string[]; phone_numbers?: string[] }
): Promise<string | null> {
  type Resp = { id: string };
  const res = await dpRequest<Resp>("/contacts", {
    method: "POST",
    body: JSON.stringify({ ...data, type: "company" }),
  });
  return res.id ?? null;
}

export async function isDialpadConnected(): Promise<boolean> {
  const tokens = await getDialpadTokens();
  return !!tokens;
}
