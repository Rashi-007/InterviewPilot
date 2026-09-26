/**
 * Seeds the database with a demo user + realistic dummy data:
 * - 8 job applications across every Kanban status
 * - 3 mock interview sessions with AI-style feedback
 * - 2 extension_sync_log rows simulating Gmail-detected interviews
 * - 1 sample resume attached to the demo user
 *
 * Run with: npm run seed
 * Demo login: demo@interviewpilot.ai / demo1234
 */
import { supabase } from "../config/supabase";
import { hashPassword } from "../services/auth.service";

const SAMPLE_RESUME = `Priya Sharma
Full-Stack Developer

SKILLS: React, TypeScript, Node.js, Express, PostgreSQL, REST APIs, Git,
Tailwind CSS, basic AWS (S3, EC2), Python (scripting), Agile/Scrum.

EXPERIENCE
Software Engineer Intern — Zeta Labs (2024-2025)
- Built internal dashboard features in React + TypeScript
- Wrote REST endpoints in Node/Express backed by PostgreSQL
- Collaborated with design on a component library using Tailwind CSS

PROJECTS
- Campus Marketplace: full-stack app (React, Express, Postgres) for
  student buy/sell listings with auth and image uploads.
- Weather CLI: Python tool that fetches and caches forecast data.

EDUCATION
B.Tech, Computer Science — final year`;

function daysAgoDate(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

async function seed() {
  console.log("🌱 Seeding database...");

  const passwordHash = await hashPassword("demo1234");

  // Upsert the demo user by email so this script is safely re-runnable.
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", "demo@interviewpilot.ai")
    .maybeSingle();

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    await supabase.from("users").update({ resume_text: SAMPLE_RESUME }).eq("id", userId);
  } else {
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: "demo@interviewpilot.ai",
        password_hash: passwordHash,
        full_name: "Priya Sharma",
        resume_text: SAMPLE_RESUME,
      })
      .select("id")
      .single();

    if (error || !newUser) throw new Error(error?.message || "Failed to create demo user");
    userId = newUser.id;
  }

  // Clear old demo data so seed is re-runnable without duplicates.
  await supabase.from("extension_sync_log").delete().eq("user_id", userId);
  await supabase.from("interview_sessions").delete().eq("user_id", userId);
  await supabase.from("applications").delete().eq("user_id", userId);

  const applications = [
    { company_name: "Google", role_title: "Software Engineer Intern", status: "applied", source: "extension_linkedin", days_ago: 21 },
    { company_name: "Microsoft", role_title: "Frontend Engineer", status: "screening", source: "extension_indeed", days_ago: 18 },
    { company_name: "Stripe", role_title: "Backend Engineer", status: "technical", source: "manual", days_ago: 15 },
    { company_name: "Notion", role_title: "Product Engineer", status: "technical", source: "extension_company_site", days_ago: 12 },
    { company_name: "Figma", role_title: "Full Stack Developer", status: "hr", source: "manual", days_ago: 9 },
    { company_name: "Razorpay", role_title: "SDE-1", status: "offer", source: "extension_linkedin", days_ago: 30 },
    { company_name: "Zomato", role_title: "Software Developer", status: "rejected", source: "extension_indeed", days_ago: 25 },
    { company_name: "Freshworks", role_title: "Associate Software Engineer", status: "applied", source: "manual", days_ago: 3 },
  ] as const;

  const { data: insertedApps, error: appsError } = await supabase
    .from("applications")
    .insert(
      applications.map((app) => ({
        user_id: userId,
        company_name: app.company_name,
        role_title: app.role_title,
        job_description: `We are looking for a ${app.role_title} with strong skills in JavaScript/TypeScript, React, Node.js, and REST API design. Experience with PostgreSQL and cloud deployment is a plus.`,
        status: app.status,
        source: app.source,
        applied_date: daysAgoDate(app.days_ago),
      }))
    )
    .select("id, company_name, role_title");

  if (appsError || !insertedApps) throw new Error(appsError?.message || "Failed to seed applications");

  // Match seeded rows back up by company name (insert order isn't guaranteed).
  const findApp = (company: string) => insertedApps.find((a) => a.company_name === company)!;

  // ---- Mock interview sessions with feedback ----
  const sessionsData = [
    { app: findApp("Stripe"), role: "Backend Engineer", type: "technical", score: 4.2 },
    { app: findApp("Notion"), role: "Product Engineer", type: "mixed", score: 3.6 },
    { app: findApp("Figma"), role: "Full Stack Developer", type: "behavioral", score: 4.5 },
  ] as const;

  for (const s of sessionsData) {
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: userId,
        application_id: s.app.id,
        role_title: s.role,
        session_type: s.type,
        avg_score: s.score,
      })
      .select("id")
      .single();

    if (sessionError || !session) throw new Error(sessionError?.message || "Failed to seed session");

    await supabase.from("interview_qa").insert({
      session_id: session.id,
      question: `Explain how you would design a REST API for the ${s.role} role's core feature.`,
      question_type: "technical",
      user_answer:
        "I'd start with resource-based routes, use proper HTTP verbs, add pagination for list endpoints, and validate input with a schema library.",
      ai_score: s.score,
      ai_feedback:
        "Solid structural answer covering routing and validation. Could go deeper on error handling conventions and versioning strategy.",
      model_answer:
        "A strong answer covers: resource-oriented URL design, consistent status codes, input validation (e.g. with Zod), pagination/filtering, versioning (e.g. /v1/), and clear error response shapes.",
    });
  }

  // ---- Simulated Gmail interview detections (extension sync log) ----
  const stripeApp = findApp("Stripe");
  const figmaApp = findApp("Figma");

  await supabase.from("extension_sync_log").insert([
    {
      user_id: userId,
      event_type: "gmail_interview_detected",
      payload: {
        company_name: "Stripe",
        email_subject: "Your technical interview with Stripe is confirmed",
        email_snippet: "We're excited to move forward — your technical interview is scheduled for next week.",
        interview_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      },
      application_id: stripeApp.id,
    },
    {
      user_id: userId,
      event_type: "gmail_interview_detected",
      payload: {
        company_name: "Figma",
        email_subject: "Interview scheduled: Figma HR round",
        email_snippet: "Looking forward to speaking with you about the Full Stack Developer role.",
        interview_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      },
      application_id: figmaApp.id,
    },
  ]);

  console.log("✅ Seed complete!");
  console.log("   Demo login: demo@interviewpilot.ai / demo1234");
  console.log(`   ${insertedApps.length} applications, ${sessionsData.length} mock interview sessions seeded.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
