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
      text.includes('murder') || text.includes('shooting') || text.includes('robbery')) {
    return 'Crime';
  }
  if (text.includes('business') || text.includes('economy') || text.includes('market') || 
      text.includes('company') || text.includes('stock')) {
    return 'Business';
  }
  if (text.includes('sport') || text.includes('jaguars') || text.includes('football') || 
      text.includes('basketball') || text.includes('game') || text.includes('team')) {
    return 'Sports';
  }
  if (text.includes('school') || text.includes('education') || text.includes('student') || 
      text.includes('university') || text.includes('college')) {
    return 'Education';
  }
  if (text.includes('traffic') || text.includes('road') || text.includes('highway') || 
      text.includes('crash') || text.includes('accident')) {
    return 'Traffic';
  }
  if (text.includes('weather') || text.includes('storm') || text.includes('hurricane') || 
      text.includes('rain') || text.includes('temperature')) {
    return 'Weather';
  }
  if (text.includes('food') || text.includes('restaurant') || text.includes('dining') || 
      text.includes('chef') || text.includes('menu')) {
    return 'Food';
  }
  if (text.includes('entertainment') || text.includes('movie') || text.includes('music') || 
      text.includes('concert') || text.includes('show')) {
    return 'Entertainment';
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

    // Fetch US top headlines and Florida/Jacksonville news
    const searchQueries = [
      'Jacksonville Florida',
      'Florida news',
    ];

    let allArticles: NewsAPIArticle[] = [];

    // First get top US headlines
    console.log('Fetching US top headlines...');
    const headlinesResponse = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=20`,
      {
        headers: {
          'X-Api-Key': NEWS_API_KEY,
        },
      }
    );

    if (headlinesResponse.ok) {
      const headlinesData = await headlinesResponse.json();
      console.log(`Got ${headlinesData.articles?.length || 0} top headlines`);
      if (headlinesData.articles) {
        allArticles = [...headlinesData.articles];
      }
    } else {
      console.log(`Headlines request failed: ${headlinesResponse.status}`);
    }

    // Then search for local news
    for (const query of searchQueries) {
      if (allArticles.length >= 40) break;

      console.log(`Searching for: ${query}`);
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
          allArticles = [...allArticles, ...data.articles];
        }
      } else {
        console.log(`Search request failed: ${response.status}`);
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

    console.log(`Valid unique articles: ${uniqueArticles.length}`);

    // Check which articles already exist
    const sourceUrls = uniqueArticles.map(a => a.url);
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('source_url')
      .in('source_url', sourceUrls);

    const existingUrls = new Set(existingArticles?.map(a => a.source_url) || []);
    const newArticles = uniqueArticles.filter(a => !existingUrls.has(a.url));

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

    // Insert articles
    const insertData = articlesToInsert.map((article, index) => ({
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
      is_featured: index === 0,
      is_breaking: false,
      view_count: 0,
      upvotes: 0,
      comment_count: 0,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('articles')
      .insert(insertData)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully imported ${inserted?.length || 0} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${inserted?.length || 0} articles from NewsAPI`,
        imported: inserted?.length || 0,
        articles: inserted?.map(a => ({ title: a.title, category: a.category })),
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
