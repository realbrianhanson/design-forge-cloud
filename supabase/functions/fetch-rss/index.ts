import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RssSource {
  id: string;
  name: string;
  slug: string;
  feed_url: string;
  website_url: string | null;
  category_default: string | null;
  is_active: boolean;
}

interface FetchResult {
  source_id: string;
  source_name: string;
  success: boolean;
  articles_found: number;
  articles_inserted: number;
  error?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

async function hashSuffix(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 4)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImageUrl(item: Record<string, unknown>): string | null {
  // Try media:content
  if (item['media:content']) {
    const media = item['media:content'] as Record<string, unknown>;
    if (typeof media === 'object' && media['@url']) {
      return media['@url'] as string;
    }
    if (Array.isArray(media) && media[0]?.['@url']) {
      return media[0]['@url'] as string;
    }
  }
  
  // Try media:thumbnail
  if (item['media:thumbnail']) {
    const thumb = item['media:thumbnail'] as Record<string, unknown>;
    if (typeof thumb === 'object' && thumb['@url']) {
      return thumb['@url'] as string;
    }
  }
  
  // Try enclosure
  if (item['enclosure']) {
    const enclosure = item['enclosure'] as Record<string, unknown>;
    if (typeof enclosure === 'object' && enclosure['@url']) {
      const type = enclosure['@type'] as string || '';
      if (type.startsWith('image/')) {
        return enclosure['@url'] as string;
      }
    }
  }
  
  // Try to extract from content/description
  const content = (item['content:encoded'] || item['description'] || '') as string;
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  return null;
}

function parseXmlSimple(xml: string): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];
  
  // Handle RSS 2.0 format
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches) {
    const item: Record<string, unknown> = {};
    
    // Extract common fields
    const fields = ['title', 'link', 'description', 'pubDate', 'guid', 'author', 'dc:creator'];
    for (const field of fields) {
      const regex = new RegExp(`<${field}[^>]*>([\\s\\S]*?)<\\/${field}>`, 'i');
      const match = itemXml.match(regex);
      if (match) {
        // Handle CDATA
        let value = match[1];
        const cdataMatch = value.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        if (cdataMatch) {
          value = cdataMatch[1];
        }
        item[field] = value.trim();
      }
    }
    
    // Extract content:encoded
    const contentMatch = itemXml.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
    if (contentMatch) {
      let value = contentMatch[1];
      const cdataMatch = value.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
      if (cdataMatch) {
        value = cdataMatch[1];
      }
      item['content:encoded'] = value.trim();
    }
    
    // Extract media:content
    const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*\/?>/i);
    if (mediaMatch) {
      item['media:content'] = { '@url': mediaMatch[1] };
    }
    
    // Extract media:thumbnail
    const thumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*\/?>/i);
    if (thumbMatch) {
      item['media:thumbnail'] = { '@url': thumbMatch[1] };
    }
    
    // Extract enclosure
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']([^"']+)["'][^>]*\/?>/i);
    if (enclosureMatch) {
      item['enclosure'] = { '@url': enclosureMatch[1], '@type': enclosureMatch[2] };
    }
    
    items.push(item);
  }
  
  // Handle Atom format if no RSS items found
  if (items.length === 0) {
    const entryMatches = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
    
    for (const entryXml of entryMatches) {
      const item: Record<string, unknown> = {};
      
      // Title
      const titleMatch = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        item['title'] = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
      }
      
      // Link - prefer alternate
      const linkMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']alternate["'][^>]*\/?>/i) ||
                        entryXml.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["'][^>]*\/?>/i) ||
                        entryXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i);
      if (linkMatch) {
        item['link'] = linkMatch[1];
      }
      
      // Summary/content as description
      const summaryMatch = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
                           entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
      if (summaryMatch) {
        item['description'] = summaryMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
      }
      
      // Published date
      const pubMatch = entryXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
                       entryXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
      if (pubMatch) {
        item['pubDate'] = pubMatch[1].trim();
      }
      
      // ID as guid
      const idMatch = entryXml.match(/<id[^>]*>([\s\S]*?)<\/id>/i);
      if (idMatch) {
        item['guid'] = idMatch[1].trim();
      }
      
      items.push(item);
    }
  }
  
  return items;
}

