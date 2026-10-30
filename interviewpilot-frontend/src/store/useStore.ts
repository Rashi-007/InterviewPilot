import { create } from "zustand";
import { Application, KPIs, ApplicationStatus } from "@/types";
import { api, hasToken } from "@/lib/api";
import { MOCK_APPLICATIONS, MOCK_KPIS } from "@/data/mockData";

interface AppState {
  applications: Application[];
  kpis: KPIs | null;
  loading: boolean;
  demoMode: boolean; // true when backend is unreachable — using mock data
  error: string | null;

  fetchApplications: () => Promise<void>;
  fetchKpis: () => Promise<void>;
  updateStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  addApplication: (app: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  applications: [],
  kpis: null,
  loading: false,
  demoMode: false,
  error: null,

  fetchApplications: async () => {
    set({ loading: true, error: null });
    if (!hasToken()) {
      set({ applications: MOCK_APPLICATIONS, demoMode: true, loading: false });
      return;
    }
    try {
      const apps = await api<Application[]>("/applications");
      set({ applications: apps, demoMode: false, loading: false });
    } catch (err) {
      console.error("Failed to fetch applications:", err);

      set({
        applications: MOCK_APPLICATIONS,
        demoMode: true,
        loading: false,
        error: err instanceof Error ? err.message : "Backend connection failed",
      });
    }
  },

  fetchKpis: async () => {
    if (!hasToken()) {
      set({ kpis: MOCK_KPIS, demoMode: true });
      return;
    }
    try {
      const kpis = await api<KPIs>("/applications/kpis");
      set({ kpis });
    } catch (err) {
      console.error("Failed to fetch KPIs:", err);

      set({
        kpis: MOCK_KPIS,
        demoMode: true,
        error: err instanceof Error ? err.message : "Failed to fetch KPIs",
      });
    }
  },

  updateStatus: async (id, status) => {
    const prev = get().applications;
    // Optimistic update — the whole point of a Kanban drag is that it feels instant.
    set({
      applications: prev.map((a) => (a.id === id ? { ...a, status } : a)),
    });

    if (get().demoMode) return; // demo mode: local-only, nothing to sync

    try {
      await api(`/applications/${id}`, { method: "PATCH", body: { status } });
    } catch (err) {
      set({ applications: prev, error: "Couldn't update status — reverted." });
    }
  },

  addApplication: async (app) => {
    if (get().demoMode) {
      const newApp: Application = {
        id: `local-${Date.now()}`,
        company_name: app.company_name || "Untitled",
        role_title: app.role_title || "Untitled role",
        job_description: app.job_description || null,
        job_url: app.job_url || null,
        status: app.status || "applied",
        source: "manual",
        applied_date: new Date().toISOString(),
        interview_date: null,
        location: app.location || null,
        salary_range: app.salary_range || null,
        notes: app.notes || null,
        extracted_skills: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set({ applications: [newApp, ...get().applications] });
      return;
    }
    const created = await api<Application>("/applications", {
      method: "POST",
      body: app,
    });
    set({ applications: [created, ...get().applications] });
  },

  deleteApplication: async (id) => {
    const prev = get().applications;
    set({ applications: prev.filter((a) => a.id !== id) });
    if (get().demoMode) return;
    try {
      await api(`/applications/${id}`, { method: "DELETE" });
    } catch {
      set({ applications: prev, error: "Couldn't delete — reverted." });
    }
  },
}));
