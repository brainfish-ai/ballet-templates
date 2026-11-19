const { invoice_id, customer_id, amount_due, attempt_count } = input_data as {
  invoice_id: string;
  customer_id: string;
  amount_due?: number;
  attempt_count?: number;
};

const stripeKey = metaphor.secret('STRIPE_API_KEY');

const invoiceRes = await fetch(`https://api.stripe.com/v1/invoices/${invoice_id}`, {
  headers: {
    'Authorization': `Bearer ${stripeKey}`,
  },
});

if (!invoiceRes.ok) {
  throw new Error(`Stripe invoice API error: ${invoiceRes.status} ${invoiceRes.statusText}`);
}

const invoice = await invoiceRes.json() as {
  id: string;
  customer: string;
  amount_due: number;
  currency: string;
  attempt_count: number;
  next_payment_attempt: number | null;
  hosted_invoice_url?: string;
  charge?: string;
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
};

let failure_reason = 'Unknown';

if (invoice.charge) {
  const chargeRes = await fetch(`https://api.stripe.com/v1/charges/${invoice.charge}`, {
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
    },
  });

  if (chargeRes.ok) {
    const charge = await chargeRes.json() as { failure_message?: string };
    failure_reason = charge.failure_message ?? 'Declined';
  }
}

const result = {
  invoice_id,
  customer_id,
  customer_email: customer.email ?? 'unknown',
  customer_name: customer.name ?? 'Unknown Customer',
  amount_due: amount_due ?? invoice.amount_due,
  currency: invoice.currency.toUpperCase(),
  attempt_count: attempt_count ?? invoice.attempt_count,
  failure_reason,
  invoice_url: invoice.hosted_invoice_url ?? `https://dashboard.stripe.com/invoices/${invoice_id}`,
  next_payment_attempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
};
