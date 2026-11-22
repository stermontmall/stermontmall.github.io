const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createHarness(records) {
  const calls = [];
  const store = new Map();
  const window = {
    STM_PB_URL: "https://pb.example.test",
    localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    console,
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/api\/collections\/([^/]+)\/records(?:\/([^/]+))?/);
      assert.ok(match, "unexpected PocketBase request " + url);
      const table = decodeURIComponent(match[1]);
      const recordId = match[2];
      const method = options.method || "GET";
      if (method === "GET") {
        const all = records[table] || [];
        const page = Number(parsed.searchParams.get("page") || 1);
        const perPage = Number(parsed.searchParams.get("perPage") || 30);
        const start = (page - 1) * perPage;
        const items = all.slice(start, start + perPage);
        return { ok: true, status: 200, json: async () => ({ items, totalItems: all.length, totalPages: Math.ceil(all.length / perPage), page, perPage }) };
      }
      if (method === "POST") return { ok: true, status: 200, json: async () => ({ id: "new-record", ...JSON.parse(options.body) }) };
      if (method === "PATCH") return { ok: true, status: 200, json: async () => ({ id: recordId, ...JSON.parse(options.body) }) };
      if (method === "DELETE") return { ok: true, status: 204, json: async () => ({}) };
      throw new Error("unexpected method " + method);
    }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve("./adapter.js"), "utf8"), { window, URLSearchParams, console });
  return { db: window.STM_DB, calls };
}

(async () => {
  const products = Array.from({ length: 475 }, (_, index) => ({ id: "pb-" + index, supabase_id: "legacy-" + index, name: "Product " + index }));
  const h = createHarness({ products, categories: [{ id: "cat-pb", supabase_id: "42", name: "Pest control", parent_id: 0 }], users: [{ id: "auth-user-id", email: "customer@example.test", role: "customer" }] });

  const ranged = await h.db.from("products").select("id,name").range(225, 249);
  assert.equal(ranged.error, null);
  assert.equal(ranged.data.length, 25);
  assert.equal(ranged.data[0].id, "legacy-225");
  assert.equal(ranged.data[24].id, "legacy-249");
  assert.equal(ranged.count, 475);
  assert.ok(h.calls.some(call => new URL(call.url).searchParams.get("fields").includes("supabase_id")), "select(id,...) must request the mapped legacy ID");

  const limited = await h.db.from("products").select("id,name").limit(250);
  assert.equal(limited.error, null);
  assert.equal(limited.data.length, 250, "limit must span PocketBase pages rather than silently stopping at page one");
  assert.equal(limited.data[249].id, "legacy-249");

  const category = await h.db.from("categories").select("id,name").single();
  assert.equal(category.error, null);
  assert.equal(category.data.id, 42, "legacy numeric category IDs must be restored");
  assert.equal(category.data.parent_id, null, "root category parent_id must map from PocketBase zero to null");

  const user = await h.db.from("users").select("*").eq("id", "auth-user-id").single();
  assert.equal(user.error, null);
  assert.equal(user.data.id, "auth-user-id", "PocketBase auth IDs must not be remapped to supabase_id");
  const userCall = h.calls.find(call => call.url.includes("/users/records?"));
  assert.equal(new URL(userCall.url).searchParams.get("filter"), 'id = "auth-user-id"');

  const multiple = await h.db.from("products").select("*").limit(2).single();
  assert.ok(multiple.error, "single() must reject multiple rows");
  console.log("PocketBase adapter compatibility tests passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
