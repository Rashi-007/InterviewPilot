import type { PlasmoCSConfig } from "plasmo";
import type { JobCapturePayload } from "~lib/types";

// Runs on every LinkedIn jobs page: the full job page (/jobs/view/<id>) AND
// the split view on search / collection pages (?currentJobId=<id>).
export const config: PlasmoCSConfig = {
  matches: ["https://*.linkedin.com/jobs/*"],
  run_at: "document_idle",
};

// The job id appears in the URL in both layouts. We always save the same
// clean address built from it, so each job is stored once and never as
// the search-results URL.
const log = (...a: unknown[]) => console.log("[InterviewPilot]", ...a);
log("content script loaded on", window.location.href);

function jobId(): string | null {
  const u = new URL(window.location.href);
  return (
    u.searchParams.get("currentJobId") ||
    u.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)/)?.[1] ||
    null
  );
}
const canonicalUrl = (id: string) => `https://www.linkedin.com/jobs/view/${id}/`;

// First selector that returns text wins; the later ones are fallbacks for
// when LinkedIn renames its CSS classes.
function firstText(selectors: string[]): string | undefined {
  for (const s of selectors) {
    const t = document.querySelector<HTMLElement>(s)?.innerText?.trim();
    if (t) return t;
  }
  return undefined;
}

function scrape(id: string): JobCapturePayload | null {
  const roleTitle = firstText([
    ".job-details-jobs-unified-top-card__job-title",
    ".top-card-layout__title",
    "h1",
  ]);
  const companyName = firstText([
    ".job-details-jobs-unified-top-card__company-name",
    ".topcard__org-name-link",
    "a[href*='/company/']",
  ]);
  if (!roleTitle || !companyName) return null; // page still rendering

  return {
    role_title: roleTitle,
    company_name: companyName,
    location: firstText([
      ".job-details-jobs-unified-top-card__primary-description-container",
      ".job-details-jobs-unified-top-card__bullet",
      ".topcard__flavor--bullet",
    ]),
    job_description: firstText([
      ".jobs-description__content",
      "#job-details",
      ".description__text",
    ])?.slice(0, 5000),
    job_url: canonicalUrl(id),
    source: "extension_linkedin",
  };
}

let lastCapturedId = "";
let pending = false;

// Called on every page change. When the job id changes we wait ~1.2 s so the
// right-hand panel shows the NEW job before we read it (otherwise we could
// save the previous job's title under the new id).
function check() {
  const id = jobId();
  if (!id || id === lastCapturedId || pending) return;
  pending = true;
  log("job id found:", id, "- waiting for the page to render");
  window.setTimeout(() => {
    pending = false;
    if (jobId() !== id) return; // user already moved on
    const job = scrape(id);
    if (job) log("scraped:", job.role_title, "|", job.company_name);
    else log("scrape found no title/company yet - selectors may not match this page");
    if (!job) return;           // not rendered yet; the observer will retry
    lastCapturedId = id;
    chrome.runtime.sendMessage({ type: "JOB_CAPTURED", payload: job }, (reply) =>
      log("background replied:", JSON.stringify(reply), chrome.runtime.lastError?.message ?? "")
    );
  }, 1200);
}

new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
check();

// --- Easy Apply confirmation -> mark as Applied ---
new MutationObserver(() => {
  const confirmation = document.querySelector(
    "[data-test-modal] h2, .artdeco-inline-feedback--success"
  );
  const id = jobId();
  if (id && confirmation?.textContent?.match(/application (sent|submitted)/i)) {
    chrome.runtime.sendMessage({
      type: "APPLICATION_SUBMITTED",
      payload: { job_url: canonicalUrl(id) },
    });
  }
}).observe(document.body, { childList: true, subtree: true });