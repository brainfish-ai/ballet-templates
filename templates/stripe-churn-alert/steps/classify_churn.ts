const { subscription, hubspot_notes, skipped } = input_data as {
  subscription?: {
    plan_name: string;
    amount: number;
    currency: string;
    cancellation_reason: string;
    customer_name: string;
    skipped?: boolean | string;
  };
  hubspot_notes?: string;
  skipped?: boolean | string;
};

let result;

if (skipped === true || skipped === 'true' || subscription?.skipped === true || subscription?.skipped === 'true') {
  result = { skipped: true };
} else {
  const prompt = `Customer: ${subscription!.customer_name}
Plan: ${subscription!.plan_name} (${subscription!.currency} ${subscription!.amount / 100})
Cancellation reason from Stripe: ${subscription!.cancellation_reason}
HubSpot notes: ${hubspot_notes ?? 'none'}`;

  const res = await metaphor.agent('churn-classifier', { prompt });

  const churn_category = String(res?.category ?? 'unknown');
  const reason_summary = String(res?.summary ?? 'No reason provided').slice(0, 300);

  const summary = `Churn detected: ${subscription!.customer_name} cancelled ${subscription!.plan_name}. Reason: ${reason_summary}. Category: ${churn_category}.`;

  const slack_message = `:warning: *Churn Alert*: ${subscription!.customer_name} cancelled *${subscription!.plan_name}* (${subscription!.currency} ${subscription!.amount / 100}).\n*Reason*: ${reason_summary}\n*Category*: ${churn_category}\nView in HubSpot or Stripe.`;

  result = {
    category: churn_category,
    summary: reason_summary,
    slack_message,
  };
}
