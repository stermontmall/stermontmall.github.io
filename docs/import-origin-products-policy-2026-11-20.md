# Imported / origin-specific products policy (owner-approved 2026-11-20)

Source of truth: Supabase `public.site_playbook`, topic `import_origin_products` (also pointed to from `READ_ME_FIRST`). This file mirrors it for the repo.

Applies when the same product is listed from different producing countries (e.g. MAP 12-61-0 25kg from Morocco, Saudi Arabia, Russia, China) and no Kenyan KES listing exists for that origin. All other posting rules still apply.

## Pricing
- FX: USD 1 = KSh 129.50 (checked 2026-11-20; CBK indicative 129.89 on 2026-10-23). Re-check at the start of each batch and record it.
- Landed-cost allowance: +25% (freight, duty, clearing, handling). Single value to change if real quotes arrive.
- Baseline KES = supplier USD price per 25kg bag x 129.50 x 1.25. Per-ton quotes: divide by 40.
- Then the 4-tier markup (`public.price_4tier`), 15% minimum margin, round to nearest KSh 50, KSh 200 minimum. Stock 1000, low_at 20.
- Never invent a USD quote. Origin must be stated on the source page. Technical/industrial grade quotes are not a valid baseline.

## Listing rules
- id: `map-fertilizer-25kg-<country>` (no date stamps). Name states the country of origin.
- Never overwrite the existing `mono-ammonium-phosphate-map-fertilizer-25kg`.
- Photo: exact product photo sourced online and attached via `public.add_product_photo`; stay inactive if no match.
- Description: original, structured, 600-900 factual words.
- Product links given to the owner: `https://stermontarcade.co.ke/?product=<slug>`.
