import { NextResponse } from "next/server";
import { triggerBalletWorkflow } from "@/lib/ballet";

type LeadBody = {
  name?: string;
  email?: string;
  company?: string;
  title?: string;
  website?: string;
  message?: string;
};

function mockProfile(body: LeadBody, company: string, domain: string) {
  return {
    profile: {
      name: body.name || "Jordan Lee",
      email: body.email || `jordan@${domain}`,
      title: body.title || "Head of RevOps",
      company,
      size: "51-200",
      industry: "Software",
      fit_score: 82,
      summary: `Mock enrichment for ${company}: B2B software buyer signals look strong for mid-market automation.`,
      website: body.website || `https://${domain}`,
      routing: {
        owner: "enterprise-ae@example.com",
        queue: "enterprise",
        priority: "hot",
      },
    },
  };
}

function normalizeOutput(output: unknown, body: LeadBody, company: string, domain: string) {
  if (output && typeof output === "object" && "profile" in (output as object)) {
    return output;
  }
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    // salesforce-lead-enrichment style: brief + rating
    if (typeof o.brief === "string" || typeof o.rating === "string") {
      const rating = String(o.rating ?? "Warm");
      const fit =
        /hot|a\+/i.test(rating) ? 90 : /warm|a\b/i.test(rating) ? 72 : /cold|c\b/i.test(rating) ? 35 : 60;
      return {
        profile: {
          name: body.name || "",
          email: body.email || "",
          title: body.title || "",
          company,
          size: "Unknown",
          industry: "Unknown",
          fit_score: fit,
          summary: String(o.brief ?? o.summary ?? "Ballet enrichment completed."),
          website: body.website || `https://${domain}`,
          routing: {
            owner: "inbound-queue@example.com",
            queue: "general-inbound",
            priority: fit >= 80 ? "hot" : fit >= 60 ? "warm" : "nurture",
          },
        },
      };
    }
  }
  return mockProfile(body, company, domain);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LeadBody;

  if (!body.email) {
    return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
  }

  const domain = body.email.includes("@") ? body.email.split("@")[1]! : "example.com";
  const company = body.company || domain;
  // Compatible with salesforce-lead-enrichment inputSchema (lead_id + company required)
  // and inbound-lead-slack-alert (email required, optional name/company/message).
  const input = {
    lead_id: `demo-${Date.now()}`,
    name: body.name ?? "",
    email: body.email,
    company,
    title: body.title ?? "",
    website: body.website ?? `https://${domain}`,
    message: body.message ?? "",
  };

  const result = await triggerBalletWorkflow(input, () => mockProfile(body, company, domain));
  const output = normalizeOutput(result.output, body, company, domain);

  return NextResponse.json({
    ...result,
    output,
  });
}
