import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// JSO ArcGIS service endpoints to try (these may need to be updated)
// ArcGIS Hub typically uses services like:
// https://services.arcgis.com/[ORG_ID]/arcgis/rest/services/[SERVICE_NAME]/FeatureServer/0
const JSO_ENDPOINTS = [
  // Common patterns for Florida/Jacksonville crime data
  "https://services.arcgis.com/LBbVDC0hKPAnLRpO/arcgis/rest/services/Crime_Incidents_Public/FeatureServer/0",
  "https://services.arcgis.com/LBbVDC0hKPAnLRpO/arcgis/rest/services/JSO_Crime_Data/FeatureServer/0",
  "https://services1.arcgis.com/LBbVDC0hKPAnLRpO/arcgis/rest/services/Crime/FeatureServer/0",
  // Jacksonville specific org patterns
  "https://services.arcgis.com/aAg7b4UMT7yZEr8J/arcgis/rest/services/Crime_Incidents/FeatureServer/0",
  "https://gis.coj.net/arcgis/rest/services/Public/Crime/FeatureServer/0",
];

// Field mapping: ArcGIS field names -> our schema
// These may vary based on the actual service schema
const FIELD_MAPPINGS = {
  incident_number: ["CaseNumber", "Case_Number", "CASE_NUMBER", "IncidentNumber", "INCIDENT_NUM", "case_number", "ReportNumber"],
  incident_type: ["Offense", "OFFENSE", "Crime_Type", "CRIME_TYPE", "offense_type", "CrimeType", "Description"],
  description: ["Description", "DESCRIPTION", "Narrative", "NARRATIVE", "offense_description"],
  occurred_at: ["DateOccurred", "Date_Occurred", "DATE_OCCURRED", "IncidentDate", "INCIDENT_DATE", "date_occurred", "OccurredDate"],
  reported_at: ["DateReported", "Date_Reported", "DATE_REPORTED", "ReportDate", "REPORT_DATE"],
  address: ["Address", "ADDRESS", "Location", "LOCATION", "Block_Address", "BLOCK_ADDRESS"],
  zone: ["Zone", "ZONE", "JSO_Zone", "Police_Zone", "POLICE_ZONE", "Beat"],
  latitude: ["Y", "y", "LATITUDE", "Latitude", "lat", "LAT"],
  longitude: ["X", "x", "LONGITUDE", "Longitude", "lon", "LON", "lng"],
};

// Category classification
const VIOLENT_CRIMES = [
  "murder", "homicide", "manslaughter", "robbery", "assault", "battery",
  "sexual battery", "rape", "kidnapping", "aggravated assault", "armed robbery"
];

const PROPERTY_CRIMES = [
  "burglary", "theft", "larceny", "auto theft", "motor vehicle theft",
  "vandalism", "arson", "criminal mischief", "shoplifting", "grand theft"
];

function classifyIncident(type: string): "violent" | "property" | "other" {
  const lowerType = type.toLowerCase();
  if (VIOLENT_CRIMES.some(crime => lowerType.includes(crime))) {
    return "violent";
  }
  if (PROPERTY_CRIMES.some(crime => lowerType.includes(crime))) {
    return "property";
  }
  return "other";
}

function getFieldValue(attributes: Record<string, unknown>, fieldNames: string[]): unknown {
  for (const fieldName of fieldNames) {
    if (attributes[fieldName] !== undefined && attributes[fieldName] !== null) {
      return attributes[fieldName];
    }
  }
  return null;
}

function parseDate(value: unknown): string | null {
  if (!value) return null;
  
  // ArcGIS often returns Unix timestamps in milliseconds
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  
  // Try parsing string dates
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  
  return null;
}

async function discoverServiceEndpoint(): Promise<{ url: string; fields: string[] } | null> {
  console.log("Attempting to discover JSO ArcGIS service endpoint...");
  
  for (const endpoint of JSO_ENDPOINTS) {
    try {
      // Query the service metadata
      const metadataUrl = `${endpoint}?f=json`;
      console.log(`Trying: ${metadataUrl}`);
      
      const response = await fetch(metadataUrl, {
        headers: { "Accept": "application/json" },
      });
      
      if (response.ok) {
        const metadata = await response.json();
        
        if (metadata.fields && Array.isArray(metadata.fields)) {
          const fieldNames = metadata.fields.map((f: { name: string }) => f.name);
          console.log(`Found valid service at ${endpoint} with ${fieldNames.length} fields`);
          return { url: endpoint, fields: fieldNames };
        }
      }
    } catch (error) {
      console.log(`Endpoint ${endpoint} failed:`, error);
      continue;
    }
  }
  
  return null;
}

