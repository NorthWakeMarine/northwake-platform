import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.QB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "QB_CLIENT_ID not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: process.env.QB_REDIRECT_URI!,
    response_type: "code",
    state: "nwm-qb",
  });

  return NextResponse.redirect(
    `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`
  );
}
