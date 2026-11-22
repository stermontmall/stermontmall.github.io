// Entry point: adds POST /ingest (key-protected, for ChatGPT/Claude automation) in front of the existing admin upload handler.
import base from "./index.mjs";
import { ingest } from "./ingest.mjs";

export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (req.method === "POST" && u.pathname === "/ingest") return ingest(req);
    return base.fetch(req);
  },
};
