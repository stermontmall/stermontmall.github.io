import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Starts an M-Pesa STK Push (Safaricom Daraja). Secrets (set in the Supabase dashboard):
// MPESA_ENV (sandbox|production), MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
// MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_SECRET, MPESA_TXN_TYPE (optional)
// Paybill: leave MPESA_TXN_TYPE and MPESA_PARTYB unset.
// Till (Buy Goods): MPESA_SHORTCODE = store/head office number used to sign the request,
//   MPESA_PARTYB = the till number customers pay, MPESA_TXN_TYPE = CustomerBuyGoodsOnline

const ALLOWED = [
  "https://stermontarcade.co.ke",
  "https://www.stermontarcade.co.ke",
  "https://stermontmall.github.io",
];

function corsFor(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });
}

function normPhone(p: string) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (/^[17]\d{8}$/.test(d)) d = "254" + d;
  return /^254[17]\d{8}$/.test(d) ? d : "";
}

function stamp() {
  // Daraja timestamp YYYYMMDDHHmmss in Nairobi time (UTC+3)
  const t = new Date(Date.now() + 3 * 3600 * 1000);
  return t.toISOString().replace(/[-:T]/g, "").slice(0, 14);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsFor(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const env = (k: string) => (Deno.env.get(k) || "").trim();
  const need = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_SECRET"];
  if (need.some((k) => !env(k))) return json(req, { error: "M-Pesa is not configured yet." }, 503);

  let body: { phone?: string; amount?: number; ref?: string };
  try { body = await req.json(); } catch { return json(req, { error: "Bad request" }, 400); }

  const phone = normPhone(body.phone || "");
  const amount = Math.round(Number(body.amount));
  const ref = String(body.ref || "");
  if (!phone) return json(req, { error: "Enter a valid Safaricom number, e.g. 0712 345 678." }, 400);
  if (!Number.isFinite(amount) || amount < 1 || amount > 150000) return json(req, { error: "Invalid amount." }, 400);
  if (!/^STM-[A-Z2-9]{6}$/.test(ref)) return json(req, { error: "Invalid order reference." }, 400);

  const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  // Basic abuse limits: max 2 prompts per phone per minute, 5 per order per 10 minutes
  const since1 = new Date(Date.now() - 60 * 1000).toISOString();
  const since10 = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const [a, b] = await Promise.all([
    sb.from("mpesa_payments").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", since1),
    sb.from("mpesa_payments").select("id", { count: "exact", head: true }).eq("order_ref", ref).gte("created_at", since10),
  ]);
  if ((a.count || 0) >= 2 || (b.count || 0) >= 5) return json(req, { error: "Too many attempts. Wait a minute and try again." }, 429);

  const base = env("MPESA_ENV") === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

  const tokRes = await fetch(base + "/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: "Basic " + btoa(env("MPESA_CONSUMER_KEY") + ":" + env("MPESA_CONSUMER_SECRET")) },
  });
  if (!tokRes.ok) {
    const t = (await tokRes.text().catch(() => "")).slice(0, 200);
    console.error("Daraja token failed", tokRes.status, "env=" + (env("MPESA_ENV") || "unset"), "keyLen=" + env("MPESA_CONSUMER_KEY").length, "secretLen=" + env("MPESA_CONSUMER_SECRET").length, t);
    return json(req, { error: "M-Pesa is unavailable right now." }, 502);
  }
  const { access_token } = await tokRes.json();
  const keyHint = env("MPESA_CONSUMER_KEY").slice(0, 4) + "..." + " shortcode=" + env("MPESA_SHORTCODE") + " env=" + (env("MPESA_ENV") || "unset") + " base=" + base;

  const ts = stamp();
  const shortcode = env("MPESA_SHORTCODE");
  const password = btoa(shortcode + env("MPESA_PASSKEY") + ts);
  const callback = `${env("SUPABASE_URL")}/functions/v1/mpesa-callback?s=${encodeURIComponent(env("MPESA_CALLBACK_SECRET"))}`;

  const res = await fetch(base + "/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: { Authorization: "Bearer " + access_token, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: env("MPESA_TXN_TYPE") || "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: env("MPESA_PARTYB") || shortcode,
      PhoneNumber: phone,
      CallBackURL: callback,
      AccountReference: ref,
      TransactionDesc: "Stermont order " + ref,
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.ResponseCode !== "0" || !out.CheckoutRequestID) {
    console.error("STK push rejected", res.status, keyHint, JSON.stringify(out));
    return json(req, { error: "Could not send the M-Pesa prompt. Check the number and try again." }, 502);
  }

  const { error } = await sb.from("mpesa_payments").insert({
    order_ref: ref,
    phone,
    amount,
    checkout_request_id: out.CheckoutRequestID,
    merchant_request_id: out.MerchantRequestID || null,
  });
  if (error) { console.error("Insert payment failed", error.message); return json(req, { error: "Could not record the payment." }, 500); }

  return json(req, { checkoutRequestId: out.CheckoutRequestID });
});
