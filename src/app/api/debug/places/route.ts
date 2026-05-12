import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not set" });

  // Step 1: text search by business name
  const searchParams = new URLSearchParams({
    query: "NorthWake Marine",
    key: apiKey,
  });
  const searchRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams}`
  );
  const searchData = await searchRes.json() as Record<string, unknown>;
  const firstResult = (searchData.results as Array<{place_id: string; name: string}>)?.[0];
  const placeId: string | null = firstResult?.place_id ?? (process.env.GOOGLE_PLACE_ID?.startsWith("ChIJ") ? process.env.GOOGLE_PLACE_ID : null);

  if (!placeId) {
    return NextResponse.json({ searchStatus: searchData.status, searchData, placeId: null });
  }

  // Step 2: place details
  const detailParams = new URLSearchParams({
    place_id: placeId,
    fields: "name,rating,user_ratings_total,reviews",
    key: apiKey,
  });
  const detailRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${detailParams}`
  );
  const detailData = await detailRes.json();

  return NextResponse.json({
    searchStatus: searchData.status,
    placeId,
    placeName: detailData.result?.name,
    rating: detailData.result?.rating,
    reviewCount: detailData.result?.user_ratings_total,
    reviews: detailData.result?.reviews ?? [],
    detailStatus: detailData.status,
  });
}
