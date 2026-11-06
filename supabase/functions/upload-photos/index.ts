import { createClient } from "jsr:@supabase/supabase-js@2";

// Generic product photo uploader. Works for ANY existing product.
// Mode A (website page): POST multipart/form-data: pass, files (named <product-id>.jpg|png|webp), activate=1 (optional)
// Mode B (AI sessions / SQL): POST application/json: { pass, product_id, image_url | image_base64, activate? }
//   image_url: the function downloads it (public https only).
//   image_base64: raw base64 or a data: URL of the photo itself (use this when the AI tool can't give a direct link).
//   Either way it checks the file is a real jpg/png/webp <= 5 MB, and saves it.
// Passcode lives in public.upload_settings (key 'photo_passcode'). Rotate it with SQL.
// Result: file saved to bucket product-images as <product-id>.<ext>, URL saved into products.images.
const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_LABEL = "5 MB";
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const EXT_TYPE: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

function sniff(b: Uint8Array): string {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return "";
}


function dimensions(b: Uint8Array, mime: string): { width: number; height: number } | null {
  if (mime === "image/png" && b.length >= 24) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { width: v.getUint32(16), height: v.getUint32(20) };
  }
  if (mime === "image/jpeg") {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1]; i += 2;
      if (m === 0xd8 || m === 0xd9 || (m >= 0xd0 && m <= 0xd7)) continue;
      if (i + 2 > b.length) break;
      const len = (b[i] << 8) | b[i + 1];
      if (len < 2 || i + len > b.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m))
        return { height: (b[i+3] << 8) | b[i+4], width: (b[i+5] << 8) | b[i+6] };
      i += len;
    }
  }
  if (mime === "image/webp" && b.length >= 30) {
    const s = (i:number,n:number) => String.fromCharCode(...b.slice(i,i+n));
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (s(12,4) === "VP8X") return { width: 1 + b[24] + (b[25]<<8) + (b[26]<<16), height: 1 + b[27] + (b[28]<<8) + (b[29]<<16) };
    if (s(12,4) === "VP8 " && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return { width: v.getUint16(26,true)&0x3fff, height: v.getUint16(28,true)&0x3fff };
    if (s(12,4) === "VP8L" && b[20] === 0x2f) return { width: 1 + (((b[22]&0x3f)<<8)|b[21]), height: 1 + (((b[24]&0x0f)<<10)|(b[23]<<2)|((b[22]&0xc0)>>6)) };
  }
  return null;
}
function enforcePhotoQuality(b: Uint8Array, mime: string): string | null {
  const d = dimensions(b, mime);
  if (!d) return "could not read image dimensions; upload a standard JPG, PNG or WebP";
  if (d.width < 800 || d.height < 800) return "photo is too small (" + d.width + "×" + d.height + "); minimum is 800×800 pixels";
  return null;
}

function notSupportedReason(b: Uint8Array): string {
  const head = new TextDecoder().decode(b.slice(4, 12));
  if (head.startsWith("ftyp") && /avif|avis/.test(head)) return "image is AVIF; convert it to jpg, png or webp first";
  if (head.startsWith("ftyp") && /heic|heix|mif1/.test(head)) return "image is HEIC; convert it to jpg, png or webp first";
  const start = new TextDecoder().decode(b.slice(0, 15)).toLowerCase();
  if (start.includes("<!doctype") || start.includes("<html")) return "link is a web page, not a direct image file; use the direct image link or send image_base64";
  if (start.includes("<svg") || start.includes("<?xml")) return "image is SVG; only jpg, png or webp are accepted";
  if (start.startsWith("gif")) return "image is GIF; only jpg, png or webp are accepted";
  return "file is not a jpg, png or webp image";
}

function safeHttps(u: URL): boolean {
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (h.includes(":") || /^[0-9.]+$/.test(h)) return false; // no IP literals
  return true;
}

