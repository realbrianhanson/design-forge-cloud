
# 904News — Read-Only Audit & Fix Plan

No files were changed. Findings verified against live DB, PostgREST behavior, and source.

## Root cause: empty business directory & homepage "Discover Local"

Verified live:
- DB: 190 `businesses` with `status='active'`.
- Anon `select=id,name` → **200 OK**.
- Anon `select=*` (and `select=email` / `select=phone`) → **401 `permission denied for table businesses`** (PostgREST error 42501).

Column-level GRANTs on `public.businesses` exclude `email` / `phone` from anon (the recent PII hardening). PostgREST fails the whole request when a `select=*` expands to columns the role can't read.

The client hits `select('*')` in:
- `src/hooks/useBusinessDirectory.ts` (line ~34) → `/businesses` renders 0 while `useCategoryCounts` (selects only `category, subcategories`) still returns 190 → matches "count 190, results 0".
- `src/hooks/useBusinesses.ts` `useFeaturedBusinesses` / `useBusiness` / `useSimilarBusinesses` → homepage "Discover Local" empty, business detail 404, similar list empty.
- Same pattern likely to bite anywhere else doing `.from('businesses').select('*')` for anon.

Fix shape (P0): replace `select('*')` in these hooks with an explicit public column list (everything except `email`, `phone`, and any other privileged column). Keep `email`/`phone` reads for the owner/admin path via a separate authenticated query, or expose them through a `businesses_public` view with `security_invoker=on`.

## Other verified findings

**Auth route mismatch (P0, trivial)**
- `src/components/article/CommentsSection.tsx:123` links to `/login`. Router has `/auth/signin` and `/signin`, no `/login`. Every signed-out commenter hits 404.

**Comments / voting / saving are stubs (P1)**
- `src/components/article/CommentsSection.tsx:44` — `// TODO: Implement comment submission` (form no-op).
- `src/components/article/EngagementBar.tsx:51,62` — vote and save are local `useState` only; nothing written to `votes` / `user_saved_items` tables (which already exist with RLS).
- `src/hooks/useComments.ts:48` — hard-coded `author_name: 'Anonymous'`; never joins `user_profiles`.

**Newsletter forms nonfunctional (P1)**
- `src/components/layout/Footer.tsx:120` — `<form onSubmit={(e) => e.preventDefault()}>` with no handler; input isn't wired to state or the RPC. The working form is `NewsletterSignupForm` (used on homepage/newsletter page). News sidebar likely has the same static markup — confirm in `src/pages/News.tsx`. Zero subscribers in DB is consistent with only the homepage form being live.

**Spanish content off-topic (P1)**
- `supabase/functions/fetch-spanish-news/index.ts` uses NewsAPI `everything` with broad Spanish queries and no Jacksonville geo filter, so it surfaces national/LatAm Spanish news. Local RSS sources are English-only, so `language='es'` bucket is dominated by non-local content.
- UI translation coverage: `src/lib/translations.ts` + `useLanguage`. Article/event/business bodies and many card labels are not routed through `t`. Spot-check every `Layout`, card, and page for hard-coded English strings.

**Homepage H1 missing (P2, SEO)**
- `src/pages/Index.tsx` has no `<h1>`. `HeroSection` uses `<h2>` (verify) and `SectionHeader` uses `<h2>`. Google/LLMs see no top-level heading.

**Edge functions with `verify_jwt=false` (P1 security)**
- `supabase/config.toml`: `process-article-ai`, `send-newsletter-email`, and several ingestion functions run unauthenticated. `process-article-ai` uses `SUPABASE_SERVICE_ROLE_KEY` and calls the billable Lovable AI Gateway — anyone can invoke it and rack up spend or mass-mutate `articles`. `send-newsletter-email` similarly can be abused for spam/enumeration.
- Some ingestion functions do gate on `x-pipeline-secret` (per earlier work). Confirm these two do; if not, they must.

**Google Places key rotation (P1, still open)**
- `GOOGLE_PLACES_API_KEY` historically leaked in image URLs. Rotation was deferred to the user. Until rotated, treat the current key as compromised (quota theft, billing risk).

**Footer + social placeholders (P2)**
- `src/components/layout/Footer.tsx` — About / Privacy / Terms all point to `/news`; Twitter/Facebook/Instagram are `https://twitter.com` etc. Kill or replace before publishing more widely.

**Content / engagement (P2)**
- Only 1 future approved event; 0 newsletter subscribers. Ingestion works but supply is thin — audit `fetch-city-events` / `fetch-eventbrite-events` schedules and success rates in `data_operation_logs`, and confirm approval flow isn't silently rejecting events.

## Files involved

