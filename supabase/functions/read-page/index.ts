// Stermont Office: read-page
// Lets the builder read a Jumia Kenya product page, category page or search result from the server (a browser cannot, Jumia blocks it).
// Only signed-in staff (public.is_staff()) can use it, and only https://www.jumia.co.ke pages can be fetched.
// It returns facts only (name, brand, pack/variant text, prices) and never images, so nothing is guessed and no photos are copied.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED = ["jumia.co.ke"];
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function hostOk(u: URL) {
  return u.protocol === "https:" && !u.username && !u.password && u.port === "" &&
    ALLOWED.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
}
function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(+n));
}
function clean(s: string) {
  return decode(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

async function isStaff(auth: string) {
  const base = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!base || !key || !auth) return false;
  try {
    const r = await fetch(`${base}/rest/v1/rpc/is_staff`, {
      method: "POST",
      headers: { apikey: key, Authorization: auth, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch (_e) {
    return false;
  }
}

async function getPage(start: URL) {
  let u = start;
  for (let i = 0; i < 4; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    let r: Response;
    try {
      r = await fetch(u.toString(), {
        redirect: "manual",
        signal: ctl.signal,
        headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-KE,en;q=0.9" },
      });
    } catch (_e) {
      clearTimeout(t);
      return { status: 0, html: "", finalUrl: u.toString(), error: "the page did not answer in time" };
    }
    if (r.status >= 300 && r.status < 400) {
      clearTimeout(t);
      const loc = r.headers.get("location");
      if (!loc) break;
      let n: URL;
      try { n = new URL(loc, u); } catch (_e) { break; }
      if (!hostOk(n)) return { status: 0, html: "", finalUrl: u.toString(), error: "the page redirected outside the allowed site" };
      u = n;
      continue;
    }
    let html = "";
    try { html = (await r.text()).slice(0, 1500000); } catch (_e) { /* keep empty */ }
    clearTimeout(t);
    return { status: r.status, html, finalUrl: u.toString() };
  }
  return { status: 0, html: "", finalUrl: u.toString(), error: "too many redirects" };
}

// deno-lint-ignore no-explicit-any
function walk(x: any, out: any[]) {
  if (!x || typeof x !== "object") return;
  if (Array.isArray(x)) { x.forEach((v) => walk(v, out)); return; }
  const t = x["@type"];
  const types = Array.isArray(t) ? t : [t];
  if (types.includes("Product")) {
    const offers = Array.isArray(x.offers) ? x.offers : x.offers ? [x.offers] : [];
    out.push({
      name: x.name,
      brand: x.brand && typeof x.brand === "object" ? x.brand.name : x.brand,
      sku: x.sku,
      // deno-lint-ignore no-explicit-any
      offers: offers.slice(0, 12).map((o: any) => ({ price: o.price ?? o.lowPrice, highest: o.highPrice, currency: o.priceCurrency, availability: o.availability, name: o.name })),
    });
  }
  for (const k of Object.keys(x)) if (k !== "offers") walk(x[k], out);
}
function jsonLd(html: string) {
  // deno-lint-ignore no-explicit-any
  const out: any[] = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 40) {
    try { walk(JSON.parse(m[1]), out); } catch (_e) { /* skip bad block */ }
  }
  return out.slice(0, 40);
}
function cards(html: string) {
  // deno-lint-ignore no-explicit-any
  const out: any[] = [];
  const re = /<article[^>]*class="[^"]*\bprd\b[^"]*"[\s\S]*?<\/article>/g;
  let m;
  while ((m = re.exec(html)) && out.length < 40) {
    const c = m[0];
    const name = /<h3[^>]*class="[^"]*\bname\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/.exec(c)?.[1];
    const price = /<div[^>]*class="[^"]*\bprc\b[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(c)?.[1];
    const old = /<div[^>]*class="[^"]*\bold\b[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(c)?.[1];
    const href = /<a[^>]*class="[^"]*\bcore\b[^"]*"[^>]*href="([^"]+)"/.exec(c)?.[1];
    const brand = /data-(?:ga4-item_brand|gtm-brand|brand)="([^"]*)"/.exec(c)?.[1];
    let link: string | undefined;
    try { link = href ? new URL(decode(href), "https://www.jumia.co.ke").toString() : undefined; } catch (_e) { /* ignore */ }
    if (name) out.push({ name: clean(name), brand: brand ? decode(brand) : undefined, price: price ? clean(price) : undefined, was: old ? clean(old) : undefined, link });
  }
  return out;
}
function visibleText(html: string) {
  return clean(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " "));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!(await isStaff(req.headers.get("Authorization") || ""))) return json({ ok: false, error: "Staff sign-in required. Sign in at /admin.html and try again." }, 403);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch (_e) { return json({ ok: false, error: 'Send JSON like {"url":"https://www.jumia.co.ke/..."} or {"search":"product name"}' }, 400); }

  let target: URL;
  try {
    if (body && typeof body.search === "string" && body.search.trim()) {
      target = new URL("https://www.jumia.co.ke/catalog/?q=" + encodeURIComponent(body.search.trim().slice(0, 120)));
    } else {
      target = new URL(String(body && body.url || ""));
    }
  } catch (_e) { return json({ ok: false, error: "Not a valid web address" }, 400); }
  if (!hostOk(target)) return json({ ok: false, error: "Only https://www.jumia.co.ke pages can be read" }, 400);

  const p = await getPage(target);
  if (p.error) return json({ ok: false, blocked: true, url: p.finalUrl, error: p.error });

  const head = p.html.slice(0, 4000);
  const products = jsonLd(p.html);
  const list = cards(p.html);
  const blocked = p.status === 403 || p.status === 429 || p.status === 503 || (!products.length && !list.length && /just a moment|captcha|access denied|attention required|px-captcha/i.test(head));
  if (blocked) return json({ ok: false, blocked: true, status: p.status, url: p.finalUrl, error: "Jumia refused the request (it blocks some servers)" });
  if (p.status >= 400) return json({ ok: false, status: p.status, url: p.finalUrl, error: "The page was not found or is unavailable" });

  const title = clean(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(p.html)?.[1] || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(p.html)?.[1] || "");
  return json({
    ok: true,
    status: p.status,
    url: p.finalUrl,
    title,
    products,
    listings: list,
    // visible text so pack sizes and prices written on the page can be read; the first part only
    text: (products.length || list.length ? visibleText(p.html).slice(0, 3000) : visibleText(p.html).slice(0, 6000)),
  });
});
