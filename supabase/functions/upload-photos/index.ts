import { createClient } from "jsr:@supabase/supabase-js@2";

// Generic product photo uploader. Works for ANY existing product. Deployed as Edge Function `upload-photos` (verify_jwt = false).
//
// PASSCODE (any one of these): JSON/form field `pass`, header `Authorization: Bearer <passcode>`, header `x-api-key`, header `x-passcode`.
//   Passcode lives in public.upload_settings (key 'photo_passcode'). Rotate it with SQL. Never commit it.
//
// WAYS TO SEND PHOTOS
//  1. JSON  { product_id, image_url }                      public https link to a jpg/png/webp/gif/avif, OR a public https product/web page
//                                                          (the page's main photo is found automatically: og:image, twitter:image, image_src, JSON-LD image)
//  2. JSON  { product_id, image_base64 }                   raw base64 or a data: URL
//  3. JSON  { product_id, images: [ ... ] }                several photos for one product; each item is a link string, a data: URL,
//                                                          or an object { image_url | image_base64 | download_link | url }
//  4. JSON  { product_id, openaiFileIdRefs: [ {download_link} ] }   ChatGPT Actions file attachments
//  5. multipart/form-data: pass, product_id, files (any file names; 1st replaces the main photo, the rest are added to the gallery)
//  6. multipart/form-data: pass, files named <product-id>.jpg|png|webp|gif (the website page's old way)
//  Options: activate (true / "1") publishes the product after the photo is saved; append (true / "1") adds to the gallery
//  instead of replacing the main photo.
//
// LIMITS (owner request 2026-11-08: remove limits): 50 MB per photo (the Supabase Storage per-file ceiling on this plan), up to 60
//  photos per call, any pixel size; jpg/png/webp/gif/avif. The type is checked from the file's own bytes, because the bucket is
//  public and must never serve HTML/SVG/scripts. HEIC is not accepted (browsers cannot display it).
// 2026-11-11 (owner request): web-page links are accepted. The page is downloaded, up to 4 candidate image addresses are read from it,
//  and each candidate goes through the same https-only / no-IP / byte-sniffing checks as a direct image link.
// Result: file saved to bucket product-images, URL(s) saved into products.images.
const BUCKET = "product-images";
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_LABEL = "50 MB";
const MAX_PER_CALL = 60;
const MAX_PAGE_CANDIDATES = 4;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

