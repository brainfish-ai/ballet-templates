const { should_draft, customer_email, customer_name, invoice_url, amount_due, currency } = input_data as {
  should_draft: boolean;
  customer_email: string;
  customer_name: string;
  invoice_url: string;
  amount_due: number;
  currency: string;
};

if (!should_draft || !customer_email || customer_email === 'unknown') {
  const result = { drafted: false, message: 'Email draft skipped per dunning rules or missing customer email.' };
  return;
}

const amount_formatted = `${currency} ${(amount_due / 100).toFixed(2)}`;

const prompt = `Customer: ${customer_name}
Invoice amount: ${amount_formatted}
Invoice URL: ${invoice_url}

Write a professional, empathetic email to the customer notifying them that their payment failed and asking them to update their payment method. Keep it short (3 to 4 sentences). Include the invoice amount and a link to retry the payment.`;

const res = await metaphor.agent('dunning-email-writer', { prompt });

const email_body = String(res?.email_body ?? `Hi ${customer_name},\n\nWe noticed that your recent payment of ${amount_formatted} was declined. Please update your payment method to avoid service interruption.\n\nYou can retry the payment here: ${invoice_url}\n\nThank you!`);

function check<T>(res: { ok: boolean; data?: T; error?: { message?: string } }, what: string): T {
  if (!res.ok) {
    throw new Error(`${what} failed: ${res.error?.message ?? 'unknown error'}. Check the Gmail connection and try again.`);
  }
  return res.data as T;
}

const draftRes = check(
  await metaphor.integration('gmail', 'drafts.create', {
    to: [customer_email],
    subject: `Payment Update Needed: ${amount_formatted} invoice`,
    body: email_body,
    contentType: 'text',
  }),
  'Creating Gmail draft',
);

const draft_id = (draftRes as { id?: string })?.id ?? 'unknown';

const result = {
  drafted: true,
  draft_id,
  to: customer_email,
  message: `Email drafted for review. Draft ID: ${draft_id}. Review and send from Gmail.`,
};
