"use client";

import { useState, useEffect } from "react";
import type { GoogleReview } from "@/lib/google-places";

const STATIC_REVIEWS: GoogleReview[] = [
  {
    author: "D. Harrington",
    rating: 5,
    text: "They turned my 32ft center console from embarrassing to showroom. Ceramic coating looks unreal even after a month of salt water. NorthWake is the only call I make.",
    relativeTime: "32ft Center Console, Jacksonville",
  },
  {
    author: "R. Castellano",
    rating: 5,
    text: "Monthly maintenance plan took a full chore off my list. They show up, document everything, and my boat is always ready. The photo reports after every visit are a nice touch.",
    relativeTime: "41ft Cruiser, St. Johns River",
  },
  {
    author: "M. Sullivan",
    rating: 5,
    text: "Booked a full detail and ceramic before selling. Got asking price. The NorthWake guys are meticulous and actually care about the work they do. Rare.",
    relativeTime: "28ft Sport Fishing, Orange Park",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= rating ? "#f59e0b" : "none"} stroke={i <= rating ? "#f59e0b" : "#686A6C"} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsCarousel({
  reviews,
  rating,
  count,
}: {
  reviews: GoogleReview[];
  rating: number | null;
  count: number | null;
}) {
  const items = reviews.length > 0 ? reviews : STATIC_REVIEWS;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const t = setInterval(() => setCurrent((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const review = items[current];
  const isGoogle = reviews.length > 0;

  return (
    <div
      className="flex flex-col items-center gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {isGoogle && rating && count && (
        <div className="flex items-center gap-3">
          <StarRating rating={Math.round(rating)} />
          <span className="text-steel-light text-xs font-medium">{rating.toFixed(1)} out of 5</span>
          <span className="text-steel text-xs">({count} reviews)</span>
          <span className="text-steel text-[10px] tracking-widest uppercase">Google</span>
        </div>
      )}

      <div className="max-w-2xl w-full">
        <div className="bg-obsidian p-8 flex flex-col gap-5 text-center transition-all duration-300">
          {isGoogle && <StarRating rating={review.rating} />}
          <p className="text-steel-light text-sm leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
          <div className="flex flex-col gap-0.5 items-center mt-auto">
            <span className="text-wake text-xs font-bold tracking-wide">{review.author}</span>
            <span className="text-steel text-[10px] tracking-[0.2em] uppercase">{review.relativeTime}</span>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setPaused(true); }}
              className={`rounded-full transition-all duration-200 ${i === current ? "w-4 h-1.5 bg-navy" : "w-1.5 h-1.5 bg-steel/40 hover:bg-steel"}`}
              aria-label={`Review ${i + 1}`}
            />
          ))}
        </div>
      )}

      {isGoogle && (
        <a
          href="https://g.page/r/CdvYJ9aDJv8NEAE/review"
          target="_blank"
          rel="noopener noreferrer"
          className="text-steel text-[10px] tracking-[0.25em] uppercase hover:text-wake transition-colors duration-200"
        >
          Leave a review on Google →
        </a>
      )}
    </div>
  );
}
