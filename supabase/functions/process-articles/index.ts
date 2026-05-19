import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEIGHBORHOODS = [
  'downtown', 'riverside', 'avondale', 'san-marco', 'southside', 'arlington',
  'mandarin', 'jacksonville-beach', 'neptune-beach', 'atlantic-beach', 'ponte-vedra',
  'westside', 'northside', 'springfield', 'orange-park'
];

const CATEGORIES = [
  'local_news', 'crime', 'politics', 'business', 'sports', 'entertainment', 'weather', 'traffic'
];

interface ProcessResult {
  id: string;
  title: string;
  success: boolean;
  category?: string;
  neighborhood?: string | null;
  summary?: string;
  is_breaking?: boolean;
  error?: string;
}

async function fetchOgImage(sourceUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(sourceUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 904NewsBot' } });
    clearTimeout(timeout);
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    const MAX = 200 * 1024;
    while (total < MAX) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    try { await reader.cancel(); } catch { /* ignore */ }
    const html = new TextDecoder().decode(new Uint8Array(chunks.flatMap(c => Array.from(c)))).slice(0, MAX);
    const m1 = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const m2 = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    const found = m1?.[1] || m2?.[1];
    if (!found) return null;
    try {
      return new URL(found, sourceUrl).toString();
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// deno-lint-ignore no-explicit-any
async function processArticle(supabase: any, article: any, apiKey: string): Promise<ProcessResult> {
  const result: ProcessResult = {
    id: article.id,
    title: article.title,
    success: false,
  };

  try {
    const articleText = article.excerpt || article.content?.substring(0, 500) || article.title;
    const sourceName = article.source_name || 'Unknown Source';

    const systemPrompt = `You are a Jacksonville, Florida local news analyst. Analyze articles and respond with ONLY a valid JSON object (no markdown, no explanation, no code blocks).`;

    const userPrompt = `Analyze this article and respond with ONLY a JSON object:

Article Title: ${article.title}
Article Excerpt: ${articleText}
Source: ${sourceName}

Respond with this exact JSON structure:
{
  "category": "one of: local_news, crime, politics, business, sports, entertainment, weather, traffic",
  "neighborhood": "one of: downtown, riverside, avondale, san-marco, southside, arlington, mandarin, jacksonville-beach, neptune-beach, atlantic-beach, ponte-vedra, westside, northside, springfield, orange-park, or null if not specific to a neighborhood",
  "summary": "2-3 sentence summary explaining why this matters to Jacksonville residents. Write in your own words, add local context.",
  "is_breaking": false,
  "importance_score": 5
}

importance_score: 1-10 where 10 is extremely important breaking news.`;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log(`AI Response for "${article.title.substring(0, 50)}...":`, content);

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // Try to find JSON object
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonStr = objMatch[0];
        }
      }
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      
      // Try to extract partial data
      const categoryMatch = content.match(/"category"\s*:\s*"([^"]+)"/);
      const summaryMatch = content.match(/"summary"\s*:\s*"([^"]+)"/);
      
      if (categoryMatch && summaryMatch) {
        parsed = {
          category: categoryMatch[1],
          summary: summaryMatch[1],
          neighborhood: null,
          is_breaking: false,
        };
      } else {
        // Mark as error and continue
        await supabase
          .from('articles')
          .update({ status: 'error' })
          .eq('id', article.id);
        throw new Error('Failed to parse AI response');
      }
    }

    // Validate and normalize the response
    const category = CATEGORIES.includes(parsed.category?.toLowerCase()) 
      ? parsed.category.toLowerCase() 
      : 'local_news';
    
    const neighborhoodSlug = parsed.neighborhood && NEIGHBORHOODS.includes(parsed.neighborhood.toLowerCase())
      ? parsed.neighborhood.toLowerCase()
      : null;

    // Look up neighborhood ID if slug provided
    let neighborhoodId = null;
    if (neighborhoodSlug) {
      const { data: neighborhood } = await supabase
        .from('neighborhoods')
        .select('id')
        .eq('slug', neighborhoodSlug)
        .maybeSingle();
      neighborhoodId = neighborhood?.id || null;
    }

    // Determine is_breaking based on importance_score or explicit flag
    const isBreaking = parsed.is_breaking === true || (parsed.importance_score && parsed.importance_score >= 9);

    // Update the article
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        category,
        neighborhood_id: neighborhoodId,
        ai_summary: parsed.summary,
        is_breaking: isBreaking,
        status: 'active',
      })
      .eq('id', article.id);

    if (updateError) {
      console.error('Failed to update article:', updateError);
      throw updateError;
    }

    // Log the processing
    await supabase
      .from('ai_processing_logs')
      .insert({
        article_id: article.id,
        category_result: category,
        neighborhood_result: neighborhoodSlug,
        summary_result: parsed.summary,
        is_breaking_result: isBreaking,
        tokens_used: aiResponse.usage?.total_tokens || 0,
        success: true,
      });

    result.success = true;
    result.category = category;
    result.neighborhood = neighborhoodSlug;
    result.summary = parsed.summary;
    result.is_breaking = isBreaking;

    console.log(`✓ Processed: ${article.title.substring(0, 50)}... → ${category}`);

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`✗ Failed: ${article.title.substring(0, 50)}... → ${result.error}`);

    // Log the error
    await supabase
      .from('ai_processing_logs')
      .insert({
        article_id: article.id,
        error_message: result.error,
        success: false,
      });
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse optional request body
    let limit = 10;
    let articleId: string | null = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        limit = body.limit || 10;
        articleId = body.article_id || null;
      } catch {
        // No body or invalid JSON
      }
    }

    // If specific article requested, process just that one
    if (articleId) {
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, excerpt, content, source_name')
        .eq('id', articleId)
        .single();

      if (fetchError || !article) {
        throw new Error('Article not found');
      }

      const result = await processArticle(supabase, article, LOVABLE_API_KEY);

      return new Response(JSON.stringify({
        success: result.success,
        processed: 1,
        results: [result],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query articles without AI summary (pending or active)
    const { data: pendingArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, excerpt, content, source_name')
      .is('ai_summary', null)
      .in('status', ['pending', 'active'])
      .order('published_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!pendingArticles || pendingArticles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending articles to process',
        processed: 0,
        results: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${pendingArticles.length} pending articles...`);

    // Process each article
    const results: ProcessResult[] = [];
    for (const article of pendingArticles) {
      const result = await processArticle(supabase, article, LOVABLE_API_KEY);
      results.push(result);

      // Small delay between articles to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total_processed: results.length,
        succeeded: successCount,
        failed: failedCount,
      },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-articles:', error);
    
    // Return appropriate status for rate limits
    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (error.message.includes('Payment required')) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
