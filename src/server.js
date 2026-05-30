import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createStore } from "./store.js";

const defaultStore = createStore();

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function text(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function requireAuth(req, apiToken) {
  return req.headers["x-dryrun-token"] === apiToken;
}

function logEvent(eventType, detail) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: "info",
    eventType,
    ...detail
  }));
}

export function createServer({ apiToken, release, store = defaultStore } = {}) {
  const token = apiToken ?? "local-dryrun-token";
  const releaseVersion = release ?? "0.1.0";

  return async function handler(req, res) {
    const url = new URL(req.url ?? "/", "http://dryrun.local");
    const requestId = req.headers["x-request-id"] ?? randomUUID();

    try {
      if (req.method === "GET" && url.pathname === "/healthz") {
        return json(res, 200, { ok: true, release: releaseVersion, requestId });
      }

      if (req.method === "GET" && url.pathname === "/") {
        const html = await readFile(join(process.cwd(), "src", "ui.html"), "utf8");
        return text(res, 200, html.replaceAll("__RELEASE__", releaseVersion), "text/html; charset=utf-8");
      }

      if (req.method === "GET" && url.pathname === "/recruiting/prospects") {
        const html = await readFile(join(process.cwd(), "src", "ui.html"), "utf8");
        return text(res, 200, html.replaceAll("__RELEASE__", releaseVersion), "text/html; charset=utf-8");
      }

      if (url.pathname.startsWith("/api/")) {
        if (!requireAuth(req, token)) {
          return json(res, 401, { error: "unauthorized", requestId });
        }
      }

      if (req.method === "GET" && url.pathname === "/api/prospects") {
        return json(res, 200, { prospects: await store.list(), requestId });
      }

      if (req.method === "POST" && url.pathname === "/api/prospects") {
        const input = await readBody(req);
        const prospect = await store.create({
          name: String(input.name ?? "").trim(),
          source: String(input.source ?? "founder-network").trim(),
          status: "new"
        });
        logEvent("prospect_created", { requestId, actorId: "cto-dryrun", prospectId: prospect.id });
        return json(res, 201, { prospect, requestId });
      }

      const updateMatch = url.pathname.match(/^\/api\/prospects\/([^/]+)$/);
      if (req.method === "PATCH" && updateMatch) {
        const input = await readBody(req);
        const prospect = await store.update(updateMatch[1], {
          status: String(input.status ?? "contacted").trim()
        });
        logEvent("prospect_updated", {
          requestId,
          actorId: "cto-dryrun",
          prospectId: prospect.id,
          nextStatus: prospect.status
        });
        return json(res, 200, { prospect, requestId });
      }

      return json(res, 404, { error: "not_found", requestId });
    } catch (error) {
      return json(res, 500, {
        error: "internal_error",
        message: error instanceof Error ? error.message : "unknown error",
        requestId
      });
    }
  };
}

