import { NextResponse } from "next/server";
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
      website: body.website ?? `https://${domain}`,
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
        summary: `Mock enrichment for ${company}: B2B software buyer signals look strong for mid-market automation.`,
        website: body.website ?? `https://${domain}`,
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
