import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth); // every route below requires a logged-in user

const statusEnum = z.enum(["viewed","applied", "screening", "technical", "hr", "offer", "rejected"]);

const createSchema = z.object({
  company_name: z.string().min(1),
  role_title: z.string().min(1),
  job_description: z.string().optional(),
  job_url: z.string().url().optional(),
  status: statusEnum.optional(),
  applied_date: z.string().optional(), // ISO date
  interview_date: z.string().optional(), // ISO datetime
  location: z.string().optional(),
  salary_range: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/applications — list with filter/sort/search (used by table + kanban views)
router.get("/", async (req, res) => {
  const userId = req.user!.userId;
  const { status, company, search, sortBy = "applied_date", sortDir = "desc" } = req.query;

  let query = supabase.from("applications").select("*").eq("user_id", userId);

  if (status) query = query.eq("status", String(status));
  if (company) query = query.ilike("company_name", `%${company}%`);
  if (search) {
    const q = String(search);
    query = query.or(`company_name.ilike.%${q}%,role_title.ilike.%${q}%`);
  }

  const allowedSort = new Set(["applied_date", "interview_date", "created_at", "company_name"]);
  const sortColumn = allowedSort.has(String(sortBy)) ? String(sortBy) : "applied_date";
  query = query.order(sortColumn, { ascending: sortDir === "asc" });

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/applications/kpis — dashboard KPI cards
// PostgREST's query builder doesn't expose SQL aggregates like FILTER/AVG,
// so we fetch the (small, per-user) rows we need and compute in JS instead.
router.get("/kpis", async (req, res) => {
  const userId = req.user!.userId;

  const { data: apps, error: appsError } = await supabase
    .from("applications")
    .select("status, applied_date")
    .eq("user_id", userId);

  if (appsError) return res.status(500).json({ error: appsError.message });

  const { data: sessions, error: sessionsError } = await supabase
    .from("interview_sessions")
    .select("avg_score")
    .eq("user_id", userId)
    .not("avg_score", "is", null);

  if (sessionsError) return res.status(500).json({ error: sessionsError.message });

  const total = apps?.length || 0;
  const interviews = apps?.filter((a) => a.status !== "applied").length || 0;
  const offers = apps?.filter((a) => a.status === "offer").length || 0;

  const lastApplied = apps?.length
    ? apps.reduce((latest, a) => (a.applied_date > latest ? a.applied_date : latest), apps[0].applied_date)
    : null;

  const daysSinceLastApplication = lastApplied
    ? Math.floor((Date.now() - new Date(lastApplied).getTime()) / 86400000)
    : null;

  const scores = (sessions || []).map((s) => s.avg_score).filter((s): s is number => s !== null);
  const avgScore = scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

  res.json({
    total_applications: total,
    interviews_scheduled: interviews,
    avg_ai_score: avgScore !== null ? avgScore.toFixed(2) : null,
    conversion_rate: total > 0 ? +((offers / total) * 100).toFixed(1) : 0,
    days_since_last_application: daysSinceLastApplication,
  });
});

// GET /api/applications/:id
router.get("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Application not found" });
  res.json(data);
});

// POST /api/applications — manual add (also used internally by extension sync)
router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const d = parsed.data;

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      company_name: d.company_name,
      role_title: d.role_title,
      job_description: d.job_description || null,
      job_url: d.job_url || null,
      status: d.status || "applied",
      applied_date: d.applied_date || new Date().toISOString().slice(0, 10),
      interview_date: d.interview_date || null,
      location: d.location || null,
      salary_range: d.salary_range || null,
      notes: d.notes || null,
    })
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/applications/:id — edit fields, incl. dragging between Kanban columns (status)
router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const { data, error } = await supabase
    .from("applications")
    .update(parsed.data)
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Application not found" });
  res.json(data);
});

// DELETE /api/applications/:id
router.delete("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Application not found" });
  res.status(204).send();
});

export default router;
