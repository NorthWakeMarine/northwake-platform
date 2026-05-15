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
  company_name?: string | null;
}): Promise<string> {
  const supabase = svc();

  const { data: existing } = await supabase
    .from("contacts")
    .select("qb_customer_id")
    .eq("id", contact.id)
    .single();

  if (existing?.qb_customer_id) return existing.qb_customer_id;

  // DisplayName: prefer personal name, fall back to company name, then email
  const displayName = contact.name?.trim() || contact.company_name?.trim() || contact.email || "Unknown";

  const body: Record<string, unknown> = { DisplayName: displayName };
  if (contact.company_name?.trim()) body.CompanyName = contact.company_name.trim();
  if (contact.email) body.PrimaryEmailAddr = { Address: contact.email };
  if (contact.phone) body.PrimaryPhone = { FreeFormNumber: contact.phone };

  type CustomerResponse = { Customer: { Id: string } };

  let qbId: string;
  try {
    const data = await qbRequest<CustomerResponse>("/customer", {
      method: "POST",
      body: JSON.stringify(body),
    });
    qbId = data.Customer.Id;
  } catch (err) {
    if (!(err instanceof Error && err.message.includes("6240"))) throw err;

    // Name conflicts with an existing QB entity (customer or vendor).
    // Check active and inactive customers for a direct link.
    const escapedName = displayName.replace(/'/g, "\\'");
    type QueryResp = { QueryResponse: { Customer?: { Id: string }[] } };
    const found = await qbRequest<QueryResp>(
      `/query?query=${encodeURIComponent(`SELECT Id FROM Customer WHERE DisplayName = '${escapedName}' MAXRESULTS 1`)}`
    );
    const existing = found.QueryResponse.Customer?.[0];
    if (existing) {
      qbId = existing.Id;
    } else {
      // Conflict is a vendor or employee — QB forbids sharing names across entity types.
      // Skip QB linking for this contact; it can be resolved manually in QuickBooks.
      return null as unknown as string;
    }
  }

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

export type QbTransaction = {
  id: string;
  txnType: "Invoice" | "Payment" | "SalesReceipt" | "CreditMemo";
  docNumber: string | null;
  txnDate: string;
  totalAmt: number;
  body: string | null;
  status: string | null;
};

export async function listQbTransactionsForCustomer(qbCustomerId: string): Promise<QbTransaction[]> {
  const q = (entity: string) =>
    encodeURIComponent(`SELECT * FROM ${entity} WHERE CustomerRef = '${qbCustomerId}' ORDERBY TxnDate DESC MAXRESULTS 100`);

  type LineItem = { Description?: string; Amount?: number; DetailType?: string };
  type InvoiceResp     = { QueryResponse: { Invoice?:     { Id: string; DocNumber?: string; TxnDate: string; TotalAmt: number; Balance: number; Line?: LineItem[] }[] } };
  type PaymentResp     = { QueryResponse: { Payment?:     { Id: string; TxnDate: string; TotalAmt: number; PrivateNote?: string }[] } };
  type ReceiptResp     = { QueryResponse: { SalesReceipt?: { Id: string; DocNumber?: string; TxnDate: string; TotalAmt: number; Line?: LineItem[] }[] } };
  type CreditMemoResp  = { QueryResponse: { CreditMemo?:  { Id: string; DocNumber?: string; TxnDate: string; TotalAmt: number; Line?: LineItem[] }[] } };

  function parseLines(lines?: LineItem[]): string | null {
    const body = (lines ?? [])
      .filter((l) => l.Description && l.DetailType !== "SubTotalLineDetail")
      .map((l) => `${l.Description}${l.Amount != null ? ` — $${l.Amount.toFixed(2)}` : ""}`)
      .join("\n");
    return body || null;
  }

  const [inv, pay, rec, crd] = await Promise.allSettled([
    qbRequest<InvoiceResp>(`/query?query=${q("Invoice")}`),
    qbRequest<PaymentResp>(`/query?query=${q("Payment")}`),
    qbRequest<ReceiptResp>(`/query?query=${q("SalesReceipt")}`),
    qbRequest<CreditMemoResp>(`/query?query=${q("CreditMemo")}`),
  ]);

  const results: QbTransaction[] = [];

  if (inv.status === "fulfilled") {
    for (const r of inv.value.QueryResponse.Invoice ?? []) {
      const status = r.Balance === 0 ? "Paid" : r.Balance < r.TotalAmt ? "Partial" : "Unpaid";
      results.push({ id: r.Id, txnType: "Invoice", docNumber: r.DocNumber ?? null, txnDate: r.TxnDate, totalAmt: r.TotalAmt, body: parseLines(r.Line), status });
    }
  }
  if (pay.status === "fulfilled") {
    for (const r of pay.value.QueryResponse.Payment ?? []) {
      results.push({ id: r.Id, txnType: "Payment", docNumber: null, txnDate: r.TxnDate, totalAmt: r.TotalAmt, body: r.PrivateNote ?? null, status: "Received" });
    }
  }
  if (rec.status === "fulfilled") {
    for (const r of rec.value.QueryResponse.SalesReceipt ?? []) {
      results.push({ id: r.Id, txnType: "SalesReceipt", docNumber: r.DocNumber ?? null, txnDate: r.TxnDate, totalAmt: r.TotalAmt, body: parseLines(r.Line), status: "Paid" });
    }
  }
  if (crd.status === "fulfilled") {
    for (const r of crd.value.QueryResponse.CreditMemo ?? []) {
      results.push({ id: r.Id, txnType: "CreditMemo", docNumber: r.DocNumber ?? null, txnDate: r.TxnDate, totalAmt: r.TotalAmt, body: parseLines(r.Line), status: "Credit" });
    }
  }

  return results.sort((a, b) => b.txnDate.localeCompare(a.txnDate));
}

export type QbCustomer = {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  Active: boolean;
  Notes?: string;
  SyncToken?: string;
};

export async function listQbCustomers(): Promise<QbCustomer[]> {
  type Resp = { QueryResponse: { Customer?: QbCustomer[] } };
  const data = await qbRequest<Resp>(
    "/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20Active%20%3D%20true%20MAXRESULTS%20500"
  );
  return data.QueryResponse.Customer ?? [];
}

export async function getQbCustomer(qbCustomerId: string): Promise<QbCustomer> {
  type Resp = { Customer: QbCustomer };
  const data = await qbRequest<Resp>(`/customer/${qbCustomerId}`);
  return data.Customer;
}

// ── Notes-based vessel sync ───────────────────────────────────────────────────

const VESSELS_PREFIX = "Vessels:";

export type NoteVessel = { year: number | null; makeModel: string | null; lengthFt: string | null };

export function parseVesselsFromNotes(notes: string | null): NoteVessel[] {
  if (!notes) return [];
  const line = notes.split("\n").find((l) => l.startsWith(VESSELS_PREFIX));
  if (!line) return [];
  return line.slice(VESSELS_PREFIX.length).trim().split(" | ").filter(Boolean).flatMap((v) => {
    const parts = v.split(" - ");
    const yearStr = parts[0]?.trim() ?? "";
    const makeModel = parts[1]?.trim() || null;
    const lengthFt = parts[2]?.trim() || null;
    const year = parseInt(yearStr, 10);
    const parsedYear = !isNaN(year) && year > 1900 ? year : null;
    // Skip entries with no identifying info (just a length or completely blank)
    if (!parsedYear && !makeModel) return [];
    return [{ year: parsedYear, makeModel, lengthFt }];
  });
}

export function buildNotesWithVessels(existingNotes: string | null, vessels: NoteVessel[]): string {
  const otherLines = (existingNotes ?? "").split("\n").filter((l) => !l.startsWith(VESSELS_PREFIX)).join("\n").trim();
  // Only write vessels that have at least a year or make/model — skip length-only ghost entries
  const meaningful = vessels.filter((v) => v.year || v.makeModel);
  if (meaningful.length === 0) return otherLines;
  const vesselLine = VESSELS_PREFIX + " " + meaningful
    .map((v) => `${v.year ?? ""} - ${v.makeModel ?? ""} - ${v.lengthFt ?? ""}`)
    .join(" | ");
  return otherLines ? `${vesselLine}\n${otherLines}` : vesselLine;
}

export async function updateQbCustomerNotes(qbCustomerId: string, syncToken: string, notes: string): Promise<void> {
  await qbRequest("/customer", {
    method: "POST",
    body: JSON.stringify({ Id: qbCustomerId, SyncToken: syncToken, sparse: true, Notes: notes }),
  });
}