async function fetchCrimeData(
  endpoint: string,
  hoursBack: number = 48
): Promise<{ features: Array<{ attributes: Record<string, unknown>; geometry?: { x: number; y: number } }> }> {
  // Calculate date filter
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursBack);
  
  // Build query - try common date field patterns
  const dateFields = ["DateOccurred", "Date_Occurred", "DATE_OCCURRED", "IncidentDate", "INCIDENT_DATE"];
  const cutoffTimestamp = cutoffDate.getTime();
  
  // Try with date filter first
  for (const dateField of dateFields) {
    const whereClause = `${dateField} >= ${cutoffTimestamp}`;
    const queryUrl = new URL(`${endpoint}/query`);
    queryUrl.searchParams.set("where", whereClause);
    queryUrl.searchParams.set("outFields", "*");
    queryUrl.searchParams.set("returnGeometry", "true");
    queryUrl.searchParams.set("f", "json");
    queryUrl.searchParams.set("resultRecordCount", "1000");
    
    try {
      console.log(`Querying with date field ${dateField}...`);
      const response = await fetch(queryUrl.toString());
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          console.log(`Found ${data.features.length} incidents with ${dateField} filter`);
          return data;
        }
      }
    } catch {
      continue;
    }
  }
  
  // Fallback: get latest records without date filter
  console.log("Date filter failed, fetching latest 1000 records...");
  const queryUrl = new URL(`${endpoint}/query`);
  queryUrl.searchParams.set("where", "1=1");
  queryUrl.searchParams.set("outFields", "*");
  queryUrl.searchParams.set("returnGeometry", "true");
  queryUrl.searchParams.set("f", "json");
  queryUrl.searchParams.set("resultRecordCount", "1000");
  queryUrl.searchParams.set("orderByFields", "OBJECTID DESC");
  
  const response = await fetch(queryUrl.toString());
  if (!response.ok) {
    throw new Error(`Query failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request parameters
    const url = new URL(req.url);
    const hoursBack = parseInt(url.searchParams.get("hours") || "48");
    const dryRun = url.searchParams.get("dry_run") === "true";
    const customEndpoint = url.searchParams.get("endpoint");

    console.log(`Fetching crime data (${hoursBack} hours back, dryRun: ${dryRun})`);

    // Step 1: Discover or use custom endpoint
    let serviceInfo: { url: string; fields: string[] } | null = null;
    
    if (customEndpoint) {
      console.log(`Using custom endpoint: ${customEndpoint}`);
      serviceInfo = { url: customEndpoint, fields: [] };
    } else {
      serviceInfo = await discoverServiceEndpoint();
    }

    if (!serviceInfo) {
      // Return instructions for manual configuration
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not discover JSO ArcGIS service endpoint",
          instructions: [
            "The JSO Transparency Portal may use a different ArcGIS service URL.",
            "Steps to find the correct endpoint:",
            "1. Visit https://transparency.jaxsheriff.org",
            "2. Open browser DevTools (F12) → Network tab",
            "3. Look for requests to 'services.arcgis.com' or similar",
            "4. Find a FeatureServer URL with crime/incident data",
            "5. Call this function with ?endpoint=[YOUR_URL]",
            "",
            "Example: /fetch-crime-data?endpoint=https://services.arcgis.com/ORG/arcgis/rest/services/Crime/FeatureServer/0",
            "",
            "Alternatively, the JSO may provide data through:",
            "- A different GIS server (gis.coj.net)",
            "- A direct download (CSV/Excel)",
            "- An authenticated API requiring credentials"
          ],
          tried_endpoints: JSO_ENDPOINTS,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Fetch crime data
    const data = await fetchCrimeData(serviceInfo.url, hoursBack);

    if (!data.features || data.features.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No new incidents found",
          endpoint: serviceInfo.url,
          inserted: 0,
          updated: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log a sample record to help with field mapping
    if (data.features.length > 0) {
      console.log("Sample record attributes:", JSON.stringify(data.features[0].attributes));
    }

    // Step 3: Get neighborhoods for location matching
    const { data: neighborhoods } = await supabase
      .from("neighborhoods")
      .select("id, name, zip_codes");

    // Step 4: Process and insert incidents
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    const statsToUpdate: Record<string, number> = {};

    for (const feature of data.features) {
      try {
        const attrs = feature.attributes;
        const geometry = feature.geometry;

        // Extract fields using mapping
        const incidentNumber = getFieldValue(attrs, FIELD_MAPPINGS.incident_number);
        const incidentType = getFieldValue(attrs, FIELD_MAPPINGS.incident_type);

        if (!incidentNumber || !incidentType) {
          console.log("Skipping record - missing required fields:", { incidentNumber, incidentType });
          skipped++;
          continue;
        }

        // Check if already exists
        const { data: existing } = await supabase
          .from("crime_incidents")
          .select("id")
          .eq("incident_number", String(incidentNumber))
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Extract other fields
        const occurredAt = parseDate(getFieldValue(attrs, FIELD_MAPPINGS.occurred_at));
        const reportedAt = parseDate(getFieldValue(attrs, FIELD_MAPPINGS.reported_at));
        const address = getFieldValue(attrs, FIELD_MAPPINGS.address);
        const zone = getFieldValue(attrs, FIELD_MAPPINGS.zone);
        const description = getFieldValue(attrs, FIELD_MAPPINGS.description);

        // Get coordinates
        let latitude = getFieldValue(attrs, FIELD_MAPPINGS.latitude) as number | null;
        let longitude = getFieldValue(attrs, FIELD_MAPPINGS.longitude) as number | null;

        // Use geometry if attributes don't have coords
        if (!latitude && geometry?.y) latitude = geometry.y;
        if (!longitude && geometry?.x) longitude = geometry.x;

        // Classify incident
        const category = classifyIncident(String(incidentType));

        // Try to match neighborhood (simplified - just use zone for now)
        // A more sophisticated approach would use geocoding or polygon containment
        let neighborhoodId: string | null = null;

        // Build the incident record
        const incident = {
          incident_number: String(incidentNumber),
          incident_type: String(incidentType),
          incident_category: category,
          description: description ? String(description) : null,
          occurred_at: occurredAt,
          reported_at: reportedAt,
          address: address ? String(address) : null,
          neighborhood_id: neighborhoodId,
          latitude: latitude,
          longitude: longitude,
          zone: zone ? String(zone) : null,
          status: "open",
          source_url: serviceInfo.url,
          raw_data: attrs,
        };

        if (dryRun) {
          console.log("Would insert:", incident.incident_number, incident.incident_type);
          inserted++;
        } else {
          const { error } = await supabase.from("crime_incidents").insert(incident);

          if (error) {
            console.error("Insert error:", error);
            errors++;
          } else {
            inserted++;

            // Track stats for aggregation
            if (occurredAt) {
              const dateKey = occurredAt.split("T")[0];
              const statsKey = `${dateKey}|${String(incidentType)}`;
              statsToUpdate[statsKey] = (statsToUpdate[statsKey] || 0) + 1;
            }
          }
        }
      } catch (err) {
        console.error("Error processing feature:", err);
        errors++;
      }
    }

    // Step 5: Update daily stats (upsert)
    if (!dryRun && Object.keys(statsToUpdate).length > 0) {
      console.log("Updating daily stats...");
      
      for (const [key, count] of Object.entries(statsToUpdate)) {
        const [date, incidentType] = key.split("|");
        
        // Check if exists
        const { data: existingStat } = await supabase
          .from("crime_stats_daily")
          .select("id, count")
          .eq("date", date)
          .is("neighborhood_id", null)
          .eq("incident_type", incidentType)
          .maybeSingle();

        if (existingStat) {
          await supabase
            .from("crime_stats_daily")
            .update({ count: existingStat.count + count })
            .eq("id", existingStat.id);
        } else {
          await supabase.from("crime_stats_daily").insert({
            date,
            neighborhood_id: null,
            incident_type: incidentType,
            count,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        endpoint: serviceInfo.url,
        total_fetched: data.features.length,
        inserted,
        skipped,
        errors,
        dry_run: dryRun,
        sample_fields: data.features.length > 0 
          ? Object.keys(data.features[0].attributes)
          : [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in fetch-crime-data:", error);
    
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