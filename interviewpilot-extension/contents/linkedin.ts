import type { PlasmoCSConfig } from "plasmo";
import type { JobCapturePayload } from "~lib/types";

// Runs on every LinkedIn jobs page: the full job page (/jobs/view/<id>) AND
// the split view on search / collection pages (?currentJobId=<id>).
export const config: PlasmoCSConfig = {
  matches: ["https://*.linkedin.com/jobs/*"],
  run_at: "document_idle",
};

const log = (...a: unknown[]) => console.log("[InterviewPilot]", ...a);
log("content script loaded on", window.location.href);

// The job id appears in the URL in both layouts. We always save the same
// clean address built from it, so each job is stored once.
function jobId(): string | null {
  const u = new URL(window.location.href);
  return (
    u.searchParams.get("currentJobId") ||
    u.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)/)?.[1] ||
    null
  );
}
const canonicalUrl = (id: string) => `https://www.linkedin.com/jobs/view/${id}/`;

// ---------- small helpers ----------
const visibleText = (el: Element | null | undefined): string | undefined =>
  (el as HTMLElement | null | undefined)?.innerText?.trim() || undefined;
const firstLine = (s: string) => s.split("\n")[0].trim();

// Full text of the first selector match that actually has text.
function textOf(selectors: string[]): string | undefined {
  for (const s of selectors) {
    for (const el of Array.from(document.querySelectorAll(s))) {
      const t = visibleText(el);
      if (t) return t;
    }
  }
  return undefined;
}

// LinkedIn formats the tab title of a full job page as
// "Job title | Company | LinkedIn" (sometimes prefixed with "(2) ").
function fromPageTitle(): { title: string; company: string } | undefined {
  if (!/\/jobs\/view\//.test(window.location.pathname)) return undefined;
  const parts = document.title.replace(/^\(\d+\)\s*/, "").split(" | ").map((p) => p.trim());
  return parts.length >= 3 ? { title: parts[0], company: parts[1] } : undefined;
}

function findTitle(id: string): string | undefined {
  const known = textOf([
    ".job-details-jobs-unified-top-card__job-title",
    ".top-card-layout__title",
    "h1",
  ]);
  if (known) return firstLine(known);
  // The job title is usually a link to this same job.
  for (const a of Array.from(document.querySelectorAll(`a[href*="/jobs/view/${id}"]`))) {
    const t = visibleText(a);
    if (t && t.length > 3) return firstLine(t);
  }
  return fromPageTitle()?.title;
}

function findCompany(): string | undefined {
  const known = textOf([
    ".job-details-jobs-unified-top-card__company-name",
    ".topcard__org-name-link",
  ]);
  if (known) return firstLine(known);
  // The first company link is often only the logo (no text), so take the
  // first one that has a name.
  for (const a of Array.from(document.querySelectorAll("a[href*='/company/']"))) {
    const t = visibleText(a);
    if (t) return firstLine(t);
  }
  return fromPageTitle()?.company;
}

// e.g. "Panchkula, Haryana, India · 1 week ago · 75 people clicked apply"
function findLocation(): string | undefined {
  const known = textOf([
    ".job-details-jobs-unified-top-card__primary-description-container",
    ".job-details-jobs-unified-top-card__bullet",
    ".topcard__flavor--bullet",
  ]);
  if (known) return firstLine(known).split("·")[0].trim();
  for (const el of Array.from(document.querySelectorAll("p, span"))) {
    const t = visibleText(el);
    if (el.childElementCount === 0 && t && t.length < 160 && t.includes("·") && /ago|applicant|clicked apply/i.test(t)) {
      return t.split("·")[0].trim();
    }
  }
  return undefined;
}

function findDescription(): string | undefined {
  const known = textOf([".jobs-description__content", "#job-details", ".description__text"]);
  if (known) return known.slice(0, 5000);
  // Find the "About the job" heading, then climb to the block that holds the text.
  const heading = Array.from(document.querySelectorAll("h1, h2, h3, h4, p, span")).find(
    (e) => e.childElementCount === 0 && visibleText(e)?.toLowerCase() === "about the job"
  );
  let node = heading?.parentElement as HTMLElement | null | undefined;
  while (node && (node.innerText?.length ?? 0) < 300) node = node.parentElement;
  const text = node?.innerText?.replace(/^\s*About the job\s*/i, "").trim();
  return text ? text.slice(0, 5000) : undefined;
}

function scrape(id: string): JobCapturePayload | null {
  const roleTitle = findTitle(id);
  const companyName = findCompany();
  if (!roleTitle || !companyName) return null; // page still rendering

  return {
    role_title: roleTitle,
    company_name: companyName,
    location: findLocation(),
    job_description: findDescription(),
    job_url: canonicalUrl(id),
    source: "extension_linkedin",
  };
}

let lastCapturedId = "";
let pending = false;

// Called on every page change. When the job id changes we wait ~1.2 s so the
// page shows the NEW job before we read it.
function check() {
  const id = jobId();
  if (!id || id === lastCapturedId || pending) return;
  pending = true;
  log("job id found:", id, "- waiting for the page to render");
  window.setTimeout(() => {
    pending = false;
    if (jobId() !== id) return; // user already moved on
    const job = scrape(id);
    if (job) log("scraped:", job.role_title, "|", job.company_name, "|", job.location ?? "no location");
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