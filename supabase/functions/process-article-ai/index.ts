import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, action = 'process' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Handle batch processing action
    if (action === 'process_pending') {
      const { data: pendingArticles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, excerpt, content')
        .is('ai_summary', null)
        .eq('status', 'pending')
        .limit(10);
        
      if (fetchError) throw fetchError;
      
      const results = [];
      for (const article of pendingArticles || []) {
        try {
          const result = await processArticle(supabase, article, LOVABLE_API_KEY);
          results.push({ id: article.id, success: true, ...result });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.push({ id: article.id, success: false, error: errorMessage });
        }
      }
      
      return new Response(JSON.stringify({ 
        processed: results.length,
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle single article processing
    if (!articleId) {
      throw new Error('articleId is required');
    }
    
    // Fetch the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, excerpt, content')
      .eq('id', articleId)
      .single();
      
    if (articleError) throw articleError;
    if (!article) throw new Error('Article not found');
    
    const result = await processArticle(supabase, article, LOVABLE_API_KEY);
    
    return new Response(JSON.stringify({ 
      success: true,
      articleId,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing article:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processArticle(
  supabase: any, 
  article: { id: string; title: string; excerpt: string | null; content: string | null },
  apiKey: string
) {
  const articleText = article.excerpt || article.content?.substring(0, 500) || article.title;
  
  const prompt = `You are a local Jacksonville, Florida news analyst. Analyze this article and provide:

1. CATEGORY: Classify into exactly one of: local_news, crime, politics, business, sports, entertainment, weather, traffic

2. NEIGHBORHOOD: If the article mentions a specific Jacksonville area, identify it from this list: downtown, riverside, avondale, san-marco, southside, arlington, mandarin, jacksonville-beach, neptune-beach, atlantic-beach, ponte-vedra, westside, northside, springfield, orange-park. Return null if no specific area is mentioned.

3. SUMMARY: Write a 2-3 sentence summary that:
   - Explains why this matters to Jacksonville residents
   - Adds local context
   - Is written in your own words (not copying the original)
   - Encourages readers to learn more

4. IS_BREAKING: Is this breaking news that Jacksonville residents need to know immediately? (true/false)

Article Title: ${article.title}
Article Excerpt: ${articleText}

Respond in JSON format only:
{
  "category": "string",
  "neighborhood": "string or null",
  "summary": "string",
  "is_breaking": boolean
}`;

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
        { role: 'system', content: 'You are a local news analyst for Jacksonville, Florida. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add more credits.');
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
  
  // Parse JSON from response (handle markdown code blocks)
  let parsed;
  try {
    const jsonMatch = content.match(/```json?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    parsed = JSON.parse(jsonStr.trim());
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI response');
  }
  
  // Validate and normalize the response
  const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'local_news';
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
      .single();
    neighborhoodId = neighborhood?.id || null;
  }
  
  // Update the article
  const { error: updateError } = await supabase
    .from('articles')
    .update({
      category,
      neighborhood_id: neighborhoodId,
      ai_summary: parsed.summary,
      is_breaking: parsed.is_breaking === true,
      status: 'active',
    })
    .eq('id', article.id);
    
  if (updateError) {
    console.error('Failed to update article:', updateError);
    throw updateError;
  }
  
  // Log the processing
  const { error: logError } = await supabase
    .from('ai_processing_logs')
    .insert({
      article_id: article.id,
      category_result: category,
      neighborhood_result: neighborhoodSlug,
      summary_result: parsed.summary,
      is_breaking_result: parsed.is_breaking,
      tokens_used: aiResponse.usage?.total_tokens || 0,
    });
  
  // Ignore log errors - table might not exist
  if (logError) {
    console.log('Could not log AI processing (table may not exist):', logError.message);
  }
  
  return {
    category,
    neighborhood: neighborhoodSlug,
    summary: parsed.summary,
    is_breaking: parsed.is_breaking,
    tokens_used: aiResponse.usage?.total_tokens || 0,
  };
}
