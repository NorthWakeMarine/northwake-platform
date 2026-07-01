"use client";

import { useRef, useState } from "react";
import type { DriveFile } from "@/lib/google-drive";

// Resize + compress JPEG/PNG images to max 2048px before upload.
// iPhone photos are 5-10 MB; Vercel's body limit is 4.5 MB.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = url;
    });
    URL.revokeObjectURL(url);

    const MAX = 2048;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w <= MAX && h <= MAX && file.size < 3 * 1024 * 1024) return file;
    if (w > MAX || h > MAX) {
      const scale = MAX / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type WaiverEvent = {
  id: string;
  created_at: string;
  metadata?: Record<string, string> | null;
};

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  return "FILE";
}

function fmtSize(bytes: string | null) {
  if (!bytes) return "";
  const n = parseInt(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ContactDocuments({
  contactId,
  initialFiles,
  folderUrl: initialFolderUrl,
  waiverEvents,
}: {
  contactId: string;
  initialFiles: DriveFile[];
  folderUrl: string | null;
  waiverEvents: WaiverEvent[];
}) {
  const [files, setFiles] = useState<DriveFile[]>(initialFiles);
  const [folderUrl, setFolderUrl] = useState<string | null>(initialFolderUrl);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setError(null);

    const errors: string[] = [];
    for (let i = 0; i < selected.length; i++) {
      const raw  = selected[i];
      setUploadProgress(selected.length > 1 ? `Uploading ${i + 1} of ${selected.length}...` : "Uploading...");

      const file = await compressImage(raw);
      const fd = new FormData();
      fd.append("contact_id", contactId);
      fd.append("file", file);

      try {
        const res = await fetch("/api/drive-upload", { method: "POST", body: fd });
        // Guard against non-JSON error responses (e.g. 413 from Vercel body limit)
        const text = await res.text();
        let json: Record<string, unknown>;
        try { json = JSON.parse(text); } catch { throw new Error(`Upload failed (${res.status})`); }
        if (!res.ok) throw new Error((json.error as string) ?? "Upload failed.");
        if (json.folderUrl && !folderUrl) setFolderUrl(json.folderUrl as string);
        const uploaded: DriveFile = {
          id:          json.file ? (json.file as { id: string }).id : "",
          name:        json.file ? (json.file as { name: string }).name : file.name,
          mimeType:    file.type || "application/octet-stream",
          webViewLink: json.file ? (json.file as { url: string }).url : "",
          createdTime: new Date().toISOString(),
          size:        String(file.size),
        };
        setFiles((prev) => [uploaded, ...prev]);
      } catch (err) {
        errors.push(`${raw.name}: ${err instanceof Error ? err.message : "Upload failed."}`);
      }
    }

    setUploadProgress(null);
    if (errors.length) setError(errors.join(" · "));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="bg-[#F1F2F5] neu-card rounded-md">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-slate-800 text-sm font-semibold">Documents</h3>
          <p className="text-slate-400 text-[11px] mt-0.5">Waivers, COIs, and other files</p>
        </div>
        <div className="flex items-center gap-3">
          {folderUrl && (
            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] tracking-widest uppercase text-slate-400 hover:text-slate-600 font-medium border border-slate-200 px-2.5 py-1.5 rounded-sm transition-colors"
            >
              Open Folder
            </a>
          )}
          <label className={`flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-semibold px-3 py-1.5 rounded-sm cursor-pointer transition-colors border ${
            uploadProgress
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              : "bg-[#000080] text-white border-[#000080] hover:bg-[#0000a0]"
          }`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {uploadProgress ?? "Upload"}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              disabled={!!uploadProgress}
              onChange={handleUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.heic"
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs px-6 py-3 border-b border-red-100">{error}</p>
      )}

      {files.length === 0 && waiverEvents.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-slate-400 text-sm">No documents yet.</p>
          <p className="text-slate-300 text-xs mt-1">Upload a signed waiver, COI, or any other file.</p>
        </div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: "calc(5 * 56px)" }}>
          {/* Waivers from timeline events (submitted via website) */}
          {waiverEvents.length > 0 && (
            <ul className="divide-y divide-slate-50">
              {waiverEvents.map((ev) => {
                const m = ev.metadata;
                const pdfUrl = m?.drive_file_url ?? null;
                return (
                  <li key={ev.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-sm bg-emerald-50 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-emerald-600 tracking-wider">WAV</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-xs font-medium truncate">
                        Signed Waiver{m?.name ? ` — ${m.name}` : ""}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5">
                        {m?.date ?? fmtDate(ev.created_at)}
                        {m?.boat ? ` · ${m.boat}` : ""}
                      </p>
                    </div>
                    {pdfUrl ? (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] tracking-widest uppercase text-blue-500 hover:text-blue-700 font-medium transition-colors whitespace-nowrap shrink-0"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-[10px] tracking-widest uppercase text-emerald-600 font-medium whitespace-nowrap shrink-0">
                        Signed
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {files.length > 0 && (
            <ul className="divide-y divide-slate-50">
              {files.map((f) => (
                <li key={f.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-slate-500 tracking-wider">{fileIcon(f.mimeType)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-xs font-medium truncate">{f.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      {fmtDate(f.createdTime)}{f.size ? ` · ${fmtSize(f.size)}` : ""}
                    </p>
                  </div>
                  <a
                    href={f.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase text-blue-500 hover:text-blue-700 font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    Open
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
