import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

type QbEntity = { name: string; id: string; operation: string };

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("intuit-signature") ?? "";
  const secret = process.env.QB_WEBHOOK_VERIFIER_TOKEN ?? "";

  if (secret && !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const notifications = (payload.eventNotifications as { dataChangeEvent?: { entities?: QbEntity[] } }[] | undefined) ?? [];

  // Return 200 immediately so QB does not retry on slow processing
  const response = NextResponse.json({ ok: true });

  Promise.all(
    notifications.flatMap((notification) =>
      (notification.dataChangeEvent?.entities ?? []).map((entity) => {
        if (entity.name === "Payment" && entity.operation === "Create") {
          return handlePayment(entity.id);
        } else if (entity.name === "Customer" && (entity.operation === "Create" || entity.operation === "Update")) {
          return handleCustomer(entity.id);
        } else if (entity.name === "Customer" && entity.operation === "Delete") {
          return handleCustomerDelete(entity.id);
        } else if (
          (entity.name === "Invoice" || entity.name === "SalesReceipt" || entity.name === "CreditMemo") &&
          (entity.operation === "Create" || entity.operation === "Update")
        ) {
          return handleTransaction(entity.name as "Invoice" | "SalesReceipt" | "CreditMemo", entity.id);
        }
        return Promise.resolve();
      })
    )
  ).catch((err) => console.error("QB webhook async error:", err));

  return response;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return null;
}

async function qbFetch(tokens: { access_token: string; realm_id: string }, path: string) {
  const res = await fetch(
    `https://quickbooks.api.intuit.com/v3/company/${tokens.realm_id}${path}?minorversion=70`,
    { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } }
  );
  if (!res.ok) return null;
  return res.json();
}

// ── Customer.Create / Customer.Update ────────────────────────────────────────

async function handleCustomer(qbCustomerId: string) {
  const supabase = svc();
  const { getQbTokens, parseVesselsFromCustomFields, parseVesselsFromNotes } = await import("@/lib/quickbooks");
  const tokens = await getQbTokens();
  if (!tokens) return;

  try {
    const data = await qbFetch(tokens, `/customer/${qbCustomerId}`);
    if (!data) return;
    const qbC = data.Customer;

    const qbEmailRaw = qbC.PrimaryEmailAddr?.Address as string | undefined;
    const qbPhoneRaw = qbC.PrimaryPhone?.FreeFormNumber as string | undefined;
    const qbEmail = qbEmailRaw?.toLowerCase();
    const qbName = (qbC.DisplayName as string | undefined)?.toLowerCase().trim();

    // Find matching CRM contact by email then name
    let match: { id: string; name: string | null; email: string | null; phone: string | null; address: string | null; company_name: string | null; qb_customer_id: string | null } | null = null;

    if (qbEmail) {
      const { data: byEmail } = await supabase
        .from("contacts")
        .select("id, name, email, phone, address, company_name, qb_customer_id")
        .ilike("email", qbEmail)
        .maybeSingle();
      match = byEmail ?? null;
    }
    if (!match && qbName) {
      const { data: byName } = await supabase
        .from("contacts")
        .select("id, name, email, phone, address, company_name, qb_customer_id")
        .ilike("name", qbName)
        .maybeSingle();
      match = byName ?? null;
    }
    // Also check by existing qb_customer_id link
    if (!match) {
      const { data: byQbId } = await supabase
        .from("contacts")
        .select("id, name, email, phone, address, company_name, qb_customer_id")
        .eq("qb_customer_id", qbCustomerId)
        .maybeSingle();
      match = byQbId ?? null;
    }

    if (!match) return;

    // Build update payload
    const billAddr = qbC.BillAddr as { Line1?: string; Line2?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string } | undefined;
    const addressParts = [
      billAddr?.Line1,
      billAddr?.Line2,
      billAddr?.City && billAddr?.CountrySubDivisionCode
        ? `${billAddr.City}, ${billAddr.CountrySubDivisionCode}${billAddr.PostalCode ? " " + billAddr.PostalCode : ""}`
        : billAddr?.City,
    ].filter(Boolean);
    const formattedAddress = addressParts.length ? addressParts.join(", ") : null;

    const update: Record<string, unknown> = { qb_customer_id: qbCustomerId };
    if (formattedAddress && !match.address) update.address = formattedAddress;
    if ((qbC.CompanyName as string | undefined)?.trim() && !match.company_name) {
      update.company_name = (qbC.CompanyName as string).trim();
    }
    if (qbPhoneRaw && !match.phone) {
      update.phone = normalizePhone(qbPhoneRaw) ?? qbPhoneRaw;
    }

    await supabase.from("contacts").update(update).eq("id", match.id);

    // Sync vessels: custom fields first, Notes as fallback for legacy data
    const rawCFs = (qbC.CustomField as unknown[] | undefined) ?? [];
    const cfVessels = parseVesselsFromCustomFields(rawCFs);
    const noteVessels = cfVessels.length > 0 ? cfVessels : parseVesselsFromNotes((qbC.Notes as string | null) ?? null);
    if (noteVessels.length > 0) {
      const { data: existing } = await supabase
        .from("vessels")
        .select("make_model, year, length_ft, name")
        .eq("owner_id", match.id);
      const existingKeys = new Set(
        (existing ?? []).map((v) => `${v.year ?? ""}|${v.make_model?.toLowerCase() ?? ""}`)
      );
      const toInsert = noteVessels.filter((nv) => {
        const key = `${nv.year ?? ""}|${nv.makeModel?.toLowerCase() ?? ""}`;
        return !existingKeys.has(key);
      });
      if (toInsert.length > 0) {
        await supabase.from("vessels").insert(
          toInsert.map((nv) => ({
            owner_id: match.id,
            asset_type: "vessel",
            year: nv.year,
            make_model: nv.makeModel,
            length_ft: nv.lengthFt?.replace(/\s*ft\s*$/i, "").trim() || null,
          }))
        );
      }
    }
  } catch (err) {
    console.error("QB customer webhook error:", err);
  }
}

