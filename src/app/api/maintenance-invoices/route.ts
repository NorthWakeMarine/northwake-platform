import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

async function pMap<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = svc();

  // Target: next month
  const now = new Date();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  // 1. Fetch all auto-invoice links that have a price set
  const { data: links, error: linkErr } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, contact_id, service_label, invoice_amount, contacts(qb_customer_id, name)")
    .eq("auto_invoice", true)
    .not("invoice_amount", "is", null)
    .gt("invoice_amount", 0);

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
  if (!links || links.length === 0) {
    return NextResponse.json({ invoiced: 0, skipped: 0, message: "No auto-invoice links configured." });
  }

  type LinkInfo = {
    contactId: string;
    qbCustomerId: string | null;
    contactName: string | null;
    serviceLabel: string;
    invoiceAmount: number;
  };

  const linkBySeriesId = new Map<string, LinkInfo>();
  for (const l of links) {
    const c = l.contacts as unknown as { qb_customer_id: string | null; name: string | null } | null;
    if (!c?.qb_customer_id) continue;
    linkBySeriesId.set(l.gcal_event_id, {
      contactId:     l.contact_id,
      qbCustomerId:  c.qb_customer_id,
      contactName:   c.name ?? null,
      serviceLabel:  l.service_label ?? "Maintenance Service",
      invoiceAmount: Number(l.invoice_amount),
    });
  }

  if (linkBySeriesId.size === 0) {
    return NextResponse.json({ invoiced: 0, skipped: 0, message: "No links with QB customers found." });
  }

  // 2. Fetch next month's GCal events
  let gcalEvents: { id: string; title: string; start: string; recurringEventId?: string }[] = [];
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    gcalEvents = await listEvents(nextMonthStart, nextMonthEnd);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Calendar events." }, { status: 500 });
  }

  // 3. Load QB helpers
  let createQbInvoiceDraft: typeof import("@/lib/quickbooks").createQbInvoiceDraft;
  let getQbInvoiceUrl: typeof import("@/lib/quickbooks").getQbInvoiceUrl;
  let getValidTokens: typeof import("@/lib/quickbooks").getValidTokens;
  try {
    const qb = await import("@/lib/quickbooks");
    createQbInvoiceDraft = qb.createQbInvoiceDraft;
    getQbInvoiceUrl      = qb.getQbInvoiceUrl;
    getValidTokens       = qb.getValidTokens;
  } catch {
    return NextResponse.json({ error: "Failed to load QuickBooks module." }, { status: 500 });
  }

  const tokens = await getValidTokens();

  // 4. Match calendar events to auto-invoice links
  type WorkItem = {
    eventId: string;
    txnDate: string;
    link: LinkInfo;
  };

  const workItems: WorkItem[] = [];
  for (const ev of gcalEvents) {
    const link = linkBySeriesId.get(ev.id) ?? (ev.recurringEventId ? linkBySeriesId.get(ev.recurringEventId) : undefined);
    if (!link) continue;
    const txnDate = ev.start.includes("T")
      ? new Date(ev.start).toISOString().slice(0, 10)
      : ev.start;
    workItems.push({ eventId: ev.id, txnDate, link });
  }

  // 5. Dedup: skip events already invoiced
  const existingCheck = await supabase
    .from("timeline_events")
    .select("metadata")
    .eq("event_type", "invoice")
    .in("contact_id", [...new Set(workItems.map(w => w.link.contactId))]);

  const existingGcalIds = new Set<string>(
    (existingCheck.data ?? [])
      .map(e => (e.metadata as { gcal_event_id?: string } | null)?.gcal_event_id)
      .filter(Boolean) as string[]
  );

  const toProcess = workItems.filter(w => !existingGcalIds.has(w.eventId));

  // 6. Create invoices
  const failed: string[] = [];
  let invoiced = 0;

  await pMap(toProcess, async (w) => {
    try {
      const { invoiceId, docNumber } = await createQbInvoiceDraft({
        qbCustomerId:    w.link.qbCustomerId!,
        lineDescription: w.link.serviceLabel,
        amount:          w.link.invoiceAmount,
      });
      const invoiceUrl = getQbInvoiceUrl(tokens.realm_id, invoiceId);

      await supabase.from("timeline_events").insert({
        contact_id: w.link.contactId,
        event_type: "invoice",
        title:      `Invoice #${docNumber}`,
        body:       w.link.serviceLabel,
        metadata:   {
          qb_invoice_id:  `Invoice:${invoiceId}`,
          doc_number:     docNumber,
          invoice_url:    invoiceUrl,
          gcal_event_id:  w.eventId,
          auto_generated: true,
        },
        created_by: "cron",
      });
      invoiced++;
    } catch (err) {
      failed.push(`${w.link.contactName ?? w.link.contactId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 5);

  // 7. Log summary
  const month = nextMonthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  await supabase.from("system_flags").upsert({
    key:        `maintenance_invoices_${nextMonthStart.toISOString().slice(0, 7)}`,
    value:      { invoiced, skipped: toProcess.length - invoiced - failed.length, failed, month },
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  return NextResponse.json({ invoiced, skipped: workItems.length - toProcess.length, failed, month });
}
