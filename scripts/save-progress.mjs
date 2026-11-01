import { readFile, writeFile } from "node:fs/promises";

const file = "HANDOFF-live.md";
const required = (process.env.CHECKPOINT_SUMMARY || "").trim();
if (!required) {
  console.error("Missing checkpoint summary. Enter the required Summary field in GitHub Actions.");
  process.exit(1);
}

const clean = (value) => (value || "").trim() || "Not provided";
const now = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Nairobi",
  dateStyle: "medium",
  timeStyle: "medium",
}).format(new Date());

const section = [
  `## PROGRESS CHECKPOINT — ${now} (Africa/Nairobi)`,
  `**Summary:** ${clean(required)}`,
  `**Completed:** ${clean(process.env.CHECKPOINT_COMPLETED)}`,
  `**Next:** ${clean(process.env.CHECKPOINT_NEXT)}`,
  `**Blocked / owner action:** ${clean(process.env.CHECKPOINT_BLOCKED)}`,
  `**Working branch / PR:** ${clean(process.env.CHECKPOINT_BRANCH)}`,
  "",
  "---",
  "",
].join("\n");

let previous;
try {
  previous = await readFile(file, "utf8");
} catch {
  console.error(`Cannot find ${file}; refusing to create a replacement handoff file.`);
  process.exit(1);
}

await writeFile(file, section + previous, "utf8");
console.log("Checkpoint added to the top of HANDOFF-live.md.");
