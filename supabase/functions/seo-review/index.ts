import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_ORIGIN = "https://stermontarcade.co.ke";
const CORS = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function serviceRequest(path: string, init: RequestInit = {}) {
  return fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ ok: false, error: "POST required." }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return reply({ ok: false, error: "Your admin session is missing. Sign in again." }, 401);

    const userResponse = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SERVICE_KEY, Authorization: authorization }
    });
    if (!userResponse.ok) return reply({ ok: false, error: "Your admin session has expired. Sign in again." }, 401);

    const user = await userResponse.json();
    const email = String(user?.email || "").trim().toLowerCase();
    if (!user?.id || !email) return reply({ ok: false, error: "Could not verify the signed-in admin account." }, 401);

    const staffResponse = await serviceRequest("staff?select=email&limit=1&email=ilike." + encodeURIComponent(email));
    if (!staffResponse.ok) return reply({ ok: false, error: "Could not verify staff access. Please try again." }, 503);
    const staffRows = await staffResponse.json();
    if (!Array.isArray(staffRows) || staffRows.length !== 1) {
      return reply({ ok: false, error: "This account is not authorised to review SEO proposals." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const id = String(body?.proposal_id || "");
    const action = String(body?.action || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return reply({ ok: false, error: "A valid proposal ID is required." }, 400);
    }
    if (action !== "approve" && action !== "reject") {
      return reply({ ok: false, error: "Action must be approve or reject." }, 400);
    }

    const pendingResponse = await serviceRequest(
      "seo_content_proposals?id=eq." + encodeURIComponent(id) + "&status=eq.pending&select=id,target_type,target_slug,status"
    );
    if (!pendingResponse.ok) return reply({ ok: false, error: "Could not load the pending proposal." }, 502);
    const pendingRows = await pendingResponse.json();
    if (!Array.isArray(pendingRows) || pendingRows.length !== 1) {
      return reply({ ok: false, error: "This proposal is no longer pending. Refresh the proposal list." }, 409);
    }

    const proposal = pendingRows[0];
    const nextStatus = action === "approve" ? "approved" : "rejected";
    const target = "target_type=eq." + encodeURIComponent(proposal.target_type) +
      "&target_slug=eq." + encodeURIComponent(proposal.target_slug) +
      "&status=eq." + nextStatus + "&id=neq." + encodeURIComponent(id) + "&select=id,status";
    const existingResponse = await serviceRequest("seo_content_proposals?" + target);
    if (!existingResponse.ok) return reply({ ok: false, error: "Could not check earlier review decisions." }, 502);
    const existingRows = await existingResponse.json();
    if (!Array.isArray(existingRows)) return reply({ ok: false, error: "Unexpected review history response." }, 502);

    const superseded: string[] = [];
    for (const old of existingRows) {
      const marker = "superseded-" + old.id;
      const move = await serviceRequest("seo_content_proposals?id=eq." + encodeURIComponent(old.id) + "&status=eq." + nextStatus, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: marker })
      });
      const moved = await move.json().catch(() => []);
      if (!move.ok || !Array.isArray(moved) || moved.length !== 1) {
        for (const priorId of superseded) {
          await serviceRequest("seo_content_proposals?id=eq." + encodeURIComponent(priorId), {
            method: "PATCH",
            body: JSON.stringify({ status: nextStatus })
          });
        }
        return reply({ ok: false, error: "Could not safely replace the earlier review decision. No new decision was saved." }, 502);
      }
      superseded.push(old.id);
    }

    const update = await serviceRequest(
      "seo_content_proposals?id=eq." + encodeURIComponent(id) + "&status=eq.pending&select=id,status,reviewed_by,reviewed_at",
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          status: nextStatus,
          reviewed_by: email,
          reviewed_at: new Date().toISOString()
        })
      }
    );
    const rows = await update.json().catch(() => []);
    if (!update.ok || !Array.isArray(rows) || rows.length !== 1) {
      for (const priorId of superseded) {
        await serviceRequest("seo_content_proposals?id=eq." + encodeURIComponent(priorId), {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
      }
      return reply({ ok: false, error: "Database could not save the review decision. Earlier decisions were restored." }, 502);
    }

    return reply({
      ok: true,
      id: rows[0].id,
      status: rows[0].status,
      reviewed_at: rows[0].reviewed_at,
      superseded_count: superseded.length
    });
  } catch (_error) {
    return reply({ ok: false, error: "Unexpected review error. Refresh the page and try again." }, 500);
  }
});
