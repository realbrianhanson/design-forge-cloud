import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CityEvent {
  title: string;
  date: string;
  time?: string;
  location?: string;
  address?: string;
  description?: string;
  url: string;
  category: string;
}

// Map event titles/types to categories
function categorizeEvent(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Government/City Council meetings
  if (
    lowerTitle.includes('council') ||
    lowerTitle.includes('commission') ||
    lowerTitle.includes('committee') ||
    lowerTitle.includes('board') ||
    lowerTitle.includes('cpac') ||
    lowerTitle.includes('public meeting') ||
    lowerTitle.includes('hearing') ||
    lowerTitle.includes('advisory') ||
    lowerTitle.includes('task force') ||
    lowerTitle.includes('shade meeting') ||
    lowerTitle.includes('governance')
  ) {
    return 'government';
  }
  
  // Community events
  if (
    lowerTitle.includes('community') ||
    lowerTitle.includes('neighborhood') ||
    lowerTitle.includes('veterans') ||
    lowerTitle.includes('stand down') ||
    lowerTitle.includes('farmacy') ||
    lowerTitle.includes('food') ||
    lowerTitle.includes('biometrics')
  ) {
    return 'community';
  }
  
  // Arts & Culture
  if (
    lowerTitle.includes('art') ||
    lowerTitle.includes('museum') ||
    lowerTitle.includes('cultural') ||
    lowerTitle.includes('movie') ||
    lowerTitle.includes('film')
  ) {
    return 'arts';
  }
  
  // Sports & Recreation
  if (
    lowerTitle.includes('park') ||
    lowerTitle.includes('playoff') ||
    lowerTitle.includes('sports') ||
    lowerTitle.includes('recreation')
  ) {
    return 'sports';
  }
  
  // Family
  if (
    lowerTitle.includes('kids') ||
    lowerTitle.includes('family') ||
    lowerTitle.includes('youth')
  ) {
    return 'family';
  }
  
  // Business
  if (
    lowerTitle.includes('business') ||
    lowerTitle.includes('retirement') ||
    lowerTitle.includes('employee') ||
    lowerTitle.includes('lunch and learn') ||
    lowerTitle.includes('webinar') ||
    lowerTitle.includes('seminar')
  ) {
    return 'business';
  }
  
  // Default to community for city events
  return 'community';
}

// Parse time string like "12:00 p.m. – 1:00 p.m." to start time
function parseTimeString(timeStr: string): { startTime?: string; endTime?: string } {
  if (!timeStr) return {};
  
  // Match patterns like "12:00 p.m." or "8:00 am"
  const timePattern = /(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)/gi;
  const matches = [...timeStr.matchAll(timePattern)];
  
  if (matches.length === 0) return {};
  
  const parseTime = (match: RegExpMatchArray) => {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toLowerCase().replace(/\./g, '');
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  };
  
  return {
    startTime: parseTime(matches[0]),
    endTime: matches.length > 1 ? parseTime(matches[1]) : undefined,
  };
}

