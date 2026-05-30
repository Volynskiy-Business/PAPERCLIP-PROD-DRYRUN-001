import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

test("static shell exposes release and readiness identifiers", async () => {
  const html = await readFile(new URL("../src/index.html", import.meta.url), "utf8");

  assert.match(html, /PAPERCLIP-PROD-DRYRUN-001/);
  assert.match(html, /data-release="0\.1\.0"/);
  assert.match(html, /runtime-status/);
});

