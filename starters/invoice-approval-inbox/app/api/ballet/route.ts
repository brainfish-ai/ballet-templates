import { NextResponse } from "next/server";
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
      summary: `Mock Ballet run: ${decision === "approve" ? "Approved" : "Rejected"} ${body.invoice_id} for ${body.vendor ?? "vendor"} (${body.currency ?? "USD"} ${Number(body.amount ?? 0).toLocaleString()}).`,
      decided_at: new Date().toISOString(),
    }),
  );

  return NextResponse.json(result);
}