// deno-lint-ignore no-explicit-any
async function fetchAndParseRss(source: RssSource, supabase: any): Promise<FetchResult> {
  const result: FetchResult = {
    source_id: source.id,
    source_name: source.name,
    success: false,
    articles_found: 0,
    articles_inserted: 0,
  };
  
  try {
    console.log(`Fetching RSS from ${source.name}: ${source.feed_url}`);
    
    // Fetch the RSS feed
    const response = await fetch(source.feed_url, {
      headers: {
        'User-Agent': '904News RSS Aggregator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xml = await response.text();
    const items = parseXmlSimple(xml);
    
    result.articles_found = items.length;
    console.log(`Found ${items.length} items in ${source.name}`);
    
    // Process each item
    for (const item of items) {
      try {
        const title = item['title'] as string;
        const link = item['link'] as string;
        const description = item['description'] as string || '';
        const pubDate = item['pubDate'] as string;
        const guid = (item['guid'] as string) || link;
        
        if (!title || !link) {
          console.log('Skipping item without title or link');
          continue;
        }
        
        const externalId = guid || link;
        
        // Check if article already exists
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('rss_source_id', source.id)
          .eq('external_id', externalId)
          .maybeSingle();
        
        if (existing) {
          console.log(`Article already exists: ${title.substring(0, 50)}...`);
          continue;
        }
        
        // Also check by source_url to avoid duplicates
        const { data: existingByUrl } = await supabase
          .from('articles')
          .select('id')
          .eq('source_url', link)
          .maybeSingle();
        
        if (existingByUrl) {
          console.log(`Article with same URL exists: ${title.substring(0, 50)}...`);
          continue;
        }
        
        // Extract and clean data
        const excerpt = stripHtml(description).substring(0, 300);
        const imageUrl = extractImageUrl(item);
        const slug = `${slugify(title)}-${await hashSuffix(externalId)}`;
        
        // Parse published date
        let publishedAt: string | null = null;
        if (pubDate) {
          try {
            const date = new Date(pubDate);
            if (!isNaN(date.getTime())) {
              publishedAt = date.toISOString();
            }
          } catch {
            console.log(`Could not parse date: ${pubDate}`);
          }
        }
        
        // Insert article
        const { error: insertError } = await supabase
          .from('articles')
          .insert({
            title: title.substring(0, 500),
            slug,
            excerpt: excerpt || null,
            source_url: link,
            source_name: source.name,
            image_url: imageUrl,
            category: source.category_default || 'local_news',
            content_type: 'aggregated',
            status: 'pending',
            published_at: publishedAt,
            rss_source_id: source.id,
            external_id: externalId,
          });
        
        if (insertError) {
          // Check if it's a duplicate key error
          if (insertError.code === '23505') {
            console.log(`Duplicate article skipped: ${title.substring(0, 50)}...`);
          } else {
            console.error(`Failed to insert article: ${insertError.message}`);
          }
        } else {
          result.articles_inserted++;
          console.log(`Inserted: ${title.substring(0, 50)}...`);
        }
      } catch (itemError) {
        console.error(`Error processing item:`, itemError);
      }
    }
    
    // Update last_fetched_at and accumulate articles_count
    const { data: current } = await supabase
      .from('rss_sources')
      .select('articles_count')
      .eq('id', source.id)
      .single();

    await supabase
      .from('rss_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        articles_count: (current?.articles_count ?? 0) + result.articles_inserted,
      })
      .eq('id', source.id);
    
    result.success = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching ${source.name}:`, error);
  }
  
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    let sourceId: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        sourceId = body.source_id || null;
      } catch {
        // No body or invalid JSON, fetch all sources
      }
    }
    
    // Query RSS sources
    let query = supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true);
    
    if (sourceId) {
      query = query.eq('id', sourceId);
    }
    
    const { data: sources, error: sourcesError } = await query;
    
    if (sourcesError) {
      throw new Error(`Failed to fetch RSS sources: ${sourcesError.message}`);
    }
    
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active RSS sources found', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${sources.length} RSS sources`);
    
    // Fetch all sources in parallel
    const settled = await Promise.allSettled(
      sources.map(source => fetchAndParseRss(source as RssSource, supabase))
    );
    const results: FetchResult[] = settled.map((s, i) => {
      if (s.status === 'fulfilled') return s.value;
      return {
        source_id: sources[i].id,
        source_name: sources[i].name,
        success: false,
        articles_found: 0,
        articles_inserted: 0,
        error: s.reason instanceof Error ? s.reason.message : 'Unknown error',
      };
    });
    
    // Summary
    const totalFound = results.reduce((sum, r) => sum + r.articles_found, 0);
    const totalInserted = results.reduce((sum, r) => sum + r.articles_inserted, 0);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          sources_processed: sources.length,
          sources_succeeded: successCount,
          sources_failed: failedCount,
          total_articles_found: totalFound,
          total_articles_inserted: totalInserted,
        },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-rss:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
