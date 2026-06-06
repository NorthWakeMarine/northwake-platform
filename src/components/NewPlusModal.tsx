"use client";

import { useState, useTransition, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  createServiceEvent,
  createSalesMeetingEvent,
  createBlankCalendarEvent,
  searchContactsByName,
  getVesselsByContactId,
  getServiceTemplates,
  type NewEventState,
  type ServiceTemplate,
} from "@/app/actions";

// ── Google Calendar color swatches ────────────────────────────────────────────

const GCAL_COLORS: { id: string; name: string; bg: string; border: string }[] = [
  { id: "1",  name: "Lavender",  bg: "#EEF0FB", border: "#7986CB" },
  { id: "2",  name: "Sage",      bg: "#E6F4EA", border: "#33B679" },
  { id: "3",  name: "Grape",     bg: "#F5E6FB", border: "#8E24AA" },
  { id: "4",  name: "Flamingo",  bg: "#FCE8E6", border: "#E67C73" },
  { id: "5",  name: "Banana",    bg: "#FEF9E0", border: "#F6BF26" },
  { id: "6",  name: "Tangerine", bg: "#FDE9E0", border: "#F4511E" },
  { id: "7",  name: "Peacock",   bg: "#E3F5FD", border: "#039BE5" },
  { id: "8",  name: "Graphite",  bg: "#F1F1F1", border: "#616161" },
  { id: "9",  name: "Blueberry", bg: "#E8EAF6", border: "#3F51B5" },
  { id: "10", name: "Basil",     bg: "#E6F4EA", border: "#0B8043" },
  { id: "11", name: "Tomato",    bg: "#FCE8E6", border: "#D50000" },
];

type EventType = "recurring" | "one_time" | "sales_meeting" | "calendar_event";
type ContactResult = { id: string; name: string; email: string | null };
type VesselOption  = { id: string; name: string | null; make_model: string | null; length_ft: string | null };

const FREQUENCY_OPTIONS = [
  { value: "1",  label: "Every week" },
  { value: "2",  label: "Every 2 weeks" },
  { value: "4",  label: "Every 4 weeks" },
  { value: "6",  label: "Every 6 weeks" },
];

const inputCls = "border border-gray-500 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-navy w-full bg-white";
const labelCls = "text-[10px] font-medium text-gray-700 tracking-widest uppercase";

// ── Local date/time helpers ───────────────────────────────────────────────────

function toLocalIso(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

function addHours(iso: string, h: number): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + h);
  return toLocalIso(d);
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  onClose: () => void;
  // If pre-set from contact detail page
  preContactId?:   string;
  preContactName?: string;
  preVessels?:     VesselOption[];
};