```text
Directory bug (P0)
  src/hooks/useBusinessDirectory.ts       select('*') → 401 for anon
  src/hooks/useBusinesses.ts              select('*') in 3 hooks
  src/pages/BusinessDetail.tsx            consumer of useBusiness (verify)
  (schema)  public.businesses column GRANTs — anon has no SELECT on email/phone

Auth link (P0)
  src/components/article/CommentsSection.tsx  line 123: /login → /auth/signin

Comments/votes/saves (P1)
  src/components/article/CommentsSection.tsx  line 44
  src/components/article/EngagementBar.tsx    lines 51, 62
  src/hooks/useComments.ts                    line 48
  (DB)  votes, comments, user_saved_items already exist

Newsletter forms (P1)
  src/components/layout/Footer.tsx            line 120
  src/pages/News.tsx                          sidebar form (verify)
  reuse: src/components/newsletter/NewsletterSignupForm.tsx

Spanish content (P1)
  supabase/functions/fetch-spanish-news/index.ts
  src/lib/translations.ts, src/hooks/useLanguage.tsx, all page/card components

Edge function auth (P1)
  supabase/config.toml
  supabase/functions/process-article-ai/index.ts
  supabase/functions/send-newsletter-email/index.ts

SEO / cosmetics (P2)
  src/pages/Index.tsx                     add semantic <h1>
  src/components/layout/Footer.tsx        real About/Privacy/Terms, real socials
```

## Prioritized fixes

**P0 — Ship immediately (site is visibly broken)**
1. Business directory: replace `select('*')` with an explicit public column list in `useBusinessDirectory`, `useFeaturedBusinesses`, `useBusiness`, `useSimilarBusinesses`. Optionally add `public.businesses_public` view (`security_invoker=on`) for a cleaner contract.
2. Fix `/login` → `/auth/signin` in `CommentsSection.tsx`.

**P1 — Same iteration**
3. Wire real mutations for comments (`comments` insert with `user_profiles` join), votes (`votes` upsert), saves (`user_saved_items` upsert) — replace TODOs and local state.
4. Newsletter forms: wire Footer + News sidebar to `NewsletterSignupForm` (or the RPC directly). Track `source`.
5. Edge function auth: set `verify_jwt=true` for `process-article-ai` and `send-newsletter-email`, or require `x-pipeline-secret` if invoked by cron. Add rate limiting where appropriate.
6. Rotate `GOOGLE_PLACES_API_KEY` in Google Cloud Console, update the Cloud secret, add HTTP-referrer restrictions.
7. Spanish content: filter `fetch-spanish-news` to Jacksonville/Florida geographies and locally relevant sources; consider adding es-language RSS feeds from local Hispanic outlets. Sweep components to route strings through `t`.

**P2 — Polish**
8. Add semantic `<h1>` to homepage (e.g., visually-styled "Jacksonville News, Events & Neighborhoods" above the hero, or promote hero headline to h1).
9. Replace footer placeholder links (About/Privacy/Terms pages + real social URLs, or hide until ready).
10. Audit event ingestion — investigate why only 1 approved future event exists (check `data_operation_logs`, moderation queue).

**P3 — Follow-up**
11. Add integration tests for anon read paths (e.g., a lightweight route smoke test) to catch future column-grant regressions.
12. Add a `businesses_public` view and point the frontend at it; enforce that `select('*')` on the base table is admin-only.
13. Expand translations coverage; consider server-side content translation via AI Gateway for article bodies.

## Suggested 3-batch implementation sequence (no changes made now)

**Batch A — Unblock the site (P0)**
- Patch the three business hooks to explicit column lists.
- Fix the `/login` link.
- Manual verification: homepage "Discover Local" renders, `/businesses` shows results, comment CTA lands on `/auth/signin`.

**Batch B — Restore core interactions (P1)**
- Implement comment insert + list-with-profile-join in `useComments`.
- Implement vote and save mutations in `EngagementBar`.
- Wire footer + news-sidebar newsletter forms to `NewsletterSignupForm`.
- Flip `verify_jwt` on `process-article-ai` and `send-newsletter-email`; verify cron still succeeds.
- Rotate Google Places key and restrict.

**Batch C — Quality & content (P2)**
- Add homepage `<h1>`; replace footer placeholder links.
- Refine `fetch-spanish-news` query/source list to Jacksonville-centric; add missing `t()` calls in shared components.
- Investigate event pipeline low-volume and fix.

## Assumptions
- The News sidebar newsletter is the same static markup as the footer; will confirm in build mode before wiring.
- Publishable/anon key surface is intentional; only the base-table column privileges need adjustment.
- The `businesses` schema has no other privileged columns beyond `email`/`phone`. Will confirm the full column grant list before finalizing the explicit `select` list.
