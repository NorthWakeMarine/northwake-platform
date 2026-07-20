import ProShell from "@/components/ProShell";
import CalendarClient, { type EventLink } from "./CalendarClient";
import type { CalendarEvent } from "@/lib/google-calendar";
import { createClient } from "@supabase/supabase-js";
import { getServiceTemplates } from "@/app/actions";

export const dynamic = "force-dynamic";

async function fetchEvents(): Promise<CalendarEvent[]> {
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    const now = new Date();
    const from = new Date(2025, 6, 1);
    const to   = new Date(now.getFullYear(), now.getMonth() + 18, 1);
    return await listEvents(from, to);
  } catch {
    return [];
  }
}

async function fetchLinkMap(): Promise<Record<string, EventLink>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const { data } = await supabase
      .from("calendar_contact_links")
      .select("gcal_event_id, contact_id, vessel_id, service_label, invoice_amount, invoice_discount, invoice_qty, invoice_rate, auto_invoice, sms_reminder_enabled, color_id, contacts(name, qb_customer_id), vessels(name, make_model)");

    const map: Record<string, EventLink> = {};
    for (const row of data ?? []) {
      const c = row.contacts as unknown as { name: string | null; qb_customer_id: string | null } | null;
      const v = row.vessels  as unknown as { name: string | null; make_model: string | null } | null;
      map[row.gcal_event_id] = {
        contactId:       row.contact_id,
        contactName:     c?.name ?? null,
        vesselId:        row.vessel_id ?? null,
        vesselLabel:     v ? [v.name, v.make_model].filter(Boolean).join(" ") : null,
        serviceLabel:    row.service_label ?? null,
        invoiceAmount:   row.invoice_amount ?? null,
        invoiceDiscount: row.invoice_discount ?? null,
        invoiceQty:      row.invoice_qty ?? null,
        invoiceRate:     row.invoice_rate ?? null,
        autoInvoice:     row.auto_invoice ?? false,
        smsReminderEnabled: row.sms_reminder_enabled ?? true,
        colorId:         row.color_id ?? null,
        qbCustomerId:    c?.qb_customer_id ?? null,
      };
    }
    return map;
  } catch {
    return {};
  }
}

export default async function CalendarPage() {
  const [events, linkMap, serviceTemplates] = await Promise.all([
    fetchEvents(),
    fetchLinkMap(),
    getServiceTemplates(),
  ]);
  return (
    <ProShell>
      <div className="flex-1 flex flex-col min-h-0">
        <CalendarClient events={events} linkMap={linkMap} serviceTemplates={serviceTemplates} />
      </div>
    </ProShell>
  );
}
