"use client";

import { useRef, useState, useCallback } from "react";

export type CarouselImage = {
  id: string;
  storage_path: string;
  public_url: string;
  display_order: number;
  focal_x: number;
  focal_y: number;
  active: boolean;
};

function FocalPicker({
  image,
  onSave,
  onClose,
}: {
  image: CarouselImage;
  onSave: (x: number, y: number) => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ x: image.focal_x, y: image.focal_y });
  const containerRef = useRef<HTMLDivElement>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPos({ x, y });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="relative bg-[#06061a] border border-white/10 rounded-sm overflow-hidden"
        style={{ maxWidth: "90vw", maxHeight: "90vh", width: 800 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-white text-sm font-semibold">Set Focal Point</p>
            <p className="text-white/40 text-[11px] mt-0.5">Click the image to set where to keep in frame when cropped.</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">×</button>
        </div>

        <div
          ref={containerRef}
          className="relative cursor-crosshair"
          style={{ height: 480 }}
          onClick={handleClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.public_url}
            alt="Focal point picker"
            className="w-full h-full object-contain"
          />
          {/* Preview overlay showing the crop at 16:6 aspect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(to bottom,
                  rgba(0,0,0,0.55) 0%,
                  transparent 25%,
                  transparent 75%,
                  rgba(0,0,0,0.55) 100%
                )
              `,
            }}
          />
          {/* Crosshair dot */}
          <div
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-white/80 bg-[#000080]/60" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/60 -translate-y-1/2" />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <p className="text-white/40 text-[11px]">
            Position: {pos.x}% / {pos.y}%
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-xs px-4 py-2 border border-white/10 hover:border-white/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(pos.x, pos.y); onClose(); }}
              className="bg-[#000080] hover:bg-[#0000a0] text-white text-xs px-4 py-2 transition-colors font-medium"
            >
              Save Focal Point
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ image, onClose }: { image: CarouselImage; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90" onClick={onClose}>
      <div
        className="relative bg-[#06061a] border border-white/10 rounded-sm overflow-hidden"
        style={{ maxWidth: "95vw", width: 1100 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-white text-sm font-semibold">Preview — as it appears in the carousel</p>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Simulated carousel frame */}
        <div className="relative overflow-hidden" style={{ height: 420 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.public_url}
            alt="Preview"
            className="w-full h-full object-cover"
            style={{ objectPosition: `${image.focal_x}% ${image.focal_y}%` }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, transparent 100%)",
            }}
          />
          <div className="absolute bottom-6 left-8 text-white/60 text-[10px] tracking-[0.3em] uppercase">
            Focal point: {image.focal_x}% / {image.focal_y}%
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 text-right">
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xs px-4 py-2 border border-white/10 hover:border-white/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CarouselManager({ initialImages }: { initialImages: CarouselImage[] }) {
  const [images, setImages] = useState<CarouselImage[]>(
    [...initialImages].sort((a, b) => a.display_order - b.display_order)
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [focalTarget, setFocalTarget] = useState<CarouselImage | null>(null);
  const [previewTarget, setPreviewTarget] = useState<CarouselImage | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploading(true);
    const results: CarouselImage[] = [];
    for (const file of arr) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/carousel/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.image) results.push(json.image as CarouselImage);
    }
    setImages((prev) => [...prev, ...results]);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  }

  async function handleDelete(img: CarouselImage) {
    if (!confirm(`Remove this image from the carousel?`)) return;
    setSaving(img.id);
    await fetch("/api/carousel/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: img.id, storage_path: img.storage_path }),
    });
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    setSaving(null);
  }

  async function handleToggleActive(img: CarouselImage) {
    const next = !img.active;
    setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, active: next } : i));
    await fetch("/api/carousel/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: img.id, active: next }),
    });
  }

  async function handleSaveFocal(img: CarouselImage, x: number, y: number) {
    setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, focal_x: x, focal_y: y } : i));
    await fetch("/api/carousel/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: img.id, focal_x: x, focal_y: y }),
    });
  }

  // Drag-to-reorder
  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragEnter = useCallback(
    async (targetIndex: number) => {
      if (dragIndex === null || dragIndex === targetIndex) return;
      const reordered = [...images];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      const updated = reordered.map((img, i) => ({ ...img, display_order: i + 1 }));
      setImages(updated);
      setDragIndex(targetIndex);
      // Persist new order
      await Promise.all(
        updated.map((img) =>
          fetch("/api/carousel/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: img.id, display_order: img.display_order }),
          })
        )
      );
    },
    [dragIndex, images]
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-sm p-8 flex flex-col items-center gap-3 text-center cursor-pointer transition-colors duration-200 ${
          dragOver ? "border-[#000080] bg-[#000080]/5" : "border-slate-200 hover:border-slate-300"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          {uploading ? (
            <svg className="animate-spin w-5 h-5 text-[#000080]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-slate-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-slate-700 text-sm font-semibold">
            {uploading ? "Uploading…" : "Drop images here or click to browse"}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">JPG, PNG, WebP — multiple files supported</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">No carousel images yet. Upload one above.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={() => setDragIndex(null)}
              className={`bg-white border border-slate-200 rounded-sm overflow-hidden cursor-grab transition-all duration-150 flex flex-col ${
                dragIndex === index ? "opacity-40 scale-95" : ""
              } ${!img.active ? "opacity-50" : ""}`}
            >
              {/* Thumbnail */}
              <div className="relative bg-slate-100" style={{ aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.public_url}
                  alt="Carousel image"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                {/* Order badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-widest">
                  #{img.display_order}
                </div>
                {!img.active && (
                  <div className="absolute top-2 right-2 bg-red-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-widest">
                    HIDDEN
                  </div>
                )}
              </div>

              {/* Always-visible action buttons */}
              <div className="flex items-center gap-1 px-2 py-2 border-t border-slate-100">
                <button
                  title="Preview"
                  onClick={() => setPreviewTarget(img)}
                  className="flex-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[10px] px-1.5 py-1.5 rounded-sm transition-colors font-medium"
                >
                  Preview
                </button>
                <button
                  title="Toggle visibility"
                  onClick={() => handleToggleActive(img)}
                  className="flex-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[10px] px-1.5 py-1.5 rounded-sm transition-colors font-medium"
                >
                  {img.active ? "Hide" : "Show"}
                </button>
                <button
                  title="Delete"
                  onClick={() => handleDelete(img)}
                  disabled={saving === img.id}
                  className="flex-1 text-red-400 hover:text-red-600 hover:bg-red-50 text-[10px] px-1.5 py-1.5 rounded-sm transition-colors font-medium disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      <p className="text-slate-400 text-[11px] text-center">
        Drag images to reorder. Use the buttons below each photo to preview, hide, or delete.
      </p>

      {focalTarget && (
        <FocalPicker
          image={focalTarget}
          onSave={(x, y) => handleSaveFocal(focalTarget, x, y)}
          onClose={() => setFocalTarget(null)}
        />
      )}

      {previewTarget && (
        <PreviewModal
          image={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </div>
  );
}
