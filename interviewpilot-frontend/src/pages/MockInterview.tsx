import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, RotateCcw, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Waveform } from "@/components/ui/Waveform";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useStore";
import { InterviewQA } from "@/types";

type Stage = "setup" | "loading" | "active" | "scoring";

const DEMO_QUESTIONS: InterviewQA[] = [
  { id: "dq1", session_id: "demo", question: "Walk me through how you'd design a rate limiter for a public API.", question_type: "technical", user_answer: null, ai_score: null, ai_feedback: null, model_answer: null, created_at: "" },
  { id: "dq2", session_id: "demo", question: "Tell me about a time you disagreed with a teammate's technical decision. What did you do?", question_type: "behavioral", user_answer: null, ai_score: null, ai_feedback: null, model_answer: null, created_at: "" },
  { id: "dq3", session_id: "demo", question: "How would you debug a production API endpoint that's suddenly returning 500s?", question_type: "technical", user_answer: null, ai_score: null, ai_feedback: null, model_answer: null, created_at: "" },
];

export function MockInterview() {
  const demoMode = useAppStore((s) => s.demoMode);
  const [stage, setStage] = useState<Stage>("setup");
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<InterviewQA[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  async function startSession() {
    if (!role.trim()) return;
    setStage("loading");

    if (demoMode) {
      // No live backend — use canned demo questions so the flow is still explorable.
      await new Promise((r) => setTimeout(r, 1100));
      setQuestions(DEMO_QUESTIONS);
      setStage("active");
      return;
    }

    try {
      const result = await api<{ questions: InterviewQA[] }>("/ai/mock-interview/start", {
        method: "POST",
        body: { role_title: role, session_type: "mixed", question_count: 5 },
      });
      setQuestions(result.questions);
      setStage("active");
    } catch {
      setQuestions(DEMO_QUESTIONS);
      setStage("active");
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    setEvaluating(true);

    const q = questions[current];
    let feedback = q;

    if (!demoMode) {
      try {
        feedback = await api<InterviewQA>(`/ai/mock-interview/${q.id}/answer`, {
          method: "POST",
          body: { answer },
        });
      } catch {
        feedback = mockEvaluate(q, answer);
      }
    } else {
      await new Promise((r) => setTimeout(r, 1400));
      feedback = mockEvaluate(q, answer);
    }

    const updated = [...questions];
    updated[current] = feedback;
    setQuestions(updated);
    setEvaluating(false);
    setAnswer("");
  }

  function nextQuestion() {
    if (current < questions.length - 1) setCurrent(current + 1);
    else setStage("scoring");
  }

  function reset() {
    setStage("setup");
    setRole("");
    setQuestions([]);
    setCurrent(0);
    setAnswer("");
  }

  return (
    <AppShell title="Mock Interview" subtitle="AI-generated questions, scored in real time">
      {stage === "setup" && <SetupCard role={role} setRole={setRole} onStart={startSession} />}
      {stage === "loading" && <LoadingCard />}
      {stage === "active" && (
        <ActiveInterview
          question={questions[current]}
          index={current}
          total={questions.length}
          answer={answer}
          setAnswer={setAnswer}
          evaluating={evaluating}
          onSubmit={submitAnswer}
          onNext={nextQuestion}
        />
      )}
      {stage === "scoring" && <SummaryCard questions={questions} onReset={reset} />}
    </AppShell>
  );
}

function SetupCard({ role, setRole, onStart }: { role: string; setRole: (v: string) => void; onStart: () => void }) {
  return (
    <Card className="max-w-lg mx-auto text-center py-10">
      <div className="flex justify-center mb-4">
        <Waveform size="lg" bars={7} active={false} />
      </div>
      <h2 className="font-display text-lg font-semibold text-ink mb-1">Start a mock interview</h2>
      <p className="text-sm text-ink-muted mb-6">
        Tell us the role — we'll generate a mix of technical and behavioral questions.
      </p>
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onStart()}
        placeholder="e.g. Backend Engineer"
        className="w-full rounded-lg border border-surface-border bg-surface-raised/60 px-4 py-3 text-sm text-center text-ink placeholder:text-ink-faint outline-none focus:border-signal-cyan/50 mb-4"
        autoFocus
      />
      <Button onClick={onStart} disabled={!role.trim()} className="w-full">
        <Sparkles size={16} />
        Generate Questions
      </Button>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="max-w-lg mx-auto text-center py-14">
      <div className="flex justify-center mb-5">
        <Waveform size="lg" bars={7} />
      </div>
      <p className="shimmer-text text-sm font-medium">AI is thinking...</p>
      <p className="text-xs text-ink-faint mt-1">Generating role-specific questions</p>
    </Card>
  );
}

function ActiveInterview({
  question,
  index,
  total,
  answer,
  setAnswer,
  evaluating,
  onSubmit,
  onNext,
}: {
  question: InterviewQA;
  index: number;
  total: number;
  answer: string;
  setAnswer: (v: string) => void;
  evaluating: boolean;
  onSubmit: () => void;
  onNext: () => void;
}) {
  const answered = !!question.ai_feedback;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-ink-faint font-mono">
          Question {index + 1} of {total}
        </span>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            question.question_type === "technical"
              ? "bg-signal-violet/10 text-signal-violet"
              : "bg-signal-cyan/10 text-signal-cyan"
          }`}
        >
          {question.question_type}
        </span>
      </div>

      <Card className="mb-4">
        <p className="text-base text-ink leading-relaxed">{question.question}</p>
      </Card>

      {!answered ? (
        <Card>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={5}
            className="w-full bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button onClick={onSubmit} disabled={!answer.trim() || evaluating}>
              {evaluating ? (
                <>
                  <Waveform size="sm" bars={3} />
                  Scoring...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Submit Answer
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <ScorePill score={question.ai_score} />
                <span className="text-xs text-ink-faint">AI Feedback</span>
              </div>
              <p className="text-sm text-ink-muted leading-relaxed">{question.ai_feedback}</p>

              <div className="mt-4 pt-4 border-t border-surface-border">
                <p className="text-xs font-medium text-ink-faint mb-1.5">Model Answer</p>
                <p className="text-sm text-ink-muted leading-relaxed">{question.model_answer}</p>
              </div>
            </Card>
            <div className="flex justify-end">
              <Button onClick={onNext}>{index < total - 1 ? "Next Question" : "Finish Session"}</Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return null;
  return (
    <div className="flex items-center gap-1 rounded-full bg-signal-gradient-soft px-2.5 py-1">
      <Star size={12} className="text-signal-cyan fill-signal-cyan" />
      <span className="text-xs font-mono font-medium text-ink">{score.toFixed(1)} / 5</span>
    </div>
  );
}

function SummaryCard({ questions, onReset }: { questions: InterviewQA[]; onReset: () => void }) {
  const scored = questions.filter((q) => q.ai_score !== null);
  const avg = scored.length ? scored.reduce((sum, q) => sum + (q.ai_score || 0), 0) / scored.length : 0;

  return (
    <Card className="max-w-lg mx-auto text-center py-10">
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 rounded-full bg-signal-gradient flex items-center justify-center">
          <span className="text-2xl font-display font-bold text-void">{avg.toFixed(1)}</span>
        </div>
      </div>
      <h2 className="font-display text-lg font-semibold text-ink mb-1">Session complete</h2>
      <p className="text-sm text-ink-muted mb-6">
        Average score across {scored.length} question{scored.length !== 1 ? "s" : ""}
      </p>
      <Button variant="secondary" onClick={onReset} className="w-full">
        <RotateCcw size={15} />
        Start New Session
      </Button>
    </Card>
  );
}

// Fallback scorer used only in demo mode / if the API call fails —
// keeps the flow interactive without a live backend.
function mockEvaluate(q: InterviewQA, answer: string): InterviewQA {
  const score = Math.min(5, Math.max(2.5, 3 + (answer.length % 5) * 0.4));
  return {
    ...q,
    user_answer: answer,
    ai_score: Math.round(score * 10) / 10,
    ai_feedback:
      "Solid structure and relevant reasoning. To strengthen this further, add a concrete example from past experience and quantify the impact where possible.",
    model_answer:
      "A strong answer names the core trade-offs explicitly, walks through a concrete example, and closes with how you'd validate the approach in production.",
  };
}
