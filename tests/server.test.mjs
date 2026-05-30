import http from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";
import { createStore } from "../src/store.js";

const token = "test-token";

async function withServer(fn) {
  const server = http.createServer(createServer({
    apiToken: token,
    release: "0.1.0",
    store: createStore()
  }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("health and UI routes expose staged release", async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).release, "0.1.0");

    const ui = await fetch(`${baseUrl}/recruiting/prospects`);
    assert.equal(ui.status, 200);
    assert.match(await ui.text(), /Recruiting prospect slice is staged/);
  });
});

test("rejects unauthenticated API requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/prospects`);
    assert.equal(response.status, 401);
  });
});

test("creates, lists, and updates prospects with audit events", async () => {
  await withServer(async (baseUrl) => {
    const create = await fetch(`${baseUrl}/api/prospects`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dryrun-token": token
      },
      body: JSON.stringify({ name: "Founding Engineer Candidate", source: "founder-network" })
    });
    assert.equal(create.status, 201);
    const { prospect } = await create.json();
    assert.equal(prospect.status, "new");
    assert.equal(prospect.auditEvents.length, 1);

    const update = await fetch(`${baseUrl}/api/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-dryrun-token": token
      },
      body: JSON.stringify({ status: "contacted" })
    });
    assert.equal(update.status, 200);
    const updated = await update.json();
    assert.equal(updated.prospect.status, "contacted");
    assert.equal(updated.prospect.auditEvents.length, 2);

    const list = await fetch(`${baseUrl}/api/prospects`, {
      headers: { "x-dryrun-token": token }
    });
    assert.equal(list.status, 200);
    assert.equal((await list.json()).prospects.length, 1);
  });
});

