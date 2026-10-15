import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lets the checkout page poll a payment by its (unguessable) CheckoutRequestID. Returns minimal fields only.

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
  return new Response(JSON.stringify(body), { status, headers: { ...corsFor(req), "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsFor(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  let id = "";
  try { id = String((await req.json()).checkoutRequestId || ""); } catch { /* fall through */ }
  if (!/^ws_CO_[A-Za-z0-9_]{8,80}$/.test(id)) return json(req, { error: "Invalid request" }, 400);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await sb.from("mpesa_payments")
    .select("status, mpesa_receipt, paid_amount, result_desc, created_at")
    .eq("checkout_request_id", id).maybeSingle();
  if (!data) return json(req, { status: "unknown", message: "Payment not found." });

  if (data.status === "success") return json(req, { status: "success", receipt: data.mpesa_receipt, amount: data.paid_amount });
  if (data.status === "pending") {
    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > 150000) return json(req, { status: "timeout", message: "No response from M-Pesa. If you were charged, message us on WhatsApp with the SMS." });
    return json(req, { status: "pending" });
  }
  const msg = data.status === "cancelled" ? "You cancelled the M-Pesa prompt. You can try again." : (data.result_desc || "The payment was not completed. You can try again.");
  return json(req, { status: data.status, message: msg });
});
