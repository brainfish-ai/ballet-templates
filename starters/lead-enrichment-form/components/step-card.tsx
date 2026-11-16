import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { StepState } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function StepCard({ step }: { step: StepState }) {
  const Icon =
    step.status === "running"
      ? Loader2
      : step.status === "error"
        ? XCircle
        : CheckCircle2;

  return (
    <Card className="animate-[rise_0.35s_ease-out] p-4">
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            step.status === "running"
              ? "animate-spin text-[var(--purple-ink)]"
              : step.status === "error"
                ? "text-[var(--danger)]"
                : "text-[var(--mint)]"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--ink)]">{step.title}</h3>
            {typeof step.durationMs === "number" && step.status !== "running" && (
              <span className="text-xs text-[var(--ink-3)]">
                {(step.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          {step.message && step.message !== step.title && (
            <p className="mt-1 text-xs text-[var(--ink-2)]">{step.message}</p>
          )}
          {step.activity && (
            <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--paper-2)]/80 p-2 font-mono text-[11px] leading-relaxed text-[var(--ink-2)]">
              {step.activity}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}
