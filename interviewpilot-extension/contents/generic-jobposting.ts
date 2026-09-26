import type { PlasmoCSConfig } from "plasmo";
import type { JobCapturePayload } from "~lib/types";

// Runs on every page, but only acts if it finds schema.org JobPosting
// structured data — the standard most ATS platforms (Greenhouse, Lever,
// Workday, etc.) embed for SEO. This avoids needing per-site CSS
// selectors for every possible "company site" the spec mentions.
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: [
    "https://www.linkedin.com/*",
    "https://*.indeed.com/*",
    "https://mail.google.com/*",
  ],
  run_at: "document_idle",
};

interface JobPostingSchema {
  "@type": string;
  title?: string;
  description?: string;
  hiringOrganization?: { name?: string };
  jobLocation?: { address?: { addressLocality?: string; addressRegion?: string } };
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

function findJobPostingSchema(): JobPostingSchema | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || "");
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const c of candidates) {
        if (c["@type"] === "JobPosting") return c as JobPostingSchema;
        // Some sites nest it under @graph
        if (Array.isArray(c["@graph"])) {
          const found = c["@graph"].find((g: any) => g["@type"] === "JobPosting");
          if (found) return found;
        }
      }
    } catch {
      // Malformed JSON-LD on the page — skip it, not our problem to fix.
    }
  }
  return null;
}

function attemptScrape() {
  const schema = findJobPostingSchema();
  if (!schema || !schema.title || !schema.hiringOrganization?.name) return;

  const location = schema.jobLocation?.address
    ? [schema.jobLocation.address.addressLocality, schema.jobLocation.address.addressRegion]
        .filter(Boolean)
        .join(", ")
    : undefined;

  const payload: JobCapturePayload = {
    role_title: schema.title,
    company_name: schema.hiringOrganization.name,
    job_description: schema.description ? stripHtml(schema.description).slice(0, 5000) : undefined,
    location,
    job_url: window.location.href.split("?")[0],
    source: "extension_company_site",
  };

  chrome.runtime.sendMessage({ type: "JOB_CAPTURED", payload });
}

// JSON-LD is usually present on initial load, but some ATS pages hydrate
// it client-side — a short-lived observer catches that without polling forever.
attemptScrape();
const observer = new MutationObserver(() => attemptScrape());
observer.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(() => observer.disconnect(), 8000);

// --- Generic apply-form submission detection ---
// Heuristic: a <form> submit where the submit button's visible text
// suggests a job application ("Apply", "Submit Application"). This is
// necessarily fuzzier than the LinkedIn/Indeed-specific detectors.
document.addEventListener(
  "submit",
  (e) => {
    const form = e.target as HTMLFormElement;
    const submitBtn = form.querySelector<HTMLElement>("button[type='submit'], input[type='submit']");
    const label = (submitBtn?.textContent || (submitBtn as HTMLInputElement)?.value || "").toLowerCase();

    if (/apply|submit application|send application/.test(label)) {
      chrome.runtime.sendMessage({
        type: "APPLICATION_SUBMITTED",
        payload: { job_url: window.location.href.split("?")[0] },
      });
    }
  },
  true
);
