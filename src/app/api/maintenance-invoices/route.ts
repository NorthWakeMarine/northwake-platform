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

  const debug = req.nextUrl.searchParams.get("debug") === "1";
  const supabase = svc();

  // Target: next month
  const now = new Date();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  // 1. Fetch all auto-invoice links that have a price set
  const { data: links, error: linkErr } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, contact_id, service_label, invoice_amount, invoice_discount, invoice_qty, invoice_rate, service_template_id, vessel_id, auto_invoice, contacts(qb_customer_id, name), vessels(name)")
    .not("invoice_amount", "is", null)
    .gt("invoice_amount", 0);

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
  if (!links || links.length === 0) {
    return NextResponse.json({ invoiced: 0, skipped: 0, message: "No auto-invoice links configured." });
  }

  const autoLinks = links.filter(l => l.auto_invoice);

  if (debug) {
    // Build the same maps the real run uses so we can show matching results
    const debugLinkMap = new Map<string, string>();
    for (const l of autoLinks) {
      const c = l.contacts as unknown as { qb_customer_id: string | null; name: string | null } | null;
      if (c?.qb_customer_id) debugLinkMap.set(l.gcal_event_id, c.name ?? l.contact_id);
    }
    const debugExtracted = new Map<string, string>();
    for (const [id, name] of debugLinkMap) {
      const m = id.match(/^(.+)_R?\d{8}(?:T\d{6}Z?)?$/);
      if (m) debugExtracted.set(m[1], name);
    }

    let gcalEvents: { id: string; title: string; start: string; recurringEventId?: string }[] = [];
    try {
      const { listEvents } = await import("@/lib/google-calendar");
      gcalEvents = await listEvents(nextMonthStart, nextMonthEnd);
    } catch (e) {
      return NextResponse.json({ error: "GCal fetch failed", detail: String(e) });
    }

    const matched: { gcal_id: string; recurring_id?: string; title: string; start: string; matched_contact: string | null; match_type: string }[] = [];
    for (const ev of gcalEvents) {
      let matchedContact: string | null = null;
      let matchType = "none";
      if (debugLinkMap.has(ev.id)) { matchedContact = debugLinkMap.get(ev.id)!; matchType = "exact"; }
      else if (ev.recurringEventId && debugLinkMap.has(ev.recurringEventId)) { matchedContact = debugLinkMap.get(ev.recurringEventId)!; matchType = "recurringId"; }
      else if (ev.recurringEventId && debugExtracted.has(ev.recurringEventId)) { matchedContact = debugExtracted.get(ev.recurringEventId)!; matchType = "extractedBase"; }
      matched.push({ gcal_id: ev.id, recurring_id: ev.recurringEventId, title: ev.title, start: ev.start, matched_contact: matchedContact, match_type: matchType });
    }

    return NextResponse.json({
      window: { from: nextMonthStart, to: nextMonthEnd },
      total_links: autoLinks.length,
      gcal_events_in_window: gcalEvents.length,
      matched_count: matched.filter(m => m.match_type !== "none").length,
      events: matched,
    });
  }

  // Fetch template descriptions separately to avoid FK join failures
  const templateIds = [...new Set(autoLinks.map(l => l.service_template_id).filter(Boolean))] as string[];
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
    vesselName: string | null;
    serviceLabel: string;
    serviceDescription: string | null;
    invoiceAmount: number;
    invoiceDiscount: number;
    invoiceQty: number;
    invoiceRate: number;
  };

  const linkBySeriesId = new Map<string, LinkInfo>();
  for (const l of autoLinks) {
    const c = l.contacts as unknown as { qb_customer_id: string | null; name: string | null } | null;
    if (!c?.qb_customer_id) continue;
    const v = l.vessels as unknown as { name: string | null } | null;
    const invoiceAmount = Number(l.invoice_amount);
    const invoiceQty    = l.invoice_qty && Number(l.invoice_qty) > 0 ? Number(l.invoice_qty) : 1;
    const invoiceRate   = l.invoice_rate && Number(l.invoice_rate) > 0
      ? Number(l.invoice_rate)
      : invoiceAmount / invoiceQty;
    linkBySeriesId.set(l.gcal_event_id, {
      contactId:          l.contact_id,
      qbCustomerId:       c.qb_customer_id,
      contactName:        c.name ?? null,
      vesselName:         v?.name ?? null,
      serviceLabel:       l.service_label ?? "Maintenance Service",
      serviceDescription: l.service_template_id ? (templateDescMap.get(l.service_template_id) ?? null) : null,
      invoiceAmount,
      invoiceDiscount:    Number(l.invoice_discount ?? 0),
      invoiceQty,
      invoiceRate,
    });
  }

  if (linkBySeriesId.size === 0) {
    return NextResponse.json({ invoiced: 0, skipped: 0, message: "No links with QB customers found." });
  }

  // Also index links stored with a specific instance ID by their extracted base series ID
  // so existing records created before the fix still match future recurring instances
  const linkByExtractedBase = new Map<string, LinkInfo>();
  for (const [storedId, info] of linkBySeriesId) {
    const m = storedId.match(/^(.+)_\d{8}(?:T\d{6}Z?)?$/);
    if (m) linkByExtractedBase.set(m[1], info);
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

  // 4. Match each GCal instance to a link via series base ID
  type WorkItem = {
    eventId: string;
    txnDate: string;
    link: LinkInfo;
  };

  const workItems: WorkItem[] = [];
  for (const ev of gcalEvents) {
    const link = linkBySeriesId.get(ev.id)
      ?? (ev.recurringEventId ? linkBySeriesId.get(ev.recurringEventId) : undefined)
      ?? (ev.recurringEventId ? linkByExtractedBase.get(ev.recurringEventId) : undefined);
    if (!link) continue;
    const txnDate = ev.start.includes("T")
      ? new Date(ev.start).toISOString().slice(0, 10)
      : ev.start;
    workItems.push({ eventId: ev.id, txnDate, link });
  }

  // 5. Dedup: skip GCal event instances already invoiced
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
      const eventDateLabel = new Date(w.txnDate + "T12:00:00").toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });
      const lineParts = [w.link.serviceLabel];
      if (w.link.vesselName) lineParts.push(w.link.vesselName);
      lineParts.push(eventDateLabel);
      const lineDescription = lineParts.join(" - ");

      const { invoiceId, docNumber } = await createQbInvoiceDraft({
        qbCustomerId:    w.link.qbCustomerId!,
        lineDescription,
        itemName:        w.link.serviceLabel,
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
          qb_invoice_id:  `Invoice:${invoiceId}`,
          doc_number:     docNumber || null,
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
