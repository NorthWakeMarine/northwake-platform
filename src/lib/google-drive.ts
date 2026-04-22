import { google } from "googleapis";

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

// Creates a Drive folder named "[Contact Name] - [Asset Name]" and returns its URL.
// The folder is owned by the service account; set GOOGLE_DRIVE_PARENT_FOLDER_ID
// to nest it under a shared team folder (optional).
export async function createAssetFolder(
  contactName: string,
  assetName: string
): Promise<string> {
  const auth  = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const folderName = `${contactName} - ${assetName}`;
  const parents    = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    ? [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID]
    : undefined;

  const res = await drive.files.create({
    requestBody: {
      name:     folderName,
      mimeType: "application/vnd.google-apps.folder",
      ...(parents ? { parents } : {}),
    },
    fields: "id, webViewLink",
  });

  const link = res.data.webViewLink;
  if (!link) throw new Error("Drive did not return a folder link.");
  return link;
}
