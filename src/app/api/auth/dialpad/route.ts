import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.DIALPAD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "DIALPAD_CLIENT_ID not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: process.env.DIALPAD_REDIRECT_URI!,
    response_type: "code",
    scope: "dialpad_connect",
    state: "nwm-dp",
  });

  return NextResponse.redirect(
    `https://dialpad.com/oauth2/authorize?${params.toString()}`
  );
}
