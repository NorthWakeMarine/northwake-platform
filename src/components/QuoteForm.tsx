const vesselTypes = [
  "Center Console",
  "Bowrider",
  "Pontoon",
  "Cruiser",
  "Motor Yacht",
  "Sailboat",
  "Sport Fishing",
  "Other",
];

const serviceOptions = [
  "Maintenance Wash",
  "One-Off Wash",
  "Full Detail",
  "Exterior Detailing",
  "Interior Cleaning & Cabin Detailing",
  "Canvas Cleaning & Treatment",
  "Vinyl & Upholstery Conditioning",
  "Teak Cleaning & Brightening",
  "Stainless Polish",
  "Engine Bay & Bilge Cleaning",
  "Water Spot & Mineral Deposit Removal",
  "Ceramic Coating",
  "Wax Application",
  "Gel Coat Restoration",
  "Monthly Maintenance Plan",
  "Marine Transport",
  "Captain & Crew Services",
  "Yacht Management",
  "Custom Request",
  "Not Sure — Need Consultation",
];

const referralSources = [
  "Google Search",
  "Google Maps",
  "Instagram",
  "Facebook",
  "Friend / Word of Mouth",
  "Boat Show",
  "Marina Referral",
  "Other",
];

interface QuoteFormProps {
  preselectedService?: string;
  showReferral?: boolean;
  formId?: string;
}

export default function QuoteForm({
  preselectedService,
  showReferral = false,
  formId = "quote-form",
}: QuoteFormProps) {
  const fieldClass =
    "bg-transparent border border-steel-dark text-wake placeholder-steel text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 w-full";
  const selectClass =
    "bg-obsidian border border-steel-dark text-wake text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer w-full";
  const labelClass =
    "text-steel-light text-[10px] tracking-[0.3em] uppercase font-medium";

  return (
    <form
      id={formId}
      action="#"
      method="POST"
      aria-label="Quote request form"
      className="w-full flex flex-col gap-5"
    >
      {/* Row: Name + Email */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-name`} className={labelClass}>
            Full Name <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="John Harrington"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-email`} className={labelClass}>
            Email Address <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="john@example.com"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Row: Phone + Vessel */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-phone`} className={labelClass}>
            Phone Number
          </label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(904) 606-5454"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-vessel-length`} className={labelClass}>
            Vessel Length (ft)
          </label>
          <input
            id={`${formId}-vessel-length`}
            name="vessel_length"
            type="text"
            placeholder="e.g. 28"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Row: Vessel Type + Service */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-vessel`} className={labelClass}>
            Vessel Type <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <select
            id={`${formId}-vessel`}
            name="vessel_type"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="" disabled className="text-steel">Select vessel type…</option>
            {vesselTypes.map((v) => (
              <option key={v} value={v} className="bg-obsidian text-wake">{v}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-service`} className={labelClass}>
            Service Needed <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <select
            id={`${formId}-service`}
            name="service"
            required
            defaultValue={preselectedService ?? ""}
            className={selectClass}
          >
            <option value="" disabled className="text-steel">Select a service…</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s} className="bg-obsidian text-wake">{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Referral source (optional) */}
      {showReferral && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-referral`} className={labelClass}>
            How Did You Hear About Us?
          </label>
          <select
            id={`${formId}-referral`}
            name="referral_source"
            defaultValue=""
            className={selectClass}
          >
            <option value="" className="text-steel">Prefer not to say</option>
            {referralSources.map((r) => (
              <option key={r} value={r} className="bg-obsidian text-wake">{r}</option>
            ))}
          </select>
        </div>
      )}

      {/* Message */}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${formId}-message`} className={labelClass}>
          Additional Details
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={4}
          placeholder="Vessel condition, preferred service dates, specific concerns, or anything else we should know…"
          className="bg-transparent border border-steel-dark text-wake placeholder-steel text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 resize-none w-full"
        />
      </div>

      <button
        type="submit"
        className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-4 transition-all duration-300 hover:scale-[1.02] mt-2 w-full"
      >
        Submit Quote Request
      </button>

      <p className="text-steel text-[10px] text-center tracking-wide leading-relaxed">
        No obligation. No spam. We respond within one business day.
      </p>
    </form>
  );
}
