import type { PlasmoCSConfig } from "plasmo";
import type { GmailInterviewPayload } from "~lib/types";

export const config: PlasmoCSConfig = {
  matches: ["https://mail.google.com/*"],
  run_at: "document_idle",
};

// Gmail is a heavily obfuscated SPA with no stable class names, so this
// targets the semantic bits that stay consistent: the open email's
// subject (h2[data-thread-perm-id] is Gmail's actual subject heading)
// and the sender name in the "from" line.
const INTERVIEW_KEYWORDS =
  /interview (scheduled|confirmed|invitation)|schedule your interview|invite you to interview|upcoming interview/i;

const processedThreads = new Set<string>();

function extractSenderCompany(): string | null {
  // Gmail shows the sender's email domain in the expanded header —
  // "Jane Doe <jane@stripe.com>" — a reasonable proxy for company name
  // when no better signal exists. Falls back gracefully if not found.
  const senderEl = document.querySelector<HTMLElement>("span.gD");
  const email = senderEl?.getAttribute("email");
  if (!email) return null;

  const domain = email.split("@")[1];
  if (!domain) return null;

  // "notifications.stripe.com" -> "Stripe"; skip generic ATS sending domains
  const genericAtsDomains = ["greenhouse.io", "lever.co", "myworkday.com", "icims.com"];
  const rootDomain = domain.split(".").slice(-2).join(".");
  if (genericAtsDomains.includes(rootDomain)) return null;

  const name = domain.split(".")[0].replace(/^(mail|notifications|careers|jobs)$/, "");
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : null;
}

function extractDate(text: string): string | null {
  // Deliberately simple date extraction — catches common phrasings like
  // "on March 14 at 2:00 PM" or "March 14, 2026". A production version
  // would use a proper NLP date parser; this covers the common cases
  // for a demo without adding a heavy dependency to the content script.
  const pattern =
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?(,?\s+\d{4})?/i;

  const match = text.match(pattern);
  if (match) {
    const parsed = new Date(match[0]);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function scanOpenEmail() {
  const subjectEl = document.querySelector<HTMLElement>("h2[data-thread-perm-id], h2.hP");
  const bodyEl = document.querySelector<HTMLElement>(".a3s.aiL, .a3s");

  const subject = subjectEl?.innerText?.trim();
  const threadId = subjectEl?.getAttribute("data-thread-perm-id") || subject;

  if (!subject || !threadId || processedThreads.has(threadId)) return;
  if (!INTERVIEW_KEYWORDS.test(subject) && !INTERVIEW_KEYWORDS.test(bodyEl?.innerText || "")) return;

  const bodyText = bodyEl?.innerText || "";
  const companyName = extractSenderCompany();
  const interviewDate = extractDate(subject) || extractDate(bodyText);

  if (!companyName || !interviewDate) return; // not enough signal to act confidently

  processedThreads.add(threadId);

  const payload: GmailInterviewPayload = {
    company_name: companyName,
    interview_date: interviewDate,
    email_subject: subject,
    email_snippet: bodyText.slice(0, 300),
  };

  chrome.runtime.sendMessage({ type: "GMAIL_INTERVIEW_DETECTED", payload });
}

// Gmail never does full page reloads between emails, so a MutationObserver
// on the message view is the only reliable way to catch "user opened a
// different email" as a distinct event.
const observer = new MutationObserver(() => scanOpenEmail());
observer.observe(document.body, { childList: true, subtree: true });
scanOpenEmail();
