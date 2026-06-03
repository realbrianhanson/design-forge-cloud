import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Jacksonville center coordinates
const JACKSONVILLE = {
  lat: 30.3322,
  lng: -81.6557,
  radiusMeters: 30000, // 30km to cover metro area
};

// Category mapping from Geoapify to our categories
const CATEGORY_MAP: Record<string, string> = {
  // Restaurants & Food
  "catering.restaurant": "restaurants",
  "catering.fast_food": "restaurants",
  "catering.cafe": "restaurants",
  "catering.bar": "restaurants",
  "catering.pub": "restaurants",
  "catering.ice_cream": "restaurants",
  "catering.bakery": "restaurants",
  
  // Shopping
  "commercial.shopping_mall": "shopping",
  "commercial.supermarket": "shopping",
  "commercial.marketplace": "shopping",
  "commercial.department_store": "shopping",
  "commercial.clothing": "shopping",
  "commercial.jewelry": "shopping",
  "commercial.gift_and_souvenir": "shopping",
  "commercial.books": "shopping",
  "commercial.electronics": "shopping",
  
  // Health & Medical
  "healthcare.hospital": "health",
  "healthcare.pharmacy": "health",
  "healthcare.dentist": "health",
  "healthcare.doctor": "health",
  "healthcare.clinic": "health",
  "healthcare.veterinary": "health",
  
  // Professional Services
  "service.financial.bank": "professional",
  "service.financial": "professional",
  "office.lawyer": "professional",
  "office.accountant": "professional",
  "office.insurance": "professional",
  "office.estate_agent": "professional",
  
  // Entertainment
  "entertainment.cinema": "entertainment",
  "entertainment.culture": "entertainment",
  "entertainment.museum": "entertainment",
  "entertainment.theme_park": "entertainment",
  "entertainment.zoo": "entertainment",
  "entertainment.bowling_alley": "entertainment",
  "leisure.park": "entertainment",
  
  // Automotive
  "service.vehicle": "automotive",
  "service.vehicle.car_parts": "automotive",
  "service.vehicle.car_repair": "automotive",
  "service.vehicle.car_wash": "automotive",
  "service.vehicle.fuel": "automotive",
  
  // Beauty & Spa
  "beauty.spa": "beauty",
  "beauty.hairdresser": "beauty",
  "beauty.cosmetics": "beauty",
  "beauty.massage": "beauty",
  "beauty.nails": "beauty",
  
  // Fitness
  "sport.fitness": "fitness",
  "sport.swimming_pool": "fitness",
  "sport.stadium": "fitness",
  
  // Home Services
  "building.construction": "home-services",
  "service.cleaning": "home-services",
  "service.gardening": "home-services",
};

// Categories to import (in order of priority)
const IMPORT_CATEGORIES = [
  "catering.restaurant",
  "catering.fast_food",
  "catering.cafe",
  "commercial.shopping_mall",
  "commercial.supermarket",
  "healthcare.hospital",
  "healthcare.pharmacy",
  "service.financial.bank",
  "beauty.spa",
  "beauty.hairdresser",
  "entertainment.cinema",
  "service.vehicle.car_repair",
  "sport.fitness",
];

interface GeoapifyPlace {
  properties: {
    place_id: string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    postcode?: string;
    formatted?: string;
    categories?: string[];
    contact?: {
      phone?: string;
      website?: string;
      email?: string;
    };
    opening_hours?: string;
    lat: number;
    lon: number;
  };
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// Map Geoapify category to our category
function mapCategory(categories: string[] | undefined): string {
  if (!categories) return "other";
  
  for (const cat of categories) {
    if (CATEGORY_MAP[cat]) {
      return CATEGORY_MAP[cat];
    }
    // Try partial matches
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (cat.startsWith(key.split('.')[0])) {
        return value;
      }
    }
  }
  
  return "other";
}

