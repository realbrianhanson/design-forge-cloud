# Deferred security items

These are known security gaps that were intentionally deferred. Revisit when the relevant secrets/access are available.

## Edge function authentication
**Status:** DONE. `PIPELINE_SECRET` is set as an edge function secret and mirrored in Supabase Vault as `pipeline_secret`. Internal functions (daily-news-pipeline, process-articles, fetch-rss, enrich-businesses, fetch-crime-data, fetch-city-events, fetch-eventbrite-events, fetch-weather, fetch-spanish-news, import-businesses, import-rss-articles) enforce the `x-pipeline-secret` header. All 6 pg_cron jobs read the secret from `vault.decrypted_secrets` at run time and include the header in `net.http_post`. `daily-news-pipeline` forwards the header to `fetch-rss` and `process-articles`.

**Functions intentionally left open (called from frontend):** geocode-address, send-newsletter-email, process-article-ai.



## Google Places API key
**Status:** The historical `GOOGLE_PLACES_API_KEY` was previously leaked in image URLs stored in `businesses.cover_image_url`. Those URLs have been nulled, but the key itself was not rotated.

**Fix:** Rotate the key in Google Cloud Console, restrict the new key to domains (`904news.com`, `*.lovable.app`), and update `GOOGLE_PLACES_API_KEY` in Supabase secrets. Also verify "Places API (New)" is enabled and billing is active — current enrichment runs return 0 results across all 190 businesses, suggesting the key/billing/API enablement needs investigation.

## CORS
**Status:** All edge functions use `Access-Control-Allow-Origin: '*'`.

**Fix:** For functions called from the frontend, lock to your domains. For internal-only functions, no CORS needed once authentication is in place.
