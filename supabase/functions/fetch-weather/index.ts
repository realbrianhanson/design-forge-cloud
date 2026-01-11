import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Jacksonville coordinates and NWS config
const JACKSONVILLE = {
  lat: 30.3322,
  lon: -81.6557,
  forecastOffice: "JAX",
  gridX: 72,
  gridY: 55,
  observationStation: "KJAX",
  alertZone: "FLZ025", // Duval County
};

const NWS_USER_AGENT = "(904News, contact@904news.com)";

// Alert types that should generate articles
const ARTICLE_WORTHY_ALERTS = [
  'hurricane warning',
  'hurricane watch',
  'tropical storm warning',
  'tropical storm watch',
  'storm surge warning',
  'storm surge watch',
  'tornado warning',
  'tornado watch',
  'severe thunderstorm warning',
  'flash flood warning',
  'flood warning',
  'extreme heat warning',
  'excessive heat warning',
  'freeze warning',
  'winter storm warning',
];

// Helper to fetch with retry
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000
): Promise<Response> {
  const headers = {
    ...options.headers,
    "User-Agent": NWS_USER_AGENT,
    "Accept": "application/geo+json",
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.ok) {
        return response;
      }
      
      // If 500 error, retry
      if (response.status >= 500 && i < retries - 1) {
        console.log(`NWS returned ${response.status}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      
      throw new Error(`NWS API error: ${response.status} ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Fetch failed, retrying in ${delay}ms...`, error);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  
  throw new Error("Max retries exceeded");
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32);
}

// Parse NWS temperature (can be in C or F)
function parseTemperature(value: number | null, unit: string): { f: number; c: number } | null {
  if (value === null) return null;
  
  if (unit === "wmoUnit:degC" || unit === "C") {
    return {
      c: Math.round(value),
      f: celsiusToFahrenheit(value),
    };
  }
  
  // Assume Fahrenheit
  return {
    f: Math.round(value),
    c: Math.round((value - 32) * 5/9),
  };
}

// Fetch current observations from nearest station
async function fetchCurrentWeather() {
  console.log("Fetching current weather from KJAX...");
  
  const url = `https://api.weather.gov/stations/${JACKSONVILLE.observationStation}/observations/latest`;
  const response = await fetchWithRetry(url);
  const data = await response.json();
  
  const props = data.properties;
  
  // Parse temperature
  const temp = parseTemperature(
    props.temperature?.value,
    props.temperature?.unitCode || "wmoUnit:degC"
  );
  
  const feelsLike = parseTemperature(
    props.windChill?.value || props.heatIndex?.value || props.temperature?.value,
    props.temperature?.unitCode || "wmoUnit:degC"
  );

  return {
    temperature_f: temp?.f || null,
    temperature_c: temp?.c || null,
    conditions: props.textDescription || "Unknown",
    conditions_icon: props.icon || null,
    humidity: props.relativeHumidity?.value ? Math.round(props.relativeHumidity.value) : null,
    wind_speed: props.windSpeed?.value 
      ? `${Math.round(props.windSpeed.value * 0.621371)} mph` // Convert km/h to mph
      : null,
    wind_direction: props.windDirection?.value 
      ? getWindDirection(props.windDirection.value) 
      : null,
    feels_like_f: feelsLike?.f || temp?.f || null,
  };
}

// Convert wind degrees to direction
function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", 
                      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Fetch 7-day forecast
async function fetchForecast() {
  console.log("Fetching 7-day forecast...");
  
  const url = `https://api.weather.gov/gridpoints/${JACKSONVILLE.forecastOffice}/${JACKSONVILLE.gridX},${JACKSONVILLE.gridY}/forecast`;
  const response = await fetchWithRetry(url);
  const data = await response.json();
  
  const periods = data.properties?.periods || [];
  
  return periods.map((period: {
    name: string;
    startTime: string;
    isDaytime: boolean;
    temperature: number;
    temperatureUnit: string;
    shortForecast: string;
    icon: string;
    probabilityOfPrecipitation?: { value: number | null };
    detailedForecast: string;
  }) => ({
    forecast_date: period.startTime.split("T")[0],
    period_name: period.name,
    is_daytime: period.isDaytime,
    temperature: period.temperature,
    temperature_unit: period.temperatureUnit,
    conditions: period.shortForecast,
    conditions_icon: period.icon,
    precipitation_chance: period.probabilityOfPrecipitation?.value || 0,
    detailed_forecast: period.detailedForecast,
  }));
}

// Fetch active alerts for Duval County
async function fetchAlerts() {
  console.log("Fetching weather alerts for Duval County...");
  
  const url = `https://api.weather.gov/alerts/active?zone=${JACKSONVILLE.alertZone}`;
  const response = await fetchWithRetry(url);
  const data = await response.json();
  
  const features = data.features || [];
  
  return features.map((feature: {
    properties: {
      id: string;
      event: string;
      severity: string;
      urgency: string;
      headline: string;
      description: string;
      instruction: string | null;
      areaDesc: string;
      effective: string;
      expires: string;
    };
  }) => {
    const props = feature.properties;
    return {
      alert_id: props.id,
      event: props.event,
      severity: (props.severity || "unknown").toLowerCase(),
      urgency: (props.urgency || "unknown").toLowerCase(),
      headline: props.headline,
      description: props.description,
      instruction: props.instruction,
      areas: props.areaDesc?.split("; ") || [],
      effective_at: props.effective,
      expires_at: props.expires,
      status: "active",
    };
  });
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// Check if alert should generate an article
function shouldGenerateArticle(event: string): boolean {
  const eventLower = event.toLowerCase();
  return ARTICLE_WORTHY_ALERTS.some(alertType => eventLower.includes(alertType));
}

// Create weather article from alert
async function createWeatherArticle(
  supabase: any,
  alert: {
    alert_id: string;
    event: string;
    severity: string;
    headline: string;
    description: string;
    instruction: string | null;
  }
): Promise<string | null> {
  // Check if article already exists for this alert
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("external_id", `weather-${alert.alert_id}`)
    .maybeSingle();

  if (existing) {
    console.log(`Article already exists for alert: ${alert.event}`);
    return null;
  }

  const isBreaking = alert.severity === 'severe' || alert.severity === 'extreme';
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const title = `${alert.event} issued for Jacksonville area`;
  const slug = generateSlug(`${title}-${Date.now()}`);
  
  const content = `
## ${alert.headline || alert.event}

${alert.description}

${alert.instruction ? `### What You Should Do\n\n${alert.instruction}` : ''}

### Stay Informed

For the latest updates:
- Monitor local news and weather services
- Follow @NWSJacksonville on social media
- Tune to NOAA Weather Radio (162.475 MHz)
- Visit [JaxReady.com](https://www.jaxready.com) for emergency information

*This article was automatically generated from a National Weather Service alert.*
  `.trim();

  const article = {
    title,
    slug,
    excerpt: alert.headline || `A ${alert.event} has been issued for the Jacksonville metropolitan area.`,
    content,
    category: 'weather',
    source_name: 'National Weather Service',
    source_url: 'https://www.weather.gov/jax/',
    external_id: `weather-${alert.alert_id}`,
    is_breaking: isBreaking,
    is_featured: isBreaking,
    status: 'active',
    published_at: timestamp,
    created_at: timestamp,
    content_type: 'aggregated',
  };

  const { data, error } = await supabase
    .from("articles")
    .insert(article)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating weather article:", error);
    return null;
  }

  console.log(`Created weather article: ${title} (ID: ${data.id})`);
  return data.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      current: { success: false, error: null as string | null },
      forecast: { success: false, count: 0, error: null as string | null },
      alerts: { success: false, count: 0, newAlerts: 0, articlesCreated: 0, error: null as string | null },
    };

    // 1. Fetch and update current weather
    try {
      const current = await fetchCurrentWeather();
      
      const { error } = await supabase
        .from("weather_current")
        .upsert({
          location: "jacksonville",
          ...current,
          updated_at: new Date().toISOString(),
        }, { onConflict: "location" });

      if (error) throw error;
      results.current.success = true;
      console.log("Current weather updated:", current.temperature_f + "°F", current.conditions);
    } catch (error) {
      console.error("Error fetching current weather:", error);
      results.current.error = error instanceof Error ? error.message : "Unknown error";
    }

    // 2. Fetch and update forecast
    try {
      const forecasts = await fetchForecast();
      
      // Delete old forecasts for this location
      await supabase
        .from("weather_forecast")
        .delete()
        .eq("location", "jacksonville");

      // Insert new forecasts
      const { error } = await supabase
        .from("weather_forecast")
        .insert(forecasts.map((f: Record<string, unknown>) => ({
          location: "jacksonville",
          ...f,
        })));

      if (error) throw error;
      results.forecast.success = true;
      results.forecast.count = forecasts.length;
      console.log(`Forecast updated: ${forecasts.length} periods`);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      results.forecast.error = error instanceof Error ? error.message : "Unknown error";
    }

    // 3. Fetch and update alerts + auto-generate articles
    try {
      const alerts = await fetchAlerts();
      
      // Mark expired alerts
      await supabase
        .from("weather_alerts")
        .update({ status: "expired" })
        .lt("expires_at", new Date().toISOString())
        .eq("status", "active");

      let newAlertCount = 0;
      let articlesCreated = 0;
      
      for (const alert of alerts) {
        // Check if alert already exists
        const { data: existing } = await supabase
          .from("weather_alerts")
          .select("id")
          .eq("alert_id", alert.alert_id)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase
            .from("weather_alerts")
            .insert(alert);
          
          if (!error) {
            newAlertCount++;
            
            // Check if this alert should generate an article
            if (shouldGenerateArticle(alert.event)) {
              const articleId = await createWeatherArticle(supabase, alert);
              if (articleId) articlesCreated++;
            }
          }
        }
      }

      results.alerts.success = true;
      results.alerts.count = alerts.length;
      results.alerts.newAlerts = newAlertCount;
      results.alerts.articlesCreated = articlesCreated;
      console.log(`Alerts: ${alerts.length} active, ${newAlertCount} new, ${articlesCreated} articles created`);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      results.alerts.error = error instanceof Error ? error.message : "Unknown error";
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
    console.error("Error in fetch-weather:", error);
    
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
