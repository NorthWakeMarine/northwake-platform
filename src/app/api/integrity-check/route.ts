import { NextRequest, NextResponse } from "next/server";
import { runIntegrityCheck } from "@/app/actions";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runIntegrityCheck();
  return NextResponse.json(result);
}
