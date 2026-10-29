import { FormEvent, useMemo, useState } from "react";
import { Building2, ExternalLink, LoaderCircle, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useStore";
import { AIGeneratedQuestion } from "@/types";

const SOURCES = [
  { name: "Glassdoor", host: "glassdoor.com", hint: "Interview reviews and candidate reports" },
  { name: "LeetCode Discuss", host: "leetcode.com/discuss", hint: "Technical interview experiences" },
  { name: "GeeksforGeeks", host: "geeksforgeeks.org", hint: "Company interview questions and guides" },
  { name: "AmbitionBox", host: "ambitionbox.com", hint: "Interview experiences and role insights" },
];

const DEMO_QUESTIONS: AIGeneratedQuestion[] = [
  { question: "What product or customer problem at this company interests you most, and how would your experience help solve it?", type: "behavioral" },
  { question: "Describe a technical decision you made that improved reliability or performance. How did you measure the result?", type: "technical" },
  { question: "Tell me about a time you had to make progress with incomplete requirements.", type: "behavioral" },
  { question: "How would you design a service that can scale with this company's customer growth?", type: "technical" },
  { question: "What would you prioritize in your first 90 days in this role?", type: "behavioral" },
];

export function CompanyQuestions() {
  const demoMode = useAppStore((s) => s.demoMode);
  const applications = useAppStore((s) => s.applications);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<AIGeneratedQuestion[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const companyOptions = useMemo(
    () => Array.from(new Set(applications.map((application) => application.company_name).filter(Boolean))),
    [applications]
  );
  const searchTerm = `${company.trim()} ${role.trim()} interview questions`.trim();

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setSearched(true);
    setError("");
    setLoading(true);
    if (demoMode) {
      setQuestions(DEMO_QUESTIONS);
      setLoading(false);
      return;
    }
    try {
      const result = await api<{ questions: AIGeneratedQuestion[] }>("/ai/company-questions", {
        method: "POST",
        body: { company_name: company.trim(), role_title: role.trim() },
      });
      setQuestions(result.questions);
    } catch (requestError) {
      setQuestions([]);
      setError(requestError instanceof Error ? requestError.message : "Couldn't generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Company Questions" subtitle="Practice for a specific company and role">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <div className="flex items-start gap-3 mb-5">
            <div className="rounded-lg bg-signal-violet/10 p-2.5 text-signal-violet"><Building2 size={19} /></div>
            <div>
              <h2 className="font-display font-semibold text-ink">Find interview questions</h2>
              <p className="text-sm text-ink-muted mt-1">Get Gemini generated practice questions and search interview reports from other websites.</p>
            </div>
          </div>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
            <div>
              <label htmlFor="company" className="block text-xs text-ink-faint mb-1.5">Company</label>
              <input id="company" list="company-options" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Google" className="w-full rounded-lg border border-surface-border bg-surface-raised/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-signal-cyan/50" />
              <datalist id="company-options">{companyOptions.map((name) => <option value={name} key={name} />)}</datalist>
            </div>
            <div>
              <label htmlFor="role" className="block text-xs text-ink-faint mb-1.5">Role</label>
              <input id="role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Frontend Engineer" className="w-full rounded-lg border border-surface-border bg-surface-raised/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-signal-cyan/50" />
            </div>
            <div className="flex items-end"><Button type="submit" disabled={!company.trim() || !role.trim() || loading} className="w-full md:w-auto">
              {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />} Search
            </Button></div>
          </form>
          <p className="text-xs text-ink-faint mt-3">Select a company from your applications or enter any company name.</p>
        </Card>

        {searched && <>
          <Card>
            <div className="flex items-center gap-2 mb-1"><Sparkles size={16} className="text-signal-violet" /><h2 className="font-display font-semibold text-ink">Practice questions</h2></div>
            <p className="text-xs text-ink-faint mb-4">Gemini generated predictions for {company} · {role}. These are practice prompts, not verified questions from past interviews.</p>
            {loading ? <div className="py-10 text-center text-sm text-ink-muted"><LoaderCircle size={18} className="inline animate-spin mr-2" />Generating company and role focused questions…</div> : error ? <p role="alert" className="text-sm text-status-rejected py-3">{error}</p> : questions.length ? <ol className="space-y-3">{questions.map((item, index) => <li key={`${index}-${item.question}`} className="flex gap-3 rounded-lg border border-surface-border bg-surface-raised/30 p-3.5">
              <span className="font-mono text-xs text-ink-faint pt-0.5">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex-1"><p className="text-sm text-ink leading-relaxed">{item.question}</p><span className={`inline-block mt-2 text-[10px] uppercase tracking-wide ${item.type === "technical" ? "text-signal-violet" : "text-signal-cyan"}`}>{item.type}</span></div>
            </li>)}</ol> : null}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-1"><Search size={16} className="text-signal-cyan" /><h2 className="font-display font-semibold text-ink">Search existing interview reports</h2></div>
            <p className="text-xs text-ink-faint mb-4">Open a targeted search on each site to find candidate reported questions for {company}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{SOURCES.map((source) => {
              const url = `https://www.google.com/search?q=${encodeURIComponent(`site:${source.host} ${searchTerm}`)}`;
              return <a key={source.name} href={url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-3 rounded-lg border border-surface-border p-4 transition-colors hover:border-signal-cyan/40 hover:bg-surface-raised/40">
                <div><p className="text-sm font-medium text-ink group-hover:text-signal-cyan">{source.name}</p><p className="text-xs text-ink-faint mt-1">{source.hint}</p></div><ExternalLink size={15} className="shrink-0 text-ink-faint group-hover:text-signal-cyan" />
              </a>;
            })}</div>
            <p className="text-[11px] text-ink-faint mt-4">External search results are provided by Google and may include content from users and publishers. Review each source for context.</p>
          </Card>
        </>}
      </div>
    </AppShell>
  );
}
