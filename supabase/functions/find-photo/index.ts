import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Staff-only: find a photo of an existing product online.
// POST { product_id, mode: "suggest" | "auto" }  (staff session token required)
//  - suggest: returns up to 8 candidate images (thumbnail + direct link + site) for the staff member to choose.
//  - auto:    downloads candidates, keeps only real jpg/png/webp at least 450x450, asks Gemini whether the picture
//             shows the SAME product (brand, model, pack size, no other shop's watermark), and attaches the first
//             one that passes. Needs GEMINI_API_KEY; without it auto mode returns the candidates instead.
// Never replaces an existing photo. Price, cost, description, stock and active status are never touched.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BASE = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_SIDE = 450;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const rest = (path: string, init: RequestInit = {}) =>
  fetch(BASE + "/rest/v1/" + path, {
    ...init,
    headers: { apikey: SRK, Authorization: "Bearer " + SRK, "Content-Type": "application/json", ...(init.headers || {}) },
  });

async function isStaff(auth: string) {
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!BASE || !key || !auth) return false;
  try {
    const r = await fetch(BASE + "/rest/v1/rpc/is_staff", {
      method: "POST",
      headers: { apikey: key, Authorization: auth, "Content-Type": "application/json" },
      body: "{}",
    });
    return r.ok && (await r.json()) === true;
  } catch (_e) { return false; }
}

function safeHttps(u: URL): boolean {
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (h.includes(":") || /^[0-9.]+$/.test(h)) return false;
  return true;
}
function sniff(b: Uint8Array): string {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return "";
}
// Width and height straight from the file bytes (no image library needed).
function dimensions(b: Uint8Array, type: string): { w: number; h: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    if (type === "image/png") return { w: dv.getUint32(16), h: dv.getUint32(20) };
    if (type === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        const len = dv.getUint16(i + 2);
        if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: dv.getUint16(i + 5), w: dv.getUint16(i + 7) };
        i += 2 + len;
      }
      return null;
    }
    if (type === "image/webp") {
      const tag = String.fromCharCode(b[12], b[13], b[14], b[15]);
      if (tag === "VP8 ") return { w: dv.getUint16(26, true) & 0x3fff, h: dv.getUint16(28, true) & 0x3fff };
      if (tag === "VP8L") { const v = dv.getUint32(21, true); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
      if (tag === "VP8X") return { w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1, h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1 };
    }
  } catch (_e) { /* fall through */ }
  return null;
}
async function download(raw: string): Promise<{ bytes: Uint8Array; type: string; w: number; h: number } | { error: string }> {
  let url: URL;
  try { url = new URL(raw); } catch { return { error: "bad url" }; }
  for (let hop = 0; hop < 4; hop++) {
    if (!safeHttps(url)) return { error: "not public https" };
    let r: Response;
    try {
      r = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": UA, Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8", Referer: url.origin + "/" },
      });
    } catch { return { error: "download failed" }; }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location");
      if (!loc) return { error: "bad redirect" };
      try { url = new URL(loc, url); } catch { return { error: "bad redirect" }; }
      continue;
    }
    if (!r.ok) return { error: "HTTP " + r.status };
    if (Number(r.headers.get("content-length") ?? 0) > MAX_BYTES) return { error: "over 5 MB" };
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > MAX_BYTES) return { error: "over 5 MB" };
    const type = sniff(bytes);
    if (!type) return { error: "not a jpg, png or webp image" };
    const d = dimensions(bytes, type);
    if (!d) return { error: "size unreadable" };
    if (d.w < MIN_SIDE || d.h < MIN_SIDE) return { error: "too small (" + d.w + "x" + d.h + ")" };
    return { bytes, type, w: d.w, h: d.h };
  }
  return { error: "too many redirects" };
}
function toBase64(bytes: Uint8Array): string {
  let s = "";
  const C = 0x8000;
  for (let i = 0; i < bytes.length; i += C) s += String.fromCharCode(...bytes.subarray(i, i + C));
  return btoa(s);
}

type Cand = { url: string; thumb: string; site: string };
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// Image search without an API key: Bing's image results page lists each hit's direct file link (murl) and thumbnail (turl).
async function searchBing(query: string): Promise<Cand[]> {
  const u = "https://www.bing.com/images/async?q=" + encodeURIComponent(query) + "&first=0&count=24&adlt=moderate&qft=+filterui:imagesize-large";
  let html = "";
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return [];
    html = await r.text();
  } catch { return []; }
  const out: Cand[] = [];
  const re = /\sm="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 24) {
    try {
      const o = JSON.parse(decode(m[1]));
      if (typeof o.murl !== "string" || !/^https:\/\//i.test(o.murl)) continue;
      const host = new URL(o.murl).hostname.replace(/^www\./, "");
      if (out.some((x) => x.url === o.murl)) continue;
      out.push({ url: o.murl, thumb: typeof o.turl === "string" ? o.turl : o.murl, site: host });
    } catch { /* skip malformed hit */ }
  }
  return out;
}

