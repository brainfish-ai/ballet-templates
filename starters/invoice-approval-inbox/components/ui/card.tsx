import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--line)] bg-white/80 p-5 shadow-[0_1px_0_rgba(27,22,49,0.04)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
