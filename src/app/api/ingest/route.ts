import { NextRequest, NextResponse } from "next/server";
import { ingestContact } from "@/lib/ingest";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || token !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email && !body.phone) {
    return NextResponse.json(
      { error: "At least one of email or phone is required." },
      { status: 400 }
    );
  }

  try {
    const result = await ingestContact({
      name: body.name as string | undefined,
      email: body.email as string | undefined,
      phone: body.phone as string | undefined,
      vessel_type: body.vessel_type as string | undefined,
      vessel_length: body.vessel_length as string | undefined,
      source: (body.source as string | undefined) ?? "api",
      event_type: body.event_type as string | undefined,
      event_title: body.event_title as string | undefined,
      event_body: body.event_body as string | undefined,
      metadata: body.metadata as Record<string, unknown> | undefined,
    });

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
