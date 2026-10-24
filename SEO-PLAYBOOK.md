# Stermont Arcade SEO playbook

No one can guarantee the #1 spot on Google. These moves are ordered by how much they usually help a Nairobi online store, biggest first.

## 1. Own "near me" in Nairobi (free, do this week)
1. Create or claim your **Google Business Profile** for The Sarit Centre, Karuna Road, Westlands. Verify it (postcard, phone or video).
2. Fill in everything: category "Online store" plus "Pest control supplier" if offered, hours 8 AM to 8 PM daily, phone +254 748 888 230, website `https://stermontarcade.co.ke/nairobi.html` (the Nairobi page is built for this).
3. Upload 10 or more real photos (shop front, shelves, packed orders, products). Add products to the profile.
4. Post one update a week (a product, an offer, a tip). Posts keep the profile active.
5. Keep your name, address and phone **identical** everywhere (site, Facebook, directories). Mismatches hurt local ranking.

## 2. Get real reviews (the strongest local signal)
- After each delivered order, send a WhatsApp message with your Google review link. Ask every happy customer, not just some.
- Reply to every review within a day, including bad ones, politely.
- Never buy or write fake reviews. Google removes them and can suspend the profile.
- Once you have real reviews, ask me to add review stars to your product pages.

## 3. Weekly 20-minute routine
1. Open the **Ranking opportunities** issue (arrives Mondays once the Search Console secrets are added).
2. Take the top 3 searches in "Almost page 1". For each: put those exact words in the page title, H1 and first paragraph, then link to that page from the home page and its category.
3. Take the top 3 in "Seen a lot, rarely clicked" and rewrite the title and description. Include price, "M-Pesa" and "delivery in Kenya".
4. Wait 2 to 4 weeks, then check whether the position improved. Change one thing at a time.

## 4. Win the searches people actually type
- **Price and "buy" searches** convert best: "[product] price in Kenya", "buy [product] Nairobi". Put the price, "In stock", and the M-Pesa and delivery facts near the top of every product page.
- **Problem searches** bring new customers: "how to get rid of bed bugs", "best fridge in Kenya". Publish one guide a month on the questions customers ask you on WhatsApp. Answer in plain words, add photos, link to the matching product.
- Use the words Kenyans use: "dawa ya kunguni", "dawa ya mende", "dawa ya panya" alongside the English terms. Mention them naturally in guides.
- One page per search goal. Do not make several pages that compete for the same words.

## 5. Make every product page beat the competition
- A unique description (what it treats or does, pack size, how to use, PCPB number for chemicals). Short copied manufacturer text ranks poorly.
- A clear, real photo. Pages without one are left out of Google Shopping.
- Show the real stock status and price. Google compares these with your Merchant feed.
- Link each product to its category and to 2 related products.

## 6. Earn links (the slow, powerful part)
- Ask the brands and suppliers you stock to list Stermont Arcade as a stockist on their websites.
- List your business on trusted Kenyan directories and the Nairobi business listings with the same name, address and phone.
- Offer helpful tips to local blogs, estate or landlord groups, farming groups and hostel managers, with a link to the matching guide.
- Share guides in relevant Facebook groups and answer questions there. Be useful first. Do not spam.

## 7. Free Google shopping traffic
- Your `merchant-feed.xml` can feed **Google Merchant Center** free product listings. Verify your site there and submit the feed so products can appear in Google Shopping and Images.

## 8. Speed and mobile (most Kenyan shoppers are on phones)
- Keep product photos small (WebP, under about 150 KB). Your Lighthouse workflow reports speed; fix the red items first.
- Fast phone pages rank better and sell more.

## 9. Social proof and videos
- Post short videos of products being used (TikTok, YouTube Shorts, Instagram Reels, Facebook). Put the product page link in the description. Videos also appear in Google results.
- Use WhatsApp Status and a WhatsApp Channel for offers. Traffic from social is not a ranking factor, but it brings the people who then leave reviews and links.

## What to avoid
- Buying links or reviews, hidden text, copying other shops' descriptions, and mass "pest control in every town" pages with the same text. These can get the whole site demoted.

## Tools in this repo
| Tool | What it does | When |
|---|---|---|
| `seo-check.mjs` | Daily page health check, opens an issue | Daily |
| `seo-auto-index.mjs` | Fixes tags, tells Bing and others about new pages | Mondays and on change |
| `seo-google-sitemaps.mjs` | Tells Google to re-read the sitemaps | Daily |
| `seo-extras.mjs` | Builds `sitemap-images.xml` and `llms.txt` | Mondays and after page builds |
| `seo-opportunities.mjs` | Lists searches ready to reach page 1 | Mondays |
