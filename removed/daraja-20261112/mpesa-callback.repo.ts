import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Safaricom posts the STK result here. The URL carries a secret (?s=...) set in MPESA_CALLBACK_SECRET,
// because Daraja callbacks are not signed. Deploy with JWT verification OFF.

const ok = () => new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { headers: { "Content-Type": "application/json" } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function parseDarajaDate(v: unknown) {
  const s = String(v || "");
  if (!/^\d{14}$/.test(s)) return new Date().toISOString();
  // Daraja time is Nairobi (UTC+3)
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+03:00`).toISOString();
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("MPESA_CALLBACK_SECRET") || "";
  const given = new URL(req.url).searchParams.get("s") || "";
  if (!secret || !safeEqual(secret, given)) return new Response("Forbidden", { status: 403 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: any;
  try { payload = await req.json(); } catch { return ok(); }
  const cb = payload?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return ok();

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const code = Number(cb.ResultCode);
  const update: Record<string, unknown> = {
    result_code: code,
    result_desc: String(cb.ResultDesc || "").slice(0, 300),
    merchant_request_id: cb.MerchantRequestID || null,
    updated_at: new Date().toISOString(),
    raw: payload,
  };

  if (code === 0) {
    const items: { Name: string; Value?: unknown }[] = cb.CallbackMetadata?.Item || [];
    const get = (n: string) => items.find((i) => i.Name === n)?.Value;
    update.status = "success";
    update.mpesa_receipt = String(get("MpesaReceiptNumber") || "").toUpperCase() || null;
    update.paid_amount = Number(get("Amount")) || null;
    update.paid_at = parseDarajaDate(get("TransactionDate"));
  } else {
    update.status = code === 1032 ? "cancelled" : "failed";
  }

  // Only update a payment we started and that is still pending (ignores replays)
  const { error } = await sb.from("mpesa_payments").update(update)
    .eq("checkout_request_id", cb.CheckoutRequestID).eq("status", "pending");
  if (error) console.error("Callback update failed", error.message);

  return ok();
});
