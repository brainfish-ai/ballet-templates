"use client";

import { useState } from "react";
import type { EnrichmentOutput } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function safe(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function FitGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#efe7fb" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="#6b3fc0"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * 301} 301`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="text-2xl font-semibold text-[var(--ink)]">{clamped}</span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">Fit</span>
      </div>
    </div>
  );
}

export function ResultCards({ result }: { result: EnrichmentOutput }) {
  const [copied, setCopied] = useState(false);
  const person = result.person || {};
  const company = result.company || {};
  const fit = result.fit || {};
  const score = typeof fit.score === "number" ? fit.score : 0;

  async function copyOpener() {
    if (!result.opener) return;
    await navigator.clipboard.writeText(result.opener);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4 animate-[rise_0.45s_ease-out]">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
            Person
          </p>
          <div className="mt-3 flex items-start gap-3">
            {person.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photo_url}
                alt=""
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--lilac)] text-lg font-semibold text-[var(--deep)]">
                {(person.name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--ink)]">{safe(person.name)}</h3>
              <p className="text-sm text-[var(--ink-2)]">
                {safe(person.title)} {person.seniority ? `· ${person.seniority}` : ""}
              </p>
              <p className="text-sm text-[var(--ink-3)]">{safe(person.email)}</p>
              <p className="text-xs text-[var(--ink-3)]">{safe(person.location)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {person.linkedin_url && (
                  <a className="text-xs font-medium text-[var(--purple-ink)] underline-offset-2 hover:underline" href={person.linkedin_url} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                )}
                {person.x_url && (
                  <a className="text-xs font-medium text-[var(--purple-ink)] underline-offset-2 hover:underline" href={person.x_url} target="_blank" rel="noopener noreferrer">
                    X
                  </a>
                )}
              </div>
            </div>
          </div>
          {(person.headline || person.bio) && (
            <p className="mt-3 text-sm text-[var(--ink-2)]">{person.headline || person.bio}</p>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
            Company
          </p>
          <h3 className="mt-3 text-lg font-semibold text-[var(--ink)]">{safe(company.name)}</h3>
          <p className="text-sm text-[var(--ink-2)]">
            {safe(company.industry)} · {safe(company.employee_count)} employees
          </p>
          <p className="text-xs text-[var(--ink-3)]">
            {safe(company.headquarters)} {company.founded ? `· Founded ${company.founded}` : ""}
            {company.funding ? ` · ${company.funding}` : ""}
          </p>
          {company.website && (
            <a
              className="mt-2 inline-block text-sm text-[var(--purple-ink)] underline-offset-2 hover:underline"
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              {company.domain || company.website}
            </a>
          )}
          {company.summary && (
            <p className="mt-3 text-sm text-[var(--ink-2)]">{company.summary}</p>
          )}
          {!!company.products?.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {company.products.map((p) => (
                <Badge key={p}>{p}</Badge>
              ))}
            </div>
          )}
          {!!company.tech_stack?.length && (
            <p className="mt-2 text-xs text-[var(--ink-3)]">
              Stack: {company.tech_stack.join(", ")}
            </p>
          )}
        </Card>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <FitGauge score={score} />
          <div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">ICP fit</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--ink-2)]">
              {(fit.reasons || []).map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="text-[var(--purple-ink)]">•</span>
                  <span>{reason}</span>
                </li>
              ))}
              {!fit.reasons?.length && <li>No fit reasons returned.</li>}
            </ul>
            {result.next_step && (
              <p className="mt-3 text-sm font-medium text-[var(--ink)]">
                Next step: {result.next_step}
              </p>
            )}
          </div>
        </div>
      </Card>

      {result.opener && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-[var(--ink)]">Opener</h3>
            <Button type="button" size="sm" variant="outline" onClick={copyOpener}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-2)]">
            {result.opener}
          </p>
        </Card>
      )}

      {!!result.sources?.length && (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--ink)]">Sources</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {result.sources.map((source, i) => {
              if (typeof source === "string") {
                return (
                  <li key={`${source}-${i}`} className="text-[var(--ink-2)]">
                    {source}
                  </li>
                );
              }
              const href = source.url;
              const title = source.title || source.url || "Source";
              return (
                <li key={`${title}-${i}`}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--purple-ink)] underline-offset-2 hover:underline"
                    >
                      {title}
                    </a>
                  ) : (
                    <span className="text-[var(--ink-2)]">{title}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
