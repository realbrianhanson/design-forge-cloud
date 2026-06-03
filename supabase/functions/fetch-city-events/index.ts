import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOURCE_URL = 'https://events.jacksonville.gov/all-events/events';
const BASE_URL = 'https://events.jacksonville.gov';

interface ParsedEvent {
  externalId: string;
  title: string;
  url: string;
  imageUrl: string | null;
  dateText: string | null;
  timeText: string | null;
  startTime: string | null;
}

function categorizeEvent(title: string): string {
  const t = title.toLowerCase();
  if (/(5k|run|race|marathon|triathlon|cycling|sport|athletic)/.test(t)) return 'sports';
  if (/(festival|concert|music|jazz|blues|rock|symphony)/.test(t)) return 'arts';
  if (/(art|museum|gallery|exhibit|theatre|theater|show|film|movie)/.test(t)) return 'arts';
  if (/(food|wine|beer|taste|culinary|brewery|restaurant)/.test(t)) return 'food';
  if (/(kids|family|youth|children|bible school|camp)/.test(t)) return 'family';
  if (/(business|networking|conference|expo|seminar|workshop)/.test(t)) return 'business';
  if (/(comic|gaming|cosplay|comicon|cos[\s-]?con)/i.test(t)) return 'arts';
  if (/(council|commission|committee|board|hearing|advisory|government)/.test(t)) return 'government';
  return 'community';
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100);
}

function parseDateText(dateText: string | null, timeText: string | null): string | null {
  if (!dateText) return null;
  const yearMatch = dateText.match(/\b(20\d{2})\b/);
  const monthDayMatch = dateText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
  if (!monthDayMatch) return null;
  const month = monthDayMatch[1];
  const day = monthDayMatch[2];
  const now = new Date();
  const year = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear();
  const dateStr = `${month} ${day}, ${year}`;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  if (!yearMatch && parsed < now) {
    parsed.setFullYear(year + 1);
  }
  if (timeText) {
    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      parsed.setHours(hours, minutes, 0, 0);
    } else {
      parsed.setHours(9, 0, 0, 0);
    }
  } else {
    parsed.setHours(9, 0, 0, 0);
  }
  return parsed.toISOString();
}

function parseEvents(html: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const seen = new Set<string>();
  const titleLinkRe = /<a[^>]+href="(\/all-events\/events\/[^"]+)"[^>]+class="[^"]*listTextTitle[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(titleLinkRe)) {
    const path = match[1];
    const titleRaw = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!titleRaw || titleRaw.length < 3) continue;
    if (seen.has(path)) continue;
    seen.add(path);

    const url = `${BASE_URL}${path}`;
    const externalId = `coj-events:${path.replace(/\//g, '-').replace(/^-|-$/g, '')}`;

    const linkPos = match.index ?? 0;
    const boxStart = Math.max(0, linkPos - 3000);
    const boxEnd = Math.min(html.length, linkPos + 2000);
    const blockContext = html.slice(boxStart, boxEnd);

    const imgMatch = blockContext.match(/background-image\s*:\s*url\(['"]([^'"]+)['"]\)/i);
    let imageUrl: string | null = null;
    if (imgMatch) {
      const raw = imgMatch[1];
      imageUrl = raw.startsWith('http') ? raw : `${BASE_URL}${raw}`;
    }

    const blockText = blockContext.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const dateMatch = blockText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(,?\s*\d{4})?/i);
    const timeMatch = blockText.match(/\d{1,2}:\d{2}\s*(AM|PM)/i);

    const dateText = dateMatch?.[0] ?? null;
    const timeText = timeMatch?.[0] ?? null;
    const startTime = parseDateText(dateText, timeText);

    events.push({
      externalId,
      title: titleRaw,
      url,
      imageUrl,
      dateText,
      timeText,
      startTime,
    });
  }

  return events;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let options: { dryRun?: boolean } = {};
    try {
      if (req.method === 'POST') options = await req.json();
    } catch { /* ignore */ }
    const dryRun = options.dryRun ?? false;

    console.log(`Fetching ${SOURCE_URL} (dryRun: ${dryRun})...`);

    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched HTML: ${html.length} bytes`);

    const events = parseEvents(html);
    console.log(`Parsed ${events.length} unique events`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    if (!dryRun) {
      for (const event of events) {
        if (!event.startTime) {
          console.log(`Skipping event with no parseable date: ${event.title}`);
          skipped++;
          continue;
        }

        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('external_id', event.externalId)
          .maybeSingle();

        const eventData = {
          title: event.title,
          slug: generateSlug(event.title),
          category: categorizeEvent(event.title),
          start_time: event.startTime,
          location_name: 'Jacksonville, FL',
          source_type: 'imported',
          external_id: event.externalId,
          ticket_url: event.url,
          image_url: event.imageUrl,
          status: 'approved',
          organizer_name: 'events.jacksonville.gov',
        };

        if (existing) {
          const { error } = await supabase
            .from('events')
            .update({
              title: eventData.title,
              start_time: eventData.start_time,
              ticket_url: eventData.ticket_url,
              image_url: eventData.image_url,
            })
            .eq('id', existing.id);
          if (error) { console.error('Update error:', error); skipped++; } else { updated++; }
        } else {
          const { error } = await supabase.from('events').insert(eventData);
          if (error) { console.error('Insert error:', error); skipped++; } else { created++; }
        }
      }

      await supabase.from('city_event_imports').insert({
        events_fetched: events.length,
        events_created: created,
        events_updated: updated,
        events_skipped: skipped,
        success: true,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: SOURCE_URL,
        dryRun,
        stats: {
          eventsFound: events.length,
          eventsCreated: created,
          eventsUpdated: updated,
          eventsSkipped: skipped,
        },
        sampleEvents: events.slice(0, 10).map(e => ({
          title: e.title,
          dateText: e.dateText,
          timeText: e.timeText,
          startTime: e.startTime,
          url: e.url,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('fetch-city-events error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
