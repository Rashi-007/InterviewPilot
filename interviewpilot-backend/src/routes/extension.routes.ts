import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ---------------------------------------------------------
// POST /api/extension/job-captured
// Called by the content script when it scrapes a job posting
// (LinkedIn / Indeed / company site). Creates a draft application;
// the "Applied" status flips on submission detection below.
// ---------------------------------------------------------
const jobCapturedSchema = z.object({
  company_name: z.string().min(1),
  role_title: z.string().min(1),
  job_description: z.string().optional(),
  job_url: z.string().url(),
  location: z.string().optional(),
  source: z.enum(["extension_linkedin", "extension_indeed", "extension_company_site"]),
});

router.post("/job-captured", async (req, res) => {
  const parsed = jobCapturedSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const d = parsed.data;

  // Avoid duplicate captures of the same job URL for this user.
  const { data: existing, error: lookupError } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .eq("job_url", d.job_url)
    .maybeSingle();

  if (lookupError) return res.status(500).json({ error: lookupError.message });

  let application = existing;
  if (!application) {
    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        company_name: d.company_name,
        role_title: d.role_title,
        job_description: d.job_description || null,
        job_url: d.job_url,
        location: d.location || null,
        source: d.source,
        status: "viewed",
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      return res.status(500).json({ error: insertError?.message || "Failed to save captured job" });
    }
    application = inserted;
  }

  await supabase.from("extension_sync_log").insert({
    user_id: userId,
    event_type: "job_captured",
    payload: d,
    application_id: application.id,
  });

  res.status(201).json({ application, message: "Job captured" });
});

// ---------------------------------------------------------
// POST /api/extension/application-submitted
// Called when the content script detects a job application form
// submission (e.g. "Apply" button clicked + confirmation page seen).
// ---------------------------------------------------------
const submittedSchema = z.object({
  job_url: z.string().url(),
});

router.post("/application-submitted", async (req, res) => {
  const parsed = submittedSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update({ status: "applied", applied_date: new Date().toISOString().slice(0, 10) })
    .eq("user_id", userId)
    .eq("job_url", parsed.data.job_url)
    .select("*")
    .maybeSingle();

  if (updateError) return res.status(500).json({ error: updateError.message });
  if (!updated) {
    return res.status(404).json({
      error: "No captured job found for this URL — the content script may not have scraped it first.",
    });
  }

  await supabase.from("extension_sync_log").insert({
    user_id: userId,
    event_type: "application_submitted",
    payload: parsed.data,
    application_id: updated.id,
  });

  res.json({ application: updated, message: "Marked as applied" });
});

// ---------------------------------------------------------
// POST /api/extension/gmail-interview-detected
// Called by the background worker after it parses a Gmail message
// that looks like an interview invite (regex/keyword match done on
// the extension side, e.g. "interview", "scheduled", a date/time).
// Links to an existing application by company name if possible,
// otherwise creates a new one.
// ---------------------------------------------------------
const gmailSchema = z.object({
  company_name: z.string().min(1),
  role_title: z.string().optional(),
  interview_date: z.string(), // ISO datetime, parsed by extension from email text
  email_subject: z.string().optional(),
  email_snippet: z.string().optional(),
});

router.post("/gmail-interview-detected", async (req, res) => {
  const parsed = gmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const d = parsed.data;

  const { data: existing, error: lookupError } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .ilike("company_name", d.company_name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) return res.status(500).json({ error: lookupError.message });

  let application = existing;
  if (application) {
    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({ interview_date: d.interview_date, status: "screening" })
      .eq("id", application.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return res.status(500).json({ error: updateError?.message || "Failed to update application" });
    }
    application = updated;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        company_name: d.company_name,
        role_title: d.role_title || "Unknown role",
        interview_date: d.interview_date,
        source: "extension_gmail",
        status: "screening",
        notes: d.email_snippet ? `Detected from Gmail: "${d.email_snippet}"` : null,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      return res.status(500).json({ error: insertError?.message || "Failed to create application" });
    }
    application = inserted;
  }

  await supabase.from("extension_sync_log").insert({
    user_id: userId,
    event_type: "gmail_interview_detected",
    payload: d,
    application_id: application.id,
  });

  res.status(201).json({ application, message: "Interview synced from Gmail" });
});

// ---------------------------------------------------------
// GET /api/extension/sync-status
// Powers the extension popup's "last synced" indicator.
// ---------------------------------------------------------
router.get("/sync-status", async (req, res) => {
  const userId = req.user!.userId;

  const { data, error } = await supabase
    .from("extension_sync_log")
    .select("event_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    last_sync: data || null,
    connected: true,
  });
});

export default router;
