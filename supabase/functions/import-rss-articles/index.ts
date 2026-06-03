import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsAPIArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl?: string;
}

// Jacksonville-specific keywords for strict filtering
const JACKSONVILLE_KEYWORDS = [
  'jacksonville', 'jax', 'duval', 'st. johns', 'clay county', 'nassau county',
  'ponte vedra', 'orange park', 'fleming island', 'mandarin',
  'riverside', 'san marco', 'avondale', 'jaguars', 'jumbo shrimp', 'icemen',
  'jea', 'jta', 'fscj', 'unf', 'mayo clinic jacksonville', 'baptist health',
  'st. augustine', 'fernandina', 'amelia island', 'neptune beach', 
  'atlantic beach', 'jacksonville beach', 'arlington', 'westside',
  'northside', 'southside', 'downtown jacksonville', 'five points',
  'springfield', 'murray hill', 'ortega', 'san jose', 'baymeadows',
  'town center', 'regency', 'gateway', 'deerwood', 'tinseltown'
];

// Local Jacksonville news domains
const LOCAL_JACKSONVILLE_DOMAINS = [
  'jacksonville.com', 'news4jax.com', 'firstcoastnews.com', 
  'actionnewsjax.com', 'jaxdailyrecord.com', 'folioweekly.com',
  'wjxt.com', 'wjct.org', 'jaxtoday.org'
];

function isStrictlyJacksonvilleRelevant(article: NewsAPIArticle): boolean {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  const sourceName = article.source.name.toLowerCase();
  const url = article.url.toLowerCase();
  
  // Check if from local Jacksonville domain
  const isLocalSource = LOCAL_JACKSONVILLE_DOMAINS.some(domain => 
    url.includes(domain) || sourceName.includes(domain.split('.')[0])
  );
  
  if (isLocalSource) return true;
  
  // Check for Jacksonville-specific keywords with stricter matching
  const hasJaxKeyword = JACKSONVILLE_KEYWORDS.some(keyword => {
    // Require the keyword as a distinct word (not part of another word)
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(text);
  });
  
  // For non-local sources, require explicit Jacksonville mention
  if (hasJaxKeyword) {
    // Must specifically mention Jacksonville, Jax, or Duval
    const hasPrimaryKeyword = /\b(jacksonville|jax|duval)\b/i.test(text);
    return hasPrimaryKeyword;
  }
  
  return false;
}

function createSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `${baseSlug}-${randomSuffix}`;
}

function categorizeArticle(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  if (text.includes('crime') || text.includes('arrest') || text.includes('police') || 
      text.includes('murder') || text.includes('shooting') || text.includes('robbery') ||
      text.includes('suspect') || text.includes('investigation') || text.includes('jso')) {
    return 'Crime';
  }
  if (text.includes('business') || text.includes('economy') || text.includes('market') || 
      text.includes('company') || text.includes('stock') || text.includes('jobs') ||
      text.includes('hiring') || text.includes('development') || text.includes('opening')) {
    return 'Business';
  }
  if (text.includes('jaguars') || text.includes('jumbo shrimp') || text.includes('icemen') ||
      text.includes('football') || text.includes('basketball') || text.includes('nfl') ||
      text.includes('gators') || text.includes('seminoles') || text.includes('playoff') ||
      text.includes('sport') || text.includes('game') || text.includes('coach')) {
    return 'Sports';
  }
  if (text.includes('school') || text.includes('education') || text.includes('student') || 
      text.includes('university') || text.includes('college') || text.includes('dcps') ||
      text.includes('teacher') || text.includes('unf') || text.includes('fscj')) {
    return 'Education';
  }
  if (text.includes('traffic') || text.includes('road') || text.includes('highway') || 
      text.includes('crash') || text.includes('accident') || text.includes('i-95') ||
      text.includes('construction') || text.includes('jta') || text.includes('skyway')) {
    return 'Traffic';
  }
  if (text.includes('weather') || text.includes('storm') || text.includes('hurricane') || 
      text.includes('rain') || text.includes('temperature') || text.includes('flood')) {
    return 'Weather';
  }
  if (text.includes('food') || text.includes('restaurant') || text.includes('dining') || 
      text.includes('chef') || text.includes('menu') || text.includes('brewery')) {
    return 'Food';
  }
  if (text.includes('entertainment') || text.includes('movie') || text.includes('music') || 
      text.includes('concert') || text.includes('show') || text.includes('festival')) {
    return 'Entertainment';
  }
  if (text.includes('politic') || text.includes('election') || text.includes('vote') ||
      text.includes('mayor') || text.includes('council') || text.includes('governor') ||
      text.includes('city hall') || text.includes('county commission')) {
    return 'Politics';
  }
  
  return 'Local';
}