function sniff(b: Uint8Array): string {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (b.length > 16 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return "";
}

function looksLikeHtml(b: Uint8Array): boolean {
  const start = new TextDecoder().decode(b.slice(0, 2048)).toLowerCase();
  return start.includes("<!doctype html") || start.includes("<html") || start.includes("<head") || start.includes("<meta");
}

function notSupportedReason(b: Uint8Array): string {
  const head = new TextDecoder().decode(b.slice(4, 12));
  if (head.startsWith("ftyp") && /heic|heix|mif1/.test(head)) return "image is HEIC, which browsers cannot display; convert it to jpg, png or webp first (the upload page does this for you)";
  const start = new TextDecoder().decode(b.slice(0, 15)).toLowerCase();
  if (start.includes("<!doctype") || start.includes("<html")) return "link is a web page and no usable product photo could be found on it; use the direct image link or send image_base64";
  if (start.includes("<svg") || start.includes("<?xml")) return "image is SVG; only jpg, png, webp, gif or avif are accepted";
  return "file is not a jpg, png, webp, gif or avif image";
}

function safeHttps(u: URL): boolean {
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (h.includes(":") || /^[0-9.]+$/.test(h)) return false; // no IP literals
  return true;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&#38;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x2F;/g, "/");
}

// Reads candidate photo addresses from a web page, best first. Returned as absolute URLs; each is checked again before use.
function pageImageCandidates(html: string, pageUrl: URL): string[] {
  const found: string[] = [];
  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const t = decodeEntities(raw.trim());
    if (!t || t.startsWith("data:")) return;
    try {
      const abs = new URL(t, pageUrl).toString();
      if (!found.includes(abs)) found.push(abs);
    } catch { /* ignore bad address */ }
  };
  const metaRe = /<meta\b[^>]*>/gi;
  const metas = html.match(metaRe) ?? [];
  const metaVal = (tag: string, keys: string[]) => {
    const k = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i);
    if (!k || !keys.includes(k[1].toLowerCase())) return null;
    const c = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    return c ? c[1] : null;
  };
  for (const m of metas) add(metaVal(m, ["og:image:secure_url", "og:image", "og:image:url"]));
  for (const m of metas) add(metaVal(m, ["twitter:image", "twitter:image:src"]));
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const l of links) {
    if (/\brel\s*=\s*["']image_src["']/i.test(l)) { const h = l.match(/\bhref\s*=\s*["']([^"']+)["']/i); add(h ? h[1] : null); }
  }
  for (const m of metas) add(metaVal(m, ["image"]));
  const ld = html.match(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of ld) {
    const inner = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const walk = (n: unknown) => {
        if (Array.isArray(n)) { n.forEach(walk); return; }
        if (n && typeof n === "object") {
          const o = n as Record<string, unknown>;
          const img = o.image;
          if (typeof img === "string") add(img);
          else if (Array.isArray(img)) img.forEach((x) => { if (typeof x === "string") add(x); else if (x && typeof x === "object") add((x as Record<string, unknown>).url as string); });
          else if (img && typeof img === "object") add((img as Record<string, unknown>).url as string);
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(inner));
    } catch { /* ignore bad JSON-LD */ }
  }
  return found.slice(0, MAX_PAGE_CANDIDATES);
}

type Got = { bytes: Uint8Array } | { error: string };

// depth 0 = the address the caller sent (a web page is allowed); depth 1 = an address found on that page (must be a real image).
async function fetchImage(raw: string, depth = 0): Promise<Got> {
  let url: URL;
  try { url = new URL(raw); } catch { return { error: "image_url is not a valid URL" }; }
  for (let hop = 0; hop < 4; hop++) {
    if (!safeHttps(url)) return { error: "image_url must be a public https link" };
    let r: Response;
    try {
      r = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(45000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: depth === 0 ? "image/jpeg,image/png,image/webp,image/avif,image/*;q=0.8,text/html;q=0.7" : "image/jpeg,image/png,image/webp,image/avif,image/*;q=0.8",
          Referer: url.origin + "/",
        },
      });
    } catch { return { error: "could not download the image (timeout or network error); send image_base64 instead" }; }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location");
      if (!loc) return { error: "bad redirect" };
      try { url = new URL(loc, url); } catch { return { error: "bad redirect" }; }
      continue;
    }
    if (!r.ok) return { error: "image download failed (HTTP " + r.status + "); the site may block downloads, send image_base64 instead" };
    const len = Number(r.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) return { error: "image over " + MAX_LABEL + "; use a smaller or compressed image" };
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > MAX_BYTES) return { error: "image over " + MAX_LABEL + "; use a smaller or compressed image" };
    if (sniff(bytes)) return { bytes };
    if (depth === 0 && looksLikeHtml(bytes)) {
      const html = new TextDecoder().decode(bytes.slice(0, 2 * 1024 * 1024));
      const cands = pageImageCandidates(html, url);
      if (!cands.length) return { error: notSupportedReason(bytes) };
      let lastErr = "";
      for (const c of cands) {
        const got = await fetchImage(c, 1);
        if ("bytes" in got) return got;
        lastErr = got.error;
      }
      return { error: "found photo links on the page but none could be downloaded as an image (" + lastErr + "); send image_base64 instead" };
    }
    return { error: notSupportedReason(bytes) };
  }
  return { error: "too many redirects" };
}

