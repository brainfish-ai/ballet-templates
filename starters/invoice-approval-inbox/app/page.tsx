"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PoweredByBallet } from "@/components/powered-by-ballet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Invoice = {
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  dueDate: string;
  memo: string;
};

const SEED: Invoice[] = [
  { id: "INV-2041", vendor: "Cloudflare", amount: 4200, currency: "USD", status: "pending", dueDate: "2026-11-22", memo: "Workers paid plan, Nov" },
  { id: "INV-2048", vendor: "Notion", amount: 960, currency: "USD", status: "pending", dueDate: "2026-11-30", memo: "Business seats x12" },
  { id: "INV-2033", vendor: "AWS", amount: 18750, currency: "USD", status: "approved", dueDate: "2026-11-10", memo: "Production infra" },
  { id: "INV-2029", vendor: "Figma", amount: 540, currency: "USD", status: "rejected", dueDate: "2026-11-05", memo: "Duplicate seat charge" },
  { id: "INV-2055", vendor: "Datadog", amount: 3100, currency: "USD", status: "pending", dueDate: "2026-12-01", memo: "APM overage" },
];

const FILTERS = ["all", "pending", "approved", "rejected"] as const;

export default function Home() {
  const [invoices, setInvoices] = useState(SEED);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [selectedId, setSelectedId] = useState("INV-2041");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mock, setMock] = useState(false);

  const visible = useMemo(
    () => invoices.filter((i) => filter === "all" || i.status === filter),
    [invoices, filter],
  );
  const selected = invoices.find((i) => i.id === selectedId) ?? visible[0] ?? null;

  async function decide(decision: "approve" | "reject") {
    if (!selected) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/ballet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selected.id,
          vendor: selected.vendor,
          amount: selected.amount,
          currency: selected.currency,
          decision,
          decided_by: "finance-ops@example.com",
          reason: decision === "approve" ? "Within policy" : "Needs vendor credit",
          due_date: selected.dueDate,
          memo: selected.memo,
        }),
      });
      const data = await res.json();
      setMock(Boolean(data.mock));
      const status = decision === "approve" ? "approved" : "rejected";
      setInvoices((prev) => prev.map((i) => (i.id === selected.id ? { ...i, status } : i)));
      setNote(data.output?.summary ?? `Marked ${selected.id} as ${status}.`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        title="Invoice Approval Inbox"
        subtitle="Filter by status, review the detail panel, and send approve or reject decisions through Ballet."
      />
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-sm capitalize transition ${
                filter === f
                  ? "bg-[var(--deep)] text-white"
                  : "border border-[var(--line)] bg-white/70 text-[var(--ink-2)] hover:bg-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/80 animate-[rise_0.55s_ease-out]">
            <ul className="divide-y divide-[var(--line)]">
              {visible.map((inv) => (
                <li key={inv.id}>
                  <button
                    className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[var(--lilac)]/30 ${
                      selected?.id === inv.id ? "bg-[var(--lilac)]/45" : ""
                    }`}
                    onClick={() => setSelectedId(inv.id)}
                  >
                    <div>
                      <p className="font-medium text-[var(--ink)]">{inv.vendor}</p>
                      <p className="text-xs text-[var(--ink-3)]">{inv.id} · due {inv.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--ink)]">
                        {inv.currency} {inv.amount.toLocaleString()}
                      </p>
                      <Badge className="mt-1 capitalize">{inv.status}</Badge>
                    </div>
                  </button>
                </li>
              ))}
              {visible.length === 0 && (
                <li className="px-4 py-8 text-sm text-[var(--ink-3)]">No invoices in this filter.</li>
              )}
            </ul>
          </div>

          <Card className="animate-[rise_0.7s_ease-out]">
            {!selected ? (
              <p className="text-sm text-[var(--ink-3)]">Select an invoice.</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">Detail</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">{selected.vendor}</h2>
                  <p className="text-sm text-[var(--ink-2)]">{selected.id}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--ink-3)]">Amount</dt>
                    <dd className="font-medium">{selected.currency} {selected.amount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-3)]">Due</dt>
                    <dd className="font-medium">{selected.dueDate}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[var(--ink-3)]">Memo</dt>
                    <dd className="font-medium">{selected.memo}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="brand" disabled={busy || selected.status !== "pending"} onClick={() => decide("approve")}>
                    Approve
                  </Button>
                  <Button variant="danger" disabled={busy || selected.status !== "pending"} onClick={() => decide("reject")}>
                    Reject
                  </Button>
                  <PoweredByBallet />
                </div>
                {note && (
                  <p className="text-sm text-[var(--ink-2)]">
                    {mock ? <Badge className="mr-2">Mock</Badge> : null}
                    {note}
                  </p>
                )}
                <p className="text-xs text-[var(--ink-3)]">
                  Import{" "}
                  <a className="text-[var(--purple-ink)] underline-offset-2 hover:underline" href="https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/invoice-approval&ref=main">
                    invoice-approval
                  </a>
                  .
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
      <SiteFooter slug="invoice-approval-inbox" />
    </div>
  );
}
