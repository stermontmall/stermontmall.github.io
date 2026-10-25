# Blog strategy (how the automatic tools follow it)

| Rule | Where it lives |
|---|---|
| **Consistency**: 2 good posts a week, never a burst | `blog-writer.yml` runs Tuesday and Friday. It stops writing while 2 or more drafts are waiting for review. |
| **Hub and spoke** | `blog-pillars.json` holds pillar guides (1,500-2,500 words). `blog-topics.json` holds spoke posts (800-1,200 words). Pillars are written first; a spoke waits until its pillar is live. |
| **Internal linking** | Every spoke gets a "Part of our guide" link to its pillar and must link to a product or category page. The pillar page's "More guides in this series" list is rebuilt by `blog-build.mjs` whenever a post is merged. |
| **Refresh every 3 to 6 months** | `blog-refresh.yml` reviews the stalest post (90+ days) each Thursday: fixes broken links, adds FAQs, bumps the date only when something really changed. A PR checklist asks you for fresh photos or video and a price and stock check. |
| **Local intent** | The writer must mention Kenya in the intro and Nairobi, M-Pesa or delivery across Kenya in the text. |
| **Compliance and specs** | Every post has a "Safety and compliance" section (check PCPB registration, read the label, keep away from children and food). A PCPB number, warranty or spec is only allowed if you put it in the topic's `facts`. |
| **Schema** | Every post gets Article, FAQPage and BreadcrumbList schema. |
| **Call to action** | Every post ends with a button to the featured product (or its category) "pay by M-Pesa" and a WhatsApp button. |

Safety rules that stay on purpose: no dosing or mixing rates, no prices, no guarantees. Prices live on the product pages, so posts never go stale on price.

This replaces the old "one guide a month" line in `SEO-PLAYBOOK.md`.

## Adding topics
Add a new object at the end of `blog-topics.json` with `slug`, `title`, `angle`, `keywords`, `facts`, `links` (include a `/c/` category page or a `/p/` product page) and `"status": "pending"`. Its pillar is picked from the category in `links`; set `"pillar": "<pillar-slug>"` to choose one yourself.
