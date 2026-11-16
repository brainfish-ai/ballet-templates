import { NextResponse } from "next/server";
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