// Parse a date string like "January 13, 2026"
function parseDateString(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// Create a unique external ID for the event
function createExternalId(url: string): string {
  // Use URL path as unique ID since it's consistent
  const urlPath = new URL(url).pathname;
  return `coj:${urlPath.replace(/\//g, '-').replace(/^-|-$/g, '')}`;
}

// Generate a URL-safe slug from the title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let options: { dryRun?: boolean; limit?: number } = {};
    try {
      if (req.method === 'POST') {
        options = await req.json();
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    const dryRun = options.dryRun ?? false;
    const eventLimit = options.limit ?? 100;

    console.log(`Fetching City of Jacksonville events (dryRun: ${dryRun}, limit: ${eventLimit})...`);

    // Fetch the calendar page
    const calendarUrl = 'https://www.jacksonville.gov/all-of-coj/upcoming-events/calendar';
    const response = await fetch(calendarUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched HTML length: ${html.length} chars`);

    // Try multiple patterns to find event links
    const patterns = [
      // Pattern 1: href with all-events in path
      /href="(https?:\/\/www\.jacksonville\.gov\/[^"]*\/all-events\/[^"]+)"[^>]*>([^<]+)/gi,
      // Pattern 2: relative URLs 
      /href="(\/[^"]*\/all-events\/[^"]+)"[^>]*>([^<]+)/gi,
      // Pattern 3: any jacksonville.gov event link
      /href="(https?:\/\/www\.jacksonville\.gov\/[^"]+events[^"]+)"[^>]*>([^<]+)/gi,
    ];

    const parsedEvents: CityEvent[] = [];
    const uniqueUrls = new Set<string>();

    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)];
      console.log(`Pattern found ${matches.length} matches`);
      
      for (const match of matches) {
        let url = match[1];
        const title = match[2].trim();

        // Convert relative URLs to absolute
        if (url.startsWith('/')) {
          url = `https://www.jacksonville.gov${url}`;
        }

        // Skip duplicates
        if (uniqueUrls.has(url)) continue;
        uniqueUrls.add(url);

        // Skip holidays/office closures
        if (title.toLowerCase().includes('closed') || title.toLowerCase().includes('holiday')) {
          continue;
        }

        // Skip empty or very short titles
        if (title.length < 3) continue;

        parsedEvents.push({
          title,
          date: '', // Will be parsed from individual event pages
          url,
          category: categorizeEvent(title),
        });

        if (parsedEvents.length >= eventLimit) break;
      }
      
      if (parsedEvents.length > 0) break; // Use first pattern that finds events
    }

    console.log(`Parsed ${parsedEvents.length} unique events`);

    // If we still have no events, log some HTML to debug
    if (parsedEvents.length === 0) {
      // Look for any href containing "events"
      const anyEventLink = html.match(/href="[^"]*event[^"]*"/gi);
      console.log(`Any event links found: ${anyEventLink?.slice(0, 5).join(', ') || 'none'}`);
      
      // Check if page might be JavaScript rendered
      if (html.includes('__NEXT_DATA__') || html.includes('react-root') || html.includes('ng-app')) {
        console.log('Page appears to use client-side rendering');
      }
    }

    // For events we found, try to get dates from individual pages
    const eventsWithDetails: CityEvent[] = [];
    
    // Limit concurrent fetches
    const batchSize = 5;
    const maxToFetch = Math.min(parsedEvents.length, 20);
    
    for (let i = 0; i < maxToFetch; i += batchSize) {
      const batch = parsedEvents.slice(i, i + batchSize);
      
      const detailPromises = batch.map(async (event) => {
        try {
          const eventResponse = await fetch(event.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          if (!eventResponse.ok) return event;
          
          const eventHtml = await eventResponse.text();
          
          // Try to extract date from the page
          const datePattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i;
          const dateMatch = eventHtml.match(datePattern);
          
          if (dateMatch) {
            event.date = dateMatch[0];
          }
          
          // Try to extract time
          const timePattern = /\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)/i;
          const timeMatch = eventHtml.match(timePattern);
          if (timeMatch) {
            event.time = timeMatch[0];
          }
          
          // Try to extract location
          const locationPattern = /(?:Location|Address|Where)[:]\s*([^<\n]+)/i;
          const locMatch = eventHtml.match(locationPattern);
          if (locMatch) {
            event.location = locMatch[1].trim();
          }
          
          return event;
        } catch (e) {
          console.error(`Error fetching details for ${event.url}:`, e);
          return event;
        }
      });
      
      const batchResults = await Promise.all(detailPromises);
      eventsWithDetails.push(...batchResults);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Add remaining events without detailed fetching
    eventsWithDetails.push(...parsedEvents.slice(maxToFetch));

    // Filter events that have dates
    const validEvents = eventsWithDetails.filter(e => e.date);
    console.log(`${validEvents.length} events have valid dates`);

    // Import stats
    let created = 0;
    let updated = 0;
    let skipped = 0;

    if (!dryRun && validEvents.length > 0) {
      for (const event of validEvents) {
        const externalId = createExternalId(event.url);
        const dateStr = parseDateString(event.date);
        
        if (!dateStr) {
          skipped++;
          continue;
        }

        const timeInfo = parseTimeString(event.time || '');
        const startDateTime = `${dateStr}T${timeInfo.startTime || '09:00:00'}`;
        const endDateTime = timeInfo.endTime ? `${dateStr}T${timeInfo.endTime}` : null;

        // Check if event already exists
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('external_id', externalId)
          .single();

        const eventData = {
          title: event.title,
          category: event.category,
          start_time: startDateTime,
          end_time: endDateTime,
          location_name: event.location || 'City of Jacksonville',
          location_address: event.location?.includes('Jacksonville') ? event.location : null,
          source_type: 'city',
          external_id: externalId,
          external_url: event.url,
          status: 'approved',
          organizer_name: 'City of Jacksonville',
          slug: generateSlug(event.title) + '-' + Date.now().toString(36),
        };

        if (existing) {
          const { error } = await supabase
            .from('events')
            .update({
              title: eventData.title,
              start_time: eventData.start_time,
              end_time: eventData.end_time,
              location_name: eventData.location_name,
              location_address: eventData.location_address,
              external_url: eventData.external_url,
            })
            .eq('id', existing.id);
          
          if (error) {
            console.error('Error updating event:', error);
            skipped++;
          } else {
            updated++;
          }
        } else {
          const { error } = await supabase
            .from('events')
            .insert(eventData);
          
          if (error) {
            console.error('Error creating event:', error);
            skipped++;
          } else {
            created++;
          }
        }
      }

      // Log the import
      await supabase.from('city_event_imports').insert({
        events_fetched: validEvents.length,
        events_created: created,
        events_updated: updated,
        events_skipped: skipped,
        success: true,
      });
    }

    const result = {
      success: true,
      dryRun,
      stats: {
        eventsFound: parsedEvents.length,
        eventsWithDates: validEvents.length,
        eventsCreated: created,
        eventsUpdated: updated,
        eventsSkipped: skipped,
      },
      sampleEvents: (validEvents.length > 0 ? validEvents : parsedEvents).slice(0, 5).map(e => ({
        title: e.title,
        date: e.date || 'not parsed',
        time: e.time,
        location: e.location,
        category: e.category,
        url: e.url,
      })),
    };

    console.log('Import complete:', result.stats);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching city events:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
