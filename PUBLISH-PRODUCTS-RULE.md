# READ THIS FIRST — Product publishing rule (Claude + ChatGPT)

If the owner says "publish products", "run the publish rule", or asks you to add products to the website, follow the rule below exactly. It is a permanent, fully autonomous standing instruction: the owner does not supply photos, descriptions, prices or SEO. Find everything online and publish directly.

## Where the rule lives
- **Source of truth:** Neon project `restless-shape-79120240`, database `stermont`, table `public.publishing_rules`, key `publish_products`.
  Load it with: `select content from public.publishing_rules where key = 'publish_products';`
- **This file** is a mirror so the rule is visible the moment GitHub is connected. If the two ever differ, the Neon row wins (check its `version` and `updated_at`).
- Also run `select key, version, title from public.publishing_rules;` to see the other rules (`00_read_me_first`, `supabase_legacy_rules`).

## How to connect
- **Claude:** connect the GitHub and Neon connectors, then say "publish products".
- **ChatGPT:** connect GitHub and Neon, ask it to read this file and the Neon rule, then say "publish products".
- Never use Supabase to add products. Supabase is quota-restricted; its hidden products are restored separately.
- Never put passwords, connection strings or API keys in this repo or in chat.

## Notes for assistants
- `rules/publishing-rule.json` and `AGENTS.md` / `CLAUDE.md` describe the older Supabase workflow. For posting to Neon, the rule below governs.
- Business focus: **Pest Control & Fumigation** and **Agrovet**.
- Check duplicates against Neon **and** this repo's `sitemap-products.xml` / `product-names.json` (the old Supabase catalogue returns when its quota resumes).

---

## The rule (Neon `publish_products`, version 4 = "v3.1", updated 2026-11-23)

The full text lives ONLY in Neon (load it with the query above). The older long mirror (v7/v9/v10 photo addenda) was removed on 2026-11-23 because it disagreed with the live row; it is in git history. Essentials of v3.1:

- **No questions.** Defaults: Pest Control & Fumigation + Agrovet, 25 products, unless the owner says otherwise. Skip or leave inactive and carry on; report only at the end.
- **Kept on purpose:** Step 0 PCPB ban guard (banned/withdrawn actives are never inserted), exact-product/exact-pack photo checks, four-tier price via `price_4tier(cost)`, stock 1000, low_at 50, 600-800 word description.
- **Order:** insert inactive (images empty) -> set low_at 50 -> attach photos with ChatGPT Action `ingestProductPhoto` (201 = hosted; fallback: workflow `upload-product-photos.yml`) -> activate every passing product with ONE `update ... set active = true` statement (Step 8 in the Neon row) -> verify + audit log.
- **ChatGPT one-time setup (owner):** Custom GPT -> Actions -> import `chatgpt-product-ingest-openapi.json` -> Authentication: API key, Bearer, paste the ingest key there (never in chat or the repo).

Rollback: `archive.publishing_rules_before_easy_20261123` holds the previous row (version 3).
