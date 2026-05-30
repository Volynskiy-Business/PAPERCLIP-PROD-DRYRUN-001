import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const requiredFiles = ["index.html", "styles.css", "app.js"];

for (const file of requiredFiles) {
  const fileStat = await stat(join(dist, file));
  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`Invalid build artifact: ${file}`);
  }
}

const html = await readFile(join(dist, "index.html"), "utf8");

if (!html.includes("PAPERCLIP-PROD-DRYRUN-001")) {
  throw new Error("Missing dry-run identifier in built HTML");
}

if (!html.includes('data-release="0.1.0"')) {
  throw new Error("Built HTML does not expose expected release version");
}

console.log("Build artifact verification passed");

