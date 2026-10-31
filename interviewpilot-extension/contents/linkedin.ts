import type { PlasmoCSConfig } from "plasmo";
import type { JobCapturePayload } from "~lib/types";

export const config: PlasmoCSConfig = {
  // LinkedIn uses both /jobs/view/<id>/ and /jobs/search-results/?currentJobId=<id>.
  matches: [
    "https://www.linkedin.com/jobs/view/*",
    "https://www.linkedin.com/jobs/collections/*",
    "https://www.linkedin.com/jobs/search-results/*",
  ],
  run_at: "document_idle",
};

let lastScrapedUrl = "";
let lastSubmittedUrl = "";

function getCanonicalJobUrl(): string {
  const current = new URL(window.location.href);
  const queryJobId = current.searchParams.get("currentJobId");
  const pathJobId = current.pathname.match(/\/jobs\/view\/(\d+)/)?.[1];
  const selectedCardJobId = document
    .querySelector<HTMLElement>("[data-job-id].jobs-search-results__list-item--active, [data-job-id][aria-current='true']")
    ?.dataset.jobId;
  const jobId = queryJobId || pathJobId || selectedCardJobId;

  if (jobId) return `https://www.linkedin.com/jobs/view/${encodeURIComponent(jobId)}/`;
  return `${current.origin}${current.pathname}`;
}

function scrapeLinkedInJob(): JobCapturePayload | null {
  const titleEl = document.querySelector<HTMLElement>(
    ".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .top-card-layout__title, h1.t-24"
  );
  const companyEl = document.querySelector<HTMLElement>(
    ".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .topcard__org-name-link, .job-details-jobs-unified-top-card__primary-description a"
  );
  const locationEl = document.querySelector<HTMLElement>(
    ".job-details-jobs-unified-top-card__tertiary-description-container, .jobs-unified-top-card__bullet, .topcard__flavor--bullet"
  );
  const descriptionEl = document.querySelector<HTMLElement>(
    ".jobs-description__content, .jobs-box__html-content, .description__text"
  );

  const roleTitle = titleEl?.innerText?.trim();
  const companyName = companyEl?.innerText?.trim();
  if (!roleTitle || !companyName) return null;

  return {
    role_title: roleTitle,
    company_name: companyName,
    location: locationEl?.innerText?.trim(),
    job_description: descriptionEl?.innerText?.trim()?.slice(0, 5000),
    job_url: getCanonicalJobUrl(),
    source: "extension_linkedin",
  };
}

function attemptScrape() {
  const job = scrapeLinkedInJob();
  if (!job || job.job_url === lastScrapedUrl) return;

  lastScrapedUrl = job.job_url;
  chrome.runtime.sendMessage({ type: "JOB_CAPTURED", payload: job }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("[InterviewPilot] LinkedIn capture message failed:", chrome.runtime.lastError.message);
      return;
    }
    if (!response?.ok) console.warn("[InterviewPilot] LinkedIn job was not synced:", response?.error || "Unknown error");
  });
}

// LinkedIn is a SPA: observe content changes and also check URL changes that
// can happen without a full navigation or a meaningful DOM mutation.
const observer = new MutationObserver(attemptScrape);
if (document.body) observer.observe(document.body, { childList: true, subtree: true });
attemptScrape();
window.setInterval(attemptScrape, 1000);

// Detect LinkedIn Easy Apply's final confirmation state once per job.
const applyObserver = new MutationObserver(() => {
  const confirmation = document.querySelector(
    "[data-test-modal] h2, .artdeco-inline-feedback--success"
  );
  const text = confirmation?.textContent || "";
  const jobUrl = getCanonicalJobUrl();
  if (text.match(/application (sent|submitted)/i) && jobUrl !== lastSubmittedUrl) {
    lastSubmittedUrl = jobUrl;
    chrome.runtime.sendMessage({
      type: "APPLICATION_SUBMITTED",
      payload: { job_url: jobUrl },
    });
  }
});
if (document.body) applyObserver.observe(document.body, { childList: true, subtree: true });
