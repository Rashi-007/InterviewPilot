import type { PlasmoCSConfig } from "plasmo";
import type { JobCapturePayload } from "~lib/types";

export const config: PlasmoCSConfig = {
  matches: ["https://www.indeed.com/viewjob*", "https://*.indeed.com/viewjob*"],
  run_at: "document_idle",
};

let lastScrapedUrl = "";

function scrapeIndeedJob(): JobCapturePayload | null {
  const titleEl = document.querySelector<HTMLElement>(
    "h1.jobsearch-JobInfoHeader-title, [data-testid='jobsearch-JobInfoHeader-title']"
  );
  const companyEl = document.querySelector<HTMLElement>(
    "[data-testid='inlineHeader-companyName'], .jobsearch-InlineCompanyRating-companyHeader"
  );
  const locationEl = document.querySelector<HTMLElement>(
    "[data-testid='inlineHeader-companyLocation']"
  );
  const descriptionEl = document.querySelector<HTMLElement>("#jobDescriptionText");

  const roleTitle = titleEl?.innerText?.trim();
  const companyName = companyEl?.innerText?.trim();

  if (!roleTitle || !companyName) return null;

  return {
    role_title: roleTitle,
    company_name: companyName,
    location: locationEl?.innerText?.trim(),
    job_description: descriptionEl?.innerText?.trim()?.slice(0, 5000),
    job_url: window.location.href.split("&")[0], // strip Indeed's tracking query params
    source: "extension_indeed",
  };
}

function attemptScrape() {
  const url = window.location.href;
  if (url === lastScrapedUrl) return;

  const job = scrapeIndeedJob();
  if (!job) return;

  lastScrapedUrl = url;
  chrome.runtime.sendMessage({ type: "JOB_CAPTURED", payload: job });
}

const observer = new MutationObserver(() => attemptScrape());
observer.observe(document.body, { childList: true, subtree: true });
attemptScrape();

// --- Application submission detection ---
// Indeed's own "Apply now" flow ends on a page containing a clear
// confirmation heading. External "Apply on company site" clicks aren't
// detectable from here — those get picked up by the generic detector
// content script on the company's own site instead.
function checkForConfirmation() {
  const heading = document.querySelector("h1, h2");
  if (heading?.textContent?.match(/application (submitted|sent)|you('|’)ve applied/i)) {
    chrome.runtime.sendMessage({
      type: "APPLICATION_SUBMITTED",
      payload: { job_url: lastScrapedUrl || window.location.href.split("&")[0] },
    });
  }
}

const confirmObserver = new MutationObserver(checkForConfirmation);
confirmObserver.observe(document.body, { childList: true, subtree: true });
