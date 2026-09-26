import { motion } from "framer-motion";
import clsx from "clsx";

interface WaveformProps {
  active?: boolean;
  bars?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { height: 14, width: 2 },
  md: { height: 24, width: 3 },
  lg: { height: 40, width: 4 },
};

/**
 * The signature visual motif for InterviewPilot: a voice/signal waveform.
 * Used wherever the product is "listening" or "thinking" — AI loading
 * states, the mock interview recorder, and as ambient texture in headers.
 * Bars animate with staggered, slightly randomized heights so it reads
 * as a live signal rather than a generic loading spinner.
 */
export function Waveform({ active = true, bars = 5, className, size = "md" }: WaveformProps) {
  const { height, width } = SIZES[size];
  const heights = Array.from({ length: bars }, (_, i) => 0.3 + ((i * 37) % 70) / 100);

  return (
    <div className={clsx("flex items-end gap-[3px]", className)} style={{ height }}>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="rounded-full bg-gradient-to-t from-signal-violet to-signal-cyan"
          style={{ width, height: "100%" }}
          animate={
            active
              ? { scaleY: [h, 1, h * 0.6, h] }
              : { scaleY: 0.3 }
          }
          transition={
            active
              ? { duration: 0.9 + i * 0.08, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}
