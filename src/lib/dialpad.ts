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

async function getBearerToken(): Promise<string> {
  // OAuth tokens first — user-level, can read personal (local) contacts
  const tokens = await getDialpadTokens();
  if (tokens) {
    const expiresAt = new Date(tokens.expires_at).getTime();
    if (Date.now() > expiresAt - 60_000) {
      return (await refreshDialpadTokens(tokens)).access_token;
    }
    return tokens.access_token;
  }

  // Fall back to API key — company-level, can only read company-shared contacts
  const apiKey = process.env.DIALPAD_API_KEY;
  if (apiKey) return apiKey;

  throw new Error("Dialpad not connected. Connect via OAuth on the Integrations page.");
}

const DP_BASE = "https://dialpad.com/api/v2";

async function dpRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getBearerToken();
  const res = await fetch(`${DP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
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

export async function listDialpadContactsByType(type: "company" | "local", maxTotal: number): Promise<DialpadContact[]> {
  type Resp = { items?: DialpadContact[]; cursor?: string };
  const all: DialpadContact[] = [];
  let cursor: string | undefined;
  do {
    const params = new URLSearchParams({ type, limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const data = await dpRequest<Resp>(`/contacts?${params}`);
    all.push(...(data.items ?? []));
    cursor = data.cursor;
  } while (cursor && all.length < maxTotal);
  return all;
}

export async function listDialpadContacts(maxTotal = 500): Promise<DialpadContact[]> {
  const [company, local] = await Promise.all([
    listDialpadContactsByType("company", maxTotal),
    listDialpadContactsByType("local", maxTotal),
  ]);
  // Dedupe by id in case any contacts appear in both lists
  const seen = new Set<string>();
  const all: DialpadContact[] = [];
  for (const c of [...company, ...local]) {
    if (!seen.has(c.id)) { seen.add(c.id); all.push(c); }
  }
  return all;
}

export async function updateDialpadContact(
  dpId: string,
  data: { first_name?: string; last_name?: string; emails?: string[]; phone_numbers?: string[] }
): Promise<void> {
  await dpRequest(`/contacts/${dpId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createDialpadContact(
  data: { first_name: string; last_name?: string; emails?: string[]; phone_numbers?: string[] }
): Promise<string | null> {
  type Resp = { id: string };
  const res = await dpRequest<Resp>("/contacts", {
    method: "POST",
    body: JSON.stringify({ ...data, type: "company" }),
  });
  return res.id ?? null;
}

// Step 1: create a webhook endpoint, returns its numeric ID
async function createDialpadWebhookEndpoint(hookUrl: string, secret: string): Promise<number> {
  const result = await dpRequest<{ id: number }>("/webhooks", {
    method: "POST",
    body: JSON.stringify({ hook_url: hookUrl, secret: secret || undefined }),
  });
  return result.id;
}

// Step 2a: subscribe to call events using the webhook endpoint ID
async function createDialpadCallSubscription(endpointId: number): Promise<void> {
  await dpRequest("/subscriptions/call", {
    method: "POST",
    body: JSON.stringify({
      endpoint_id: endpointId,
      enabled: true,
      call_states: ["hangup", "voicemail"],
    }),
  });
}

// Step 2b: subscribe to inbound SMS events using the webhook endpoint ID
async function createDialpadSmsSubscription(endpointId: number): Promise<void> {
  await dpRequest("/subscriptions/sms", {
    method: "POST",
    body: JSON.stringify({
      webhook_id: endpointId,
      enabled: true,
      direction: "inbound",
    }),
  });
}

export async function registerDialpadEventSubscription(hookUrl: string, secret: string): Promise<{ webhookId?: number; error?: string }> {
  try {
    const webhookId = await createDialpadWebhookEndpoint(hookUrl, secret);
    await createDialpadCallSubscription(webhookId);
    await createDialpadSmsSubscription(webhookId);
    return { webhookId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Registration failed." };
  }
}

export async function listDialpadWebhooks(): Promise<{ items?: { id: number; hook_url: string }[]; error?: string }> {
  try {
    const result = await dpRequest<{ items?: { id: number; hook_url: string }[] }>("/webhooks");
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to list webhooks." };
  }
}

export type DialpadCall = {
  id: string;
  date_started: number; // epoch ms
  duration: number | null;
  direction: "inbound" | "outbound";
  external_number: string | null;
  recording_url: string | null;
  voicemail_url: string | null;
};

export async function listDialpadCalls(options: {
  maxTotal?: number;
  started_after?: number; // epoch ms
} = {}): Promise<DialpadCall[]> {
  type Resp = { items?: DialpadCall[]; cursor?: string };
  const all: DialpadCall[] = [];
  const maxTotal = options.maxTotal ?? 500;
  let cursor: string | undefined;
  do {
    const params = new URLSearchParams({ limit: "100" });
    if (options.started_after) params.set("started_after", String(Math.floor(options.started_after / 1000)));
    if (cursor) params.set("cursor", cursor);
    const data = await dpRequest<Resp>(`/calls?${params}`);
    all.push(...(data.items ?? []));
    cursor = data.cursor;
  } while (cursor && all.length < maxTotal);
  return all;
}
