import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import {
  AIGeneratedQuestion,
  AIAnswerEvaluation,
  AIJDAnalysis,
  AIPrepPlan,
} from "../types";

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

/**
 * Small helper: asks Gemini to return ONLY JSON, then parses it.
 * Gemini's `responseMimeType: "application/json"` mode keeps it from
 * wrapping the reply in markdown fences, but we strip them anyway as
 * a safety net.
 */
async function askForJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const result = await model.generateContent(userPrompt);
  const raw = result.response.text() || "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Generates a batch of mock-interview questions for a given role.
 * Mixes technical + behavioral unless sessionType narrows it down.
 */
export async function generateInterviewQuestions(
  roleTitle: string,
  sessionType: "technical" | "behavioral" | "mixed",
  count = 5
): Promise<AIGeneratedQuestion[]> {
  const system =
    "You are an expert technical interviewer. Respond ONLY with a JSON object " +
    'shaped like { "questions": [{ "question": string, "type": "technical" | "behavioral" }] }. ' +
    "No extra commentary, no markdown.";

  const user = `Generate ${count} interview questions for a "${roleTitle}" role. ` +
    `Session focus: ${sessionType}. Mix difficulty from easy to challenging.`;

  const result = await askForJSON<{ questions: AIGeneratedQuestion[] }>(system, user);
  return result.questions;
}

/**
 * Scores a candidate's spoken/typed answer 1-5, with feedback and a
 * model answer for comparison.
 */
export async function evaluateAnswer(
  roleTitle: string,
  question: string,
  userAnswer: string
): Promise<AIAnswerEvaluation> {
  const system =
    "You are a strict but encouraging interview coach. Respond ONLY with a JSON " +
    'object shaped like { "score": number (1-5, can be decimal), "feedback": string, ' +
    '"model_answer": string }. No extra commentary, no markdown.';

  const user =
    `Role: ${roleTitle}\nQuestion: ${question}\nCandidate's answer: ${userAnswer}\n\n` +
    "Score the answer from 1 to 5, give 2-3 sentences of specific feedback " +
    "(what was good, what to improve), and provide a strong model answer.";

  return askForJSON<AIAnswerEvaluation>(system, user);
}

/**
 * Extracts key skills from a scraped job description and compares
 * them against the user's resume text to compute a match score.
 */
export async function analyzeJobDescription(
  jobDescription: string,
  resumeText: string | null
): Promise<AIJDAnalysis> {
  const system =
    "You are a technical recruiter. Respond ONLY with a JSON object shaped like " +
    '{ "key_skills": string[], "matched_skills": string[], "missing_skills": string[], ' +
    '"match_percentage": number }. No extra commentary, no markdown.';

  const user = resumeText
    ? `Job description:\n${jobDescription}\n\nCandidate resume:\n${resumeText}\n\n` +
      "Extract the key required skills from the JD, then compare against the resume " +
      "to list matched vs missing skills and an overall match percentage (0-100)."
    : `Job description:\n${jobDescription}\n\n` +
      "Extract the key required skills from this JD. No resume was provided, so " +
      "matched_skills should be an empty array, missing_skills should equal key_skills, " +
      "and match_percentage should be 0.";

  return askForJSON<AIJDAnalysis>(system, user);
}

/**
 * Given a detected interview (from Gmail parsing or manual entry),
 * generates likely questions + prep tips specific to that company/role.
 */
export async function generatePrepPlan(
  companyName: string,
  roleTitle: string,
  jobDescription: string | null
): Promise<AIPrepPlan> {
  const system =
    "You are an interview preparation coach. Respond ONLY with a JSON object shaped " +
    'like { "likely_questions": string[] (5 items), "prep_tips": string[] (4-6 items) }. ' +
    "No extra commentary, no markdown.";

  const user =
    `Company: ${companyName}\nRole: ${roleTitle}\n` +
    (jobDescription ? `Job description:\n${jobDescription}\n\n` : "") +
    "Generate 5 likely interview questions this candidate should prepare for, " +
    "plus 4-6 concrete prep tips (company research angles, skills to brush up, " +
    "questions to ask the interviewer).";

  return askForJSON<AIPrepPlan>(system, user);
}
