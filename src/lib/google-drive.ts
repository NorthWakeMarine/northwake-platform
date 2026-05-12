import { google } from "googleapis";
import { Readable } from "stream";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

function getAuth() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: [DRIVE_SCOPE],
    });
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return new google.auth.JWT({
      email:  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key:    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: [DRIVE_SCOPE],
    });
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? "urn:ietf:wg:oauth:2.0:oob"
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

function parents() {
  const id = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  return id ? [id] : undefined;
}

// Creates a Drive folder for an asset and returns its URL.
export async function createAssetFolder(
  contactName: string,
  assetName: string
): Promise<string> {
  const auth  = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const p     = parents();

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name:     `${contactName} - ${assetName}`,
      mimeType: "application/vnd.google-apps.folder",
      ...(p ? { parents: p } : {}),
    },
    fields: "id, webViewLink",
  });

  const link = res.data.webViewLink;
  if (!link) throw new Error("Drive did not return a folder link.");
  return link;
}

// Gets or creates a contact-level Documents folder. Returns { id, url }.
export async function getOrCreateContactFolder(
  contactName: string
): Promise<{ id: string; url: string }> {
  const auth  = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const p     = parents();
  const name  = `${contactName} - Documents`;

  const existing = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: `name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, webViewLink)",
    pageSize: 1,
  });

  const found = existing.data.files?.[0];
  if (found?.id && found?.webViewLink) {
    return { id: found.id, url: found.webViewLink };
  }

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(p ? { parents: p } : {}),
    },
    fields: "id, webViewLink",
  });

  if (!res.data.id || !res.data.webViewLink) throw new Error("Failed to create contact folder.");
  return { id: res.data.id, url: res.data.webViewLink };
}

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
  size: string | null;
};

// Lists files inside a Drive folder.
export async function listFolderFiles(folderId: string): Promise<DriveFile[]> {
  const auth  = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q:      `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink, createdTime, size)",
    orderBy: "createdTime desc",
    pageSize: 50,
  });

  return (res.data.files ?? []).map((f) => ({
    id:          f.id!,
    name:        f.name!,
    mimeType:    f.mimeType!,
    webViewLink: f.webViewLink!,
    createdTime: f.createdTime!,
    size:        f.size ?? null,
  }));
}

// Uploads a file buffer to a Drive folder. Returns the file's view URL.
export async function uploadFileToFolder(
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ id: string; url: string; name: string }> {
  const auth  = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink, name",
  });

  if (!res.data.id || !res.data.webViewLink) throw new Error("Upload failed.");
  return { id: res.data.id, url: res.data.webViewLink, name: res.data.name! };
}
