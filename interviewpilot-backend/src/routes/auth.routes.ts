import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase";
import { hashPassword, comparePassword, signToken } from "../services/auth.service";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, full_name } = parsed.data;

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) return res.status(500).json({ error: lookupError.message });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await hashPassword(password);
  const { data: user, error: insertError } = await supabase
    .from("users")
    .insert({ email, password_hash: passwordHash, full_name: full_name || null })
    .select("id, email, full_name")
    .single();

  if (insertError || !user) {
    return res.status(500).json({ error: insertError?.message || "Failed to create account" });
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
});

// POST /api/auth/login — used by BOTH the web app and the extension popup
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  if (!user || !(await comparePassword(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
});

export default router;
