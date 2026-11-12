import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Daraja M-Pesa STK prompt was removed on 2026-11-12 (owner request).
// Acknowledges any late Safaricom callback and records nothing.
// Old copy of this function: removed/daraja-20261112/ in the site repo.
Deno.serve(() => new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
  headers: { "Content-Type": "application/json" },
}));
