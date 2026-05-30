const release = document.querySelector("[data-release]")?.dataset.release ?? "unknown";
const releaseNode = document.querySelector("#release-version");
const statusNode = document.querySelector("#runtime-status");

if (releaseNode) {
  releaseNode.textContent = release;
}

if (statusNode) {
  statusNode.textContent = "ready";
}

window.__PAPERCLIP_DRYRUN__ = {
  release,
  status: "ready"
};

