import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// BACKUP of the version deployed in Supabase (v21) on 2026-11-12 before removal. Not used.
// Known bug: sets status "amount_mismatch", which mpesa_payments_status_check does not allow,
// so a success callback that failed the phone check was never saved.

// Safaricom posts the STK result here. The URL carries a secret (?s=...) set in MPESA_CALLBACK_SECRET,
// because Daraja callbacks are not signed. Deploy with JWT verification OFF.

const ok = () => new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { headers: { "Content-Type": "application/json" } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function normPhone(v: unknown) {
  let d = String(v || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (/^[17]\d{8}$/.test(d)) d = "254" + d;
  return /^254[17]\d{8}$/.test(d) ? d : "";
}

function parseDarajaDate(v: unknown) {
  const s = String(v || "");
  if (!/^\d{14}$/.test(s)) return new Date().toISOString();
  // Daraja time is Nairobi (UTC+3)
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+03:00`).toISOString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  // Trimmed like stk-push, so a secret saved with a stray space or newline still matches.
  const secret = (Deno.env.get("MPESA_CALLBACK_SECRET") || "").trim();
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

  // Only update a payment we started and that is still pending (ignores replays).
  // Safaricom can call back before stk-push has finished saving its row, so if no row exists yet
  // we wait briefly and try again instead of losing the result (the buyer would see a false timeout).
  let handled = false;
  for (let attempt = 0; attempt < 4 && !handled; attempt++) {
    const { data: payment, error: lookupError } = await sb.from("mpesa_payments")
      .select("id, amount, phone, status").eq("checkout_request_id", cb.CheckoutRequestID).maybeSingle();
    if (lookupError) { console.error("Callback lookup failed", lookupError.message); break; }
    if (!payment) { await sleep(1500); continue; }
    if (payment.status !== "pending") break; // already finished earlier: ignore callback replay

    const finalUpdate: Record<string, unknown> = { ...update };
    if (code === 0) {
      const expectedAmount = Number(payment.amount);
      const receivedAmount = Number(update.paid_amount);
      const receipt = String(update.mpesa_receipt || "").trim();
      const items: { Name: string; Value?: unknown }[] = cb.CallbackMetadata?.Item || [];
      const callbackPhone = normPhone(items.find((i) => i.Name === "PhoneNumber")?.Value);
      const expectedPhone = normPhone(payment.phone);
      const amountMatches = Number.isFinite(expectedAmount) && Number.isFinite(receivedAmount) &&
        Math.round(expectedAmount * 100) === Math.round(receivedAmount * 100);
      const phoneMatches = Boolean(callbackPhone && expectedPhone && callbackPhone === expectedPhone);
      if (amountMatches && receipt && phoneMatches) {
        finalUpdate.status = "success";
      } else {
        finalUpdate.status = "amount_mismatch";
        finalUpdate.result_desc = !receipt
          ? "M-Pesa success callback did not include a receipt; payment requires manual verification."
          : !amountMatches
            ? "Received amount did not match the requested amount; payment requires manual verification."
            : "M-Pesa callback phone number could not be verified against the payment request; manual verification is required.";
        console.error("M-Pesa callback validation failed", {
          checkoutRequestId: cb.CheckoutRequestID,
          expectedAmount,
          receivedAmount,
          hasReceipt: Boolean(receipt),
          phoneMatches,
        });
      }
    }

    const { data, error } = await sb.from("mpesa_payments").update(finalUpdate)
      .eq("id", payment.id).eq("status", "pending").select("id");
    if (error) { console.error("Callback update failed", error.message); break; }
    if (data && data.length) { handled = true; break; }
  }
  if (!handled) console.error("Callback did not match a pending payment", cb.CheckoutRequestID, "code=" + code);

  return ok();
});
