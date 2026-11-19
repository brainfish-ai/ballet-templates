// Read from flow.input which contains the native Stripe webhook payload
const webhook = input_data as any;
const eventType = webhook.type || '';
const subscription = webhook.object || {};
const previous = webhook.raw?.previous_attributes || webhook.raw?.data?.previous_attributes || {};

// Check if this is a cancellation event
const isCancellation = eventType === 'customer.subscription.deleted' || subscription.cancel_at_period_end === true || subscription.status === 'canceled';

if (!isCancellation) {
  const result = {
    skipped: true,
    reason: 'Not a cancellation event',
    event_type: eventType,
  };
  return;
}

const subscription_id = subscription.id;
const customer_id = subscription.customer;

// Get full customer details from Stripe
const customerResult = metaphor.integration('stripe', 'customers.get', {
  customerId: customer_id,
});

if (!customerResult.ok) {
  throw new Error(`Failed to fetch customer: ${customerResult.error}`);
}

const customer = customerResult.data;
const plan = subscription.items?.data?.[0]?.plan || subscription.plan;
const plan_name = plan?.nickname || `${plan?.currency?.toUpperCase()} ${(plan?.amount || 0) / 100}/${plan?.interval}`;
const subscription_end = new Date((subscription.current_period_end || subscription.ended_at) * 1000).toISOString();

const result = {
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
