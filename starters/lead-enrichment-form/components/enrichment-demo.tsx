"use client";

import { FormEvent, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PoweredByBallet } from "@/components/powered-by-ballet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepCard } from "@/components/step-card";
import { ResultCards } from "@/components/result-cards";
import { PromoCards } from "@/components/promo-cards";
import type {
  EnrichDataParts,
  EnrichmentOutput,
  EnrichUIMessage,
  LeadInput,
  StepState,
} from "@/lib/types";
import { IMPORT_URL, SIGNUP_URL } from "@/lib/types";

function partsOfType<T extends keyof EnrichDataParts>(
  messages: EnrichUIMessage[],
  type: `data-${T}`,
) {
  const out: Array<EnrichDataParts[T] & { id?: string }> = [];
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const part of message.parts || []) {
      if (part.type === type) {
        const typed = part as unknown as {
          data: EnrichDataParts[T];
          id?: string;
        };
        out.push({
          ...typed.data,
          id: typed.id,
        });
      }
    }
  }
  return out;
}

export function EnrichmentDemo() {
  const [lead, setLead] = useState<LeadInput>({
    name: "Jordan Lee",
    email: "jordan@acmerobotics.com",
    company: "Acme Robotics",
    title: "Head of RevOps",
    website: "https://acmerobotics.com",
    message: "Looking to automate inbound routing before our next launch.",
  });
  const [locked, setLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ballet",
      }),
    [],
  );

  const { messages, sendMessage, status, setMessages, error } =
    useChat<EnrichUIMessage>({
      transport,
      onData: (part) => {
        if (part.type === "data-locked") {
          const data = (part as { data?: EnrichDataParts["locked"] }).data;
          setLocked(true);
          setLockMessage(
            data?.message ||
              "You used your free live run. Import the playbook to run it on your own leads.",
          );
        }
      },
    });

  const busy = status === "submitted" || status === "streaming";

  const mode = partsOfType(messages, "data-mode").at(-1);
  const steps = useMemo(() => {
    const map = new Map<string, StepState>();
    for (const step of partsOfType(messages, "data-step")) {
      map.set(step.id || step.title, step);
    }
    return [...map.values()].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
  }, [messages]);
  const result = partsOfType(messages, "data-result").at(-1) as
    | EnrichmentOutput
    | undefined;
  const promos = partsOfType(messages, "data-promo");
  const lockedPart = partsOfType(messages, "data-locked").at(-1);
  const statusPart = partsOfType(messages, "data-status").at(-1);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked || busy) return;
    const form = new FormData(e.currentTarget);
    const next: LeadInput = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      company: String(form.get("company") ?? ""),
      title: String(form.get("title") ?? ""),
      website: String(form.get("website") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    setLead(next);
    setMessages([]);
    await sendMessage(
      {
        text: `Enrich ${next.name || "lead"} <${next.email}>`,
      },
      { body: { lead: next } },
    );
  }

  const isLocked = locked || Boolean(lockedPart);

  return (
    <div className="min-h-screen">
      <SiteHeader
        title="Lead Enrichment"
        subtitle="Watch Ballet enrich a lead live: people data, website crawl, ICP score, and a ready-to-send opener."
      />
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr] sm:px-8">
        <Card className="h-fit animate-[rise_0.55s_ease-out]">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Name</span>
                <input
                  name="name"
                  required
                  disabled={isLocked || busy}
                  defaultValue={lead.name}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2 disabled:opacity-60"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Work email</span>
                <input
                  name="email"
                  type="email"
                  required
                  disabled={isLocked || busy}
                  defaultValue={lead.email}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2 disabled:opacity-60"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Company</span>
                <input
                  name="company"
                  disabled={isLocked || busy}
                  defaultValue={lead.company}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2 disabled:opacity-60"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Title</span>
                <input
                  name="title"
                  disabled={isLocked || busy}
                  defaultValue={lead.title}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2 disabled:opacity-60"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--ink)]">Website</span>
              <input
                name="website"
                disabled={isLocked || busy}
                defaultValue={lead.website}
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2 disabled:opacity-60"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--ink)]">What do you need?</span>
              <textarea
                name="message"
                rows={3}
                disabled={isLocked || busy}
                defaultValue={lead.message}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 outline-none ring-[var(--purple)] focus:ring-2 disabled:opacity-60"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" variant="brand" disabled={isLocked || busy}>
                {busy ? "Enriching..." : isLocked ? "Free run used" : "Enrich lead with Ballet"}
              </Button>
              <PoweredByBallet />
            </div>

            {isLocked && (
              <p className="rounded-xl border border-[var(--line)] bg-[var(--lilac)]/50 px-3 py-2 text-sm text-[var(--ink)]">
                {lockedPart?.message ||
                  lockMessage ||
                  "You used your free live run. Import the playbook to run it on your own leads."}
              </p>
            )}
            {error && (
              <p className="text-sm text-[var(--danger)]">{error.message}</p>
            )}
          </form>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Live run</h2>
            {mode && (
              <Badge className={mode.mode === "mock" ? "bg-[var(--paper-2)]" : "bg-[var(--lilac)]"}>
                {mode.mode === "mock" ? "Sample data" : mode.mode === "byo" ? "Your workflow" : "Live"}
                {mode.label ? ` · ${mode.label}` : ""}
              </Badge>
            )}
            {statusPart?.message && (
              <span className="text-xs text-[var(--ink-3)]">{statusPart.message}</span>
            )}
          </div>

          {!steps.length && !result && !busy && (
            <Card>
              <p className="text-sm text-[var(--ink-3)] animate-[pulse-soft_2.4s_ease-in-out_infinite]">
                Submit a lead to stream people lookup, website crawl, and ICP scoring.
              </p>
            </Card>
          )}

          <div className="space-y-3">
            {steps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>

          {result && <ResultCards result={result} />}
          {(promos.length > 0 || isLocked) && (
            <PromoCards
              promos={
                promos.length
                  ? promos
                  : [
                      {
                        kind: "import",
                        title: "Import this playbook into Ballet",
                        body: "Bring the enrichment workflow into your workspace and run it on your CRM leads.",
                        href: IMPORT_URL,
                        cta: "Import to Ballet",
                      },
                      {
                        kind: "signup",
                        title: "Sign up free",
                        body: "Create a Ballet workspace and automate the handoffs between your systems.",
                        href: SIGNUP_URL,
                        cta: "Sign up free",
                      },
                    ]
              }
            />
          )}
        </div>
      </main>
      <SiteFooter slug="lead-enrichment-form" />
    </div>
  );
}
