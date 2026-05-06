"use client";

import { useActionState } from "react";
import ProShell from "@/components/ProShell";
import { updateSiteContent, type ContentUpdateState } from "@/app/actions";
import CarouselManager, { type CarouselImage } from "./CarouselManager";

type ContentItem = {
  id: string;
  key: string;
  value: string;
  description: string | null;
};

function ContentRow({ item }: { item: ContentItem }) {
  const [state, action, isPending] = useActionState<ContentUpdateState, FormData>(
    updateSiteContent,
    {}
  );

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-slate-800 text-sm font-semibold">{item.description || item.key}</p>
          <p className="text-slate-400 text-[10px] tracking-widest uppercase mt-0.5 font-mono">{item.key}</p>
        </div>
        {state.success && (
          <span className="text-[9px] tracking-widest uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm font-medium shrink-0">
            Saved
          </span>
        )}
        {state.error && (
          <span className="text-[9px] tracking-widest uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm font-medium shrink-0">
            Error
          </span>
        )}
      </div>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="key" value={item.key} />
        <textarea
          name="value"
          rows={item.value.length > 120 ? 4 : 2}
          defaultValue={item.value}
          className="border border-slate-200 text-slate-800 text-xs px-3 py-2.5 focus:outline-none focus:border-blue-400 transition-colors duration-200 resize-y w-full leading-relaxed rounded-sm bg-slate-50 focus:bg-white"
        />
        {state.error && <p className="text-red-500 text-[10px]">{state.error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-5 py-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 font-medium"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditorPageClient({
  items,
  carouselImages,
}: {
  items: ContentItem[];
  carouselImages: CarouselImage[];
}) {
  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Site Editor</h1>
          <p className="text-slate-400 text-xs mt-0.5">Edit live content and manage homepage images. Changes publish instantly.</p>
        </div>

        <div className="px-8 py-8 flex flex-col gap-10">

          {/* ── Carousel Images ── */}
          <section>
            <div className="mb-4">
              <h2 className="text-slate-800 text-base font-bold tracking-tight">Homepage Carousel</h2>
              <p className="text-slate-400 text-xs mt-0.5">Upload, reorder, and position images shown in the featured work section.</p>
            </div>
            <CarouselManager initialImages={carouselImages} />
          </section>

          {/* ── Site Content ── */}
          {items.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-slate-800 text-base font-bold tracking-tight">Site Content</h2>
                <p className="text-slate-400 text-xs mt-0.5">Edit live text on the public site.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((item) => (
                  <ContentRow key={item.key} item={item} />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </ProShell>
  );
}
