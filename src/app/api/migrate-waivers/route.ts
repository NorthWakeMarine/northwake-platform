import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// POST /api/migrate-waivers
// Finds all contacts whose Drive folder contains a .txt waiver file, generates
// a full PDF version, uploads it, and (optionally) deletes the old txt file.
export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { createClient } = await import("@supabase/supabase-js");
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Fetch all contacts with a drive folder and a signed waiver
  const { data: contacts, error } = await supa
    .from("contacts")
    .select("id, name, drive_folder_id")
    .eq("waiver_signed", true)
    .not("drive_folder_id", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { listFolderFiles, uploadFileToFolder } = await import("@/lib/google-drive");
  const { generateWaiverPdf } = await import("@/lib/waiver-pdf");
  const { google } = await import("googleapis");

  // Build a Drive client for deletions
  const getAuth = () => {
    const svcJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (svcJson) return new google.auth.GoogleAuth({ credentials: JSON.parse(svcJson), scopes: ["https://www.googleapis.com/auth/drive"] });
    const jwt = process.env.GOOGLE_SERVICE_ACCOUNT_JWT;
    if (jwt) return new google.auth.GoogleAuth({ keyFile: jwt, scopes: ["https://www.googleapis.com/auth/drive"] });
    return new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive"] });
  };

  const results: { contactId: string; name: string; status: string; detail?: string }[] = [];

  for (const contact of contacts ?? []) {
    const folderId = contact.drive_folder_id as string;
    let files;
    try {
      files = await listFolderFiles(folderId);
    } catch (e) {
      results.push({ contactId: contact.id, name: contact.name, status: "error", detail: "Could not list folder files" });
      continue;
    }

    const txtWaivers = files.filter(
      (f) => f.name.startsWith("Waiver -") && f.name.endsWith(".txt")
    );

    if (txtWaivers.length === 0) {
      results.push({ contactId: contact.id, name: contact.name, status: "skipped", detail: "No txt waiver found" });
      continue;
    }

    // Fetch the waiver timeline event to get the stored signature data
    const { data: events } = await supa
      .from("timeline_events")
      .select("metadata")
      .eq("contact_id", contact.id)
      .eq("event_type", "waiver_signed")
      .order("created_at", { ascending: false })
      .limit(1);

    const meta = events?.[0]?.metadata as Record<string, string> | undefined;
    if (!meta) {
      results.push({ contactId: contact.id, name: contact.name, status: "skipped", detail: "No waiver metadata found in timeline" });
      continue;
    }

    try {
      const pdfBuffer = await generateWaiverPdf({
        name:      meta.name      || contact.name || "",
        address:   meta.address   || "",
        phone:     meta.phone     || "",
        email:     meta.email     || "",
        boat:      meta.boat      || "",
        date:      meta.date      || "",
        signature: meta.signature || "",
      });

      // Name matches the txt file but with .pdf extension
      const pdfName = txtWaivers[0].name.replace(/\.txt$/, ".pdf");

      // Check if PDF already exists
      const alreadyExists = files.some((f) => f.name === pdfName);
      if (!alreadyExists) {
        await uploadFileToFolder(folderId, pdfName, "application/pdf", pdfBuffer);
      }

      // Delete the old txt file(s)
      const auth = getAuth();
      const drive = google.drive({ version: "v3", auth });
      for (const txt of txtWaivers) {
        await drive.files.delete({ fileId: txt.id, supportsAllDrives: true });
      }

      results.push({ contactId: contact.id, name: contact.name, status: alreadyExists ? "pdf-existed-txt-deleted" : "converted" });
    } catch (e) {
      results.push({ contactId: contact.id, name: contact.name, status: "error", detail: String(e) });
    }
  }

  const converted = results.filter((r) => r.status === "converted").length;
  const skipped   = results.filter((r) => r.status.startsWith("skipped")).length;
  const errors    = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ converted, skipped, errors, results });
}
