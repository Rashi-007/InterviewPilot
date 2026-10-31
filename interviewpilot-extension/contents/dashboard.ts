import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: [
    "https://interview-pilot-seven.vercel.app/*",
    "http://localhost:5173/*",
  ],
  run_at: "document_idle",
};

// The dashboard sends a ping after React mounts. Responding to that ping
// avoids a race where the content script loads before the Settings page.
window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  if (event.data?.type !== "INTERVIEWPILOT_EXTENSION_PING") return;

  window.postMessage(
    {
      type: "INTERVIEWPILOT_EXTENSION_PONG",
      extensionId: chrome.runtime.id,
      version: chrome.runtime.getManifest().version,
    },
    window.location.origin
  );
});