// Parse RSS feed
async function fetchRSSFeed(url: string, sourceName: string): Promise<RSSItem[]> {
  try {
    console.log(`Fetching RSS from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JaxLocalNews/1.0)',
      },
    });
    
    if (!response.ok) {
      console.log(`RSS fetch failed for ${sourceName}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const items: RSSItem[] = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 15)) {
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
      const link = itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>|<link>(.*?)<\/link>/i);
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/is);
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      const imageMatch = itemXml.match(/<media:content[^>]*url="([^"]+)"|<enclosure[^>]*url="([^"]+)"/i);
      
      if (title && link) {
        items.push({
          title: (title[1] || title[2] || '').trim(),
          link: (link[1] || link[2] || '').trim(),
          description: (description?.[1] || description?.[2] || '').replace(/<[^>]+>/g, '').trim().substring(0, 500),
          pubDate: pubDate?.[1] || new Date().toISOString(),
          imageUrl: imageMatch?.[1] || imageMatch?.[2],
        });
      }
    }
    
    console.log(`Parsed ${items.length} items from ${sourceName}`);
    return items;
  } catch (error) {
    console.log(`Error fetching ${sourceName} RSS: ${error}`);
    return [];
  }
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
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Local Jacksonville RSS feeds
    const rssSources = [
      { url: 'https://www.jacksonville.com/arc/outboundfeeds/rss/?outputType=xml', name: 'Florida Times-Union' },
      { url: 'https://www.news4jax.com/rss/', name: 'News4Jax' },
      { url: 'https://www.firstcoastnews.com/feeds/syndication/rss/news/local', name: 'First Coast News' },
    ];

    let allArticles: NewsAPIArticle[] = [];

    // Fetch from local RSS feeds first
    for (const source of rssSources) {
      const rssItems = await fetchRSSFeed(source.url, source.name);
      const converted = rssItems.map(item => ({
        source: { id: null, name: source.name },
        author: null,
        title: item.title,
        description: item.description,
        url: item.link,
        urlToImage: item.imageUrl || null,
        publishedAt: new Date(item.pubDate).toISOString(),
        content: item.description,
      }));
      allArticles = [...allArticles, ...converted];
    }

    console.log(`Fetched ${allArticles.length} articles from RSS feeds`);

    // Supplement with NewsAPI using strict Jacksonville-only search
    const newsApiQueries = [
      '"Jacksonville Florida"',
      '"Duval County"',
      '"Jacksonville Jaguars"',
      '"St. Augustine" Florida',
    ];

    for (const query of newsApiQueries) {
      if (allArticles.length >= 80) break;

      console.log(`NewsAPI search: ${query}`);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=15`,
        {
          headers: {
            'X-Api-Key': NEWS_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`Got ${data.articles?.length || 0} articles for "${query}"`);
        if (data.articles) {
          // Apply strict filtering to NewsAPI results
          const relevantArticles = data.articles.filter(isStrictlyJacksonvilleRelevant);
          console.log(`${relevantArticles.length} passed strict Jacksonville filter`);
          allArticles = [...allArticles, ...relevantArticles];
        }
      } else {
        const errorText = await response.text();
        console.log(`NewsAPI request failed: ${response.status} - ${errorText}`);
      }
    }

    console.log(`Total articles collected: ${allArticles.length}`);

    // Filter out articles without titles or with "[Removed]" content
    const validArticles = allArticles.filter(
      (article) => 
        article.title && 
        article.title !== '[Removed]' && 
        article.url &&
        article.description !== '[Removed]'
    );

    // Remove duplicates by URL
    const uniqueArticles = validArticles.reduce((acc, article) => {
      if (!acc.find(a => a.url === article.url)) {
        acc.push(article);
      }
      return acc;
    }, [] as NewsAPIArticle[]);

    console.log(`Unique valid articles: ${uniqueArticles.length}`);

    // Check which articles already exist
    const existingUrls = new Set<string>();
    
    for (let i = 0; i < uniqueArticles.length; i += 50) {
      const batch = uniqueArticles.slice(i, i + 50);
      const urls = batch.map(a => a.url);
      const { data: existingArticles } = await supabase
        .from('articles')
        .select('source_url')
        .in('source_url', urls);
      
      existingArticles?.forEach(a => {
        if (a.source_url) existingUrls.add(a.source_url);
      });
    }

    const newArticles = uniqueArticles.filter(a => !existingUrls.has(a.url));

    console.log(`New articles to import: ${newArticles.length}`);

    // Take first 25 new articles
    const articlesToInsert = newArticles.slice(0, 25);

    if (articlesToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new Jacksonville articles to import',
          imported: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert articles one by one
    const insertedArticles: Array<{ title: string; category: string; source: string }> = [];
    
    for (const article of articlesToInsert) {
      try {
        const category = categorizeArticle(article.title, article.description || '');
        const { data: inserted, error: insertError } = await supabase
          .from('articles')
          .insert({
            title: article.title,
            slug: createSlug(article.title),
            excerpt: article.description || article.title,
            content: article.content || article.description || article.title,
            source_url: article.url,
            source_name: article.source.name || 'Local News',
            image_url: article.urlToImage,
            category: category,
            published_at: article.publishedAt,
            status: 'active',
            content_type: 'aggregated',
            language: 'en', // Mark as English
            is_featured: insertedArticles.length === 0,
            is_breaking: false,
            view_count: 0,
            upvotes: 0,
            comment_count: 0,
          })
          .select('title, category')
          .single();

        if (!insertError && inserted) {
          insertedArticles.push({
            title: inserted.title,
            category: inserted.category,
            source: article.source.name,
          });
        }
      } catch (e) {
        console.log(`Skipped: ${article.title}`);
      }
    }

    console.log(`Successfully imported ${insertedArticles.length} Jacksonville articles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedArticles.length} Jacksonville local news articles`,
        imported: insertedArticles.length,
        articles: insertedArticles,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error importing articles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
