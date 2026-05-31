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

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  const yearMonth      = nextMonthStart.toISOString().slice(0, 7); // e.g. "2026-06"

  // 1. Fetch all auto-invoice links that have a price set
  const { data: links, error: linkErr } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, contact_id, service_label, invoice_amount, invoice_discount, invoice_qty, invoice_rate, billing_frequency, service_template_id, contacts(qb_customer_id, name)")
    .eq("auto_invoice", true)
    .not("invoice_amount", "is", null)
    .gt("invoice_amount", 0);

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
  if (!links || links.length === 0) {
    return NextResponse.json({ invoiced: 0, skipped: 0, message: "No auto-invoice links configured." });
  }

  // Fetch template descriptions separately to avoid FK join failures
  const templateIds = [...new Set(links.map(l => l.service_template_id).filter(Boolean))] as string[];
  const templateDescMap = new Map<string, string | null>();
  if (templateIds.length > 0) {
    const { data: tpls } = await supabase
      .from("service_templates")
      .select("id, description")
      .in("id", templateIds);
    for (const t of tpls ?? []) templateDescMap.set(t.id, t.description ?? null);
  }

  type LinkInfo = {
    contactId: string;
    qbCustomerId: string | null;
    contactName: string | null;
    serviceLabel: string;
    serviceDescription: string | null;
    invoiceAmount: number;
    invoiceDiscount: number;
    invoiceQty: number;
    invoiceRate: number;
    billingFrequency: string;
  };

  const linkBySeriesId = new Map<string, LinkInfo>();
  for (const l of links) {
    const c = l.contacts as unknown as { qb_customer_id: string | null; name: string | null } | null;
    if (!c?.qb_customer_id) continue;
    const invoiceAmount = Number(l.invoice_amount);
    const invoiceRate   = l.invoice_rate ? Number(l.invoice_rate) : invoiceAmount;
    const invoiceQty    = l.invoice_qty  ? Number(l.invoice_qty)  : 1;
    const billingFrequency = l.billing_frequency ?? "monthly";
    if (billingFrequency === "off") continue;
    linkBySeriesId.set(l.gcal_event_id, {
      contactId:          l.contact_id,
      qbCustomerId:       c.qb_customer_id,
      contactName:        c.name ?? null,
      serviceLabel:       l.service_label ?? "Maintenance Service",
      serviceDescription: l.service_template_id ? (templateDescMap.get(l.service_template_id) ?? null) : null,
      invoiceAmount,
      invoiceDiscount:    Number(l.invoice_discount ?? 0),
      invoiceQty,
      invoiceRate,
      billingFrequency,
    });
  }

  if (linkBySeriesId.size === 0) {
    return NextResponse.json({ invoiced: 0, skipped: 0, message: "No links with QB customers found." });
  }

  // 2. Fetch next month's GCal events, group by series ID
  let gcalEvents: { id: string; title: string; start: string; recurringEventId?: string }[] = [];
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    gcalEvents = await listEvents(nextMonthStart, nextMonthEnd);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Calendar events." }, { status: 500 });
  }

  // Group GCal event instances by their series base ID
  const eventsBySeriesId = new Map<string, typeof gcalEvents>();
  for (const ev of gcalEvents) {
    const seriesId = ev.recurringEventId ?? ev.id;
    if (!eventsBySeriesId.has(seriesId)) eventsBySeriesId.set(seriesId, []);
    eventsBySeriesId.get(seriesId)!.push(ev);
  }
  // Sort each group by start date ascending
  for (const evs of eventsBySeriesId.values()) {
    evs.sort((a, b) => a.start.localeCompare(b.start));
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

  // 4. Build work items based on billing_frequency
  type WorkItem = {
    seriesId: string;
    txnDate: string;
    billingPeriodKey: string;
    link: LinkInfo;
  };

  const workItems: WorkItem[] = [];

  for (const [seriesId, link] of linkBySeriesId.entries()) {
    const seriesEvents = eventsBySeriesId.get(seriesId) ?? [];

    function eventDate(ev: { start: string }): string {
      return ev.start.includes("T") ? new Date(ev.start).toISOString().slice(0, 10) : ev.start;
    }

    if (link.billingFrequency === "monthly" || link.billingFrequency === "every_6_weeks") {
      // One invoice per month, dated at the first GCal occurrence or day 1
      const date = seriesEvents.length > 0 ? eventDate(seriesEvents[0]) : toDateStr(nextMonthStart);
      workItems.push({
        seriesId,
        txnDate: date,
        billingPeriodKey: `${seriesId}_${yearMonth}`,
        link,
      });
    } else if (link.billingFrequency === "twice_monthly") {
      // Two invoices per month
      const date1 = seriesEvents.length > 0 ? eventDate(seriesEvents[0]) : toDateStr(nextMonthStart);
      const date2 = seriesEvents.length > 1
        ? eventDate(seriesEvents[1])
        : toDateStr(new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), 15));
      workItems.push({
        seriesId,
        txnDate: date1,
        billingPeriodKey: `${seriesId}_${yearMonth}-1`,
        link,
      });
      workItems.push({
        seriesId,
        txnDate: date2,
        billingPeriodKey: `${seriesId}_${yearMonth}-2`,
        link,
      });
    }
  }

  // 5. Dedup: skip billing periods already invoiced
  const allContactIds = [...new Set(workItems.map(w => w.link.contactId))];
  const existingCheck = await supabase
    .from("timeline_events")
    .select("metadata")
    .eq("event_type", "invoice")
    .in("contact_id", allContactIds);

  const existingPeriodKeys = new Set<string>(
    (existingCheck.data ?? [])
      .map(e => (e.metadata as { billing_period_key?: string } | null)?.billing_period_key)
      .filter(Boolean) as string[]
  );
  // Also check old-style gcal_event_id dedup for backwards compat
  const existingGcalEventIds = new Set<string>(
    (existingCheck.data ?? [])
      .map(e => (e.metadata as { gcal_event_id?: string } | null)?.gcal_event_id)
      .filter(Boolean) as string[]
  );

  // Build a set of gcal instance IDs for this month's events (for old-style dedup)
  const thisMonthInstanceIds = new Set<string>(gcalEvents.map(e => e.id));

  const toProcess = workItems.filter(w => {
    if (existingPeriodKeys.has(w.billingPeriodKey)) return false;
    // Old-style: if any of this series's instances from next month are already logged, skip
    const seriesEvents = eventsBySeriesId.get(w.seriesId) ?? [];
    for (const ev of seriesEvents) {
      if (existingGcalEventIds.has(ev.id) && thisMonthInstanceIds.has(ev.id)) return false;
    }
    return true;
  });

  // 6. Create invoices
  const failed: string[] = [];
  let invoiced = 0;

  await pMap(toProcess, async (w) => {
    try {
      const { invoiceId, docNumber } = await createQbInvoiceDraft({
        qbCustomerId:    w.link.qbCustomerId!,
        lineDescription: w.link.serviceLabel,
        lineBody:        w.link.serviceDescription,
        amount:          w.link.invoiceAmount,
        discount:        w.link.invoiceDiscount,
        qty:             w.link.invoiceQty,
        rate:            w.link.invoiceRate,
        txnDate:         w.txnDate,
      });
      const invoiceUrl = getQbInvoiceUrl(tokens.realm_id, invoiceId);

      await supabase.from("timeline_events").insert({
        contact_id: w.link.contactId,
        event_type: "invoice",
        title:      docNumber ? `Invoice #${docNumber}` : "Invoice (Draft)",
        body:       w.link.serviceLabel,
        metadata:   {
          qb_invoice_id:     `Invoice:${invoiceId}`,
          doc_number:        docNumber || null,
          invoice_url:       invoiceUrl,
          billing_period_key: w.billingPeriodKey,
          auto_generated:    true,
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
    key:        `maintenance_invoices_${yearMonth}`,
    value:      { invoiced, skipped: toProcess.length - invoiced - failed.length, failed, month },
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  return NextResponse.json({ invoiced, skipped: workItems.length - toProcess.length, failed, month });
}
