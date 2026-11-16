"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PoweredByBallet } from "@/components/powered-by-ballet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Deal = {
  id: string;
  name: string;
  stage: string;
  amount: number;
  owner: string;
  closeDate: string;
  lastActivityAt: string;
};

const DEALS: Deal[] = [
  { id: "D-104", name: "Northwind Clinics", stage: "Negotiation", amount: 126000, owner: "Priya Shah", closeDate: "2026-11-28", lastActivityAt: "2026-11-10" },
  { id: "D-109", name: "Lumen Studios", stage: "Proposal", amount: 64000, owner: "Alex Kim", closeDate: "2026-12-05", lastActivityAt: "2026-10-22" },
  { id: "D-112", name: "Harbor Freight Co.", stage: "Discovery", amount: 48000, owner: "", closeDate: "2026-11-02", lastActivityAt: "2026-09-30" },
  { id: "D-118", name: "Pinecrest Dental", stage: "Qualified", amount: 32000, owner: "Jess Ortiz", closeDate: "2026-12-18", lastActivityAt: "2026-11-12" },
  { id: "D-121", name: "Ironhouse Gym", stage: "Closed Won", amount: 48000, owner: "Priya Shah", closeDate: "2026-10-30", lastActivityAt: "2026-10-30" },
  { id: "D-122", name: "Cedar Analytics", stage: "Closed Lost", amount: 22000, owner: "Alex Kim", closeDate: "2026-10-18", lastActivityAt: "2026-10-18" },
];

const STAGES = ["Discovery", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mock, setMock] = useState(false);

  const openDeals = useMemo(() => DEALS.filter((d) => !d.stage.startsWith("Closed")), []);
  const won = DEALS.filter((d) => d.stage === "Closed Won");
  const lost = DEALS.filter((d) => d.stage === "Closed Lost");
  const winRate = won.length + lost.length === 0 ? 0 : Math.round((won.length / (won.length + lost.length)) * 100);
  const forecast = openDeals.reduce((sum, d) => sum + d.amount, 0);
  const funnel = STAGES.filter((s) => !s.startsWith("Closed")).map((stage) => {
    const rows = openDeals.filter((d) => d.stage === stage);
    return { stage, count: rows.length, amount: rows.reduce((s, d) => s + d.amount, 0) };
  });

  async function runHygiene() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/ballet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pipeline_hygiene",
          deals: openDeals.map((d) => ({
            id: d.id,
            name: d.name,
            stage: d.stage,
            amount: d.amount,
            owner: d.owner,
            close_date: d.closeDate,
            last_activity_at: d.lastActivityAt,
          })),
        }),
      });
      const data = await res.json();
      setMock(Boolean(data.mock));
      setResult(data.output?.plan ?? data.output?.summary ?? JSON.stringify(data.output));
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        title="RevOps Pipeline Dashboard"
        subtitle="Watch stage coverage, win rate and forecast, then clean the pipeline with a Ballet playbook."
      />
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10 sm:px-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="animate-[rise_0.6s_ease-out]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">Win rate</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{winRate}%</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{won.length} won / {lost.length} lost</p>
          </Card>
          <Card className="animate-[rise_0.7s_ease-out]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">Open forecast</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">${(forecast / 1000).toFixed(0)}k</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{openDeals.length} open deals</p>
          </Card>
          <Card className="animate-[rise_0.8s_ease-out]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">Hygiene</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="brand" onClick={runHygiene} disabled={busy}>
                {busy ? "Running…" : "Run pipeline hygiene with Ballet"}
              </Button>
              <PoweredByBallet />
            </div>
            {result && (
              <p className="mt-4 text-sm text-[var(--ink-2)]">
                {mock ? <Badge className="mr-2">Mock</Badge> : null}
                {result}
              </p>
            )}
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink)]">Stage funnel</h2>
              <p className="text-sm text-[var(--ink-2)]">Open pipeline by stage.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {funnel.map((s, i) => (
              <div
                key={s.stage}
                className="rounded-2xl border border-[var(--line)] bg-[var(--lilac)]/40 p-4"
                style={{ animation: `rise ${0.45 + i * 0.08}s ease-out` }}
              >
                <p className="text-sm font-medium text-[var(--deep)]">{s.stage}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{s.count}</p>
                <p className="text-xs text-[var(--ink-3)]">${(s.amount / 1000).toFixed(0)}k</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-[var(--ink)]">Deal table</h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--paper-2)] text-[var(--ink-3)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Deal</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Close</th>
                </tr>
              </thead>
              <tbody>
                {DEALS.map((d) => (
                  <tr key={d.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">{d.name}</td>
                    <td className="px-4 py-3"><Badge>{d.stage}</Badge></td>
                    <td className="px-4 py-3">${d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[var(--ink-2)]">{d.owner || "Unassigned"}</td>
                    <td className="px-4 py-3 text-[var(--ink-2)]">{d.closeDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--ink-3)]">
            Import the matching playbook:{" "}
            <a className="text-[var(--purple-ink)] underline-offset-2 hover:underline" href="https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/crm-hygiene&ref=main">
              crm-hygiene
            </a>
            . Related:{" "}
            <a className="text-[var(--purple-ink)] underline-offset-2 hover:underline" href="https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/win-loss-by-competitor&ref=main">
              win-loss-by-competitor
            </a>
            .
          </p>
        </section>
      </main>
      <SiteFooter slug="revops-pipeline-dashboard" />
    </div>
  );
}
