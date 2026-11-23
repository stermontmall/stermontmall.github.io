// Loads the publish_products rule into Neon public.publishing_rules from the repo copy.
// Usage: DATABASE_URL=postgres://... node scripts/seed-publishing-rule.mjs
import fs from "node:fs";
import pg from "pg";

if (!process.env.DATABASE_URL) { console.error("Set DATABASE_URL first"); process.exit(1); }

const md = fs.readFileSync(new URL("../PUBLISH-PRODUCTS-RULE.md", import.meta.url), "utf8");
const addendum = fs.readFileSync(new URL("../PUBLISH-PRODUCTS-INGEST-ADDENDUM.md", import.meta.url), "utf8");
const at = md.indexOf("## The rule");
if (at < 0) { console.error("Could not find '## The rule' in PUBLISH-PRODUCTS-RULE.md"); process.exit(1); }

const body = md.slice(md.indexOf("\n", at) + 1).split("\n").filter((l) => !l.startsWith("```")).join("\n").trim();
const content = `${body}\n\n${addendum.trim()}\n`;
const title = "Publish products (v3 + Kenyan photo policy v7 + photo ingestion v9/v10)";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const up = await client.query("UPDATE public.publishing_rules SET version = 10, title = $1, content = $2, updated_at = now() WHERE key = 'publish_products'", [title, content]);
  if (!up.rowCount) await client.query("INSERT INTO public.publishing_rules(key, version, title, content, updated_at) VALUES('publish_products', 10, $1, $2, now())", [title, content]);
  await client.query("COMMIT");
  console.log(`publish_products loaded (version 10, ${content.length} characters)`);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  await client.end();
}
