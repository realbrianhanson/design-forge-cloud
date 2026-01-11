import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Jacksonville center for bias
const JACKSONVILLE = {
  lat: 30.3322,
  lng: -81.6557,
};

interface AutocompleteResult {
  place_id: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  postcode?: string;
  lat: number;
  lon: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEOAPIFY_API_KEY");
    if (!apiKey) {
      throw new Error("GEOAPIFY_API_KEY not configured");
    }

    const { text, action = 'autocomplete' } = await req.json();

    if (!text || text.length < 3) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'autocomplete') {
      // Geoapify Autocomplete API
      const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      url.searchParams.set("text", text);
      url.searchParams.set("filter", "countrycode:us");
      url.searchParams.set("bias", `proximity:${JACKSONVILLE.lng},${JACKSONVILLE.lat}`);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "5");
      url.searchParams.set("apiKey", apiKey);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Geoapify API error: ${response.status}`);
      }

      const data = await response.json();
      const results = data.results || [];

      const suggestions: AutocompleteResult[] = results.map((r: any) => ({
        place_id: r.place_id,
        formatted: r.formatted,
        address_line1: r.address_line1 || r.formatted?.split(',')[0] || '',
        address_line2: r.address_line2 || '',
        street: r.street,
        housenumber: r.housenumber,
        city: r.city,
        state: r.state_code || r.state,
        postcode: r.postcode,
        lat: r.lat,
        lon: r.lon,
      }));

      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geocode action - convert address to coordinates
    if (action === 'geocode') {
      const url = new URL("https://api.geoapify.com/v1/geocode/search");
      url.searchParams.set("text", text);
      url.searchParams.set("filter", "countrycode:us");
      url.searchParams.set("bias", `proximity:${JACKSONVILLE.lng},${JACKSONVILLE.lat}`);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("apiKey", apiKey);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Geoapify API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.results?.[0];

      if (!result) {
        return new Response(
          JSON.stringify({ result: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          result: {
            lat: result.lat,
            lon: result.lon,
            formatted: result.formatted,
            city: result.city,
            state: result.state_code || result.state,
            postcode: result.postcode,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Error in geocode-address:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        suggestions: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
