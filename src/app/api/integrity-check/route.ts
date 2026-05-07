import { NextRequest, NextResponse } from "next/server";
import { runIntegrityCheck, importQbCustomers, syncDialpadContacts, promoteDialpadLocalToCompany } from "@/app/actions";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [qb, promote, dialpad, integrity] = await Promise.allSettled([
    importQbCustomers(),
    promoteDialpadLocalToCompany(),
    syncDialpadContacts(),
    runIntegrityCheck(),
  ]);

  return NextResponse.json({
    qb:        qb.status        === "fulfilled" ? qb.value        : { error: (qb.reason as Error)?.message },
    promote:   promote.status   === "fulfilled" ? promote.value   : { error: (promote.reason as Error)?.message },
    dialpad:   dialpad.status   === "fulfilled" ? dialpad.value   : { error: (dialpad.reason as Error)?.message },
    integrity: integrity.status === "fulfilled" ? integrity.value : { error: (integrity.reason as Error)?.message },
    ran_at: new Date().toISOString(),
  });
}
