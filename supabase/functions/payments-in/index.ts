// Stermont Arcade: receives M-Pesa Paybill (C2B) payment notifications from Safaricom (Daraja).
// Deploy as a Supabase Edge Function named "payments-in" with "Verify JWT" turned OFF:
// Safaricom does not send a login token, so this function protects itself with a secret token inside the URL
// (stored in the private payment_settings table, created by supabase-mpesa.sql).
//
// URLs:  <project>.supabase.co/functions/v1/payments-in/<token>/<action>
//   validate  (POST, from Safaricom)   always accepts
//   confirm   (POST, from Safaricom)   records the payment in mpesa_payments
//   check     (GET)                    tests the Daraja keys (sandbox or production)
//   register  (GET ?sc=SHORTCODE)      registers the confirm/validate URLs with Daraja
//   simulate  (GET ?sc=&amount=&ref=)  sandbox only: sends a fake test payment
//
// Secrets (Supabase -> Edge Functions -> Secrets): MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
// and optionally MPESA_ENV = "production" (anything else means sandbox).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENV = Deno.env.get("MPESA_ENV") === "production" ? "production" : "sandbox";
const DARAJA = ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
const FN = "payments-in";
const db = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

const ACCEPT = { ResultCode: 0, ResultDesc: "Accepted" };
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

// Compare without leaking how many characters matched.
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function hookToken(): Promise<string | null> {
  const { data } = await db.from("payment_settings").select("value").eq("key", "hook_token").maybeSingle();
  return data?.value ?? null;
}

async function darajaToken(): Promise<{ token?: string; status: number }> {
  const key = Deno.env.get("MPESA_CONSUMER_KEY"), secret = Deno.env.get("MPESA_CONSUMER_SECRET");
  if (!key || !secret) return { status: 0 };
  const r = await fetch(`${DARAJA}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: "Basic " + btoa(`${key}:${secret}`) },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return { status: r.status };
  const j = await r.json().catch(() => ({}));
  return { token: j.access_token, status: r.status };
}

async function darajaPost(path: string, body: unknown) {
  const t = await darajaToken();
  if (!t.token) return { ok: false, error: "Could not get a Daraja token", status: t.status };
  const r = await fetch(DARAJA + path, {
    method: "POST",
    headers: { Authorization: "Bearer " + t.token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await r.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep text */ }
  return { ok: r.ok, status: r.status, response: parsed };
}

Deno.serve(async (req) => {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const at = parts.indexOf(FN);
  const given = at >= 0 ? parts[at + 1] ?? "" : "";
  const action = at >= 0 ? parts[at + 2] ?? "" : "";

  const real = await hookToken();
  if (!real || !same(given, real)) return json({ error: "Not found" }, 404);

  // ---- From Safaricom ----
  if (action === "validate") return json(ACCEPT);

  if (action === "confirm") {
    try {
      const b = await req.json();
      const transId = clip(b.TransID, 40).toUpperCase();
      const amount = Number(b.TransAmount);
      if (transId.length >= 5 && Number.isFinite(amount) && amount >= 0) {
        const { error } = await db.from("mpesa_payments").upsert({
          trans_id: transId,
          trans_time: clip(b.TransTime, 20),
          amount,
          bill_ref: clip(b.BillRefNumber, 40),
          msisdn: clip(b.MSISDN, 80),
          payer_name: clip([b.FirstName, b.MiddleName, b.LastName].filter(Boolean).join(" "), 80),
          short_code: clip(b.BusinessShortCode, 12),
          env: ENV,
        }, { onConflict: "trans_id", ignoreDuplicates: true });
        if (error) console.error("payments-in: could not save payment", transId, error.message);
      } else {
        console.error("payments-in: ignored a malformed confirmation");
      }
    } catch (e) {
      console.error("payments-in: bad confirmation body", (e as Error).message);
    }
    return json(ACCEPT); // always answer Accepted so Safaricom is satisfied
  }

  // ---- Setup and testing (token-protected) ----
  if (req.method !== "GET") return json({ error: "Use GET" }, 405);
  const q = new URL(req.url).searchParams;

  if (action === "check") {
    const t = await darajaToken();
    return json({ env: ENV, keys_ok: !!t.token, daraja_status: t.status });
  }

  if (action === "register") {
    const sc = clip(q.get("sc"), 8);
    if (!/^\d{5,7}$/.test(sc)) return json({ error: "Add ?sc=YOUR_SHORTCODE" }, 400);
    const base = `${SB_URL}/functions/v1/${FN}/${real}`;
    return json({ env: ENV, shortcode: sc, ...(await darajaPost("/mpesa/c2b/v2/registerurl", {
      ShortCode: sc, ResponseType: "Completed", ConfirmationURL: `${base}/confirm`, ValidationURL: `${base}/validate`,
    })) });
  }

  if (action === "simulate") {
    if (ENV !== "sandbox") return json({ error: "Simulation is sandbox only" }, 403);
    const sc = clip(q.get("sc"), 8), amount = Math.round(Number(q.get("amount") || "10"));
    if (!/^\d{5,7}$/.test(sc) || !(amount >= 1 && amount <= 150000)) return json({ error: "Use ?sc=SHORTCODE&amount=10&ref=ACCOUNT" }, 400);
    return json({ env: ENV, ...(await darajaPost("/mpesa/c2b/v1/simulate", {
      ShortCode: sc, CommandID: "CustomerPayBillOnline", Amount: amount, Msisdn: "254708374149", BillRefNumber: clip(q.get("ref") || "test", 20),
    })) });
  }

  return json({ error: "Not found" }, 404);
});
