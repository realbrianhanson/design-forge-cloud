import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Jacksonville local news RSS feeds
const RSS_FEEDS = [
  {
    url: 'https://www.jacksonville.com/arcio/rss/category/news/?query=display_date:%5Bnow-2d+TO+now%5D+AND+revision.published:true&sort=display_date:desc&size=20',
    source_name: 'Jacksonville.com',
    category: 'Local'
  },
  {
    url: 'https://www.news4jax.com/arcio/rss/category/news/local/?size=20',
    source_name: 'News4Jax',
    category: 'Local'
  },
  {
    url: 'https://www.firstcoastnews.com/feeds/syndication/rss/news/local',
    source_name: 'First Coast News',
    category: 'Local'
  }
];

// Fallback feeds if local ones fail
const FALLBACK_FEEDS = [
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
    source_name: 'NY Times',
    category: 'Local'
  },
  {
    url: 'https://feeds.npr.org/1001/rss.xml',
    source_name: 'NPR',
    category: 'Local'
  }
];

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  enclosure?: string;
  category?: string;
  source_name?: string;
}

function parseRSSXml(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based XML parsing for RSS items
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches) {
    const getTagContent = (tag: string): string | undefined => {
      // Handle CDATA sections
      const cdataMatch = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
      if (cdataMatch) return cdataMatch[1].trim();
      
      const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : undefined;
    };
    
    const getEnclosure = (): string | undefined => {
      const match = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
      if (match) return match[1];
      
      // Try media:content
      const mediaMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
      if (mediaMatch) return mediaMatch[1];
      
      // Try media:thumbnail
      const thumbMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
      return thumbMatch ? thumbMatch[1] : undefined;
    };
    
    const title = getTagContent('title');
    const link = getTagContent('link') || getTagContent('guid');
    
    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link: link,
        description: getTagContent('description') ? decodeHtmlEntities(getTagContent('description')!) : undefined,
        pubDate: getTagContent('pubDate'),
        enclosure: getEnclosure(),
        category: getTagContent('category')
      });
    }
  }
  
  return items;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .trim();
}

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
    + '-' + Date.now().toString(36);
}

function categorizeArticle(title: string, description?: string, category?: string): string {
  const text = `${title} ${description || ''} ${category || ''}`.toLowerCase();
  
  if (text.includes('crime') || text.includes('arrest') || text.includes('police') || text.includes('shooting')) {
    return 'Crime';
  }
  if (text.includes('politic') || text.includes('election') || text.includes('vote') || text.includes('mayor') || text.includes('council')) {
    return 'Politics';
  }
  if (text.includes('business') || text.includes('econom') || text.includes('market') || text.includes('company')) {
    return 'Business';
  }
  if (text.includes('sport') || text.includes('jaguar') || text.includes('game') || text.includes('player')) {
    return 'Sports';
  }
  if (text.includes('weather') || text.includes('storm') || text.includes('hurricane') || text.includes('rain')) {
    return 'Weather';
  }
  if (text.includes('traffic') || text.includes('road') || text.includes('highway') || text.includes('accident')) {
    return 'Traffic';
  }
  if (text.includes('entertain') || text.includes('movie') || text.includes('music') || text.includes('concert')) {
    return 'Entertainment';
  }
  
  return 'Local';
}

async function fetchFeed(feed: typeof RSS_FEEDS[0]): Promise<RSSItem[]> {
  try {
    console.log(`Fetching ${feed.source_name}...`);
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 904News/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch ${feed.source_name}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const items = parseRSSXml(xml);
    console.log(`Found ${items.length} items from ${feed.source_name}`);
    
    return items.map(item => ({
      ...item,
      source_name: feed.source_name
    }));
  } catch (error) {
    console.log(`Error fetching ${feed.source_name}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch from all feeds in parallel
    let allItems: RSSItem[] = [];
    
    // Try primary feeds first
    const primaryResults = await Promise.all(RSS_FEEDS.map(fetchFeed));
    allItems = primaryResults.flat();
    
    // If we don't have enough articles, try fallback feeds
    if (allItems.length < 10) {
      console.log('Not enough articles from primary feeds, trying fallbacks...');
      const fallbackResults = await Promise.all(FALLBACK_FEEDS.map(fetchFeed));
      allItems = [...allItems, ...fallbackResults.flat()];
    }
    
    console.log(`Total items fetched: ${allItems.length}`);
    
    // Take up to 20 articles
    const articlesToImport = allItems.slice(0, 20);
    
    // Get existing article URLs to avoid duplicates
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('source_url')
      .not('source_url', 'is', null);
    
    const existingUrls = new Set(existingArticles?.map(a => a.source_url) || []);
    
    // Filter out duplicates
    const newArticles = articlesToImport.filter(item => !existingUrls.has(item.link));
    
    console.log(`New articles to import: ${newArticles.length}`);
    
    // Insert articles
    const insertedArticles: Array<{ id: string; title: string; source_name: string }> = [];
    for (const item of newArticles) {
      const category = categorizeArticle(item.title, item.description, item.category);
      const excerpt = item.description?.substring(0, 300) || null;
      
      const result = await supabase
        .from('articles')
        .insert({
          title: item.title,
          slug: createSlug(item.title),
          excerpt: excerpt,
          content: item.description || null,
          source_name: item.source_name || 'Unknown',
          source_url: item.link,
          image_url: item.enclosure || null,
          category: category,
          status: 'active',
          content_type: 'aggregated',
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          is_featured: insertedArticles.length === 0, // First article is featured
          is_breaking: false
        })
        .select('id, title, source_name')
        .single();
      
      if (result.error) {
        console.log(`Error inserting article: ${result.error.message}`);
      } else if (result.data) {
        insertedArticles.push(result.data);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Imported ${insertedArticles.length} new articles`,
        articles: insertedArticles.map(a => ({ id: a.id, title: a.title, source: a.source_name }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (err) {
    console.error('Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
