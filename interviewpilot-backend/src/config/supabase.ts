import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "./env";

// IMPORTANT: this uses the service_role key, which bypasses Row Level
// Security entirely. That's intentional — this backend does its own
// auth (JWT) and ownership checks (`.eq("user_id", userId)` on every
// query), so it needs full table access. NEVER ship the service_role
// key to the frontend or browser extension — only the backend holds it.
//
// Why REST instead of a direct Postgres connection: Supabase's REST API
// (PostgREST) runs over plain HTTPS on port 443 — the same port normal
// web traffic uses. Networks that block raw Postgres ports (5432/6543),
// which is common on campus/office WiFi, don't block 443.
export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket as any },
});

export async function testConnection(): Promise<void> {
  const { error } = await supabase.from("users").select("id").limit(1);
  // PGRST116/42P01-style "table not found" still proves the HTTPS connection
  // itself works — only throw on genuine network/auth failures.
  if (error && error.code !== "PGRST116" && !error.message?.includes("does not exist")) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
  console.log("✅ Supabase REST connection OK");
}