async function aiMatches(apiKey: string, product: { name: string; unit: string | null }, bytes: Uint8Array, type: string) {
  const schema = {
    type: "object",
    properties: {
      same_product: { type: "boolean", description: "True only if the photo clearly shows the same brand, model/variant and pack size as the product name." },
      other_shop_branding: { type: "boolean", description: "True if the photo has another shop's watermark, logo overlay, price tag or promotional text." },
      reason: { type: "string" },
    },
    required: ["same_product", "other_shop_branding", "reason"],
  };
  const prompt = "Does this photo show exactly this product: \"" + product.name + "\"" + (product.unit ? " (pack/unit: " + product.unit + ")" : "") +
    "? Be strict: the brand, model or variant and the pack size/count must match what is visible or printed on the item. A similar item from another brand or a different size is NOT a match. A plain product shot on a white or simple background is ideal; flag any other shop's watermark, logo overlay, price or promo text.";
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inline_data: { mime_type: type, data: toBase64(bytes) } }, { text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0, maxOutputTokens: 400 },
      }),
    });
    if (r.status === 429) return { rateLimited: true as const };
    if (!r.ok) return null;
    const j = await r.json();
    return JSON.parse(j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "null");
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!(await isStaff(req.headers.get("Authorization") || ""))) return json({ ok: false, error: "Staff sign-in required. Sign in at /admin.html and try again." }, 403);
  // deno-lint-ignore no-explicit-any
  let b: any;
  try { b = await req.json(); } catch { return json({ ok: false, error: "Send JSON with product_id." }, 400); }
  const id = String(b?.product_id || "").trim();
  const mode = b?.mode === "auto" ? "auto" : "suggest";
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(id)) return json({ ok: false, error: "Invalid product ID." }, 400);

  const pr = await rest("products?id=eq." + encodeURIComponent(id) + "&select=id,name,unit,images&limit=1");
  if (!pr.ok) return json({ ok: false, error: "Could not read the product." }, 500);
  const rows = await pr.json();
  if (!Array.isArray(rows) || !rows.length) return json({ ok: false, error: "No product with that ID." }, 404);
  const product = rows[0] as { id: string; name: string; unit: string | null; images: string[] | null };
  if (Array.isArray(product.images) && product.images.length) return json({ ok: false, already_has_image: true, error: "This product already has a photo. Nothing was replaced." }, 409);

  // Search by the product name; a second pass adds the pack size when the name does not carry it.
  const queries = [product.name, product.name + " product photo"];
  let cands: Cand[] = [];
  for (const q of queries) {
    for (const c of await searchBing(q)) if (!cands.some((x) => x.url === c.url)) cands.push(c);
    if (cands.length >= 16) break;
  }
  if (!cands.length) return json({ ok: false, error: "The image search returned nothing (it may be blocking this server). Paste a photo link in the box above instead." }, 502);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (mode === "suggest" || !apiKey) {
    return json({ ok: true, mode: "suggest", auto_available: !!apiKey, product_id: id, candidates: cands.slice(0, 8) });
  }

  const tried: { site: string; why: string }[] = [];
  let checked = 0;
  for (const c of cands) {
    if (checked >= 6) break;
    const got = await download(c.url);
    if ("error" in got) { tried.push({ site: c.site, why: got.error }); continue; }
    checked++;
    const verdict = await aiMatches(apiKey, product, got.bytes, got.type);
    if (verdict && "rateLimited" in verdict) return json({ ok: false, error: "Gemini free usage limit reached. Wait a minute and retry.", tried }, 429);
    if (!verdict) { tried.push({ site: c.site, why: "AI check failed" }); continue; }
    if (!verdict.same_product) { tried.push({ site: c.site, why: "not the same product: " + String(verdict.reason || "").slice(0, 120) }); continue; }
    if (verdict.other_shop_branding) { tried.push({ site: c.site, why: "has another shop's branding" }); continue; }

    const file = id + "-" + Date.now() + "." + EXT[got.type];
    const up = await fetch(BASE + "/storage/v1/object/product-images/" + file, {
      method: "POST",
      headers: { apikey: SRK, Authorization: "Bearer " + SRK, "Content-Type": got.type, "x-upsert": "false" },
      body: got.bytes,
    });
    if (!up.ok) return json({ ok: false, error: "Photo upload failed.", detail: (await up.text()).slice(0, 200) }, 500);
    const imageUrl = BASE + "/storage/v1/object/public/product-images/" + file;
    // Only fills an EMPTY photo list, so a photo added meanwhile is never overwritten.
    const patch = await rest("products?id=eq." + encodeURIComponent(id) + "&or=(images.is.null,images.eq.{})", {
      method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ images: [imageUrl] }),
    });
    const updated = patch.ok ? await patch.json() : [];
    if (!Array.isArray(updated) || !updated.length) {
      await fetch(BASE + "/storage/v1/object/product-images/" + file, { method: "DELETE", headers: { apikey: SRK, Authorization: "Bearer " + SRK } });
      return json({ ok: false, error: "The product record was not updated (it may have received a photo already); the uploaded file was removed." }, 409);
    }
    return json({ ok: true, mode: "auto", attached: true, product_id: id, image_url: imageUrl, found_on: c.site, source_link: c.url, size: got.w + "x" + got.h, ai_note: String(verdict.reason || "").slice(0, 200) });
  }
  return json({ ok: false, mode: "auto", attached: false, error: "No candidate passed the checks (right product, at least " + MIN_SIDE + "x" + MIN_SIDE + ", no other shop's branding).", candidates: cands.slice(0, 8), tried });
});
