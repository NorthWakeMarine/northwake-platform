import { NextRequest, NextResponse } from "next/server";
import { generateWaiverPdf } from "@/lib/waiver-pdf";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, address, phone, email, boat, date, signature } = body as Record<string, string>;
  if (!name || !address || !phone || !email || !boat || !date || !signature) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pdf = await generateWaiverPdf({ name, address, phone, email, boat, date, signature });
  const filename = `NorthWake-Waiver-${name.replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
