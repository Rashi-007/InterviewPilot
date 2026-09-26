import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase";
import { requireAuth } from "../middleware/auth";
import {
  generateInterviewQuestions,
  evaluateAnswer,
  analyzeJobDescription,
  generatePrepPlan,
} from "../services/ai.service";
// import { InterviewQA } from "../types";

const router = Router();
router.use(requireAuth);

// ---------------------------------------------------------
// POST /api/ai/mock-interview/start
// Creates a session + generates the first batch of questions.
// ---------------------------------------------------------
const startSchema = z.object({
  role_title: z.string().min(1),
  application_id: z.string().uuid().optional(),
  session_type: z.enum(["technical", "behavioral", "mixed"]).default("mixed"),
  question_count: z.number().int().min(1).max(10).default(5),
});

router.post("/mock-interview/start", async (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const { role_title, application_id, session_type, question_count } = parsed.data;

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: userId,
      application_id: application_id || null,
      role_title,
      session_type,
    })
    .select("*")
    .single();

  if (sessionError || !session) {
    return res.status(500).json({ error: sessionError?.message || "Failed to start session" });
  }

  const questions = await generateInterviewQuestions(role_title, session_type, question_count);

  const { data: insertedQuestions, error: qaError } = await supabase
    .from("interview_qa")
    .insert(
      questions.map((q) => ({
        session_id: session.id,
        question: q.question,
        question_type: q.type,
      }))
    )
    .select("*");

  if (qaError) return res.status(500).json({ error: qaError.message });

  res.status(201).json({ session, questions: insertedQuestions });
});

// ---------------------------------------------------------
// POST /api/ai/mock-interview/:qaId/answer
// Submits the user's answer for one question, gets AI score + feedback.
// ---------------------------------------------------------
const answerSchema = z.object({ answer: z.string().min(1) });

router.post("/mock-interview/:qaId/answer", async (req, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;

  // No JOIN support over REST, so this is two steps: fetch the QA row,
  // then confirm its parent session belongs to this user.
  const { data: qa, error: qaLookupError } = await supabase
    .from("interview_qa")
    .select("*")
    .eq("id", req.params.qaId)
    .maybeSingle();

  if (qaLookupError) return res.status(500).json({ error: qaLookupError.message });
  if (!qa) return res.status(404).json({ error: "Question not found" });

  const { data: session, error: sessionLookupError } = await supabase
    .from("interview_sessions")
    .select("role_title, user_id")
    .eq("id", qa.session_id)
    .maybeSingle();

  if (sessionLookupError) return res.status(500).json({ error: sessionLookupError.message });
  if (!session || session.user_id !== userId) {
    return res.status(404).json({ error: "Question not found" });
  }

  const evaluation = await evaluateAnswer(session.role_title, qa.question, parsed.data.answer);

  const { data: updated, error: updateError } = await supabase
    .from("interview_qa")
    .update({
      user_answer: parsed.data.answer,
      ai_score: evaluation.score,
      ai_feedback: evaluation.feedback,
      model_answer: evaluation.model_answer,
    })
    .eq("id", qa.id)
    .select("*")
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json(updated);
});

// ---------------------------------------------------------
// POST /api/ai/mock-interview/:sessionId/finish
// Averages scores across the session's questions.
// ---------------------------------------------------------
router.post("/mock-interview/:sessionId/finish", async (req, res) => {
  const userId = req.user!.userId;

  const { data: qas, error: qaError } = await supabase
    .from("interview_qa")
    .select("ai_score")
    .eq("session_id", req.params.sessionId)
    .not("ai_score", "is", null);

  if (qaError) return res.status(500).json({ error: qaError.message });

  const scores = (qas || [])
  .map((q: { ai_score: number | null }) => q.ai_score)
  .filter((s): s is number => s !== null);
  const avgScore = scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

  const { data: updated, error: updateError } = await supabase
    .from("interview_sessions")
    .update({ avg_score: avgScore })
    .eq("id", req.params.sessionId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updateError) return res.status(500).json({ error: updateError.message });
  if (!updated) return res.status(404).json({ error: "Session not found" });

  res.json(updated);
});

// ---------------------------------------------------------
// POST /api/ai/analyze-jd
// Extracts skills from a JD and matches against the user's resume.
// ---------------------------------------------------------
const analyzeSchema = z.object({
  application_id: z.string().uuid(),
});

router.post("/analyze-jd", async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", parsed.data.application_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (appError) return res.status(500).json({ error: appError.message });
  if (!application) return res.status(404).json({ error: "Application not found" });

  if (!application.job_description) {
    return res.status(400).json({ error: "This application has no job description to analyze" });
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("resume_text")
    .eq("id", userId)
    .maybeSingle();

  if (userError) return res.status(500).json({ error: userError.message });

  const analysis = await analyzeJobDescription(application.job_description, userRow?.resume_text || null);

  await supabase
    .from("applications")
    .update({ extracted_skills: analysis.key_skills })
    .eq("id", application.id);

  res.json(analysis);
});

// ---------------------------------------------------------
// POST /api/ai/prep-plan
// Generates likely questions + tips for an upcoming interview.
// Triggered manually, or automatically after the extension detects
// a Gmail interview email (see extension.routes.ts).
// ---------------------------------------------------------
const prepPlanSchema = z.object({ application_id: z.string().uuid() });

router.post("/prep-plan", async (req, res) => {
  const parsed = prepPlanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", parsed.data.application_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (appError) return res.status(500).json({ error: appError.message });
  if (!application) return res.status(404).json({ error: "Application not found" });

  const plan = await generatePrepPlan(
    application.company_name,
    application.role_title,
    application.job_description
  );

  res.json(plan);
});

export default router;
