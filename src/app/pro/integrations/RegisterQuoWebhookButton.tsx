"use client";

import { useState } from "react";

const WEBHOOK_URL = "https://northwakemarine.com/api/webhooks/quo";

const EVENTS = [
  "call.completed",
  "call.missed",
  "message.received",
  "contact.created",
  "contact.updated",
];

export default function RegisterQuoWebhookButton() {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-1.5">Webhook URL</p>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-sm px-3 py-2">
          <span className="text-slate-600 text-[11px] flex-1 truncate font-mono">{WEBHOOK_URL}</span>
          <button
            onClick={copyUrl}
            className={`shrink-0 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-sm transition-colors ${
              copied
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-1.5">Subscribe to these events</p>
        <div className="flex flex-col gap-1">
          {EVENTS.map((e) => (
            <div key={e} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
              <span className="text-slate-500 text-[11px] font-mono">{e}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-slate-400 text-[10px] leading-relaxed">
        Paste the URL above into the Quo dashboard under Settings, then subscribe to all five events listed.
      </p>
    </div>
  );
}
