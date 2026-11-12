import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Daraja M-Pesa STK prompt was removed on 2026-11-12 (owner request). Never sends a prompt.
// Old copy of this function: removed/daraja-20261112/ in the site repo.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(JSON.stringify({ error: "The M-Pesa prompt is no longer available. Please pay with the Paybill details shown at checkout." }), {
    status: 410,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
