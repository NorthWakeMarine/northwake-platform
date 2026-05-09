export type GoogleReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
};

const MAPS_BASE = "https://maps.googleapis.com/maps/api/place";

async function findPlaceId(apiKey: string): Promise<string | null> {
  // Try progressively simpler queries until one matches
  const queries = [
    "NorthWake Marine",
    "NorthWake Marine Florida",
    "NorthWake Marine Jacksonville",
  ];
  for (const input of queries) {
    const params = new URLSearchParams({
      input,
      inputtype: "textquery",
      fields: "place_id,name",
      locationbias: "circle:80000@28.566997,-81.683107",
      key: apiKey,
    });
    const res = await fetch(`${MAPS_BASE}/findplacefromtext/json?${params}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) continue;
    const data = await res.json() as { candidates?: Array<{ place_id: string }>; status?: string };
    if (data.candidates?.[0]?.place_id) return data.candidates[0].place_id;
  }
  return null;
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
