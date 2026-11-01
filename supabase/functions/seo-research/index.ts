import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://stermontarcade.co.ke";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-retry-count",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

async function db(path: string, init: RequestInit = {}) {
  return fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function audit(t: any) {
  const title = String(t.title || "").trim();
  const description = String(t.description || "").trim();
  const plain = String(t.existing || "").replace(/\\s+/g, " ").trim();
  const issues: string[] = Array.isArray(t.issues) ? t.issues.map((x: any) => String(x)) : [];
  if (!title) issues.push("Missing page title: add a unique, descriptive title.");
  else if (title.length < 25 || title.length > 65) issues.push("Title length is " + title.length + " characters; review for a concise, descriptive search title.");
  if (!description) issues.push("Missing meta description: write a unique summary of the page.");
  else if (description.length < 70 || description.length > 165) issues.push("Meta description length is " + description.length + " characters; review for a concise search snippet.");
  if (plain.length < 500) issues.push("Page text is short (" + plain.length + " characters); assess whether it answers the visitor's main questions.");
  if (!/Kenya|Nairobi|Mombasa|Eldoret|Nakuru/i.test(plain)) issues.push("No Kenyan location/context detected in supplied text; add only relevant, accurate local information.");
  if (!issues.length) issues.push("No major issues were detected by the automated scan. Manual review is still recommended.");
  const summary = [
    "## Free automated on-page SEO audit",
    "Generated from the live page scan and its title, description, text and structural checks. No paid AI, external search API, competitor research or live ranking claims were used.",
    "## Findings",
    ...issues.map((x: string) => "- " + x),
    "## Recommended improvements",
    "- Make the opening paragraph explain the page purpose and intended customer clearly.",
    "- Use descriptive subheadings that answer real customer questions.",
    "- Add relevant internal links to related services, guides or products.",
    "- Use only accurate Kenyan service-area, pricing, licensing, product and safety information.",
    "## Limitations",
    "This is an automated on-page checklist, not keyword-volume research, live competitor analysis or regulatory verification."
  ].join("\n");
  return {
    title: title || String(t.slug || "Stermont page").replace(/[-_]/g, " ").slice(0, 60),
    meta_description: description || plain.slice(0, 150),
    draft_markdown: plain || "The scanner did not supply page text. Review the live page manually before drafting replacement copy.",
    research_summary: summary,
    sources: []
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") return reply({ error: "POST required" }, 405);
    if (!req.headers.get("authorization")) return reply({ error: "Authentication required" }, 401);
    const body = await req.json();
    const targets = Array.isArray(body.targets) ? body.targets.slice(0, 8) : [];
    if (!targets.length) return reply({ error: "targets required" }, 400);
    for (const t of targets) {
      if (!t || !["service", "blog", "product", "category"].includes(t.type) || !t.slug || !t.url) {
        return reply({ error: "Each target needs a supported type, slug and URL" }, 400);
      }
      if (new URL(t.url).origin !== SITE) return reply({ error: "Target URLs must belong to Stermont Arcade" }, 400);
    }
    const runResp = await db("seo_research_runs", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ trigger: body.trigger || "manual", status: "running", pages_scanned: 0, proposals_created: 0 }),
    });
    if (!runResp.ok) throw new Error("Could not create research run: " + await runResp.text());
    const runRows = await runResp.json();
    const runId = runRows?.[0]?.id;
    let saved = 0;
    const failures: any[] = [];
    for (const target of targets) {
      try {
        const result = audit(target);
        // The table has UNIQUE (target_type, target_slug, status). Upsert the
        // pending row so repeated scans refresh it instead of failing with 23505.
        const upsert = await db("seo_content_proposals?on_conflict=target_type,target_slug,status", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({
            target_type: target.type,
            target_slug: target.slug,
            target_url: target.url,
            title: result.title,
            meta_description: result.meta_description,
            draft_markdown: result.draft_markdown,
            research_summary: result.research_summary,
            sources: [],
            seo_score_before: Number.isFinite(target.score) ? target.score : null,
            status: "pending",
            generation_model: "local-seo-audit-v1",
            generation_run_id: runId || null,
          }),
        });
        if (!upsert.ok) throw new Error("Proposal upsert failed: " + await upsert.text());
        saved++;
      } catch (e) {
        failures.push({ slug: target.slug, error: e instanceof Error ? e.message : String(e) });
      }
    }
    if (runId) {
      const update = await db("seo_research_runs?id=eq." + runId, {
        method: "PATCH",
        body: JSON.stringify({
          finished_at: new Date().toISOString(),
          status: failures.length === targets.length ? "failed" : failures.length ? "completed_with_errors" : "completed",
          pages_scanned: targets.length,
          proposals_created: saved,
          error: failures.length ? JSON.stringify(failures) : null,
        }),
      });
      if (!update.ok) throw new Error("Could not update research run: " + await update.text());
    }
    return reply({ run_id: runId, proposals_created: saved, proposals_saved: saved, failures, engine: "local-seo-audit-v1" });
  } catch (e) {
    return reply({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});