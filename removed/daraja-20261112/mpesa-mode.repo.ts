import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Tells the storefront whether to show the M-Pesa prompt button to buyers.
// True only when MPESA_ENV is "production" and every M-Pesa secret is set.
// Returns no secret values.

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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsFor(req) });
  const need = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_SECRET"];
  const enabled = Deno.env.get("MPESA_ENV") === "production" && need.every((k) => !!Deno.env.get(k));
  return new Response(JSON.stringify({ enabled }), {
    headers: { ...corsFor(req), "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
});
