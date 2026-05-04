import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export type QbTokenData = {
  access_token: string;
  refresh_token: string;
  realm_id: string;
  expires_at: string;
};

export async function getQbTokens(): Promise<QbTokenData | null> {
  const supabase = svc();
  const { data } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, realm_id, expires_at")
    .eq("provider", "quickbooks")
    .maybeSingle();
  if (!data) return null;
  return data as QbTokenData;
}

export async function saveQbTokens(tokens: QbTokenData): Promise<void> {
  const supabase = svc();
  await supabase.from("oauth_tokens").upsert(
    {
      provider: "quickbooks",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      realm_id: tokens.realm_id,
      expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" }
  );
}

async function refreshQbTokens(tokens: QbTokenData): Promise<QbTokenData> {
  const clientId = process.env.QB_CLIENT_ID!;
  const clientSecret = process.env.QB_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!res.ok) throw new Error(`QB token refresh failed: ${res.status}`);
  const body = await res.json();

  const refreshed: QbTokenData = {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? tokens.refresh_token,
    realm_id: tokens.realm_id,
    expires_at: new Date(Date.now() + body.expires_in * 1000).toISOString(),
  };
  await saveQbTokens(refreshed);
  return refreshed;
}

async function getValidTokens(): Promise<QbTokenData> {
  const tokens = await getQbTokens();
  if (!tokens) throw new Error("QuickBooks not connected. Visit /pro/integrations to authorize.");

  const expiresAt = new Date(tokens.expires_at).getTime();
  if (Date.now() > expiresAt - 60_000) {
    return refreshQbTokens(tokens);
  }
  return tokens;
}

const QB_BASE = "https://quickbooks.api.intuit.com/v3";

async function qbRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = await getValidTokens();
  const sep = path.includes("?") ? "&" : "?";
  const url = `${QB_BASE}/company/${tokens.realm_id}${path}${sep}minorversion=70`;
  const res = await fetch(url, {
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
    throw new Error(`QB API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function findOrCreateQbCustomer(contact: {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}): Promise<string> {
  const supabase = svc();

  const { data: existing } = await supabase
    .from("contacts")
    .select("qb_customer_id")
    .eq("id", contact.id)
    .single();

  if (existing?.qb_customer_id) return existing.qb_customer_id;

  const displayName = contact.name?.trim() || contact.email || "Unknown";

  const body: Record<string, unknown> = { DisplayName: displayName };
  if (contact.email) body.PrimaryEmailAddr = { Address: contact.email };
  if (contact.phone) body.PrimaryPhone = { FreeFormNumber: contact.phone };

  type CustomerResponse = { Customer: { Id: string } };
  const data = await qbRequest<CustomerResponse>("/customer", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const qbId = data.Customer.Id;
  await supabase.from("contacts").update({ qb_customer_id: qbId }).eq("id", contact.id);
  return qbId;
}

export async function createQbInvoiceDraft(opts: {
  qbCustomerId: string;
  lineDescription: string;
  amount?: number;
}): Promise<{ invoiceId: string; docNumber: string }> {
  const body = {
    CustomerRef: { value: opts.qbCustomerId },
    Line: [
      {
        DetailType: "SalesItemLineDetail",
        Amount: opts.amount ?? 0,
        Description: opts.lineDescription,
        SalesItemLineDetail: {
          ItemRef: { value: "1" },
        },
      },
    ],
  };

  type InvoiceResponse = { Invoice: { Id: string; DocNumber: string } };
  const data = await qbRequest<InvoiceResponse>("/invoice", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    invoiceId: data.Invoice.Id,
    docNumber: data.Invoice.DocNumber,
  };
}

export function getQbInvoiceUrl(realmId: string, invoiceId: string): string {
  return `https://app.qbo.intuit.com/app/invoice?txnId=${invoiceId}&companyId=${realmId}`;
}

export async function isQbConnected(): Promise<boolean> {
  const tokens = await getQbTokens();
  return !!tokens;
}

export type QbCustomer = {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  Active: boolean;
};

export async function listQbCustomers(): Promise<QbCustomer[]> {
  type Resp = { QueryResponse: { Customer?: QbCustomer[] } };
  const data = await qbRequest<Resp>(
    "/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20Active%20%3D%20true%20MAXRESULTS%20500"
  );
  return data.QueryResponse.Customer ?? [];
}
