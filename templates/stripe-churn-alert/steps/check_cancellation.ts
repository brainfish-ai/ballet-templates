const { subscription_id, customer_id, cancel_at_period_end, current_period_end } = input_data as {
  subscription_id: string;
  customer_id: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
};

if (!cancel_at_period_end) {
  throw new Error('Subscription not cancelled (cancel_at_period_end is false). Exiting workflow.');
}

const stripeKey = metaphor.secret('STRIPE_API_KEY');

const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription_id}`, {
  headers: {
    'Authorization': `Bearer ${stripeKey}`,
  },
});

if (!subRes.ok) {
  throw new Error(`Stripe API error: ${subRes.status} ${subRes.statusText}`);
}

const subscription = await subRes.json() as {
  id: string;
  customer: string;
  cancel_at_period_end: boolean;
  current_period_end: number;
  items: { data: Array<{ plan: { nickname?: string; amount: number; currency: string; interval: string } }> };
  metadata?: Record<string, string>;
};

const customerRes = await fetch(`https://api.stripe.com/v1/customers/${customer_id}`, {
  headers: {
    'Authorization': `Bearer ${stripeKey}`,
  },
});

if (!customerRes.ok) {
  throw new Error(`Stripe customer API error: ${customerRes.status} ${customerRes.statusText}`);
}

const customer = await customerRes.json() as {
  id: string;
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
};

const plan = subscription.items.data[0]?.plan;
const plan_name = plan?.nickname ?? `${plan?.currency.toUpperCase()} ${plan?.amount / 100}/${plan?.interval}`;
const subscription_end = new Date((current_period_end ?? subscription.current_period_end) * 1000).toISOString();

const result = {
  subscription_id,
  customer_id,
  customer_email: customer.email ?? 'unknown',
  customer_name: customer.name ?? 'Unknown Customer',
  plan_name,
  amount: plan?.amount ?? 0,
  currency: plan?.currency?.toUpperCase() ?? 'USD',
  subscription_end,
  cancellation_reason: subscription.metadata?.cancellation_reason ?? 'not provided',
};
