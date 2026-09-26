import { Application, KPIs, InterviewSession } from "@/types";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const MOCK_APPLICATIONS: Application[] = [
  { id: "m1", company_name: "Google", role_title: "Software Engineer Intern", job_description: "Looking for a Software Engineer Intern with strong JS/TS, React, Node.js and REST API design skills.", job_url: "https://careers.google.com", status: "applied", source: "extension_linkedin", applied_date: daysAgo(21), interview_date: null, location: "Bengaluru, IN", salary_range: null, notes: null, extracted_skills: ["React", "TypeScript", "REST APIs"], created_at: daysAgo(21), updated_at: daysAgo(21) },
  { id: "m2", company_name: "Microsoft", role_title: "Frontend Engineer", job_description: "Frontend Engineer role focused on React, accessibility, and design systems.", job_url: "https://careers.microsoft.com", status: "screening", source: "extension_indeed", applied_date: daysAgo(18), interview_date: daysAgo(-2), location: "Hyderabad, IN", salary_range: null, notes: null, extracted_skills: ["React", "Accessibility", "CSS"], created_at: daysAgo(18), updated_at: daysAgo(18) },
  { id: "m3", company_name: "Stripe", role_title: "Backend Engineer", job_description: "Backend Engineer building payment infrastructure in Node.js and PostgreSQL.", job_url: "https://stripe.com/jobs", status: "technical", source: "manual", applied_date: daysAgo(15), interview_date: daysAgo(-5), location: "Remote", salary_range: null, notes: "Detected from Gmail: technical interview confirmed", extracted_skills: ["Node.js", "PostgreSQL", "System Design"], created_at: daysAgo(15), updated_at: daysAgo(15) },
  { id: "m4", company_name: "Notion", role_title: "Product Engineer", job_description: "Product Engineer working across the full stack on core editor features.", job_url: "https://notion.so/careers", status: "technical", source: "extension_company_site", applied_date: daysAgo(12), interview_date: null, location: "Remote", salary_range: null, notes: null, extracted_skills: ["React", "TypeScript", "Product Sense"], created_at: daysAgo(12), updated_at: daysAgo(12) },
  { id: "m5", company_name: "Figma", role_title: "Full Stack Developer", job_description: "Full Stack Developer for internal tooling and collaboration features.", job_url: "https://figma.com/careers", status: "hr", source: "manual", applied_date: daysAgo(9), interview_date: daysAgo(-1), location: "Remote", salary_range: null, notes: "Detected from Gmail: HR round scheduled", extracted_skills: ["React", "Node.js", "WebSockets"], created_at: daysAgo(9), updated_at: daysAgo(9) },
  { id: "m6", company_name: "Razorpay", role_title: "SDE-1", job_description: "SDE-1 role across payments and merchant dashboard.", job_url: "https://razorpay.com/jobs", status: "offer", source: "extension_linkedin", applied_date: daysAgo(30), interview_date: null, location: "Bengaluru, IN", salary_range: "₹14-18 LPA", notes: null, extracted_skills: ["Node.js", "PostgreSQL", "REST APIs"], created_at: daysAgo(30), updated_at: daysAgo(30) },
  { id: "m7", company_name: "Zomato", role_title: "Software Developer", job_description: "Software Developer for logistics and delivery systems.", job_url: "https://zomato.com/careers", status: "rejected", source: "extension_indeed", applied_date: daysAgo(25), interview_date: null, location: "Gurugram, IN", salary_range: null, notes: null, extracted_skills: ["Java", "Spring Boot"], created_at: daysAgo(25), updated_at: daysAgo(25) },
  { id: "m8", company_name: "Freshworks", role_title: "Associate Software Engineer", job_description: "Associate Software Engineer, full stack team.", job_url: "https://freshworks.com/careers", status: "applied", source: "manual", applied_date: daysAgo(3), interview_date: null, location: "Chennai, IN", salary_range: null, notes: null, extracted_skills: null, created_at: daysAgo(3), updated_at: daysAgo(3) },
];

export const MOCK_KPIS: KPIs = {
  total_applications: MOCK_APPLICATIONS.length,
  interviews_scheduled: MOCK_APPLICATIONS.filter((a) => a.status !== "applied").length,
  avg_ai_score: "4.10",
  conversion_rate: 12.5,
  days_since_last_application: 3,
};

export const MOCK_SESSIONS: InterviewSession[] = [
  { id: "s1", application_id: "m3", role_title: "Backend Engineer", session_type: "technical", avg_score: 4.2, created_at: daysAgo(10) },
  { id: "s2", application_id: "m4", role_title: "Product Engineer", session_type: "mixed", avg_score: 3.6, created_at: daysAgo(7) },
  { id: "s3", application_id: "m5", role_title: "Full Stack Developer", session_type: "behavioral", avg_score: 4.5, created_at: daysAgo(4) },
];
