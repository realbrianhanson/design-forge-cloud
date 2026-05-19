import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://904news.com";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Entry {
  loc: string;
  lastmod?: string;
  priority: string;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function buildXml(entries: Entry[]): string {
  const urls = entries.map(e => {
    const parts = [`    <loc>${xmlEscape(e.loc)}</loc>`];
    if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
    parts.push(`    <priority>${e.priority}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const entries: Entry[] = [
      { loc: `${BASE_URL}/`, priority: '1.0' },
      { loc: `${BASE_URL}/news`, priority: '0.8' },
      { loc: `${BASE_URL}/events`, priority: '0.8' },
      { loc: `${BASE_URL}/businesses`, priority: '0.8' },
      { loc: `${BASE_URL}/neighborhoods`, priority: '0.8' },
      { loc: `${BASE_URL}/weather`, priority: '0.8' },
      { loc: `${BASE_URL}/crime`, priority: '0.8' },
    ];

    const [articles, events, businesses, neighborhoods] = await Promise.all([
      supabase.from('articles').select('slug, updated_at').eq('status', 'active').eq('language', 'en'),
      supabase.from('events').select('slug, updated_at').eq('status', 'approved').gte('start_time', new Date().toISOString()),
      supabase.from('businesses').select('slug, updated_at').eq('status', 'active'),
      supabase.from('neighborhoods').select('slug'),
    ]);

    articles.data?.forEach((a: any) => {
      if (a.slug) entries.push({ loc: `${BASE_URL}/news/${a.slug}`, lastmod: a.updated_at, priority: '0.7' });
    });
    events.data?.forEach((e: any) => {
      if (e.slug) entries.push({ loc: `${BASE_URL}/events/${e.slug}`, lastmod: e.updated_at, priority: '0.6' });
    });
    businesses.data?.forEach((b: any) => {
      if (b.slug) entries.push({ loc: `${BASE_URL}/businesses/${b.slug}`, lastmod: b.updated_at, priority: '0.5' });
    });
    neighborhoods.data?.forEach((n: any) => {
      if (n.slug) entries.push({ loc: `${BASE_URL}/neighborhoods/${n.slug}`, priority: '0.4' });
    });

    return new Response(buildXml(entries), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('sitemap-xml error:', error);
    return new Response('Error generating sitemap', { status: 500, headers: corsHeaders });
  }
});
