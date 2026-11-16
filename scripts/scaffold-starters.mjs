#!/usr/bin/env node
/**
 * Writes shared + per-starter Next.js app files under starters/.
 * Run from repo root after create-next-app scaffolds exist.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const starters = join(root, 'starters');
const REPO = 'https://github.com/brainfish-ai/ballet-templates';
const RAW = 'https://raw.githubusercontent.com/brainfish-ai/ballet-templates/main';

const apps = [
  {
    slug: 'revops-pipeline-dashboard',
    title: 'RevOps Pipeline Dashboard',
    summary:
      'Stage funnel, deal table, win rate and forecast cards, with one-click pipeline hygiene through Ballet.',
    templateId: 'crm-hygiene',
    templateTitle: 'HubSpot CRM hygiene report',
    related: ['win-loss-by-competitor'],
    actionLabel: 'Run pipeline hygiene with Ballet',
  },
  {
    slug: 'lead-enrichment-form',
    title: 'Lead Enrichment Form',
    summary:
      'Capture a lead, send it to a Ballet enrichment and routing workflow, and show the enriched profile card.',
    templateId: 'inbound-lead-slack-alert',
    templateTitle: 'Inbound Lead Slack Alert',
    related: ['salesforce-lead-enrichment'],
    actionLabel: 'Enrich and route with Ballet',
  },
  {
    slug: 'invoice-approval-inbox',
    title: 'Invoice Approval Inbox',
    summary:
      'Filter invoices by status, inspect a detail panel, and approve or reject through a Ballet approval workflow.',
    templateId: 'invoice-approval',
    templateTitle: 'Invoice approval workflow',
    related: [],
    actionLabel: 'Send decision to Ballet',
  },
];

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function write(path, content) {
  ensureDir(join(path, '..'));
  writeFileSync(path, content);
  console.log('wrote', path.replace(root + '/', ''));
}

const utilsTs = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const balletClientTs = `/**
 * Triggers a Ballet playbook from a Next.js route handler.
 *
 * Auth and payload follow Ballet's public REST docs:
 * - Authorization: Bearer <workspace API token>
 * - Execute body: { input: {...} }
 * - Webhook body: the event payload itself (URL contains /webhooks/)
 *
 * Set BALLET_API_KEY (workspace token) and BALLET_WORKFLOW_URL
 * (execute URL or webhook URL). When either is missing, mockFn runs
 * so the demo works without credentials.
 */
export type BalletTriggerResult<T> = {
  mock: boolean;
  success: boolean;
  output: T;
  runId?: string;
  error?: string;
};

function isWebhookUrl(url: string) {
  return /\\/webhooks\\//i.test(url);
}

