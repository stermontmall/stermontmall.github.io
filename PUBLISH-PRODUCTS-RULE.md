# READ THIS FIRST — Product publishing rule (Claude + ChatGPT)

If the owner says "publish products", "run the publish rule", or asks you to add products to the website, follow the rule below exactly.

## Where the rule lives
- **Source of truth:** Neon project `restless-shape-79120240`, database `stermont`, table `public.publishing_rules`, key `publish_products`.
  Load it with: `select content from public.publishing_rules where key = 'publish_products';`
- **This file** is a mirror so the rule is visible the moment GitHub is connected. If the two ever differ, the Neon row wins (check its `version` and `updated_at`).
- Also run `select key, version, title from public.publishing_rules;` to see any other rules.

## How to connect
- **Claude:** connect the GitHub and Neon connectors, then say "publish products".
- **ChatGPT:** connect GitHub and Neon, ask it to read this file and the Neon rule, then say "publish products".
- Never use Supabase for new products. Supabase is quota-restricted; its hidden products are restored separately.
- Never put passwords, connection strings or API keys in this repo or in chat.

## Notes for assistants
- `rules/publishing-rule.json` and `AGENTS.md` / `CLAUDE.md` describe the older Supabase workflow. For posting to Neon, the rule below governs.
- Business focus: **Pest Control & Fumigation** and **Agrovet**. Spread other categories only if the owner asks.
- Pesticides and veterinary products: do not invent doses, dilution rates, approved uses or registration numbers. If the PCPB status cannot be verified, say so in the report and keep the product inactive.

---

## The rule (mirror of Neon `publish_products`, version 2)

```
PUBLISH-PRODUCTS RULE v1 (owner: ntanamoupdates@gmail.com)
When the owner says "publish products", "run the publish rule" or similar, follow this rule exactly. It works the same in Claude and ChatGPT.

TARGET
Neon project restless-shape-79120240, database stermont, schema public, table products. Never use Supabase. Default batch: 20 products per run, unless the owner gives another number.

CATEGORIES (exact IDs)
- Agrovet & Farm Supplies: 43dbe459-0749-4a9e-8f59-12bbb0026be2
- Pest Control & Fumigation: 8782c41a-6cd5-4e08-b7a9-ea51c940d972
- General Merchandise: 6371a3e2-2d70-4967-a6f1-6c6c5f9d623f
- Cars for Sale: c1739dd5-19a5-45c0-80ea-3676258b746a

STEP 1 - RESEARCH ONLINE (Nairobi demand)
- Search the web for products that sell fast and are searched often in Nairobi, Kenya. Use current sources: Jumia Kenya and Kilimall best-sellers, Google Trends for Kenya, Nairobi agrovet and hardware shop listings, supermarket and wholesaler catalogues, and local classifieds.
- Favour products with repeat demand, small to mid pack sizes, and easy availability: for example common farm inputs, animal health, feeds, pest and fumigation products, household and general merchandise.
- Mix the categories according to what the owner asks for. If none is asked for, spread across Agrovet, Pest Control and General Merchandise.
- For each pick, record why it sells fast (the source or search signal) in attributes.demand_note.
- Skip any product whose name contains "Syngenta" unless the owner explicitly says otherwise in this chat. List what was skipped.
- Check the products table first and skip duplicates or near-duplicates.

STEP 2 - BASELINE COST (KES)
The database requires a verified positive KES baseline cost and sets the selling price from it.
- Use the owner's cost if the owner supplied one.
- Otherwise use a wholesale or trade price in KES from a named Nairobi/Kenya supplier, distributor or manufacturer page. Store its URL in attributes.cost_source.
- Never use a retail shelf price as the cost, because the 4-tier markup would be applied on top of it. Never invent or estimate a cost.
- If no wholesale or owner cost can be found, keep that product out of the batch and tell the owner which ones need a cost.

STEP 3 - PHOTOS (straight from online)
- Photos may be taken straight from the web. Use direct https image URLs from the manufacturer, distributor, supplier or retailer product page for that exact product.
- The image must clearly show the exact product, brand and pack size. No stock photos of a different item, no competitor watermarks, no tiny or blurry images.
- Put the URLs in images (array), the first one being the main image. Write alt_text describing the photo. Store the page URL in attributes.photo_source.
- Check each URL opens before saving it. If no verified photo is found, the product stays inactive and is reported.

STEP 4 - DESCRIPTIONS AND SEO
- description: 60 to 120 words, plain English: what it is, main use, pack size, who it suits. Only facts from the source pages. No invented specs, certifications or claims.
- meta_title under 60 characters. meta_description under 155 characters. keywords: 5 to 8 search terms people in Nairobi would use. unit: the pack size, for example "1 kg" or "50 ml".

STEP 5 - INSERT (rules enforced by the database triggers)
- In one run_sql_transaction, insert only: name, category_id, description, cost, unit, images, meta_title, meta_description, alt_text, keywords, attributes.
- Do NOT set price, old_price, stock, low_at, featured, active, slug or product_code. The triggers set them: price from price_4tier(cost), stock 1000, low-stock alert 20, featured false, active false, slug from the name, product_code STM-######.
- Slugs must not end in a date or month. If rejected, set a clean slug in the form brand-model-pack, or add a real differentiator (size, colour, pack count).
- product_code is permanent and is never changed. Never edit price after insert unless the owner asks.

STEP 6 - PUBLISH
- Only products with at least one verified photo in images may be set active = true. Run the update in a separate transaction for those products only.
- Anything without a photo stays inactive and is listed for the owner.

STEP 7 - VERIFY AND LOG
- Select name, slug, product_code, cost, price, stock, low_at, active, cardinality(images). Confirm: price equals price_4tier(cost), stock is 1000, low_at is 20, and no active product has zero images.
- Write one admin_audit_log row per product: actor_email ntanamoupdates@gmail.com, action 'publish_product', entity_type 'product', entity_id the product id, details with cost, price and image count.

OUTPUT
A short table: name, product code, cost, price, status (published or draft with the reason). Then list anything skipped, duplicated or missing a cost or photo. If any step errors, stop and report it. Do not retry blindly, and do not work around a trigger.
```
