import { api, ApiError } from "~lib/api";
import { getToken } from "~lib/storage";
import type { ExtensionMessage, MessageResult } from "~lib/types";

/**
 * Single point of contact with the backend. Content scripts never call
 * the API directly — they just describe what they observed on the page
 * and send it here via chrome.runtime.sendMessage. This keeps the JWT
 * in one place and makes it easy to add retry/queueing later.
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  return true; // keep the message channel open for the async response
});

async function handleMessage(message: ExtensionMessage): Promise<MessageResult> {
  const token = await getToken();
  if (!token) {
    // Not logged in yet — silently drop rather than erroring in the
    // console of whatever page the content script is running on.
    return { ok: false, error: "Not signed in to InterviewPilot AI" };
  }

  try {
    switch (message.type) {
      case "JOB_CAPTURED":
        await api("/extension/job-captured", { method: "POST", body: message.payload });
        await badgePulse("✓");
        return { ok: true };

      case "APPLICATION_SUBMITTED":
        await api("/extension/application-submitted", { method: "POST", body: message.payload });
        await badgePulse("✓");
        return { ok: true };

      case "GMAIL_INTERVIEW_DETECTED":
        await api("/extension/gmail-interview-detected", { method: "POST", body: message.payload });
        await badgePulse("✓");
        return { ok: true };

      default:
        return { ok: false, error: "Unknown message type" };
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && message.type === "APPLICATION_SUBMITTED") {
      // Expected case: form submitted on a page we never scraped a job
      // posting from (e.g. a quick-apply flow). Not worth surfacing as
      // an error badge — just quietly no-op.
      return { ok: false, error: "No matching captured job" };
    }
    await badgePulse("!");
    return { ok: false, error: err instanceof Error ? err.message : "Sync failed" };
  }
}

// Brief colored badge flash on the extension icon so the user gets
// passive confirmation that a capture/sync happened, without a popup
// or notification interrupting whatever they're doing.
async function badgePulse(text: "✓" | "!") {
  const color = text === "✓" ? "#34D399" : "#F76A6A";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
}