// Fetch places from Geoapify for a specific category
async function fetchPlaces(
  apiKey: string,
  category: string,
  limit = 100
): Promise<GeoapifyPlace[]> {
  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", category);
  url.searchParams.set("filter", `circle:${JACKSONVILLE.lng},${JACKSONVILLE.lat},${JACKSONVILLE.radiusMeters}`);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("apiKey", apiKey);
  
  console.log(`Fetching ${category} from Geoapify...`);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Geoapify API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.features || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Internal pipeline auth: when PIPELINE_SECRET is set, require it for all
  // non-OPTIONS requests. This blocks anonymous abuse of AI/credit-burning
  // endpoints. Cron jobs and admin triggers must send the header:
  //   x-pipeline-secret: <PIPELINE_SECRET>
  const __pipelineSecret = Deno.env.get('PIPELINE_SECRET');
  if (__pipelineSecret) {
    const __provided = req.headers.get('x-pipeline-secret');
    if (__provided !== __pipelineSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }


  try {
    const apiKey = Deno.env.get("GEOAPIFY_API_KEY");
    if (!apiKey) {
      throw new Error("GEOAPIFY_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let categories = IMPORT_CATEGORIES;
    let limitPerCategory = 100;
    
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.categories) categories = body.categories;
      if (body.limit) limitPerCategory = body.limit;
    }

    const results = {
      totalFetched: 0,
      totalImported: 0,
      totalSkipped: 0,
      totalErrors: 0,
      byCategory: {} as Record<string, { fetched: number; imported: number; skipped: number }>,
    };

    // Process each category
    for (const category of categories) {
      try {
        const places = await fetchPlaces(apiKey, category, limitPerCategory);
        
        const categoryResults = {
          fetched: places.length,
          imported: 0,
          skipped: 0,
        };
        
        for (const place of places) {
          const props = place.properties;
          
          // Skip places without names
          if (!props.name) {
            categoryResults.skipped++;
            continue;
          }
          
          // Check if business already exists by external_id
          const { data: existing } = await supabase
            .from("businesses")
            .select("id")
            .eq("external_id", props.place_id)
            .eq("source", "geoapify")
            .maybeSingle();
          
          if (existing) {
            categoryResults.skipped++;
            continue;
          }
          
          // Also check by name + address for user-submitted duplicates
          if (props.formatted) {
            const { data: nameMatch } = await supabase
              .from("businesses")
              .select("id")
              .eq("name", props.name)
              .eq("address", props.formatted.split(",")[0])
              .maybeSingle();
            
            if (nameMatch) {
              categoryResults.skipped++;
              continue;
            }
          }
          
          // Build address
          const address = props.street 
            ? `${props.housenumber || ''} ${props.street}`.trim()
            : props.formatted?.split(",")[0] || null;
          
          // Create the business
          const slug = generateSlug(`${props.name}-${props.city || 'jacksonville'}-${Date.now()}`);
          
          const business = {
            name: props.name,
            slug,
            address,
            city: props.city || "Jacksonville",
            state: props.state || "FL",
            zip_code: props.postcode || null,
            category: mapCategory(props.categories),
            phone: props.contact?.phone || null,
            website: props.contact?.website || null,
            email: props.contact?.email || null,
            latitude: props.lat,
            longitude: props.lon,
            source: "geoapify",
            external_id: props.place_id,
            status: "active",
            last_synced_at: new Date().toISOString(),
          };
          
          const { error } = await supabase
            .from("businesses")
            .insert(business);
          
          if (error) {
            console.error(`Error inserting business ${props.name}:`, error);
            results.totalErrors++;
          } else {
            categoryResults.imported++;
          }
        }
        
        results.byCategory[category] = categoryResults;
        results.totalFetched += categoryResults.fetched;
        results.totalImported += categoryResults.imported;
        results.totalSkipped += categoryResults.skipped;
        
        console.log(`${category}: ${categoryResults.imported} imported, ${categoryResults.skipped} skipped`);
        
        // Small delay between categories to respect rate limits
        await new Promise(r => setTimeout(r, 200));
        
      } catch (error) {
        console.error(`Error processing category ${category}:`, error);
        results.byCategory[category] = { fetched: 0, imported: 0, skipped: 0 };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in import-businesses:", error);
    
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