function decodeBase64Image(raw: string): Got {
  let s = raw.trim();
  const m = s.match(/^data:[^;,]*;base64,/i);
  if (m) s = s.slice(m[0].length);
  s = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!s) return { error: "image_base64 is empty" };
  if (s.length > Math.ceil(MAX_BYTES * 4 / 3) + 8) return { error: "image over " + MAX_LABEL + "; use a smaller or compressed image" };
  while (s.length % 4) s += "=";
  let bin: string;
  try { bin = atob(s); } catch { return { error: "image_base64 is not valid base64" }; }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (bytes.length > MAX_BYTES) return { error: "image over " + MAX_LABEL + "; use a smaller or compressed image" };
  if (!sniff(bytes)) return { error: notSupportedReason(bytes) };
  return { bytes };
}

// One photo item from JSON: a string (https link, data: URL or raw base64) or an object with one of several field names.
async function resolveItem(item: unknown): Promise<Got> {
  if (typeof item === "string") {
    const t = item.trim();
    if (/^https?:\/\//i.test(t)) return await fetchImage(t);
    return decodeBase64Image(t);
  }
  if (item && typeof item === "object") {
    const o = item as Record<string, unknown>;
    if (typeof o.image_base64 === "string" && o.image_base64) return decodeBase64Image(o.image_base64);
    if (typeof o.base64 === "string" && o.base64) return decodeBase64Image(o.base64);
    for (const k of ["image_url", "download_link", "url"]) {
      if (typeof o[k] === "string" && o[k]) return await fetchImage(o[k] as string);
    }
  }
  return { error: "photo item must be a link, a data: URL, base64, or an object with image_url / image_base64 / download_link" };
}

const truthy = (v: unknown) => v === true || v === 1 || v === "1" || String(v ?? "").toLowerCase() === "true";

// Saves one photo and updates products.images. append=false: becomes the main (first) photo and replaces the old main one.
// append=true: added at the end of the gallery under a unique name.
// deno-lint-ignore no-explicit-any
async function savePhoto(sb: any, base: string, id: string, bytes: Uint8Array, append: boolean, activate: boolean) {
  const ct = sniff(bytes);
  if (!ct) return { ok: false, reason: notSupportedReason(bytes) };
  const { data: prod } = await sb.from("products").select("id,images").eq("id", id).maybeSingle();
  if (!prod) return { ok: false, reason: "no product with this id; add the product first" };
  const path = append ? `${id}-${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 2).toString(36)}.${TYPES[ct]}` : `${id}.${TYPES[ct]}`;
  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, { upsert: true, contentType: ct });
  if (upErr) return { ok: false, reason: upErr.message };
  const url = `${base}/storage/v1/object/public/${BUCKET}/${path}`;
  const imgs: string[] = Array.isArray(prod.images) ? (prod.images as string[]) : [];
  const next = append
    ? [...imgs.filter((old) => old !== url), url]
    : [url, ...imgs.filter((old) => old !== url && !old.includes("/" + id + "."))];
  const patch: Record<string, unknown> = { images: next };
  if (activate) patch.active = true;
  const { error: dbErr } = await sb.from("products").update(patch).eq("id", id);
  if (dbErr) return { ok: false, reason: "saved file but DB update failed: " + dbErr.message };
  return { ok: true, product: id, url, live: activate, photos: next.length };
}

