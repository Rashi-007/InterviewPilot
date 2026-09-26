import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  KanbanSquare,
  Table2,
  Search,
  MapPin,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppStore } from "@/store/useStore";
import { Application, ApplicationStatus, STATUS_COLUMNS } from "@/types";
import { AddApplicationModal } from "@/components/AddApplicationModal";

export function Applications() {
  const { applications, fetchApplications, updateStatus, deleteApplication } =
    useAppStore();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return applications;
    const q = search.toLowerCase();
    return applications.filter(
      (a) =>
        a.company_name.toLowerCase().includes(q) ||
        a.role_title.toLowerCase().includes(q),
    );
  }, [applications, search]);

  return (
    <AppShell title="Applications" subtitle={`${applications.length} tracked`}>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised/60 px-3 py-2 text-sm w-full sm:w-72">
          <Search size={15} className="text-ink-faint shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or role..."
            className="bg-transparent outline-none text-ink placeholder:text-ink-faint w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-surface-border p-1 bg-surface-raised/40">
            <button
              onClick={() => setView("kanban")}
              className={`p-1.5 rounded-md transition-colors ${
                view === "kanban"
                  ? "bg-signal-gradient text-void"
                  : "text-ink-faint hover:text-ink"
              }`}
              aria-label="Kanban view"
            >
              <KanbanSquare size={16} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-1.5 rounded-md transition-colors ${
                view === "table"
                  ? "bg-signal-gradient text-void"
                  : "text-ink-faint hover:text-ink"
              }`}
              aria-label="Table view"
            >
              <Table2 size={16} />
            </button>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Application
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard
          applications={filtered}
          draggedId={draggedId}
          setDraggedId={setDraggedId}
          onDrop={updateStatus}
          onDelete={deleteApplication}
        />
      ) : (
        <TableView
          applications={filtered}
          onDelete={deleteApplication}
          onStatusChange={updateStatus}
        />
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddApplicationModal onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function KanbanBoard({
  applications,
  draggedId,
  setDraggedId,
  onDrop,
  onDelete,
}: {
  applications: Application[];
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  onDrop: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
      {STATUS_COLUMNS.map((col) => {
        const items = applications.filter((a) => a.status === col.key);
        return (
          <div
            key={col.key}
            className="w-72 shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedId) onDrop(draggedId, col.key);
              setDraggedId(null);
            }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-medium text-ink-muted">
                {col.label}
              </h3>
              <span className="text-xs text-ink-faint font-mono bg-surface-raised px-1.5 py-0.5 rounded">
                {items.length}
              </span>
            </div>

            <div className="space-y-2 min-h-[120px]">
              {items.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  draggable
                  onDragStart={() => setDraggedId(app.id)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <Card hover className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {app.role_title}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {app.company_name}
                        </p>
                      </div>
                      <DeleteButton id={app.id} onDelete={onDelete} />
                    </div>
                    {app.location && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-ink-faint">
                        <MapPin size={11} />
                        {app.location}
                      </div>
                    )}
                    {app.interview_date && (
                      <div className="mt-2 text-xs font-mono text-signal-cyan">
                        Interview:{" "}
                        {new Date(app.interview_date).toLocaleDateString()}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
              {items.length === 0 && (
                <div className="border border-dashed border-surface-border rounded-lg py-6 text-center text-xs text-ink-faint">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({
  applications,
  onDelete,
  onStatusChange,
}: {
  applications: Application[];
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (
    id: string,
    status: ApplicationStatus,
  ) => void | Promise<void>;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-ink-faint uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Applied</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                className="border-b border-surface-border/60 hover:bg-surface-raised/40 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-ink">
                  {app.company_name}
                </td>
                <td className="px-5 py-3.5 text-ink-muted">{app.role_title}</td>
                <td className="px-5 py-3.5">
                  <select
                    value={app.status}
                    onChange={(e) =>
                      onStatusChange(
                        app.id,
                        e.target.value as ApplicationStatus,
                      )
                    }
                    className="rounded-md border border-surface-border bg-surface-raised px-2.5 py-1.5 text-xs text-ink outline-none focus:border-signal-cyan"
                  >
                    {STATUS_COLUMNS.map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3.5 text-ink-muted font-mono text-xs">
                  {new Date(app.applied_date).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-ink-muted">
                  {app.location || "—"}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-faint hover:text-signal-cyan transition-colors"
                        aria-label={`Open ${app.company_name} job posting`}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <DeleteButton id={app.id} onDelete={onDelete} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && (
          <p className="text-center text-sm text-ink-muted py-10">
            No applications match your search.
          </p>
        )}
      </div>
    </Card>
  );
}

function DeleteButton({
  id,
  onDelete,
}: {
  id: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-status-rejected/10 hover:text-status-rejected disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Delete application"
      title="Delete application"
    >
      <Trash2 size={15} />
    </button>
  );
}
