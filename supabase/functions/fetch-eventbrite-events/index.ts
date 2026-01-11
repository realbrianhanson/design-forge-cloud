import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventbriteEvent {
  id: string;
  name: { text: string; html: string };
  description: { text: string; html: string } | null;
  url: string;
  start: { utc: string; local: string; timezone: string };
  end: { utc: string; local: string; timezone: string };
  is_free: boolean;
  logo: { original: { url: string } } | null;
  venue?: {
    name: string;
    address: {
      localized_address_display: string;
      city: string;
      region: string;
      postal_code: string;
    };
    latitude: string;
    longitude: string;
  };
  ticket_availability?: {
    minimum_ticket_price?: { major_value: string; currency: string };
    maximum_ticket_price?: { major_value: string; currency: string };
  };
  category_id: string | null;
  subcategory_id: string | null;
}

interface EventbriteResponse {
  events: EventbriteEvent[];
  pagination: {
    page_count: number;
    page_number: number;
    has_more_items: boolean;
  };
}

// Map Eventbrite category IDs to our categories
// https://www.eventbrite.com/platform/api#/reference/categories
const categoryMap: Record<string, string> = {
  '103': 'music',          // Music
  '110': 'food',           // Food & Drink
  '101': 'business',       // Business & Professional
  '105': 'arts',           // Performing & Visual Arts
  '104': 'community',      // Community & Culture
  '108': 'sports',         // Sports & Fitness
  '109': 'family',         // Travel & Outdoor (mapped to family for local events)
  '111': 'nightlife',      // Charity & Causes -> nightlife (can adjust)
  '113': 'community',      // Government & Politics
  '102': 'arts',           // Science & Technology
  '106': 'community',      // Film, Media & Entertainment
  '107': 'family',         // Family & Education
  '112': 'community',      // Religion & Spirituality
  '114': 'community',      // Home & Lifestyle
  '115': 'family',         // Auto, Boat & Air
  '116': 'community',      // Hobbies & Special Interest
  '117': 'community',      // School Activities
  '118': 'community',      // Seasonal & Holiday
  '199': 'community',      // Other
};

function mapCategory(categoryId: string | null): string {
  if (!categoryId) return 'community';
  return categoryMap[categoryId] || 'community';
}

// Strip HTML tags from text
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate a URL-safe slug
function generateSlug(title: string, id: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
  return `${baseSlug}-${id.substring(0, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('EVENTBRITE_API_KEY');
    if (!apiKey) {
      throw new Error('EVENTBRITE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request options
    let options: { dryRun?: boolean; limit?: number; daysAhead?: number } = {};
    try {
      if (req.method === 'POST') {
        options = await req.json();
      }
    } catch {
      // Use defaults
    }

    const dryRun = options.dryRun ?? false;
    const limit = options.limit ?? 100;
    const daysAhead = options.daysAhead ?? 30;

    console.log(`Fetching Eventbrite events (dryRun: ${dryRun}, limit: ${limit}, days: ${daysAhead})...`);

    // Calculate date range
    const now = new Date();
    const startDate = now.toISOString();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    // Fetch events from Eventbrite
    const searchParams = new URLSearchParams({
      'location.address': 'Jacksonville, FL',
      'location.within': '30mi',
      'expand': 'venue,ticket_availability',
      'start_date.range_start': startDate,
      'start_date.range_end': endDate,
      'page_size': Math.min(limit, 50).toString(),
    });

    const allEvents: EventbriteEvent[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && allEvents.length < limit) {
      searchParams.set('page', page.toString());
      
      const response = await fetch(
        `https://www.eventbriteapi.com/v3/events/search/?${searchParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Eventbrite API error:', response.status, errorText);
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data: EventbriteResponse = await response.json();
      allEvents.push(...data.events);
      hasMore = data.pagination.has_more_items;
      page++;

      console.log(`Fetched page ${page - 1}: ${data.events.length} events (total: ${allEvents.length})`);

      // Rate limiting - be nice to the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Total events fetched: ${allEvents.length}`);

    // Import stats
    let created = 0;
    let updated = 0;
    let skipped = 0;

    if (!dryRun) {
      for (const event of allEvents.slice(0, limit)) {
        const externalId = `eventbrite:${event.id}`;

        // Check for existing event
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('external_id', externalId)
          .single();

        // Parse pricing
        let priceMin: number | null = null;
        let priceMax: number | null = null;
        const priceType = event.is_free ? 'free' : 'paid';

        if (event.ticket_availability) {
          if (event.ticket_availability.minimum_ticket_price) {
            priceMin = parseFloat(event.ticket_availability.minimum_ticket_price.major_value);
          }
          if (event.ticket_availability.maximum_ticket_price) {
            priceMax = parseFloat(event.ticket_availability.maximum_ticket_price.major_value);
          }
        }

        // Build description with Eventbrite attribution
        let description = stripHtml(event.description?.text);
        if (description.length > 2000) {
          description = description.substring(0, 2000) + '...';
        }
        
        const shortDescription = description.length > 200 
          ? description.substring(0, 200) + '...' 
          : description;

        const eventData = {
          title: event.name.text,
          short_description: shortDescription,
          description: description,
          category: mapCategory(event.category_id),
          start_time: event.start.utc,
          end_time: event.end.utc,
          location_name: event.venue?.name || 'See event details',
          location_address: event.venue?.address.localized_address_display || null,
          image_url: event.logo?.original.url || null,
          ticket_url: event.url,
          price_type: priceType,
          price_min: priceMin,
          price_max: priceMax,
          source_type: 'eventbrite',
          external_id: externalId,
          external_url: event.url,
          status: 'approved',
          organizer_name: 'via Eventbrite',
          slug: generateSlug(event.name.text, event.id),
        };

        if (existing) {
          // Update existing event
          const { error } = await supabase
            .from('events')
            .update({
              title: eventData.title,
              short_description: eventData.short_description,
              description: eventData.description,
              start_time: eventData.start_time,
              end_time: eventData.end_time,
              location_name: eventData.location_name,
              location_address: eventData.location_address,
              image_url: eventData.image_url,
              ticket_url: eventData.ticket_url,
              price_type: eventData.price_type,
              price_min: eventData.price_min,
              price_max: eventData.price_max,
            })
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating event:', error);
            skipped++;
          } else {
            updated++;
          }
        } else {
          // Create new event
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
    }

    const result = {
      success: true,
      dryRun,
      stats: {
        eventsFetched: allEvents.length,
        eventsCreated: created,
        eventsUpdated: updated,
        eventsSkipped: skipped,
      },
      sampleEvents: allEvents.slice(0, 5).map(e => ({
        id: e.id,
        title: e.name.text,
        startTime: e.start.local,
        venue: e.venue?.name || 'TBD',
        isFree: e.is_free,
        category: mapCategory(e.category_id),
        url: e.url,
      })),
    };

    console.log('Import complete:', result.stats);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);

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
