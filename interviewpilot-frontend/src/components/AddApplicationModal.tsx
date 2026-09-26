import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./ui/Button";
import { useAppStore } from "@/store/useStore";

export function AddApplicationModal({ onClose }: { onClose: () => void }) {
  const addApplication = useAppStore((s) => s.addApplication);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = company.trim() && role.trim();

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addApplication({
        company_name: company.trim(),
        role_title: role.trim(),
        location: location.trim() || undefined,
        job_url: jobUrl.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-ink">Add Application</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Company" value={company} onChange={setCompany} placeholder="e.g. Stripe" autoFocus />
          <Field label="Role" value={role} onChange={setRole} placeholder="e.g. Backend Engineer" />
          <Field label="Location" value={location} onChange={setLocation} placeholder="e.g. Remote (optional)" />
          <Field label="Job URL" value={jobUrl} onChange={setJobUrl} placeholder="https:// (optional)" />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Adding..." : "Add Application"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised/60 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-signal-cyan/50 transition-colors"
      />
    </label>
  );
}