// ── Invoice / SalesReceipt / CreditMemo Create or Update ─────────────────────

const typeLabels: Record<string, string> = {
  Invoice: "Invoice",
  SalesReceipt: "Sales Receipt",
  CreditMemo: "Credit Memo",
};
const eventTypes: Record<string, string> = {
  Invoice: "invoice",
  SalesReceipt: "sales_receipt",
  CreditMemo: "credit_memo",
};
const txnPaths: Record<string, string> = {
  Invoice: "/invoice",
  SalesReceipt: "/salesreceipt",
  CreditMemo: "/creditmemo",
};
const txnKeys: Record<string, string> = {
  Invoice: "Invoice",
  SalesReceipt: "SalesReceipt",
  CreditMemo: "CreditMemo",
};

async function handleTransaction(txnType: "Invoice" | "SalesReceipt" | "CreditMemo", txnId: string) {
  const supabase = svc();
  const { getQbTokens, getQbInvoiceUrl } = await import("@/lib/quickbooks");
  const tokens = await getQbTokens();
  if (!tokens) return;

  try {
    const data = await qbFetch(tokens, `${txnPaths[txnType]}/${txnId}`);
    if (!data) return;
    const txn = data[txnKeys[txnType]];
    const qbCustomerId = txn?.CustomerRef?.value as string | undefined;
    if (!qbCustomerId) return;

    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("qb_customer_id", qbCustomerId)
      .maybeSingle();
    if (!contact) return;

    const txnKey = `${txnType}:${txnId}`;

    // Check if already logged; if so, update title/body but don't duplicate
    const { data: existing } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("contact_id", contact.id)
      .contains("metadata", { qb_txn_id: txnKey })
      .maybeSingle();

    type LineItem = { Description?: string; Amount?: number; DetailType?: string };
    const lines: LineItem[] = txn.Line ?? [];
    const body = lines
      .filter((l) => l.Description && l.DetailType !== "SubTotalLineDetail")
      .map((l) => `${l.Description}${l.Amount != null ? ` - $${l.Amount.toFixed(2)}` : ""}`)
      .join("\n") || "";

    const totalAmt: number = txn.TotalAmt ?? 0;
    const docNumber: string | null = txn.DocNumber ?? null;
    const txnDate: string = txn.TxnDate ?? new Date().toISOString().split("T")[0];
    const balance: number | undefined = txn.Balance;
    const status = txnType === "Invoice"
      ? (balance === 0 ? "Paid" : (balance != null && balance < totalAmt) ? "Partial" : "Unpaid")
      : txnType === "CreditMemo" ? "Credit" : "Paid";

    const label = typeLabels[txnType];
    const docPart = docNumber ? ` #${docNumber}` : "";
    const invoiceUrl = txnType === "Invoice" ? getQbInvoiceUrl(tokens.realm_id, txnId) : null;

    const title = `${label}${docPart} - $${Math.abs(totalAmt).toFixed(2)}${status ? ` (${status})` : ""}`;
    const metadata = {
      qb_txn_id: txnKey,
      txn_type: txnType,
      doc_number: docNumber,
      total: totalAmt,
      status,
      txn_date: txnDate,
      invoice_url: invoiceUrl,
    };

    if (existing) {
      await supabase
        .from("timeline_events")
        .update({ title, body, metadata })
        .eq("id", existing.id);
    } else {
      await supabase.from("timeline_events").insert({
        contact_id: contact.id,
        event_type: eventTypes[txnType],
        title,
        body,
        metadata,
        created_by: "system",
        created_at: txnDate,
      });
    }

    // Move to invoiced stage when an invoice is created/updated
    if (txnType === "Invoice" && status !== "Paid") {
      await supabase
        .from("contacts")
        .update({ pipeline_stage: "done_invoiced" })
        .eq("id", contact.id);
    }
  } catch (err) {
    console.error(`QB ${txnType} webhook error:`, err);
  }
}

