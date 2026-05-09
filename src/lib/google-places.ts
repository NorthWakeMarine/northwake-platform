export type GoogleReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
};

const MAPS_BASE = "https://maps.googleapis.com/maps/api/place";

async function findPlaceId(apiKey: string): Promise<string | null> {
  // Nearby search at the exact coordinates from the Google Maps listing
  const params = new URLSearchParams({
    location: "28.566997,-81.683107",
    radius: "200",
    keyword: "NorthWake Marine",
    key: apiKey,
  });
  const res = await fetch(`${MAPS_BASE}/nearbysearch/json?${params}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = await res.json() as { results?: Array<{ place_id: string; name: string }>; status?: string };
  return data.results?.[0]?.place_id ?? null;
}

export async function getGoogleReviews(): Promise<{ reviews: GoogleReview[]; rating: number | null; count: number | null }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { reviews: [], rating: null, count: null };

  try {
    // Only use GOOGLE_PLACE_ID if it's in ChIJ format — ignore hex format from Maps URLs
    const envId = process.env.GOOGLE_PLACE_ID;
    const placeId = (envId?.startsWith("ChIJ") ? envId : null) ?? await findPlaceId(apiKey);
    if (!placeId) return { reviews: [], rating: null, count: null };

    const params = new URLSearchParams({
      place_id: placeId,
      fields: "reviews,rating,user_ratings_total",
      key: apiKey,
    });
    const res = await fetch(`${MAPS_BASE}/details/json?${params}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { reviews: [], rating: null, count: null };

    const data = await res.json() as {
      result?: {
        reviews?: Array<{
          author_name?: string;
          rating?: number;
          text?: string;
          relative_time_description?: string;
        }>;
        rating?: number;
        user_ratings_total?: number;
      };
    };

    const result = data.result;
    if (!result) return { reviews: [], rating: null, count: null };

    const reviews: GoogleReview[] = (result.reviews ?? [])
      .filter((r) => r.text && (r.rating ?? 0) >= 4)
      .map((r) => ({
        author: r.author_name ?? "Verified Customer",
        rating: r.rating ?? 5,
        text: r.text ?? "",
        relativeTime: r.relative_time_description ?? "",
      }));

    return {
      reviews,
      rating: result.rating ?? null,
      count: result.user_ratings_total ?? null,
    };
  } catch {
    return { reviews: [], rating: null, count: null };
  }
}
