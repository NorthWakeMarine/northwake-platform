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

  const entities = (payload.eventNotifications as { dataChangeEvent?: { entities?: { name: string; id: string; operation: string }[] } }[] | undefined) ?? [];

  for (const notification of entities) {
    const changed = notification.dataChangeEvent?.entities ?? [];
    for (const entity of changed) {
      if (entity.name === "Payment" && entity.operation === "Create") {
        await handlePayment(entity.id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handlePayment(qbPaymentId: string) {
  const supabase = svc();
  const { getQbTokens } = await import("@/lib/quickbooks");
  const tokens = await getQbTokens();
  if (!tokens) return;

  try {
    const res = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokens.realm_id}/payment/${qbPaymentId}?minorversion=70`,
      { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } }
    );
    if (!res.ok) return;
    const data = await res.json();
    const payment = data.Payment;
    const linkedTxn = payment?.Line?.[0]?.LinkedTxn?.[0];
    if (!linkedTxn) return;

    const invoiceId = linkedTxn.TxnId;
    if (!invoiceId) return;

    const invRes = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokens.realm_id}/invoice/${invoiceId}?minorversion=70`,
      { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } }
    );
    if (!invRes.ok) return;
    const invData = await invRes.json();
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
      contact_id:  contact.id,
      event_type:  "payment",
      title:       "Payment Received",
      body:        `QuickBooks payment of $${Number(amount).toFixed(2)} received. Invoice moved to Done.`,
      metadata:    { qb_payment_id: qbPaymentId, qb_invoice_id: invoiceId, amount },
      created_by:  "system",
    });

  } catch (err) {
    console.error("QB payment handler error:", err);
  }
}
