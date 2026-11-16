import type { EnrichmentOutput, LeadInput } from "@/lib/types";
import { STEP_TITLES } from "@/lib/types";

export function buildMockOutput(lead: LeadInput): EnrichmentOutput {
  const domain = lead.email.includes("@") ? lead.email.split("@")[1]! : "example.com";
  const company = lead.company || domain.replace(/\..+$/, "");
  return {
    person: {
      name: lead.name || "Jordan Lee",
      email: lead.email,
      title: lead.title || "Head of RevOps",
      seniority: "Director",
      linkedin_url: "https://www.linkedin.com/in/example",
      x_url: null,
      location: "San Francisco, CA",
      photo_url: null,
      bio: "Builds GTM systems for product-led teams.",
      headline: lead.title || "Head of RevOps",
    },
    company: {
      name: company,
      domain,
      website: lead.website || `https://${domain}`,
      industry: "Software",
      founded: 2018,
      headquarters: "San Francisco, CA",
      employee_count: "51-200",
      funding: "Series B",
      summary: `${company} sells workflow automation for RevOps and CS Ops teams.`,
      products: ["Pipeline hygiene", "Lead routing", "Forecasting"],
      tech_stack: ["Salesforce", "HubSpot", "Slack"],
    },
    website: {
      pages_crawled: ["/", "/product", "/pricing"],
      highlights: [
        "Positions around cross-system automation",
        "Calls out RevOps and CS Ops as buyers",
      ],
    },
    fit: {
      score: 84,
      reasons: [
        "Buyer title maps to RevOps ownership",
        "Company size fits mid-market ICP",
        "Stack includes CRM systems Ballet already connects",
      ],
    },
    next_step: "Send a short opener and offer a 20-minute workflow teardown.",
    opener: `Hi ${lead.name?.split(" ")[0] || "there"}, noticed ${company} is scaling RevOps across CRM and support. Ballet can turn those handoffs into reviewable playbooks in about five minutes. Open to a quick look this week?`,
    sources: [
      { title: `${company} website`, url: lead.website || `https://${domain}` },
      { title: "Sample firmographic match", url: "https://ballet.dev" },
    ],
  };
}

export type MockBalletFrame = { event: string; data: unknown; delayMs: number };

/** Produces Ballet-shaped SSE frames for offline / unreachable demo mode. */
export function mockBalletFrames(lead: LeadInput): MockBalletFrame[] {
  const output = buildMockOutput(lead);
  const steps = [
    {
      id: "people_lookup",
      title: STEP_TITLES[0],
      activity: `Looking up ${lead.email} across public people graphs…`,
    },
    {
      id: "site_crawl",
      title: STEP_TITLES[1],
      activity: `Crawling ${output.company?.website || "company site"} for product and ICP clues…`,
    },
    {
      id: "fit_opener",
      title: STEP_TITLES[2],
      activity: "Scoring fit and drafting a first-touch opener…",
    },
  ];

  const frames: MockBalletFrame[] = [
    { event: "run_start", data: { mode: "mock" }, delayMs: 0 },
    {
      event: "run_delta",
      data: { delta: { type: "status_delta", message: "Starting enrichment run" } },
      delayMs: 120,
    },
  ];

  steps.forEach((step, index) => {
    frames.push({
      event: "step_start",
      data: {
        index,
        step: {
          id: step.id,
          description: step.title,
          friendlyMessage: step.title,
        },
      },
      delayMs: index === 0 ? 200 : 350,
    });
    frames.push({
      event: "step_delta",
      data: {
        stepId: step.id,
        delta: { type: "agent_activity_delta", message: step.activity },
      },
      delayMs: 450,
    });
    frames.push({
      event: "step_stop",
      data: {
        stepId: step.id,
        result: { status: "completed", durationMs: 700 + index * 180, output: null },
      },
      delayMs: 500,
    });
  });

  frames.push({
    event: "run_stop",
    data: { run: { status: "completed", success: true, output } },
    delayMs: 250,
  });

  return frames;
}

export function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
