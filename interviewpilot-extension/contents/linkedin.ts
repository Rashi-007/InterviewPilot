import type { PlasmoCSConfig } from "plasmo";
import type { JobCapturePayload } from "~lib/types";

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/jobs/view/*", "https://www.linkedin.com/jobs/collections/*"],
  run_at: "document_idle",
};

// LinkedIn's job view is a single-page app — the URL changes without a
// full reload as the user clicks between listings, so we watch for DOM
// changes rather than only running once on page load.
let lastScrapedUrl = "";

function scrapeLinkedInJob(): JobCapturePayload | null {
  const titleEl = document.querySelector<HTMLElement>(
    ".job-details-jobs-unified-top-card__job-title, .top-card-layout__title"
  );
  const companyEl = document.querySelector<HTMLElement>(
    ".job-details-jobs-unified-top-card__company-name, .topcard__org-name-link"
  );
  const locationEl = document.querySelector<HTMLElement>(
    ".job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet"
  );
  const descriptionEl = document.querySelector<HTMLElement>(
    ".jobs-description__content, .description__text"
  );

  const roleTitle = titleEl?.innerText?.trim();
  const companyName = companyEl?.innerText?.trim();

  if (!roleTitle || !companyName) return null;

  return {
    role_title: roleTitle,
    company_name: companyName,
    location: locationEl?.innerText?.trim(),
    job_description: descriptionEl?.innerText?.trim()?.slice(0, 5000),
    job_url: window.location.href.split("?")[0],
    source: "extension_linkedin",
  };
}

function attemptScrape() {
  const url = window.location.href;
  if (url === lastScrapedUrl) return;

  const job = scrapeLinkedInJob();
  if (!job) return; // page hasn't finished rendering yet — observer will retry

  lastScrapedUrl = url;
  chrome.runtime.sendMessage({ type: "JOB_CAPTURED", payload: job });
}

// LinkedIn renders job details asynchronously after navigation, so a
// MutationObserver catches it reliably instead of guessing a timeout.
const observer = new MutationObserver(() => attemptScrape());
observer.observe(document.body, { childList: true, subtree: true });
attemptScrape();

// --- Apply-button submission detection ---
// LinkedIn's "Easy Apply" flow is a multi-step modal, not a plain form
// submit, so we watch for the modal's final confirmation state instead
// of a `submit` event.
const applyObserver = new MutationObserver(() => {
  const confirmation = document.querySelector(
    "[data-test-modal] h2, .artdeco-inline-feedback--success"
  );
  if (confirmation?.textContent?.match(/application (sent|submitted)/i)) {
    chrome.runtime.sendMessage({
      type: "APPLICATION_SUBMITTED",
      payload: { job_url: window.location.href.split("?")[0] },
    });
  }
});
applyObserver.observe(document.body, { childList: true, subtree: true });
