export type GoogleReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
};

type PlacesSearchResponse = {
  places?: Array<{ id: string; displayName?: { text: string } }>;
};

type PlaceDetailsResponse = {
  reviews?: Array<{
    authorAttribution?: { displayName?: string };
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
  }>;
  rating?: number;
  userRatingCount?: number;
};

async function findPlaceId(apiKey: string): Promise<string | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: "NorthWake Marine Jacksonville FL" }),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data: PlacesSearchResponse = await res.json();
  return data.places?.[0]?.id ?? null;
}

export async function getGoogleReviews(): Promise<{ reviews: GoogleReview[]; rating: number | null; count: number | null }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { reviews: [], rating: null, count: null };

  try {
    const placeId = process.env.GOOGLE_PLACE_ID ?? await findPlaceId(apiKey);
    if (!placeId) return { reviews: [], rating: null, count: null };

    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "reviews,rating,userRatingCount",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return { reviews: [], rating: null, count: null };

    const data: PlaceDetailsResponse = await res.json();
    const reviews: GoogleReview[] = (data.reviews ?? [])
      .filter((r) => r.text?.text && (r.rating ?? 0) >= 4)
      .map((r) => ({
        author: r.authorAttribution?.displayName ?? "Verified Customer",
        rating: r.rating ?? 5,
        text: r.text?.text ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
      }));

    return {
      reviews,
      rating: data.rating ?? null,
      count: data.userRatingCount ?? null,
    };
  } catch {
    return { reviews: [], rating: null, count: null };
  }
}
