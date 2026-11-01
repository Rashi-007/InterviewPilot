import type { PlasmoCSConfig } from "plasmo";
import type { JobCapturePayload } from "~lib/types";

// Runs on all Indeed pages (including in.indeed.com). It only captures when
// a job is actually open: either a /viewjob page (?jk=<id>) or the split
// view on search pages (?vjk=<id>).
export const config: PlasmoCSConfig = {
  matches: ["https://*.indeed.com/*"],
  run_at: "document_idle",
};

const log = (...a: unknown[]) => console.log("[InterviewPilot]", ...a);
log("content script loaded on", window.location.href);

function jobKey(): string | null {
  const u = new URL(window.location.href);
  return u.searchParams.get("jk") || u.searchParams.get("vjk");
}
// Same clean address whichever layout the job was opened from.
const canonicalUrl = (key: string) => `${window.location.origin}/viewjob?jk=${key}`;

function firstText(selectors: string[]): string | undefined {
  for (const s of selectors) {
    const t = document.querySelector<HTMLElement>(s)?.innerText?.trim();
    if (t) return t;
  }
  return undefined;
}

function scrape(key: string): JobCapturePayload | null {
  const roleTitle = firstText([
    "h1.jobsearch-JobInfoHeader-title",
    "[data-testid='jobsearch-JobInfoHeader-title']",
    "h1",
  ]);
  const companyName = firstText([
    "[data-testid='inlineHeader-companyName']",
    "[data-company-name='true']",
    ".jobsearch-InlineCompanyRating-companyHeader",
  ]);
  if (!roleTitle || !companyName) return null;

  return {
    role_title: roleTitle,
    company_name: companyName,
    location: firstText([
      "[data-testid='inlineHeader-companyLocation']",
      "[data-testid='job-location']",
    ]),
    job_description: firstText(["#jobDescriptionText"])?.slice(0, 5000),
    job_url: canonicalUrl(key),
    source: "extension_indeed",
  };
}

let lastCapturedKey = "";
let pending = false;

function check() {
  const key = jobKey();
  if (!key || key === lastCapturedKey || pending) return;
  pending = true;
  log("job id found:", key, "- waiting for the page to render");
  window.setTimeout(() => {
    pending = false;
    if (jobKey() !== key) return;
    const job = scrape(key);
    if (job) log("scraped:", job.role_title, "|", job.company_name);
    else log("scrape found no title/company yet - selectors may not match this page");
    if (!job) return;
    lastCapturedKey = key;
    chrome.runtime.sendMessage({ type: "JOB_CAPTURED", payload: job }, (reply) =>
      log("background replied:", JSON.stringify(reply), chrome.runtime.lastError?.message ?? "")
    );
  }, 1200);
}

new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
check();

// --- Application confirmation -> mark as Applied ---
new MutationObserver(() => {
  const heading = document.querySelector("h1, h2");
  if (heading?.textContent?.match(/application (submitted|sent)|you('|’)ve applied/i)) {
    const key = lastCapturedKey || jobKey();
    if (key) {
      chrome.runtime.sendMessage({
        type: "APPLICATION_SUBMITTED",
        payload: { job_url: canonicalUrl(key) },
      });
    }
  }
}).observe(document.body, { childList: true, subtree: true });