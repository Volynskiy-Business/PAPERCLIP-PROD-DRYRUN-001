import { spawn } from "node:child_process";

const port = 45129;
const token = "local-dryrun-token";
const server = spawn(process.execPath, ["server.js"], {
  env: {
    ...process.env,
    PORT: String(port),
    DRYRUN_API_TOKEN: token,
    RELEASE_VERSION: "0.1.0"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));

async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("local server did not become healthy");
}

try {
  await waitForHealth();
  const create = await fetch(`http://127.0.0.1:${port}/api/prospects`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dryrun-token": token
    },
    body: JSON.stringify({ name: "Local Smoke Candidate" })
  });
  if (create.status !== 201) {
    throw new Error(`expected create 201, got ${create.status}`);
  }
  console.log("Local smoke passed");
} finally {
  server.kill("SIGTERM");
}

