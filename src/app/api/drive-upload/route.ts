import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const contactId = formData.get("contact_id") as string | null;
  const file      = formData.get("file") as File | null;

  if (!contactId || !file) {
    return NextResponse.json({ error: "Missing contact_id or file." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Get contact name + existing folder ID
  const { data: contact } = await supabase
    .from("contacts")
    .select("name, drive_folder_id, drive_folder_url")
    .eq("id", contactId)
    .single();

  if (!contact) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  const { getOrCreateContactFolder, uploadFileToFolder } = await import("@/lib/google-drive");

  // Create folder if it doesn't exist yet
  let folderId = contact.drive_folder_id as string | null;
  if (!folderId) {
    const folder = await getOrCreateContactFolder(contact.name ?? "Unknown Contact");
    folderId = folder.id;
    await supabase
      .from("contacts")
      .update({ drive_folder_id: folder.id, drive_folder_url: folder.url })
      .eq("id", contactId);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadFileToFolder(folderId, file.name, file.type || "application/octet-stream", buffer);

  return NextResponse.json({ ok: true, file: uploaded });
}
