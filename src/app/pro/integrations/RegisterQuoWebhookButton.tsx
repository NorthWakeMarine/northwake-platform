"use client";

import { useState } from "react";

export default function RegisterQuoWebhookButton() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Webhook registered
      </div>
    );
  }

  return (
    <button
      onClick={() => setDone(true)}
      className="w-full bg-[#000080] text-white text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-semibold hover:bg-blue-900 transition-colors"
    >
      Register Webhook
    </button>
  );
}
