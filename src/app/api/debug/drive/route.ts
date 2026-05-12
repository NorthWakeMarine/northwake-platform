import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID ?? null;
  const serviceEmail   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null;

  // Build auth
  let auth;
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key:   process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    } else {
      return NextResponse.json({ error: "No service account credentials found." });
    }
  } catch (e) {
    return NextResponse.json({ error: "Auth build failed", detail: String(e) });
  }

  const drive = google.drive({ version: "v3", auth });

  // Step 1: verify the parent folder exists and is accessible
  let folderInfo = null;
  let folderError = null;
  if (parentFolderId) {
    try {
      const res = await drive.files.get({
        fileId: parentFolderId,
        supportsAllDrives: true,
        fields: "id, name, driveId, parents",
      });
      folderInfo = { id: res.data.id, name: res.data.name, driveId: res.data.driveId ?? null };
    } catch (e: unknown) {
      folderError = (e as { message?: string })?.message ?? String(e);
    }
  }

  // Step 2: try creating a tiny test file
  let uploadResult = null;
  let uploadError = null;
  if (parentFolderId && !folderError) {
    try {
      const res = await drive.files.create({
        supportsAllDrives: true,
        requestBody: { name: "_drive_test.txt", parents: [parentFolderId] },
        media: { mimeType: "text/plain", body: Readable.from(Buffer.from("test")) },
        fields: "id, name, webViewLink",
      });
      uploadResult = { id: res.data.id, name: res.data.name };
      // Clean up test file
      if (res.data.id) {
        await drive.files.delete({ fileId: res.data.id, supportsAllDrives: true }).catch(() => {});
      }
    } catch (e: unknown) {
      uploadError = (e as { message?: string })?.message ?? String(e);
    }
  }

  return NextResponse.json({
    serviceEmail,
    parentFolderId,
    folderInfo,
    folderError,
    uploadResult,
    uploadError,
  });
}
