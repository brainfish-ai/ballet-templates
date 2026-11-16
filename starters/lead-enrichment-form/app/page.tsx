"use client";

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

        <Card className={`animate-[rise_0.75s_ease-out] ${profile ? "bg-[var(--lilac)]/35" : ""}`}>
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
