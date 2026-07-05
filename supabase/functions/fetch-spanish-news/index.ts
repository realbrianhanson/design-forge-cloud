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

// Spanish news search queries for Florida/Jacksonville related content
const SPANISH_NEWS_QUERIES = [
  'Jacksonville Florida',
  'Florida noticias',
  'Jacksonville comunidad',
  'Florida hispanos',
  'Florida latinos',
  'Duval County',
];

function createSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `${baseSlug}-${randomSuffix}`;
}

function categorizeArticle(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Spanish keywords for categorization
  if (text.includes('crimen') || text.includes('arresto') || text.includes('policía') || 
      text.includes('asesinato') || text.includes('tiroteo') || text.includes('robo') ||
      text.includes('sospechoso') || text.includes('investigación')) {
    return 'Crime';
  }
  if (text.includes('negocio') || text.includes('economía') || text.includes('mercado') || 
      text.includes('empresa') || text.includes('empleo') || text.includes('trabajo') ||
      text.includes('desarrollo')) {
    return 'Business';
  }
  if (text.includes('deportes') || text.includes('fútbol') || text.includes('béisbol') ||
      text.includes('baloncesto') || text.includes('jaguars')) {
    return 'Sports';
  }
  if (text.includes('política') || text.includes('gobierno') || text.includes('elección') ||
      text.includes('senador') || text.includes('gobernador') || text.includes('congreso')) {
    return 'Politics';
  }
  if (text.includes('entretenimiento') || text.includes('música') || text.includes('cine') ||
      text.includes('festival') || text.includes('concierto') || text.includes('arte')) {
    return 'Entertainment';
  }
  if (text.includes('clima') || text.includes('huracán') || text.includes('tormenta') ||
      text.includes('tiempo') || text.includes('temperatura')) {
    return 'Weather';
  }
  if (text.includes('tráfico') || text.includes('accidente') || text.includes('carretera')) {
    return 'Traffic';
  }
  
  return 'Local';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');

    if (!NEWS_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'NEWS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching Spanish language news...');
    
    let allArticles: NewsAPIArticle[] = [];

    // Fetch Spanish news from NewsAPI
    for (const query of SPANISH_NEWS_QUERIES) {
      if (allArticles.length >= 50) break;

      console.log(`NewsAPI Spanish search: ${query}`);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=es&sortBy=publishedAt&pageSize=20`,
        {
          headers: {
            'X-Api-Key': NEWS_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`Got ${data.articles?.length || 0} Spanish articles for "${query}"`);
        if (data.articles) {
          allArticles = [...allArticles, ...data.articles];
        }
      } else {
        const errorText = await response.text();
        console.log(`NewsAPI request failed: ${response.status} - ${errorText}`);
      }
    }

    console.log(`Total Spanish articles collected: ${allArticles.length}`);

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

    console.log(`Unique valid Spanish articles: ${uniqueArticles.length}`);

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

    console.log(`New Spanish articles to import: ${newArticles.length}`);

    // Take first 25 new articles
    const articlesToInsert = newArticles.slice(0, 25);

    if (articlesToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new Spanish articles to import',
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
            source_name: article.source.name || 'Noticias',
            image_url: article.urlToImage,
            category: category,
            published_at: article.publishedAt,
            status: 'active',
            content_type: 'aggregated',
            language: 'es', // Mark as Spanish
            is_featured: false,
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

    console.log(`Successfully imported ${insertedArticles.length} Spanish articles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedArticles.length} Spanish news articles`,
        imported: insertedArticles.length,
        articles: insertedArticles,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error importing Spanish articles:', error);
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
