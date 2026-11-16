const input = input_data as {
  invoice_id: string;
  vendor?: string;
  amount?: number | string;
  currency?: string;
  decision: string;
  decided_by?: string;
  reason?: string;
  due_date?: string;
  memo?: string;
};

const raw = String(input.decision ?? '').trim().toLowerCase();
const decision = raw === 'approve' || raw === 'approved' ? 'approve' : raw === 'reject' || raw === 'rejected' ? 'reject' : '';

if (!decision) {
  throw new Error('decision must be approve or reject');
}
if (!input.invoice_id) {
  throw new Error('invoice_id is required');
}

const amount = Number(input.amount);
const currency = String(input.currency ?? 'USD');

const res = await metaphor.agent('invoice-approval-scribe', {
  prompt: [
    `Invoice: ${input.invoice_id}`,
    `Vendor: ${input.vendor ?? 'unknown'}`,
    `Amount: ${Number.isFinite(amount) ? amount : 'unknown'} ${currency}`,
    `Decision: ${decision}`,
    `Decided by: ${input.decided_by ?? 'unknown'}`,
    `Reason: ${input.reason ?? ''}`,
    `Due date: ${input.due_date ?? ''}`,
    `Memo: ${input.memo ?? ''}`,
  ].join('\n'),
});

const summary =
  typeof res === 'string'
    ? res
    : String(res?.summary ?? `${decision === 'approve' ? 'Approved' : 'Rejected'} invoice ${input.invoice_id}.`);

const result = {
  invoice_id: input.invoice_id,
  vendor: input.vendor ?? '',
  amount: Number.isFinite(amount) ? amount : null,
  currency,
  decision,
  status: decision === 'approve' ? 'approved' : 'rejected',
  decided_by: input.decided_by ?? '',
  reason: input.reason ?? '',
  due_date: input.due_date ?? '',
  memo: input.memo ?? '',
  summary: summary.slice(0, 400),
  decided_at: new Date().toISOString(),
};
