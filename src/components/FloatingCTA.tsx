import Link from "next/link";

export default function FloatingCTA() {
  return (
    <div
      aria-label="Get a quick quote"
      className="hidden"
    >
      <Link
        href="/contact"
        className="chrome-btn flex items-center gap-2.5 font-bold text-[10px] tracking-[0.25em] uppercase px-5 py-3.5 shadow-lg shadow-black/50 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {/* Anchor icon */}
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="3" />
          <line x1="12" y1="8" x2="12" y2="21" />
          <path d="M5 14l7 7 7-7" />
          <line x1="5" y1="11" x2="19" y2="11" />
        </svg>
        Book Now
      </Link>
    </div>
  );
}
