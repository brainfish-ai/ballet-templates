const { failure_details } = input_data as {
  failure_details: {
    customer_name: string;
    amount_due: number;
    currency: string;
    attempt_count: number;
    failure_reason: string;
    invoice_url: string;
    next_payment_attempt: string | null;
  };
};

const { customer_name, amount_due, currency, attempt_count, failure_reason, invoice_url, next_payment_attempt } = failure_details;

const amount_formatted = `${currency} ${(amount_due / 100).toFixed(2)}`;

let payment_status = 'payment_failed';
let escalation_level = 'low';
let should_draft_email = false;
let slack_urgency = '';

if (attempt_count === 1 || attempt_count === 2) {
  payment_status = 'payment_failed_retry_scheduled';
  escalation_level = 'low';
  should_draft_email = false;
  slack_urgency = 'Initial failure';
} else if (attempt_count === 3) {
  payment_status = 'payment_failed_needs_attention';
  escalation_level = 'medium';
  should_draft_email = true;
  slack_urgency = ':warning: 3rd attempt failed';
} else if (attempt_count >= 4) {
  payment_status = 'payment_failed_escalated';
  escalation_level = 'high';
  should_draft_email = true;
  slack_urgency = ':rotating_light: ESCALATED (4+ failures)';
}

if (amount_due >= 50000) {
  escalation_level = 'high';
  slack_urgency = `:rotating_light: ${slack_urgency} - High value invoice`;
}

const failure_summary = `Payment failed (attempt ${attempt_count}). Amount: ${amount_formatted}. Reason: ${failure_reason}. ${next_payment_attempt ? `Next retry: ${next_payment_attempt}` : 'No retry scheduled.'} Status: ${payment_status}.`;

const slack_message = `${slack_urgency}\n*Payment Failed*: ${customer_name}\n*Invoice*: ${amount_formatted} (attempt ${attempt_count})\n*Reason*: ${failure_reason}\n*Status*: ${payment_status}\n${next_payment_attempt ? `Next retry: ${next_payment_attempt}` : 'No retry scheduled.'}\n${should_draft_email ? 'Customer email will be sent after approval.' : 'Internal alert only.'}\nView invoice: ${invoice_url}`;

const result = {
  payment_status,
  escalation_level,
  should_draft_email,
  failure_summary,
  slack_message,
};
