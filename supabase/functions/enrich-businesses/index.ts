import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photos?: Array<{ name: string }>;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  };
  editorialSummary?: { text?: string };
  formattedAddress?: string;
}

interface EnrichmentResult {
  businessId: string;
  businessName: string;
  success: boolean;
  googlePlaceId?: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  error?: string;
}

function mapPriceLevel(priceLevel?: string): number | null {
  const mapping: Record<string, number> = {
    "PRICE_LEVEL_FREE": 0,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
  };
  return priceLevel ? mapping[priceLevel] ?? null : null;
}

async function findGooglePlace(
  apiKey: string,
  businessName: string,
  address: string | null,
  city: string | null
): Promise<GooglePlace | null> {
  const searchQuery = address
    ? `${businessName} ${address}, ${city || 'Jacksonville'}, FL`
    : `${businessName} ${city || 'Jacksonville'}, FL`;

  try {
    const response = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.rating",
          "places.userRatingCount",
          "places.priceLevel",
          "places.photos",
          "places.formattedAddress",
          "places.websiteUri",
          "places.internationalPhoneNumber",
          "places.nationalPhoneNumber",
          "places.regularOpeningHours",
          "places.editorialSummary",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        locationBias: {
          circle: {
            center: { latitude: 30.3322, longitude: -81.6557 },
            radius: 30000,
          },
        },
        maxResultCount: 1,
      }),
    });

    if (!response.ok) {
      console.error(`Google Places search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.places?.[0] || null;
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return null;
  }
}

// Download a Google Place photo and store it in Supabase Storage.
// Returns the public URL, or null on any failure.
// deno-lint-ignore no-explicit-any
async function downloadAndStorePhoto(
  supabase: any,
  apiKey: string,
  businessId: string,
  photoReference: string
): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=800&maxWidthPx=800`;
    const response = await fetch(url, {
      headers: { "X-Goog-Api-Key": apiKey },
    });

    if (!response.ok) {
      console.error(`Photo fetch failed (${response.status}) for ${businessId}`);
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const path = `${businessId}/cover.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("business-photos")
      .upload(path, bytes, { contentType, upsert: true });

    if (uploadError) {
      console.error(`Storage upload failed for ${businessId}:`, uploadError.message);
      return null;
    }

    return supabase.storage.from("business-photos").getPublicUrl(path).data.publicUrl;
  } catch (error) {
    console.error(`downloadAndStorePhoto error for ${businessId}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let limit = 50;
    let forceRefresh = false;
    let businessIds: string[] | null = null;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.limit) limit = body.limit;
      if (body.forceRefresh) forceRefresh = body.forceRefresh;
      if (body.businessIds) businessIds = body.businessIds;
    }

    let query = supabase
      .from("businesses")
      .select("id, name, address, city, phone, description")
      .eq("status", "active");

    if (businessIds && businessIds.length > 0) {
      query = query.in("id", businessIds);
    } else if (!forceRefresh) {
      query = query.or("rating.is.null,cover_image_url.is.null");
    }

    query = query.limit(limit);

    const { data: businesses, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch businesses: ${fetchError.message}`);
    }

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No businesses need enrichment",
          enriched: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Enriching ${businesses.length} businesses with Google Places data...`);

    const results: EnrichmentResult[] = [];
    let enrichedCount = 0;
    let errorCount = 0;

    for (const business of businesses) {
      const result: EnrichmentResult = {
        businessId: business.id,
        businessName: business.name,
        success: false,
      };

      try {
        const googlePlace = await findGooglePlace(
          apiKey,
          business.name,
          business.address,
          business.city
        );

        if (!googlePlace) {
          result.error = "No matching place found on Google";
          results.push(result);
          continue;
        }

        result.googlePlaceId = googlePlace.id;

        const updateData: Record<string, unknown> = {
          last_synced_at: new Date().toISOString(),
        };

        if (googlePlace.rating) {
          updateData.rating = googlePlace.rating;
          result.rating = googlePlace.rating;
        }

        if (googlePlace.userRatingCount) {
          updateData.review_count = googlePlace.userRatingCount;
          result.reviewCount = googlePlace.userRatingCount;
        }

        const priceLevel = mapPriceLevel(googlePlace.priceLevel);
        if (priceLevel !== null) {
          updateData.price_level = priceLevel;
        }

        if (googlePlace.websiteUri) {
          updateData.website = googlePlace.websiteUri;
        }

        const googlePhone =
          googlePlace.internationalPhoneNumber || googlePlace.nationalPhoneNumber;
        if (googlePhone && !business.phone) {
          updateData.phone = googlePhone;
        }

        if (googlePlace.regularOpeningHours?.weekdayDescriptions?.length) {
          updateData.hours = googlePlace.regularOpeningHours.weekdayDescriptions;
        }

        if (googlePlace.editorialSummary?.text && !business.description) {
          updateData.description = googlePlace.editorialSummary.text;
        }

        if (googlePlace.photos && googlePlace.photos.length > 0) {
          const photoUrl = await downloadAndStorePhoto(
            supabase,
            apiKey,
            business.id,
            googlePlace.photos[0].name
          );
          if (photoUrl) {
            updateData.cover_image_url = photoUrl;
            result.photoUrl = photoUrl;
          }
        }

        const { error: updateError } = await supabase
          .from("businesses")
          .update(updateData)
          .eq("id", business.id);

        if (updateError) {
          result.error = `Update failed: ${updateError.message}`;
          errorCount++;
        } else {
          result.success = true;
          enrichedCount++;
          console.log(`✓ Enriched: ${business.name} - Rating: ${result.rating}, Reviews: ${result.reviewCount}`);
        }
      } catch (error) {
        result.error = error instanceof Error ? error.message : "Unknown error";
        errorCount++;
      }

      results.push(result);

      await new Promise(r => setTimeout(r, 50));
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: businesses.length,
          enriched: enrichedCount,
          errors: errorCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in enrich-businesses:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
