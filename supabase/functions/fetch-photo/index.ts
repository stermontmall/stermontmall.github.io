import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Staff-only: download a product photo from a public https link and store it in the product-images bucket.
// POST { image_url, name? } with the staff session token -> { ok: true, url } (the public Storage URL).
// Browsers cannot download other sites' images (CORS), so the server does it.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BASE = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

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
function sniff(b: Uint8Array): string {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return "";
}
function badType(b: Uint8Array): string {
  const head = new TextDecoder().decode(b.slice(4, 12));
  if (head.startsWith("ftyp") && /avif|avis/.test(head)) return "That link is an AVIF image; use a jpg, png or webp link.";
  if (head.startsWith("ftyp") && /heic|heix|mif1/.test(head)) return "That link is a HEIC image; use a jpg, png or webp link.";
  const start = new TextDecoder().decode(b.slice(0, 15)).toLowerCase();
  if (start.includes("<!doctype") || start.includes("<html")) return "That link is a web page, not an image file. Right-click the picture, copy the image address, and paste that.";
  return "That link is not a jpg, png or webp image.";
}
function safeHttps(u: URL): boolean {
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (h.includes(":") || /^[0-9.]+$/.test(h)) return false;
  return true;
}
async function download(raw: string): Promise<{ bytes: Uint8Array; type: string } | { error: string }> {
  let url: URL;
  try { url = new URL(raw); } catch { return { error: "That photo link is not a valid URL." }; }
  for (let hop = 0; hop < 4; hop++) {
    if (!safeHttps(url)) return { error: "The photo link must be a public HTTPS link." };
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
    } catch { return { error: "Could not download the photo link (timeout or network error). Upload the file instead." }; }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location");
      if (!loc) return { error: "The photo link redirects badly." };
      try { url = new URL(loc, url); } catch { return { error: "The photo link redirects badly." }; }
      continue;
    }
    if (!r.ok) return { error: "The photo link could not be downloaded (HTTP " + r.status + "); the site may block downloads. Upload the file instead." };
    if (Number(r.headers.get("content-length") ?? 0) > MAX_BYTES) return { error: "The photo is over 5 MB; use a smaller image." };
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > MAX_BYTES) return { error: "The photo is over 5 MB; use a smaller image." };
    const type = sniff(bytes);
    if (!type) return { error: badType(bytes) };
    return { bytes, type };
  }
  return { error: "The photo link redirects too many times." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!(await isStaff(req.headers.get("Authorization") || ""))) return json({ ok: false, error: "Staff sign-in required. Sign in at /admin.html and try again." }, 403);
  // deno-lint-ignore no-explicit-any
  let b: any;
  try { b = await req.json(); } catch (_e) { return json({ ok: false, error: "Send JSON with image_url." }, 400); }
  const link = String(b?.image_url || "").trim();
  if (!link || link.length > 2000) return json({ ok: false, error: "Paste a direct photo link." }, 400);
  const got = await download(link);
  if ("error" in got) return json({ ok: false, error: got.error }, 422);

  const base = String(b?.name || "item").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";
  const file = base + "-" + Date.now() + Math.floor(Math.random() * 99) + "." + EXT[got.type];
  const up = await fetch(BASE + "/storage/v1/object/product-images/" + file, {
    method: "POST",
    headers: { apikey: SRK, Authorization: "Bearer " + SRK, "Content-Type": got.type, "x-upsert": "false" },
    body: got.bytes,
  });
  if (!up.ok) return json({ ok: false, error: "Photo upload failed.", detail: (await up.text()).slice(0, 200) }, 500);
  return json({ ok: true, url: BASE + "/storage/v1/object/public/product-images/" + file });
});
