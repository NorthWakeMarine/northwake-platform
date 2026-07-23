import { NextRequest, NextResponse } from "next/server";
import { runIntegrityCheck, importQbCustomers, importQbInvoices, importQbItems, pushCrmToQuickBooks, syncVesselsToQbNotes, importQuoContacts, pushCrmToQuo } from "@/app/actions";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [qb, invoices, items, pushQb, qbNotes, quo, quoPush, integrity] = await Promise.allSettled([
    importQbCustomers(),
    importQbInvoices(),
    importQbItems(),
    pushCrmToQuickBooks(),
    syncVesselsToQbNotes(),
    importQuoContacts(),
    pushCrmToQuo(),
    runIntegrityCheck(),
  ]);

  return NextResponse.json({
    qb:        qb.status        === "fulfilled" ? qb.value        : { error: (qb.reason as Error)?.message },
    invoices:  invoices.status  === "fulfilled" ? invoices.value  : { error: (invoices.reason as Error)?.message },
    items:     items.status     === "fulfilled" ? items.value     : { error: (items.reason as Error)?.message },
    pushQb:    pushQb.status    === "fulfilled" ? pushQb.value    : { error: (pushQb.reason as Error)?.message },
    qbNotes:   qbNotes.status   === "fulfilled" ? qbNotes.value   : { error: (qbNotes.reason as Error)?.message },
    quo:       quo.status       === "fulfilled" ? quo.value       : { error: (quo.reason as Error)?.message },
    quoPush:   quoPush.status   === "fulfilled" ? quoPush.value   : { error: (quoPush.reason as Error)?.message },
    integrity: integrity.status === "fulfilled" ? integrity.value : { error: (integrity.reason as Error)?.message },
    ran_at: new Date().toISOString(),
  });
}