async function fetchImage(raw: string): Promise<{ bytes: Uint8Array } | { error: string }> {
  let url: URL;
  try { url = new URL(raw); } catch { return { error: "image_url is not a valid URL" }; }
  for (let hop = 0; hop < 4; hop++) {
    if (!safeHttps(url)) return { error: "image_url must be a public https link" };
    let r: Response;
    try {
      r = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8",
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
    const mime = sniff(bytes);
    if (!mime) return { error: notSupportedReason(bytes) };
    const qualityError = enforcePhotoQuality(bytes, mime);
    if (qualityError) return { error: qualityError };
    return { bytes };
  }
  return { error: "too many redirects" };
}

function decodeBase64Image(raw: string): { bytes: Uint8Array } | { error: string } {
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
  const mime = sniff(bytes);
  if (!mime) return { error: notSupportedReason(bytes) };
  const qualityError = enforcePhotoQuality(bytes, mime);
  if (qualityError) return { error: qualityError };
  return { bytes };
}

// deno-lint-ignore no-explicit-any
async function savePhoto(sb: any, base: string, id: string, bytes: ArrayBuffer | Uint8Array, ct: string, activate: boolean, prod: { images: unknown }) {
  const qualityError = enforcePhotoQuality(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), ct);
  if (qualityError) return { ok: false, reason: qualityError };
  const path = `${id}.${TYPES[ct]}`;
  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, { upsert: true, contentType: ct });
  if (upErr) return { ok: false, reason: upErr.message };
  const url = `${base}/storage/v1/object/public/${BUCKET}/${path}`;
  const imgs: string[] = Array.isArray(prod.images) ? (prod.images as string[]) : [];
  const next = [url, ...imgs.filter((old) => old !== url && !old.includes("/" + id + "."))];
  const patch: Record<string, unknown> = { images: next };
  if (activate) patch.active = true;
  const { error: dbErr } = await sb.from("products").update(patch).eq("id", id);
  if (dbErr) return { ok: false, reason: "saved file but DB update failed: " + dbErr.message };
  return { ok: true, product: id, url, live: activate };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Use the Stermont photo upload page.", { headers: cors });
  try {
    const base = Deno.env.get("SUPABASE_URL")!;
    const sb = createClient(base, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: st } = await sb.from("upload_settings").select("value").eq("key", "photo_passcode").maybeSingle();
    const isJson = (req.headers.get("content-type") ?? "").includes("application/json");

    if (isJson) {
      const b = await req.json().catch(() => ({}));
      if (!st || String(b?.pass ?? "") !== st.value) return json({ error: "Wrong passcode" }, 401);
      const id = String(b?.product_id ?? "");
      if (!ID_RE.test(id)) return json({ ok: false, reason: "product_id must be lowercase-hyphen" }, 400);
      const { data: prod } = await sb.from("products").select("id,images").eq("id", id).maybeSingle();
      if (!prod) return json({ ok: false, reason: "no product with this id; add the product first" }, 404);
      let got: { bytes: Uint8Array } | { error: string };
      if (typeof b?.image_base64 === "string" && b.image_base64.length > 0) got = decodeBase64Image(b.image_base64);
      else if (typeof b?.image_url === "string" && b.image_url.length > 0) got = await fetchImage(b.image_url);
      else return json({ ok: false, reason: "send image_url (direct https link to a jpg/png/webp) or image_base64" }, 400);
      if ("error" in got) return json({ ok: false, reason: got.error }, 422);
      const ct = sniff(got.bytes);
      const res = await savePhoto(sb, base, id, got.bytes, ct, b?.activate === true, prod);
      return json(res, res.ok ? 200 : 500);
    }

    const form = await req.formData();
    if (!st || String(form.get("pass") ?? "") !== st.value) return json({ error: "Wrong passcode" }, 401);
    const activate = String(form.get("activate") ?? "") === "1";
    const results: unknown[] = [];
    for (const f of form.getAll("files")) {
      if (!(f instanceof File)) continue;
      const m = f.name.toLowerCase().match(/^(.+)\.([a-z0-9]+)$/);
      const id = m ? m[1].replace(/_avif$/, "") : "";
      if (!m || !ID_RE.test(id)) { results.push({ file: f.name, ok: false, reason: "rename file to <product-id>.jpg (lowercase-hyphen)" }); continue; }
      const { data: prod } = await sb.from("products").select("id,images").eq("id", id).maybeSingle();
      if (!prod) { results.push({ file: f.name, ok: false, reason: "no product with this id; post the product first" }); continue; }
      if (f.size > MAX_BYTES) { results.push({ file: f.name, ok: false, reason: "file over " + MAX_LABEL + "; compress it" }); continue; }
      const ct = TYPES[f.type] ? f.type : (EXT_TYPE[m[2]] ?? "");
      if (!ct) { results.push({ file: f.name, ok: false, reason: "only jpg, png or webp" }); continue; }
      const r = await savePhoto(sb, base, id, await f.arrayBuffer(), ct, activate, prod);
      results.push({ file: f.name, ...r });
    }
    return json({ results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
