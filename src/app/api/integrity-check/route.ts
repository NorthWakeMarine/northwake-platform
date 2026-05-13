import { NextRequest, NextResponse } from "next/server";
import { runIntegrityCheck, importQbCustomers, importQbInvoices, syncDialpadContacts, promoteDialpadLocalToCompany, pushCrmToDialpad, pushCrmToQuickBooks, syncVesselsToQbNotes, importOpenPhoneContacts, pushCrmToOpenPhone } from "@/app/actions";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [qb, invoices, promote, dialpad, pushDialpad, pushQb, qbNotes, openphone, opPush, integrity] = await Promise.allSettled([
    importQbCustomers(),
    importQbInvoices(),
    promoteDialpadLocalToCompany(),
    syncDialpadContacts(),
    pushCrmToDialpad(),
    pushCrmToQuickBooks(),
    syncVesselsToQbNotes(),
    importOpenPhoneContacts(),
    pushCrmToOpenPhone(),
    runIntegrityCheck(),
  ]);

  return NextResponse.json({
    qb:          qb.status          === "fulfilled" ? qb.value          : { error: (qb.reason as Error)?.message },
    invoices:    invoices.status    === "fulfilled" ? invoices.value    : { error: (invoices.reason as Error)?.message },
    promote:     promote.status     === "fulfilled" ? promote.value     : { error: (promote.reason as Error)?.message },
    dialpad:     dialpad.status     === "fulfilled" ? dialpad.value     : { error: (dialpad.reason as Error)?.message },
    pushDialpad: pushDialpad.status === "fulfilled" ? pushDialpad.value : { error: (pushDialpad.reason as Error)?.message },
    pushQb:      pushQb.status      === "fulfilled" ? pushQb.value      : { error: (pushQb.reason as Error)?.message },
    qbNotes:     qbNotes.status     === "fulfilled" ? qbNotes.value     : { error: (qbNotes.reason as Error)?.message },
    openphone:   openphone.status   === "fulfilled" ? openphone.value   : { error: (openphone.reason as Error)?.message },
    opPush:      opPush.status      === "fulfilled" ? opPush.value      : { error: (opPush.reason as Error)?.message },
    integrity:   integrity.status   === "fulfilled" ? integrity.value   : { error: (integrity.reason as Error)?.message },
    ran_at: new Date().toISOString(),
  });
}
