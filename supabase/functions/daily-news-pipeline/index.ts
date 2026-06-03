import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipelineResult {
  success: boolean;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  fetch_results?: {
    sources_processed: number;
    articles_found: number;
    articles_inserted: number;
  };
  process_results?: {
    total_processed: number;
    succeeded: number;
    failed: number;
  };
  error?: string;
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


  const startTime = new Date();
  const result: PipelineResult = {
    success: false,
    started_at: startTime.toISOString(),
    completed_at: '',
    duration_seconds: 0,
  };

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional parameters
    let processLimit = 20;
    let skipFetch = false;
    let skipProcess = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        processLimit = body.process_limit || 20;
        skipFetch = body.skip_fetch || false;
        skipProcess = body.skip_process || false;
      } catch {
        // No body or invalid JSON
      }
    }

    console.log('🚀 Starting daily news pipeline...');
    console.log(`  - Skip fetch: ${skipFetch}`);
    console.log(`  - Skip process: ${skipProcess}`);
    console.log(`  - Process limit: ${processLimit}`);

    // Step 1: Fetch RSS feeds
    if (!skipFetch) {
      console.log('\n📰 Step 1: Fetching RSS feeds...');
      
      const fetchResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-rss`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('RSS fetch failed:', errorText);
        throw new Error(`RSS fetch failed: ${fetchResponse.status}`);
      }

      const fetchData = await fetchResponse.json();
      console.log('RSS fetch complete:', fetchData.summary);

      result.fetch_results = {
        sources_processed: fetchData.summary?.sources_processed || 0,
        articles_found: fetchData.summary?.total_articles_found || 0,
        articles_inserted: fetchData.summary?.total_articles_inserted || 0,
      };
    } else {
      console.log('\n⏭️ Skipping RSS fetch');
    }

    // Step 2: Process articles with AI
    if (!skipProcess) {
      console.log('\n🤖 Step 2: Processing articles with AI...');

      const processResponse = await fetch(`${SUPABASE_URL}/functions/v1/process-articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: processLimit }),
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('Article processing failed:', errorText);
        // Don't throw - we still got RSS articles
        result.process_results = {
          total_processed: 0,
          succeeded: 0,
          failed: 0,
        };
      } else {
        const processData = await processResponse.json();
        console.log('Article processing complete:', processData.summary);

        result.process_results = {
          total_processed: processData.summary?.total_processed || 0,
          succeeded: processData.summary?.succeeded || 0,
          failed: processData.summary?.failed || 0,
        };
      }
    } else {
      console.log('\n⏭️ Skipping article processing');
    }

    // Log pipeline run
    await supabase.from('ai_processing_logs').insert({
      success: true,
      summary_result: `Pipeline: ${result.fetch_results?.articles_inserted || 0} fetched, ${result.process_results?.succeeded || 0} processed`,
    });

    const endTime = new Date();
    result.success = true;
    result.completed_at = endTime.toISOString();
    result.duration_seconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    console.log(`\n✅ Pipeline completed in ${result.duration_seconds}s`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const endTime = new Date();
    result.completed_at = endTime.toISOString();
    result.duration_seconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    result.error = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ Pipeline failed:', result.error);

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