async function readExecuteStream(res: Response): Promise<{
  success: boolean;
  output: unknown;
  runId?: string;
}> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(String(json.error ?? json.message ?? \`Ballet request failed (\${res.status})\`));
    }
    return {
      success: true,
      output: (json.output as unknown) ?? json,
      runId: typeof json.runId === "string" ? json.runId : undefined,
    };
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Ballet stream had no body");
  const decoder = new TextDecoder();
  let buffer = "";
  let result: { success: boolean; output: unknown; runId?: string } | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\\n\\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const event = JSON.parse(line.slice(5).trim()) as {
        type?: string;
        run?: { success?: boolean; output?: unknown; id?: string; runId?: string };
      };
      if (event.type === "run_stop" && event.run) {
        result = {
          success: Boolean(event.run.success),
          output: event.run.output,
          runId: event.run.runId ?? event.run.id,
        };
      }
    }
  }

  if (!result) throw new Error("Ballet stream ended without run_stop");
  return result;
}

export async function triggerBalletWorkflow<T>(
  input: Record<string, unknown>,
  mockFn: () => T,
): Promise<BalletTriggerResult<T>> {
  const apiKey = process.env.BALLET_API_KEY?.trim();
  const workflowUrl = process.env.BALLET_WORKFLOW_URL?.trim();

  if (!apiKey || !workflowUrl) {
    return { mock: true, success: true, output: mockFn() };
  }

  try {
    const webhook = isWebhookUrl(workflowUrl);
    const res = await fetch(workflowUrl, {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${apiKey}\`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(webhook ? input : { input }),
    });

    const parsed = await readExecuteStream(res);
    return {
      mock: false,
      success: parsed.success,
      output: (parsed.output as T) ?? mockFn(),
      runId: parsed.runId,
    };
  } catch (err) {
    return {
      mock: false,
      success: false,
      output: mockFn(),
      error: err instanceof Error ? err.message : "Ballet request failed",
    };
  }
}
`;

const buttonTsx = `"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--purple)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ink)] text-white hover:bg-[var(--deep)] shadow-sm",
        brand:
          "bg-[var(--purple-ink)] text-white hover:bg-[var(--deep)] shadow-sm",
        outline:
          "border border-[var(--line)] bg-white/70 text-[var(--ink)] hover:bg-white",
        ghost: "text-[var(--ink-2)] hover:bg-white/60",
        danger: "bg-[var(--danger)] text-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";
`;

const badgeTsx = `import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-2.5 py-0.5 text-xs font-medium text-[var(--ink-2)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
`;

const cardTsx = `import type { ReactNode } from "react";
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
`;

const poweredByTsx = `import Image from "next/image";

export function PoweredByBallet({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://ballet.dev?utm_source=github&utm_medium=template&utm_campaign=powered-by"
      target="_blank"
      rel="noopener noreferrer"
      className={\`inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--lilac)]/70 px-2.5 py-1 text-[11px] font-medium text-[var(--deep)] transition hover:bg-[var(--lilac)] \${className}\`}
    >
      <Image src="/ballet-mark-v2.svg" alt="" width={14} height={14} />
      Powered by Ballet workflow
    </a>
  );
}
`;

const siteHeaderTsx = `import Image from "next/image";

export function SiteHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(138,91,209,0.18),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(42,31,94,0.12),transparent_35%),var(--dots)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:px-8">
        <a
          href="https://ballet.dev?utm_source=github&utm_medium=template&utm_campaign=starter-header"
          className="inline-flex w-fit items-center gap-3"
        >
          <Image
            src="/ballet-mark-v2.svg"
            alt="Ballet"
            width={40}
            height={40}
            priority
            className="animate-[float_4s_ease-in-out_infinite]"
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-[var(--ink-2)]">
            BALLET
          </span>
        </a>
        <div className="max-w-2xl animate-[rise_0.7s_ease-out]">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base text-[var(--ink-2)] sm:text-lg">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
`;

const siteFooterTsx = `export function SiteFooter({ slug }: { slug: string }) {
  const href = \`https://ballet.dev?utm_source=github&utm_medium=template&utm_campaign=\${slug}\`;
  return (
    <footer className="border-t border-[var(--line)] bg-white/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-[var(--ink-2)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          Built with Ballet.{" "}
          <a className="font-semibold text-[var(--purple-ink)] underline-offset-4 hover:underline" href={href}>
            Automate this workflow at ballet.dev
          </a>
        </p>
        <p className="text-xs text-[var(--ink-3)]">Demo UI. Wire BALLET_API_KEY and BALLET_WORKFLOW_URL for live runs.</p>
      </div>
    </footer>
  );
}
`;

const globalsCss = `@import "tailwindcss";

:root {
  --paper: #f7f4ef;
  --paper-2: #f0ebe3;
  --ink: #1b1631;
  --ink-2: #4a4460;
  --ink-3: #635c7a;
  --line: #1b16311a;
  --purple: #8a5bd1;
  --purple-ink: #6b3fc0;
  --deep: #2a1f5e;
  --lilac: #efe7fb;
  --mint: #24965c;
  --amber: #b8701c;
  --danger: #a8331d;
  --dots: radial-gradient(#1b16311c 1px, transparent 1.4px) 0 0 / 22px 22px;
  --background: var(--paper);
  --foreground: var(--ink);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-geist-sans), "Geist Variable", system-ui, sans-serif;
}
`;

function envFile() {
  return `BALLET_API_KEY=mt_live_your_workspace_token
BALLET_WORKFLOW_URL=https://api.ballet.dev/api/playbooks/YOUR_PLAYBOOK_ID/execute
`;
}

function layoutTsx(app) {
  return `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "${app.title} | Ballet",
  description: "${app.summary}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={\`\${geistSans.variable} \${geistMono.variable} min-h-screen antialiased\`}>
        {children}
      </body>
    </html>
  );
}
`;
}

function readme(app) {
  const deploy = `https://vercel.com/new/clone?repository-url=${REPO}&root-directory=starters/${app.slug}&env=BALLET_API_KEY,BALLET_WORKFLOW_URL`;
  const v0 = `https://v0.app/chat/api/open?url=${encodeURIComponent(`${RAW}/starters/${app.slug}/README.md`)}`;
  const importUrl = `https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/${app.templateId}&ref=main`;
  const related = app.related
    .map(
      (id) =>
        `- [\`${id}\`](../../templates/${id}) ([Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/${id}&ref=main))`,
    )
    .join('\n');

  return `# ${app.title}

${app.summary}

![Screenshot](./screenshot.svg)

This starter is a backlink and acquisition asset for [Ballet](https://ballet.dev). The Ballet hook is the primary CTA on the page.

## Matching Ballet playbook

Import [\`${app.templateId}\`](../../templates/${app.templateId}) (${app.templateTitle}):

[Import to Ballet](${importUrl})

${related ? `Related templates:\\n${related}\\n` : ''}
## Setup in 3 steps

1. Create the workflow in Ballet by importing \`${app.templateId}\` (or remix an equivalent playbook), then publish it and copy the webhook URL or REST execute URL.
2. Set env vars in \`.env.local\` from \`.env.example\`: \`BALLET_API_KEY\` (workspace API token) and \`BALLET_WORKFLOW_URL\`.
3. Deploy to Vercel (or run \`npm install && npm run dev\` locally). Missing env vars fall back to mock responses so the demo still works.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](${deploy})

[![Open in v0](https://v0.dev/chat-static/button.svg)](${v0})

| Link | URL |
|---|---|
| Deploy with Vercel | ${deploy} |
| Open in v0 | ${v0} |

## Ballet API notes

The route at \`app/api/ballet/route.ts\` POSTs to \`BALLET_WORKFLOW_URL\` with \`Authorization: Bearer $BALLET_API_KEY\`.

- Execute URLs receive \`{ "input": { ... } }\` and may stream SSE (\`run_stop\` carries the output).
- Webhook URLs (path contains \`/webhooks/\`) receive the event payload directly.

Never commit real keys.

## Scripts

\`\`\`bash
npm install
npm run dev
npm run lint
npm run build
\`\`\`
`;
}

function screenshotSvg(app) {
  const title = app.title.replace(/&/g, '&amp;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f4ef"/>
      <stop offset="100%" stop-color="#efe7fb"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <rect x="48" y="48" width="1184" height="624" rx="28" fill="#ffffff" fill-opacity="0.85" stroke="#1b16311a"/>
  <rect x="80" y="88" width="48" height="48" rx="12" fill="#2a1f5e"/>
  <text x="148" y="120" font-family="Geist, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#1b1631">BALLET</text>
  <text x="80" y="210" font-family="Geist, Helvetica, Arial, sans-serif" font-size="42" font-weight="700" fill="#1b1631">${title}</text>
  <text x="80" y="260" font-family="Geist, Helvetica, Arial, sans-serif" font-size="22" fill="#4a4460">${app.summary.slice(0, 90).replace(/&/g, '&amp;')}</text>
  <rect x="80" y="320" width="280" height="48" rx="14" fill="#6b3fc0"/>
  <text x="220" y="351" text-anchor="middle" font-family="Geist, Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">${app.actionLabel.slice(0, 28)}</text>
</svg>
`;
}

const packageDepsPatch = {
  dependencies: {
    'class-variance-authority': '^0.7.1',
    clsx: '^2.1.1',
    'lucide-react': '^0.511.0',
    'tailwind-merge': '^3.3.0',
  },
};

// App-specific pages and API routes
const revopsPage = `"use client";

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
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">\${(forecast / 1000).toFixed(0)}k</p>
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
                style={{ animation: \`rise \${0.45 + i * 0.08}s ease-out\` }}
              >
                <p className="text-sm font-medium text-[var(--deep)]">{s.stage}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{s.count}</p>
                <p className="text-xs text-[var(--ink-3)]">\${(s.amount / 1000).toFixed(0)}k</p>
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
                    <td className="px-4 py-3">\${d.amount.toLocaleString()}</td>
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
`;

const revopsApi = `import { NextResponse } from "next/server";
import { triggerBalletWorkflow } from "@/lib/ballet";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    deals?: Array<Record<string, unknown>>;
  };

  const result = await triggerBalletWorkflow(
    {
      action: body.action ?? "pipeline_hygiene",
      deals: body.deals ?? [],
      stale_days: 14,
    },
    () => ({
      plan: "Mock hygiene plan: assign Harbor Freight Co., refresh Lumen Studios activity, and move overdue close dates before Friday forecast.",
      actions: [
        "Assign an owner to Harbor Freight Co.",
        "Touch Lumen Studios (stale proposal).",
        "Update overdue close dates in Negotiation.",
      ],
      flagged: 2,
      totals: { deals_scanned: body.deals?.length ?? 0, mock: true },
    }),
  );

  return NextResponse.json(result);
}
`;

const leadPage = `"use client";

import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PoweredByBallet } from "@/components/powered-by-ballet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Profile = {
  name: string;
  email: string;
  title: string;
  company: string;
  size: string;
  industry: string;
  fit_score: number;
  summary: string;
  website?: string;
  routing?: { owner: string; queue: string; priority: string };
};

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [mock, setMock] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      company: String(form.get("company") ?? ""),
      title: String(form.get("title") ?? ""),
      website: String(form.get("website") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    try {
      const res = await fetch("/api/ballet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMock(Boolean(data.mock));
      if (!data.success && data.error) setError(data.error);
      setProfile(data.output?.profile ?? data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        title="Lead Enrichment Form"
        subtitle="Capture a lead and let Ballet enrich the company profile, score fit, and suggest a route."
      />
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] sm:px-8">
        <Card className="animate-[rise_0.55s_ease-out]">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Name</span>
                <input name="name" required className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2" placeholder="Jordan Lee" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Work email</span>
                <input name="email" type="email" required className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2" placeholder="jordan@acme.com" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Company</span>
                <input name="company" className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2" placeholder="Acme Robotics" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--ink)]">Title</span>
                <input name="title" className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2" placeholder="Head of RevOps" />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--ink)]">Website</span>
              <input name="website" className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 outline-none ring-[var(--purple)] focus:ring-2" placeholder="https://acme.com" />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--ink)]">What do you need?</span>
              <textarea name="message" rows={4} className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 outline-none ring-[var(--purple)] focus:ring-2" placeholder="Looking to automate inbound routing before our next launch." />
            </label>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" variant="brand" disabled={busy}>
                {busy ? "Enriching…" : "Enrich and route with Ballet"}
              </Button>
              <PoweredByBallet />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          </form>
          <p className="mt-5 text-xs text-[var(--ink-3)]">
            Import{" "}
            <a className="text-[var(--purple-ink)] underline-offset-2 hover:underline" href="https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/inbound-lead-slack-alert&ref=main">
              inbound-lead-slack-alert
            </a>
            {" "}or{" "}
            <a className="text-[var(--purple-ink)] underline-offset-2 hover:underline" href="https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/salesforce-lead-enrichment&ref=main">
              salesforce-lead-enrichment
            </a>
            .
          </p>
        </Card>

        <Card className={\`animate-[rise_0.75s_ease-out] \${profile ? "bg-[var(--lilac)]/35" : ""}\`}>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Enriched profile</h2>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Company, size, industry and fit score from Ballet.</p>
          {!profile ? (
            <p className="mt-8 text-sm text-[var(--ink-3)] animate-[pulse-soft_2.4s_ease-in-out_infinite]">
              Submit a lead to see the enriched card.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {mock && <Badge>Mock</Badge>}
                <Badge className="border-transparent bg-[var(--deep)] text-white">
                  Fit {profile.fit_score}
                </Badge>
                {profile.routing && <Badge>{profile.routing.priority}</Badge>}
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--ink)]">{profile.company}</p>
                <p className="text-sm text-[var(--ink-2)]">
                  {profile.name} · {profile.title || "Contact"} · {profile.email}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[var(--ink-3)]">Size</dt>
                  <dd className="font-medium text-[var(--ink)]">{profile.size}</dd>
                </div>
                <div>
                  <dt className="text-[var(--ink-3)]">Industry</dt>
                  <dd className="font-medium text-[var(--ink)]">{profile.industry}</dd>
                </div>
              </dl>
              <p className="text-sm text-[var(--ink-2)]">{profile.summary}</p>
              {profile.routing && (
                <p className="text-sm text-[var(--ink)]">
                  Route to <span className="font-semibold">{profile.routing.owner}</span> ({profile.routing.queue})
                </p>
              )}
            </div>
          )}
        </Card>
      </main>
      <SiteFooter slug="lead-enrichment-form" />
    </div>
  );
}
`;

const leadApi = `import { NextResponse } from "next/server";
import { triggerBalletWorkflow } from "@/lib/ballet";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    company?: string;
    title?: string;
    website?: string;
    message?: string;
  };

  if (!body.email) {
    return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
  }

  const domain = body.email.includes("@") ? body.email.split("@")[1] : "example.com";
  const company = body.company || domain;

  const result = await triggerBalletWorkflow(
    {
      name: body.name ?? "",
      email: body.email,
      company,
      title: body.title ?? "",
      website: body.website ?? \`https://\${domain}\`,
      message: body.message ?? "",
    },
    () => ({
      profile: {
        name: body.name ?? "Jordan Lee",
        email: body.email,
        title: body.title ?? "Head of RevOps",
        company,
        size: "51-200",
        industry: "Software",
        fit_score: 82,
        summary: \`Mock enrichment for \${company}: B2B software buyer signals look strong for mid-market automation.\`,
        website: body.website ?? \`https://\${domain}\`,
        routing: {
          owner: "enterprise-ae@example.com",
          queue: "enterprise",
          priority: "hot",
        },
      },
    }),
  );

  return NextResponse.json(result);
}
`;

const invoicePage = `"use client";

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
      setNote(data.output?.summary ?? \`Marked \${selected.id} as \${status}.\`);
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
              className={\`rounded-full px-3 py-1.5 text-sm capitalize transition \${
                filter === f
                  ? "bg-[var(--deep)] text-white"
                  : "border border-[var(--line)] bg-white/70 text-[var(--ink-2)] hover:bg-white"
              }\`}
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
                    className={\`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[var(--lilac)]/30 \${
                      selected?.id === inv.id ? "bg-[var(--lilac)]/45" : ""
                    }\`}
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
`;

const invoiceApi = `import { NextResponse } from "next/server";
import { triggerBalletWorkflow } from "@/lib/ballet";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    invoice_id?: string;
    vendor?: string;
    amount?: number;
    currency?: string;
    decision?: string;
    decided_by?: string;
    reason?: string;
    due_date?: string;
    memo?: string;
  };

  if (!body.invoice_id || !body.decision) {
    return NextResponse.json(
      { success: false, error: "invoice_id and decision are required" },
      { status: 400 },
    );
  }

  const decision = String(body.decision).toLowerCase().startsWith("approve")
    ? "approve"
    : "reject";

  const result = await triggerBalletWorkflow(
    {
      invoice_id: body.invoice_id,
      vendor: body.vendor ?? "",
      amount: body.amount ?? 0,
      currency: body.currency ?? "USD",
      decision,
      decided_by: body.decided_by ?? "finance-ops@example.com",
      reason: body.reason ?? "",
      due_date: body.due_date ?? "",
      memo: body.memo ?? "",
    },
    () => ({
      invoice_id: body.invoice_id,
      decision,
      status: decision === "approve" ? "approved" : "rejected",
      summary: \`Mock Ballet run: \${decision === "approve" ? "Approved" : "Rejected"} \${body.invoice_id} for \${body.vendor ?? "vendor"} (\${body.currency ?? "USD"} \${Number(body.amount ?? 0).toLocaleString()}).\`,
      decided_at: new Date().toISOString(),
    }),
  );

  return NextResponse.json(result);
}
`;

const pages = {
  'revops-pipeline-dashboard': { page: revopsPage, api: revopsApi },
  'lead-enrichment-form': { page: leadPage, api: leadApi },
  'invoice-approval-inbox': { page: invoicePage, api: invoiceApi },
};

for (const app of apps) {
  const dir = join(starters, app.slug);
  if (!existsSync(dir)) {
    console.error('missing starter scaffold:', app.slug);
    process.exit(1);
  }

  write(join(dir, 'lib/utils.ts'), utilsTs);
  write(join(dir, 'lib/ballet.ts'), balletClientTs);
  write(join(dir, 'components/ui/button.tsx'), buttonTsx);
  write(join(dir, 'components/ui/badge.tsx'), badgeTsx);
  write(join(dir, 'components/ui/card.tsx'), cardTsx);
  write(join(dir, 'components/powered-by-ballet.tsx'), poweredByTsx);
  write(join(dir, 'components/site-header.tsx'), siteHeaderTsx);
  write(join(dir, 'components/site-footer.tsx'), siteFooterTsx);
  write(join(dir, 'app/globals.css'), globalsCss);
  write(join(dir, 'app/layout.tsx'), layoutTsx(app));
  write(join(dir, 'app/page.tsx'), pages[app.slug].page);
  write(join(dir, 'app/api/ballet/route.ts'), pages[app.slug].api);
  write(join(dir, '.env.example'), envFile());
  write(join(dir, 'README.md'), readme(app).replace(/\\n/g, '\n'));
  write(join(dir, 'screenshot.svg'), screenshotSvg(app));

  // patch package.json deps and scripts (webpack build for CI reliability)
  const pkgPath = join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = app.slug;
  pkg.scripts = {
    ...pkg.scripts,
    build: 'next build',
    dev: 'next dev',
  };
  pkg.dependencies = { ...pkg.dependencies, ...packageDepsPatch.dependencies };
  write(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

console.log('\\nScaffold files written for', apps.length, 'starters.');
