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

type Check = { key: string; label: string; weight: number; passed: boolean; detail: string };
function audit(t: any) {
  const title = String(t.title || "").trim();
  const description = String(t.description || "").trim();
  const metrics = t.metrics && typeof t.metrics === "object" ? t.metrics : {};
  const checks: Check[] = [
    { key: "title", label: "Unique descriptive title", weight: 10, passed: Boolean(title) && title.length >= 25 && title.length <= 65, detail: title ? `Current title is ${title.length} characters.` : "No title was detected." },
    { key: "description", label: "Search snippet description", weight: 10, passed: Boolean(description) && description.length >= 70 && description.length <= 165, detail: description ? `Current description is ${description.length} characters.` : "No meta description was detected." },
    { key: "h1", label: "Single clear H1", weight: 10, passed: metrics.h1Count === 1, detail: `Detected ${Number(metrics.h1Count) || 0} H1 elements.` },
    { key: "canonical", label: "Valid canonical URL", weight: 10, passed: metrics.canonicalValid === true, detail: metrics.canonical || "Canonical URL missing or invalid." },
    { key: "indexability", label: "Indexability signals", weight: 10, passed: metrics.indexable === true, detail: metrics.indexabilityDetail || "Noindex or unavailable indexability signal." },
    { key: "headings", label: "Useful heading structure", weight: 8, passed: metrics.h2Count >= 2 && metrics.headingOrderValid === true, detail: `${Number(metrics.h2Count) || 0} H2 headings; heading order ${metrics.headingOrderValid ? "looks valid" : "needs review"}.` },
    { key: "images", label: "Descriptive image alternatives", weight: 8, passed: metrics.imageCount > 0 && metrics.imagesWithAlt === metrics.imageCount, detail: `${Number(metrics.imagesWithAlt) || 0} of ${Number(metrics.imageCount) || 0} images have non-empty alt text.` },
    { key: "internalLinks", label: "Relevant internal links", weight: 8, passed: metrics.internalLinks >= 3, detail: `${Number(metrics.internalLinks) || 0} internal links detected.` },
    { key: "structuredData", label: "Structured data presence", weight: 8, passed: metrics.jsonLdCount > 0, detail: `${Number(metrics.jsonLdCount) || 0} JSON-LD block(s) detected; schema validity is not verified here.` },
    { key: "content", label: "Useful page depth", weight: 10, passed: metrics.wordCount >= 350, detail: `${Number(metrics.wordCount) || 0} visible words detected; word count alone does not prove quality.` },
    { key: "cta", label: "Clear next step", weight: 5, passed: metrics.hasCallToAction === true, detail: metrics.hasCallToAction ? "A contact, purchase or booking action was detected." : "No obvious conversion action was detected." },
    { key: "duplicates", label: "No repeated H1", weight: 3, passed: metrics.h1Count === 1, detail: "Review headings for duplicate or vague wording." },
  ];
  const total = checks.reduce((n, c) => n + c.weight, 0);
  const score = Math.round(checks.reduce((n, c) => n + (c.passed ? c.weight : 0), 0) / total * 100);
  const failed = checks.filter(c => !c.passed);
  const summary = [
    "## Automated on-page SEO assessment",
    "This is a deterministic technical/content-structure checklist based on the live HTML supplied by the browser. It is not keyword-volume research, a Google ranking measurement, competitor research, backlink analysis or a guarantee of ranking improvement.",
    `## Weighted score: ${score}/100`,
    "Weights are visible and reflect basic on-page hygiene. A passing check does not prove that the page is useful, accurate or competitive.",
    "## Evidence",
    ...checks.map(c => `- ${c.passed ? "PASS" : "REVIEW"} · ${c.label} (${c.weight} points): ${c.detail}`),
    "## Highest-priority improvements",
    ...(failed.length ? failed.sort((a,b) => b.weight-a.weight).map((c,i) => `${i+1}. **${c.label}:** ${c.detail} Fix this only where the page genuinely needs it; do not add filler or irrelevant keywords.`) : ["No failures in the automated checks. Perform a human review for accuracy, originality, search intent and conversion usefulness."]),
    "## Research limitations",
    "No external search or competitor sources were queried for this run. Sources are intentionally empty rather than fabricated. Validate target keywords and search demand in Google Search Console or a keyword research tool before changing copy."
  ].join("\n");
  const brief = [
    `# Editorial improvement brief: ${title || t.slug}`,
    `Target page: ${t.url}`,
    `Current automated score: ${score}/100`,
    "",
    "## Fix first",
    ...(failed.length ? failed.sort((a,b) => b.weight-a.weight).map((c,i) => `${i+1}. ${c.label} — ${c.detail}`) : ["No automated technical/content-structure failure was detected."]),
    "",
    "## Copywriting requirements",
    "- Preserve the page's real product/service facts, availability, prices, warranties, locations and policies. Verify every claim with the business owner or source data.",
    "- Identify the actual search intent and primary customer question before selecting a target phrase.",
    "- Write a unique, accurate title and meta description that describe this exact page; do not force arbitrary character targets at the expense of clarity.",
    "- Improve the opening so visitors immediately understand what is offered, who it is for and the next useful action.",
    "- Add specific, useful sections and FAQs only when they answer real customer questions.",
    "- Add contextual internal links to genuinely related pages; avoid repeated exact-match anchors.",
    "- Do not invent reviews, credentials, stock, delivery promises, prices, guarantees, locations or product specifications.",
    "",
    "## Existing page text for editor reference",
    String(t.existing || "").slice(0, 6000) || "No readable page text was supplied. Inspect the live page before writing replacement copy.",
    "",
    "This is an editorial brief, not publish-ready replacement copy. No live page is changed by this proposal."
  ].join("\n");
  return {
    title: title || String(t.slug || "Stermont page").replace(/[-_]/g, " ").slice(0, 60),
    meta_description: description,
    draft_markdown: brief,
    research_summary: summary,
    score,
    sources: []
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") return reply({ error: "POST required" }, 405);
    const authorization = req.headers.get("authorization");
    if (!authorization) return reply({ error: "Authentication required" }, 401);
    const userCheck = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SERVICE_KEY, Authorization: authorization },
    });
    if (!userCheck.ok) return reply({ error: "Valid Supabase user session required" }, 401);
    const user = await userCheck.json();
    if (!user?.id || !user?.email) return reply({ error: "Authenticated user could not be verified" }, 401);
    const staffCheck = await db("staff?email=ilike." + encodeURIComponent(String(user.email).trim()) + "&select=email&limit=1");
    if (!staffCheck.ok) throw new Error("Could not verify SEO Doctor staff access: " + await staffCheck.text());
    const staffRows = await staffCheck.json();
    if (!Array.isArray(staffRows) || staffRows.length !== 1) return reply({ error: "Staff access required" }, 403);

    const body = await req.json();
    const targets = Array.isArray(body.targets) ? body.targets.slice(0, 8) : [];
    if (!targets.length) return reply({ error: "targets required" }, 400);
    for (const t of targets) {
      if (!t || !["service", "blog", "product", "category", "page"].includes(t.type) || !t.slug || !t.url) {
        return reply({ error: "Each target needs a supported type, slug and URL" }, 400);
      }
      let url: URL;
      try { url = new URL(t.url); } catch { return reply({ error: "Invalid target URL" }, 400); }
      if (url.origin !== SITE || !url.pathname.endsWith(".html") && url.pathname !== "/") {
        return reply({ error: "Target must be an HTML page on the Stermont Arcade site" }, 400);
      }
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
            sources: result.sources,
            seo_score_before: result.score,
            status: "pending",
            generation_model: "weighted-onpage-audit-v2",
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
          status: failures.length ? "failed" : "completed",
          pages_scanned: targets.length,
          proposals_created: saved,
          error: failures.length ? JSON.stringify(failures) : null,
        }),
      });
      if (!update.ok) throw new Error("Could not update research run: " + await update.text());
    }
    return reply({ run_id: runId, proposals_created: saved, proposals_saved: saved, failures, engine: "weighted-onpage-audit-v2" });
  } catch (e) {
    return reply({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
