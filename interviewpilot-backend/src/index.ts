import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { testConnection } from "./config/supabase";

import authRoutes from "./routes/auth.routes";
import applicationsRoutes from "./routes/applications.routes";
import aiRoutes from "./routes/ai.routes";
import extensionRoutes from "./routes/extension.routes";

const app = express();

// ----- CORS -----
// Must explicitly allow the Chrome extension's origin
// (chrome-extension://<id>) in ALLOWED_ORIGINS, or the extension's
// fetch calls to this API will be blocked by the browser.
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" })); // 2mb to comfortably fit scraped JDs/resume text

// ----- Health check -----
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: env.nodeEnv });
});

// ----- Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/extension", extensionRoutes);

// ----- 404 fallback -----
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ----- Global error handler -----
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

async function start() {
  app.listen(env.port, () => {
    console.log(`🚀 InterviewPilot AI backend running on http://localhost:${env.port}`);
  });

  try {
    await testConnection();
  } catch (err) {
    console.error("Supabase connection unavailable; database-backed routes will fail until it recovers:", err);
  }
}

start();
