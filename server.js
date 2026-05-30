import http from "node:http";
import { createServer } from "./src/server.js";

const port = Number.parseInt(process.env.PORT ?? "45129", 10);
const server = http.createServer(createServer({
  apiToken: process.env.DRYRUN_API_TOKEN ?? "local-dryrun-token",
  release: process.env.RELEASE_VERSION ?? "0.1.0"
}));

server.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: "info",
    eventType: "server_started",
    port,
    release: process.env.RELEASE_VERSION ?? "0.1.0"
  }));
});