export default function NewPlusModal({ onClose, preContactId, preContactName, preVessels }: Props) {
  const router = useRouter();

  // Step: "customer" (pipeline only) | "type" | "service" | "sales" | "calendar"
  const step0 = preContactId ? "type" : "customer";
  const [step, setStep] = useState<"customer" | "type" | "service" | "sales" | "calendar">(step0);
  const [eventType, setEventType] = useState<EventType | null>(null);

  // ── Customer selection ──
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<ContactResult[]>([]);
  const [picked,  setPicked]  = useState<ContactResult | null>(
    preContactId && preContactName ? { id: preContactId, name: preContactName, email: null } : null
  );
  const [searching, startSearch] = useTransition();

  // ── Vessels / templates ──
  const [vessels,   setVessels]   = useState<VesselOption[]>(preVessels ?? []);
  const [vesselId,  setVesselId]  = useState(preVessels?.[0]?.id ?? "");
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loadingV,  startLoadV]   = useTransition();
  const [loadingT,  startLoadT]   = useTransition();

  // ── Service fields ──
  const [templateId,  setTemplateId]  = useState("");
  const [serviceLabel, setServiceLabel] = useState("");
  const [qty,         setQty]         = useState("1");
  const [rate,        setRate]        = useState("");
  const [discount,    setDiscount]    = useState("0");
  const [startTime,   setStartTime]   = useState(() => toLocalIso(new Date()));
  const [endTime,     setEndTime]     = useState(() => addHours(toLocalIso(new Date()), 2));
  const [frequency,   setFrequency]   = useState<string>("4"); // default every 4 weeks
  const [notes,       setNotes]       = useState("");

  // ── Calendar event fields ──
  const [calTitle,    setCalTitle]    = useState("");
  const [calIsAllDay, setCalIsAllDay] = useState(false);
  const [calColorId,  setCalColorId]  = useState("");
  const [calLocation, setCalLocation] = useState("");
  const [calNotes,    setCalNotes]    = useState("");

  // ── Action state ──
  const [serviceState,  serviceAction,  servicePending]  = useActionState<NewEventState, FormData>(createServiceEvent,      {});
  const [salesState,    salesAction,    salesPending]    = useActionState<NewEventState, FormData>(createSalesMeetingEvent, {});
  const [calState,      calAction,      calPending]      = useActionState<NewEventState, FormData>(createBlankCalendarEvent, {});

  // ── On success close ──
  useEffect(() => {
    if (serviceState.success || salesState.success || calState.success) {
      router.refresh();
      onClose();
    }
  }, [serviceState.success, salesState.success, calState.success, router, onClose]);

  // ── Contact search ──
  useEffect(() => {
    if (step !== "customer" || picked) return;
    const t = setTimeout(() => {
      if (query.length < 2) { setResults([]); return; }
      startSearch(async () => {
        const r = await searchContactsByName(query);
        setResults(r);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query, step, picked]);

  // ── Load vessels + templates when contact is picked ──
  useEffect(() => {
    if (!picked) return;
    if (!preVessels) {
      startLoadV(async () => {
        const v = await getVesselsByContactId(picked.id);
        setVessels(v);
        setVesselId(v[0]?.id ?? "");
      });
    }
    startLoadT(async () => {
      const t = await getServiceTemplates();
      setTemplates(t);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  // ── Template autofill ──
  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    setServiceLabel(tpl.service_label);
    if (tpl.is_per_foot) {
      const v = vessels.find(v => v.id === vesselId);
      const ft = v?.length_ft ? parseFloat(v.length_ft) : null;
      setRate(ft ? String((tpl.default_amount * ft).toFixed(2)) : "");
    } else {
      setRate(String(tpl.default_amount));
    }
  }

  function handleVesselChange(id: string) {
    setVesselId(id);
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl?.is_per_foot) return;
    const v = vessels.find(v => v.id === id);
    const ft = v?.length_ft ? parseFloat(v.length_ft) : null;
    setRate(ft ? String((tpl.default_amount * ft).toFixed(2)) : "");
  }

  const gross = parseFloat(qty || "1") * parseFloat(rate || "0");
  const net   = Math.max(0, gross - parseFloat(discount || "0"));
  const pickedVessel = vessels.find(v => v.id === vesselId);
  const vesselLabel  = pickedVessel ? (pickedVessel.name ?? pickedVessel.make_model ?? "Vessel") : "";

  const isLoading = loadingV || loadingT;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-sm shadow-2xl w-full sm:max-w-lg max-h-[92dvh] min-h-[480px] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-slate-800 text-sm font-semibold">
            {step === "customer" && "Select Customer"}
            {step === "type"     && "New+"}
            {step === "service"  && (eventType === "recurring" ? "Recurring Service" : "One-Time Invoice")}
            {step === "sales"    && "Sales Meeting"}
            {step === "calendar" && "Calendar Event"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        {/* Contact banner when picked */}
        {picked && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#000080] shrink-0" />
              <span className="text-xs font-semibold text-slate-700">{picked.name}</span>
              {vesselLabel && <span className="text-[10px] text-slate-400">&middot; {vesselLabel}</span>}
            </div>
            {step !== "customer" && !preContactId && (
              <button
                onClick={() => { setPicked(null); setVessels([]); setVesselId(""); setStep("customer"); }}
                className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Change
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step: Customer Select ── */}
          {step === "customer" && (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search customer name..."
                  className={inputCls}
                  autoFocus
                />
                {searching && (
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">searching...</span>
                )}
                {results.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-sm shadow-lg overflow-hidden">
                    {results.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setPicked(r);
                          setResults([]);
                          setStep("type");
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <p className="text-xs font-medium text-slate-800">{r.name}</p>
                        {r.email && <p className="text-[10px] text-slate-400">{r.email}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!query && <p className="text-[11px] text-slate-400 text-center">Type at least 2 characters to search</p>}
            </div>
          )}

          {/* ── Step: Type Select ── */}
          {step === "type" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  type: "recurring" as EventType,
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  ),
                  label: "Recurring Service",
                  desc: "Creates repeating calendar events with auto-invoicing",
                },
                {
                  type: "one_time" as EventType,
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="9" y1="7" x2="15" y2="7" />
                      <line x1="9" y1="11" x2="15" y2="11" />
                      <line x1="9" y1="15" x2="11" y2="15" />
                    </svg>
                  ),
                  label: "One-Time Invoice",
                  desc: "Single service event with a one-time invoice",
                },
                {
                  type: "sales_meeting" as EventType,
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  label: "Sales Meeting",
                  desc: "Schedule a sales consultation on the calendar",
                },
                {
                  type: "calendar_event" as EventType,
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                  label: "Calendar Event",
                  desc: "Blank event with custom color",
                },
              ].map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setEventType(opt.type);
                    setStep(
                      opt.type === "recurring" || opt.type === "one_time" ? "service"
                      : opt.type === "sales_meeting" ? "sales"
                      : "calendar"
                    );
                  }}
                  className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-sm hover:border-[#000080] hover:bg-[#000080]/5 transition-colors text-center group"
                >
                  <span className="text-slate-500 group-hover:text-[#000080] transition-colors">{opt.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#000080] transition-colors">{opt.label}</span>
                  <span className="text-[10px] text-slate-400 leading-snug">{opt.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step: Service Config (Recurring or One-Time) ── */}
          {step === "service" && (
            <div className="flex flex-col gap-4">

              {isLoading && <p className="text-[11px] text-slate-400">Loading...</p>}

              {/* Vessel */}
              {vessels.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Vessel</label>
                  <select value={vesselId} onChange={e => handleVesselChange(e.target.value)} className={inputCls}>
                    <option value="">No vessel selected</option>
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>
                        {[v.name, v.make_model].filter(Boolean).join(" ")}
                        {v.length_ft ? ` (${v.length_ft} ft)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Service template */}
              {templates.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Service Template</label>
                  <select value={templateId} onChange={e => handleTemplateChange(e.target.value)} className={inputCls}>
                    <option value="">Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.is_per_foot ? `$${Number(t.default_amount).toFixed(2)}/ft` : `$${Number(t.default_amount).toFixed(2)}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Service label */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Service Label <span className="text-red-500">*</span></label>
                <input
                  value={serviceLabel}
                  onChange={e => setServiceLabel(e.target.value)}
                  placeholder="e.g. Bi-Weekly Wash"
                  className={inputCls}
                  required
                />
              </div>

              {/* Qty / Rate / Discount */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Qty <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0.01" value={qty} onChange={e => setQty(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Rate ($) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Discount ($)</label>
                  <input type="number" step="0.01" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" className={inputCls} />
                </div>
              </div>
              {rate && (
                <p className="text-[11px] text-slate-500 -mt-2">
                  Gross: ${gross.toFixed(2)}
                  {parseFloat(discount) > 0 && <span className="text-emerald-700 font-semibold ml-2">Net: ${net.toFixed(2)}</span>}
                </p>
              )}

              {/* Date/time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Start <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime(addHours(e.target.value, 2)); }} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>End <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Frequency (recurring only) */}
              {eventType === "recurring" && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Frequency</label>
                  <select value={frequency} onChange={e => setFrequency(e.target.value)} className={inputCls}>
                    {FREQUENCY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Access instructions, special notes..." className={`${inputCls} resize-none`} />
              </div>

              {/* Auto-generated title preview */}
              {(picked && serviceLabel) && (
                <div className="bg-slate-50 border border-slate-100 rounded-sm px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-0.5">Event title</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {[picked.name, vesselLabel, serviceLabel].filter(Boolean).join(" - ")}
                  </p>
                </div>
              )}

              {serviceState.error && <p className="text-red-600 text-xs">{serviceState.error}</p>}

              <form action={serviceAction}>
                <input type="hidden" name="contact_id"    value={picked?.id ?? ""} />
                <input type="hidden" name="contact_name"  value={picked?.name ?? ""} />
                <input type="hidden" name="vessel_id"     value={vesselId} />
                <input type="hidden" name="vessel_name"   value={vesselLabel} />
                <input type="hidden" name="template_id"   value={templateId} />
                <input type="hidden" name="service_label" value={serviceLabel} />
                <input type="hidden" name="qty"           value={qty} />
                <input type="hidden" name="rate"          value={rate} />
                <input type="hidden" name="discount"      value={discount} />
                <input type="hidden" name="start_time"    value={startTime} />
                <input type="hidden" name="end_time"      value={endTime} />
                <input type="hidden" name="frequency"     value={eventType === "recurring" ? frequency : ""} />
                <input type="hidden" name="description"   value={notes} />
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={servicePending || !picked || !serviceLabel || !rate}
                    className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-40">
                    {servicePending ? "Creating..." : eventType === "recurring" ? "Create Recurring Service" : "Create One-Time Invoice"}
                  </button>
                  <button type="button" onClick={() => setStep("type")} className="px-4 text-slate-500 text-xs hover:text-slate-800 transition-colors">Back</button>
                </div>
              </form>

            </div>
          )}

          {/* ── Step: Sales Meeting ── */}
          {step === "sales" && (
            <div className="flex flex-col gap-4">

              {isLoading && <p className="text-[11px] text-slate-400">Loading...</p>}

              {/* Vessel (optional) */}
              {vessels.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Vessel (optional)</label>
                  <select value={vesselId} onChange={e => setVesselId(e.target.value)} className={inputCls}>
                    <option value="">None</option>
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>
                        {[v.name, v.make_model].filter(Boolean).join(" ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date/time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Start <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime(addHours(e.target.value, 1)); }} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>End <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agenda, location, etc." className={`${inputCls} resize-none`} />
              </div>

              {/* Title preview */}
              {picked && (
                <div className="bg-slate-50 border border-slate-100 rounded-sm px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-0.5">Event title</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {[picked.name, vesselLabel, "Sales Meeting"].filter(Boolean).join(" - ")}
                  </p>
                </div>
              )}

              {salesState.error && <p className="text-red-600 text-xs">{salesState.error}</p>}

              <form action={salesAction}>
                <input type="hidden" name="contact_id"   value={picked?.id ?? ""} />
                <input type="hidden" name="contact_name" value={picked?.name ?? ""} />
                <input type="hidden" name="vessel_id"    value={vesselId} />
                <input type="hidden" name="vessel_name"  value={vesselLabel} />
                <input type="hidden" name="start_time"   value={startTime} />
                <input type="hidden" name="end_time"     value={endTime} />
                <input type="hidden" name="description"  value={notes} />
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={salesPending || !picked}
                    className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-40">
                    {salesPending ? "Creating..." : "Schedule Sales Meeting"}
                  </button>
                  <button type="button" onClick={() => setStep("type")} className="px-4 text-slate-500 text-xs hover:text-slate-800 transition-colors">Back</button>
                </div>
              </form>

            </div>
          )}

          {/* ── Step: Blank Calendar Event ── */}
          {step === "calendar" && (
            <div className="flex flex-col gap-4">

              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                <input value={calTitle} onChange={e => setCalTitle(e.target.value)} placeholder="Event title" className={inputCls} autoFocus />
              </div>

              {/* All-day toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <div
                  onClick={() => setCalIsAllDay(v => !v)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${calIsAllDay ? "bg-[#000080]" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${calIsAllDay ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-slate-500 text-xs">All day</span>
              </label>

              {/* Date/time */}
              {calIsAllDay ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Start Date <span className="text-red-500">*</span></label>
                    <input type="date" value={startTime.split("T")[0]} onChange={e => setStartTime(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>End Date <span className="text-red-500">*</span></label>
                    <input type="date" value={endTime.split("T")[0]} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Start <span className="text-red-500">*</span></label>
                    <input type="datetime-local" value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime(addHours(e.target.value, 1)); }} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>End <span className="text-red-500">*</span></label>
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}

              {/* Color picker */}
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Color</label>
                <div className="flex flex-wrap gap-2">
                  {GCAL_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCalColorId(prev => prev === c.id ? "" : c.id)}
                      title={c.name}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c.border,
                        borderColor:     calColorId === c.id ? "#000080" : "transparent",
                        outline:         calColorId === c.id ? "2px solid #000080" : "none",
                        outlineOffset:   "2px",
                      }}
                    />
                  ))}
                  {calColorId && (
                    <button type="button" onClick={() => setCalColorId("")} className="text-[10px] text-slate-400 hover:text-slate-600 self-center ml-1">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Location (optional)</label>
                <input value={calLocation} onChange={e => setCalLocation(e.target.value)} placeholder="Address, marina, etc." className={inputCls} />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Notes (optional)</label>
                <textarea rows={2} value={calNotes} onChange={e => setCalNotes(e.target.value)} className={`${inputCls} resize-none`} />
              </div>

              {calState.error && <p className="text-red-600 text-xs">{calState.error}</p>}

              <form action={calAction}>
                <input type="hidden" name="contact_id"  value={picked?.id ?? ""} />
                <input type="hidden" name="title"       value={calTitle} />
                <input type="hidden" name="start_time"  value={startTime} />
                <input type="hidden" name="end_time"    value={endTime} />
                <input type="hidden" name="is_all_day"  value={calIsAllDay ? "true" : "false"} />
                <input type="hidden" name="color_id"    value={calColorId} />
                <input type="hidden" name="location"    value={calLocation} />
                <input type="hidden" name="description" value={calNotes} />
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={calPending || !calTitle}
                    className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-40">
                    {calPending ? "Creating..." : "Create Event"}
                  </button>
                  <button type="button" onClick={() => setStep("type")} className="px-4 text-slate-500 text-xs hover:text-slate-800 transition-colors">Back</button>
                </div>
              </form>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
