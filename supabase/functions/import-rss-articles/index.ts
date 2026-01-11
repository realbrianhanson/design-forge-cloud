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

// Jacksonville-specific keywords to prioritize local news
const JACKSONVILLE_KEYWORDS = [
  'jacksonville', 'jax', 'duval', 'st. johns', 'clay county', 'nassau county',
  'beaches', 'ponte vedra', 'orange park', 'fleming island', 'mandarin',
  'riverside', 'san marco', 'avondale', 'jaguars', 'jumbo shrimp', 'icemen',
  'jea', 'jta', 'fscj', 'unf', 'mayo clinic jacksonville', 'baptist health',
  'st. augustine', 'fernandina', 'amelia island'
];

function isJacksonvilleRelevant(article: NewsAPIArticle): boolean {
  const text = `${article.title} ${article.description || ''} ${article.source.name}`.toLowerCase();
  return JACKSONVILLE_KEYWORDS.some(keyword => text.includes(keyword));
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
      text.includes('suspect') || text.includes('investigation')) {
    return 'Crime';
  }
  if (text.includes('business') || text.includes('economy') || text.includes('market') || 
      text.includes('company') || text.includes('stock') || text.includes('jobs') ||
      text.includes('hiring') || text.includes('development')) {
    return 'Business';
  }
  if (text.includes('sport') || text.includes('jaguars') || text.includes('football') || 
      text.includes('basketball') || text.includes('game') || text.includes('nfl') ||
      text.includes('gators') || text.includes('seminoles') || text.includes('playoff')) {
    return 'Sports';
  }
  if (text.includes('school') || text.includes('education') || text.includes('student') || 
      text.includes('university') || text.includes('college') || text.includes('dcps')) {
    return 'Education';
  }
  if (text.includes('traffic') || text.includes('road') || text.includes('highway') || 
      text.includes('crash') || text.includes('accident') || text.includes('i-95') ||
      text.includes('construction')) {
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
      text.includes('mayor') || text.includes('council') || text.includes('governor')) {
    return 'Politics';
  }
  
  return 'Local';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // More specific Jacksonville/Northeast Florida search queries
    const searchQueries = [
      'Jacksonville Florida news',
      'Jacksonville Jaguars',
      'Duval County Florida',
      'St. Johns County Florida',
      'Northeast Florida',
      'St. Augustine Florida',
      'Jacksonville crime',
      'Jacksonville business',
      'Florida Gators',
    ];

    let allArticles: NewsAPIArticle[] = [];

    // Search for Jacksonville-specific news first
    for (const query of searchQueries) {
      if (allArticles.length >= 100) break;

      console.log(`Searching for: ${query}`);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20`,
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
          allArticles = [...allArticles, ...data.articles];
        }
      } else {
        const errorText = await response.text();
        console.log(`Search request failed: ${response.status} - ${errorText}`);
      }
    }

    console.log(`Total articles fetched: ${allArticles.length}`);

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

    // Prioritize Jacksonville-relevant articles
    const jacksonvilleArticles = uniqueArticles.filter(isJacksonvilleRelevant);
    const otherArticles = uniqueArticles.filter(a => !isJacksonvilleRelevant(a));
    
    // Combine with Jacksonville articles first
    const sortedArticles = [...jacksonvilleArticles, ...otherArticles];

    console.log(`Jacksonville-relevant articles: ${jacksonvilleArticles.length}`);
    console.log(`Valid unique articles: ${uniqueArticles.length}`);

    // Check which articles already exist - use smaller batches to avoid issues
    const existingUrls = new Set<string>();
    
    // Check in batches of 50 to avoid query limits
    for (let i = 0; i < sortedArticles.length; i += 50) {
      const batch = sortedArticles.slice(i, i + 50);
      const urls = batch.map(a => a.url);
      const { data: existingArticles } = await supabase
        .from('articles')
        .select('source_url')
        .in('source_url', urls);
      
      existingArticles?.forEach(a => {
        if (a.source_url) existingUrls.add(a.source_url);
      });
    }

    const newArticles = sortedArticles.filter(a => !existingUrls.has(a.url));

    console.log(`New articles to import: ${newArticles.length}`);

    // Take only first 20 new articles
    const articlesToInsert = newArticles.slice(0, 20);

    if (articlesToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new articles to import',
          imported: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert articles one by one to handle duplicates gracefully
    const insertedArticles: Array<{ title: string; category: string }> = [];
    
    for (const article of articlesToInsert) {
      try {
        const { data: inserted, error: insertError } = await supabase
          .from('articles')
          .insert({
            title: article.title,
            slug: createSlug(article.title),
            excerpt: article.description || article.title,
            content: article.content || article.description || article.title,
            source_url: article.url,
            source_name: article.source.name || 'NewsAPI',
            image_url: article.urlToImage,
            category: categorizeArticle(article.title, article.description || ''),
            published_at: article.publishedAt,
            status: 'active',
            content_type: 'aggregated',
            is_featured: insertedArticles.length === 0,
            is_breaking: false,
            view_count: 0,
            upvotes: 0,
            comment_count: 0,
          })
          .select('title, category')
          .single();

        if (!insertError && inserted) {
          insertedArticles.push(inserted);
        }
      } catch (e) {
        // Skip duplicates silently
        console.log(`Skipped duplicate: ${article.title}`);
      }
    }

    console.log(`Successfully imported ${insertedArticles.length} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedArticles.length} articles from NewsAPI`,
        imported: insertedArticles.length,
        jacksonvilleRelevant: jacksonvilleArticles.length,
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
