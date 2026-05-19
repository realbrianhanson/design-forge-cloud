# Deferred security items

These are known security gaps that were intentionally deferred. Revisit when the relevant secrets/access are available.

## Edge function authentication
**Status:** All 13 edge functions have `verify_jwt = false` and no internal authentication. Anyone with the function URL can trigger them, including AI-burning endpoints like `process-articles` and `daily-news-pipeline`.

**Fix:** Generate a random 32+ character secret (`openssl rand -hex 32`), set it as `PIPELINE_SECRET` in Supabase Edge Function secrets, then add a header check at the top of each internal-only function:
```ts
const expectedSecret = Deno.env.get('PIPELINE_SECRET');
const providedSecret = req.headers.get('x-pipeline-secret');
if (expectedSecret && providedSecret !== expectedSecret) {
  return new Response('Unauthorized', { status: 401 });
}
```
Then update the cron jobs in `pg_cron` to pass the secret in the `x-pipeline-secret` header.

**Functions to protect:** daily-news-pipeline, process-articles, fetch-rss, enrich-businesses, fetch-crime-data, fetch-city-events, fetch-eventbrite-events, fetch-weather, fetch-spanish-news, import-businesses, import-rss-articles.

**Functions to leave open (called from frontend):** geocode-address, send-newsletter-email, process-article-ai (single-article admin trigger).

## Google Places API key
**Status:** The historical `GOOGLE_PLACES_API_KEY` was previously leaked in image URLs stored in `businesses.cover_image_url`. Those URLs have been nulled, but the key itself was not rotated.

**Fix:** Rotate the key in Google Cloud Console, restrict the new key to domains (`904news.com`, `*.lovable.app`), and update `GOOGLE_PLACES_API_KEY` in Supabase secrets. Also verify "Places API (New)" is enabled and billing is active — current enrichment runs return 0 results across all 190 businesses, suggesting the key/billing/API enablement needs investigation.

## CORS
**Status:** All edge functions use `Access-Control-Allow-Origin: '*'`.

**Fix:** For functions called from the frontend, lock to your domains. For internal-only functions, no CORS needed once authentication is in place.
