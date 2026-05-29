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
  const nextMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0); // last day of next month

  // 1. Fetch all calendar contact links + qb_customer_id
  const { data: links } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, contact_id, vessel_id, contacts(qb_customer_id, name)");

  if (!links || links.length === 0) {
    return NextResponse.json({ invoiced: 0, skipped: 0, message: "No linked events." });
  }

  // Build lookup: series_id -> { contact_id, qb_customer_id, contact_name }
  type LinkInfo = { contactId: string; qbCustomerId: string | null; contactName: string | null };
  const linkBySeriesId = new Map<string, LinkInfo>();
  for (const l of links) {
    const c = l.contacts as unknown as { qb_customer_id: string | null; name: string | null } | null;
    linkBySeriesId.set(l.gcal_event_id, {
      contactId:    l.contact_id,
      qbCustomerId: c?.qb_customer_id ?? null,
      contactName:  c?.name ?? null,
    });
  }

  // 2. Fetch next month's GCal events
  let gcalEvents: { id: string; title: string; start: string; recurringEventId?: string }[] = [];
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    gcalEvents = await listEvents(nextMonthStart, nextMonthEnd);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Calendar events." }, { status: 500 });
  }

  // 3. Load QB recurring templates once
  let templates: Awaited<ReturnType<typeof import("@/lib/quickbooks").listQbRecurringInvoiceTemplates>> = [];
  let getQbInvoiceUrl: typeof import("@/lib/quickbooks").getQbInvoiceUrl;
  let createQbInvoiceFromTemplate: typeof import("@/lib/quickbooks").createQbInvoiceFromTemplate;
  let getValidTokens: typeof import("@/lib/quickbooks").getValidTokens;
  try {
    const qb = await import("@/lib/quickbooks");
    templates = await qb.listQbRecurringInvoiceTemplates();
    getQbInvoiceUrl = qb.getQbInvoiceUrl;
    createQbInvoiceFromTemplate = qb.createQbInvoiceFromTemplate;
    getValidTokens = qb.getValidTokens;
  } catch {
    return NextResponse.json({ error: "Failed to load QuickBooks templates." }, { status: 500 });
  }

  const tokens = await getValidTokens();

  // Build lookup: qb_customer_id -> template
  const templateByCustomer = new Map(
    templates.map(t => [t.Invoice.CustomerRef.value, t])
  );

  // 4. Match events to links
  type WorkItem = {
    event: typeof gcalEvents[0];
    link: LinkInfo;
    template: typeof templates[0];
  };

  const workItems: WorkItem[] = [];
  for (const ev of gcalEvents) {
    const link = linkBySeriesId.get(ev.id) ?? (ev.recurringEventId ? linkBySeriesId.get(ev.recurringEventId) : undefined);
    if (!link || !link.qbCustomerId) continue;
    const template = templateByCustomer.get(link.qbCustomerId);
    if (!template) continue;
    workItems.push({ event: ev, link, template });
  }

  // 5. Dedup: check for existing invoice timeline_events keyed by gcal_event_id
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

  const toProcess = workItems.filter(w => !existingGcalIds.has(w.event.id));

  // 6. Create invoices with pMap(5) concurrency
  const failed: string[] = [];
  let invoiced = 0;

  await pMap(toProcess, async (w) => {
    try {
      const txnDate = w.event.start.includes("T")
        ? new Date(w.event.start).toISOString().slice(0, 10)
        : w.event.start;

      const { invoiceId, docNumber } = await createQbInvoiceFromTemplate(w.template, txnDate);
      const invoiceUrl = getQbInvoiceUrl(tokens.realm_id, invoiceId);

      await supabase.from("timeline_events").insert({
        contact_id: w.link.contactId,
        event_type: "invoice",
        title:      `Invoice #${docNumber}`,
        body:       w.event.title,
        metadata:   {
          qb_invoice_id:  `Invoice:${invoiceId}`,
          doc_number:     docNumber,
          invoice_url:    invoiceUrl,
          gcal_event_id:  w.event.id,
          auto_generated: true,
        },
        created_by: "cron",
      });
      invoiced++;
    } catch (err) {
      failed.push(`${w.link.contactName ?? w.link.contactId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 5);

  // 7. Log summary to system_flags
  const month = nextMonthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  await supabase.from("system_flags").upsert({
    key:        `maintenance_invoices_${nextMonthStart.toISOString().slice(0, 7)}`,
    value:      { invoiced, skipped: toProcess.length - invoiced - failed.length, failed, month },
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  return NextResponse.json({ invoiced, skipped: workItems.length - toProcess.length, failed, month });
}
