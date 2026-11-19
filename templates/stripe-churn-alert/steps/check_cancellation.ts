// Read from flow.input which contains the native Stripe webhook payload
const webhook = (input_data as any).event || input_data;
const eventType = webhook.event || webhook.type || '';
const subscription = webhook.object || {};
const previous = webhook.raw?.previous_attributes || webhook.raw?.data?.previous_attributes || {};

// Check if this is a cancellation event - only alert when cancel_at_period_end changed false->true
const isDeleted = eventType === 'customer.subscription.deleted';
const wasCancelledJustNow = subscription.cancel_at_period_end === true && previous.cancel_at_period_end === false;
const isCancellation = isDeleted || wasCancelledJustNow;

let result;

if (!isCancellation) {
  result = {
    skipped: true,
    reason: 'Not a cancellation event or cancel_at_period_end was already true',
    event_type: eventType,
  };
} else {

  const subscription_id = subscription.id;
  const customer_id = subscription.customer;

  // Get full customer details from Stripe
  const customerResult = await metaphor.integration('stripe', 'customers.get', {
    customerId: customer_id,
  });

  if (!customerResult.ok) {
    throw new Error(`Failed to fetch customer: ${customerResult.error?.message ?? JSON.stringify(customerResult.error)}`);
  }

  const customer = customerResult.data;
  const plan = subscription.items?.data?.[0]?.plan || subscription.plan;
  const plan_name = plan?.nickname || `${plan?.currency?.toUpperCase()} ${(plan?.amount || 0) / 100}/${plan?.interval}`;

  // Handle current_period_end from subscription or items.data[0]
  const period_end = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end ?? subscription.ended_at;
  const subscription_end = period_end ? new Date(period_end * 1000).toISOString() : 'N/A';

  result = {
    skipped: false,
    subscription_id,
    customer_id,
    customer_email: customer.email || 'unknown',
    customer_name: customer.name || 'Unknown Customer',
    plan_name,
    amount: plan?.amount || 0,
    currency: plan?.currency?.toUpperCase() || 'USD',
    subscription_end,
    cancellation_reason: subscription.cancellation_details?.reason || subscription.metadata?.cancellation_reason || 'not provided',
  };
}