// ── Payment.Create ────────────────────────────────────────────────────────────

async function handlePayment(qbPaymentId: string) {
  const supabase = svc();
  const { getQbTokens } = await import("@/lib/quickbooks");
  const tokens = await getQbTokens();
  if (!tokens) return;

  try {
    const data = await qbFetch(tokens, `/payment/${qbPaymentId}`);
    if (!data) return;
    const payment = data.Payment;
    const linkedTxn = payment?.Line?.[0]?.LinkedTxn?.[0];
    if (!linkedTxn) return;

    const invoiceId = linkedTxn.TxnId;
    if (!invoiceId) return;

    const invData = await qbFetch(tokens, `/invoice/${invoiceId}`);
    if (!invData) return;
    const qbCustomerId = invData.Invoice?.CustomerRef?.value;
    if (!qbCustomerId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contact }: { data: any } = await supabase
      .from("contacts")
      .select("id, vessels ( id )")
      .eq("qb_customer_id", qbCustomerId)
      .maybeSingle();

    if (!contact) return;

    await supabase
      .from("contacts")
      .update({ pipeline_stage: "done_invoiced" })
      .eq("id", contact.id);

    const today = new Date().toISOString().split("T")[0];
    const vessels = Array.isArray(contact.vessels) ? contact.vessels : [];
    if (vessels.length > 0) {
      await supabase
        .from("vessels")
        .update({ last_service_date: today })
        .eq("id", vessels[0].id);
    }

    const amount = payment.TotalAmt ?? 0;
    await supabase.from("timeline_events").insert({
      contact_id: contact.id,
      event_type: "payment",
      title: "Payment Received",
      body: `QuickBooks payment of $${Number(amount).toFixed(2)} received. Invoice moved to Done.`,
      metadata: { qb_payment_id: qbPaymentId, qb_invoice_id: invoiceId, amount },
      created_by: "system",
    });
  } catch (err) {
    console.error("QB payment handler error:", err);
  }
}

async function handleCustomerDelete(qbCustomerId: string) {
  const supabase = svc();
  try {
    await supabase
      .from("contacts")
      .update({ qb_customer_id: null })
      .eq("qb_customer_id", qbCustomerId);
  } catch (err) {
    console.error("QB customer delete handler error:", err);
  }
}