function passFrom(req: Request, fromBody: unknown): string {
  const h = req.headers;
  const bearer = (h.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  return String(fromBody ?? "") || bearer || (h.get("x-api-key") ?? "") || (h.get("x-passcode") ?? "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method === "GET") {
    return json({
      service: "Stermont product photo upload",
      how: "POST JSON {product_id, image_url | image_base64 | images:[...] | openaiFileIdRefs:[{download_link}], activate?, append?} or multipart/form-data (product_id, files). image_url may be a direct image link or a public product web page (its main photo is found automatically). Send the passcode as `pass` or as Authorization: Bearer <passcode>.",
      limits: "jpg/png/webp/gif/avif, 50 MB per photo, up to 60 photos per call, no minimum pixel size",
    });
  }
  if (req.method !== "POST") return new Response("Use POST.", { status: 405, headers: cors });
  try {
    const base = Deno.env.get("SUPABASE_URL")!;
    const sb = createClient(base, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: st } = await sb.from("upload_settings").select("value").eq("key", "photo_passcode").maybeSingle();
    const isJson = (req.headers.get("content-type") ?? "").includes("application/json");

    if (isJson) {
      const b = await req.json().catch(() => ({}));
      if (!st || passFrom(req, b?.pass) !== st.value) return json({ error: "Wrong passcode" }, 401);
      const id = String(b?.product_id ?? "");
      if (!ID_RE.test(id)) return json({ ok: false, reason: "product_id must be lowercase-hyphen" }, 400);
      const { data: prod } = await sb.from("products").select("id").eq("id", id).maybeSingle();
      if (!prod) return json({ ok: false, reason: "no product with this id; add the product first" }, 404);

      let items: unknown[] = [];
      if (Array.isArray(b?.images) && b.images.length) items = b.images;
      else if (Array.isArray(b?.openaiFileIdRefs) && b.openaiFileIdRefs.length) items = b.openaiFileIdRefs;
      else if (typeof b?.image_base64 === "string" && b.image_base64.length > 0) items = [{ image_base64: b.image_base64 }];
      else if (typeof b?.image_url === "string" && b.image_url.length > 0) items = [{ image_url: b.image_url }];
      else return json({ ok: false, reason: "send image_url (https link to an image or a product page), image_base64, images:[...] or openaiFileIdRefs" }, 400);
      if (items.length > MAX_PER_CALL) return json({ ok: false, reason: "at most " + MAX_PER_CALL + " photos per call" }, 400);

      const activate = truthy(b?.activate);
      const wantAppend = truthy(b?.append);
      const results: Record<string, unknown>[] = [];
      for (let i = 0; i < items.length; i++) {
        const got = await resolveItem(items[i]);
        if ("error" in got) { results.push({ ok: false, reason: got.error }); continue; }
        // The publish flag goes with the last photo so a product is never made live by a half-finished batch.
        const res = await savePhoto(sb, base, id, got.bytes, wantAppend || i > 0, activate && i === items.length - 1);
        results.push(res);
      }
      if (items.length === 1) { const r = results[0]; return json(r, r.ok ? 200 : (String(r.reason).startsWith("saved") ? 500 : 422)); }
      const okAll = results.every((r) => r.ok);
      return json({ ok: okAll, product: id, saved: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results }, okAll ? 200 : 207);
    }

    const form = await req.formData();
    if (!st || passFrom(req, form.get("pass")) !== st.value) return json({ error: "Wrong passcode" }, 401);
    const activate = truthy(form.get("activate"));
    const formId = String(form.get("product_id") ?? "").trim();
    const wantAppend = truthy(form.get("append"));
    const files = form.getAll("files").filter((f) => f instanceof File) as File[];
    if (files.length > MAX_PER_CALL) return json({ error: "at most " + MAX_PER_CALL + " photos per call" }, 400);
    const results: unknown[] = [];
    if (formId && !ID_RE.test(formId)) return json({ error: "product_id must be lowercase-hyphen" }, 400);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let id = formId;
      if (!id) {
        const m = f.name.toLowerCase().match(/^(.+)\.([a-z0-9]+)$/);
        id = m ? m[1].replace(/_avif$/, "") : "";
        if (!ID_RE.test(id)) { results.push({ file: f.name, ok: false, reason: "name the file <product-id>.jpg, or send a product_id field" }); continue; }
      }
      if (f.size > MAX_BYTES) { results.push({ file: f.name, ok: false, reason: "file over " + MAX_LABEL + "; compress it" }); continue; }
      const buf = new Uint8Array(await f.arrayBuffer());
      const isLast = i === files.length - 1;
      const r = await savePhoto(sb, base, id, buf, formId ? (wantAppend || i > 0) : wantAppend, activate && (formId ? isLast : true));
      results.push({ file: f.name, ...r });
    }
    return json({ results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
