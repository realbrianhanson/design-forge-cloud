# Make article pages worth returning to

Goal: turn each article from a one-paragraph summary into a richer, original page that gives readers (and Google) a reason to come back — all fully automated, no editorial work.

## What gets added to every article

1. **TL;DR bullets** — 3–5 short bullets with the key facts (who/what/where/when/$).
2. **Why it matters for Jacksonville** — 2–3 bullets of local impact, written from a local angle, not a rehash of the summary.
3. **FAQ block** — 3–5 "People also ask" style Q&As, rendered as an accordion and emitted as `FAQPage` JSON-LD (SEO multiplier — eligible for rich results).
4. **Related on 904news** — up to 3 auto-linked articles from the same category/neighborhood (DB query, no AI cost).

The existing AI Summary card stays as the lead.

## Where the work happens

### 1. Database (migration)
Add columns to `articles`:
- `tldr_bullets text[]`
- `local_impact text[]`
- `faq jsonb` — array of `{ question, answer }`
- `enrichment_status text default 'pending'` — so we can re-run only what's missing

### 2. Edge function: `process-articles`
After the existing summary step, add a second AI call (one per article, `google/gemini-2.5-flash`) that returns a structured object with `tldr_bullets`, `local_impact`, and `faq` in a single call. Save to the new columns. Set `enrichment_status='complete'`. On failure, log and leave status `pending` so the next run retries.

Prompt is grounded in the source article + the fact that the audience is Jacksonville residents. Explicitly forbids copying source sentences verbatim (avoids duplicate-content risk).

### 3. Frontend: `ArticleDetail.tsx`
Render new blocks in this order, below the AI Summary:
- TL;DR bullets (compact bulleted list, icon)
- Why it matters for Jacksonville (callout card)
- Article body / "Read full article" CTA (unchanged)
- Related on 904news (already present — keep)
- FAQ accordion (uses existing `Accordion` component) + inject `FAQPage` JSON-LD via the existing `SEO` component's `structuredData` prop

All blocks render only if data is present, so older articles without enrichment still look fine.

### 4. Backfill
One-shot: run `process-articles` against existing articles with `enrichment_status='pending'` in batches. No new function needed — the same one handles it.

## What we are NOT doing (and why)

- **Not lengthening the AI Summary** — that's plagiarism risk and adds no unique value.
- **Not auto-translating to Spanish per article** — separate larger effort; can be next.
- **Not synthesizing multiple sources into one article** — requires clustering logic; bigger scope.
- **Not adding a Timeline / "Story so far"** — needs entity linking across articles; phase 2.

## Cost / impact
- ~1 extra AI call per article on ingest. Gemini Flash → fractions of a cent each.
- Article pages roughly 3–4× more content, all original, all structured. Better dwell time, better SEO (FAQ rich results), better return-visit value.

## Technical notes
- Schema for the AI call uses Zod with the AI SDK `Output` API (structured output, no JSON parsing).
- FAQ JSON-LD follows schema.org `FAQPage` spec.
- New columns are nullable so the migration is non-breaking.
- Render gates: each block checks `Array.isArray(x) && x.length > 0`.