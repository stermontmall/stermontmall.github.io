# Stermont Arcade — Product Pricing Rules

**Status:** Canonical staff rule  
**Source of truth:** `CLAUDE.md` and Supabase `public.publishing_rules`, key `autonomous_bulk_product_publishing`  
**Applies to:** New products and new pack variants across Stermont Arcade  
**Currency:** Kenyan shillings (KES / KSh), inclusive of applicable local taxes

This document makes the current rule easy to find. The live staff admin view reads the canonical rule from Supabase; do not maintain a separate competing formula here.

## 1. Verify the baseline cost

- Prefer the lowest reliable Kenyan wholesale/distributor price for the exact brand, model and pack size from a trusted Kenyan supplier.
- If only reputable Nairobi retail prices are published, use the retail price multiplied by 0.85 as the estimated baseline and label it as an estimate in the handoff.
- Record the exact supplier/store and source URL.
- Never invent a price or silently substitute another pack size.
- Exclude Syngenta products from pricing changes unless the owner explicitly instructs otherwise.

## 2. Apply exactly one markup tier

| Verified baseline cost | Markup |
|---|---:|
| Below KSh 20,000 | 30% |
| KSh 20,000–39,999 inclusive | 25% |
| KSh 40,000–60,000 inclusive | 20% |
| Above KSh 60,000 | 17.5% |

## 3. Apply the price guardrails in order

1. Calculate the tier price from the verified baseline.
2. Ensure the final price is at least 15% above the verified baseline cost.
3. Round the final price to the nearest KSh 50.
4. Enforce a minimum storefront price of KSh 200 per product and pack variant.
5. Save and report the verified baseline, source URL, selected tier, rounded final price and actual stored selling price.

Never invent or estimate a source price except for the explicitly allowed retail × 0.85 baseline method, which must be labelled as estimated. Do not reprice Syngenta items without explicit owner instruction.

## 4. New-product inventory defaults

- `products.stock = 1000`
- `products.low_at = 20`
- `featured = false`, unless the owner explicitly requests featured placement.

## 5. Pack sizes

Every pack size/capacity must have its own verified baseline and final price. Use the existing product variant architecture where supported; otherwise use distinct pack-size SKUs and slugs. Never apply one pack's price to another pack by assumption.

## 6. Publication gate

A product is not ready to publish until its exact product identity, Kenyan KES baseline, calculated selling price, image, product information and applicable regulatory checks are verified. If a price cannot be verified, hold/skip the product rather than publishing a guessed price.

## Default behavior

This is the default pricing policy for every new product and pack variant entered through the staff admin. The admin preview mirrors the tiers, but the final selling price is recalculated by Supabase `public.price_4tier(p_baseline)` before saving. Existing-product edits do not silently reprice the item.

## Where to see the rule

- GitHub: this file and the canonical sections in `CLAUDE.md` / `AGENTS.md`.
- Staff admin: **Store → Pricing rules** at `/admin.html#pricing-rules` (requires staff sign-in).
- Supabase: `public.publishing_rules`, key `autonomous_bulk_product_publishing`.

The Supabase rule table remains protected by row-level security. Only authenticated staff can read it through the admin view; do not make internal pricing rules publicly readable to anonymous shoppers.
