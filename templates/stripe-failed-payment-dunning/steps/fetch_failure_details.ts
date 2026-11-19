// Read from native Stripe webhook payload
const webhook = input_data as any;
const invoice = webhook.object || {};

const invoice_id = invoice.id;
const customer_id = invoice.customer;

// Get full invoice details
const invoiceResult = metaphor.integration('stripe', 'invoices.get', {
  invoiceId: invoice_id,
});

if (!invoiceResult.ok) {
  throw new Error(`Failed to fetch invoice: ${invoiceResult.error}`);
}

const invoiceData = invoiceResult.data;

// Get customer details
const customerResult = metaphor.integration('stripe', 'customers.get', {
  customerId: customer_id,
});

if (!customerResult.ok) {
  throw new Error(`Failed to fetch customer: ${customerResult.error}`);
}

const customer = customerResult.data;

// Get failure reason from payment intent
let failure_reason = 'Unknown';
if (invoiceData.payment_intent) {
  const paymentIntentResult = metaphor.integration('stripe', 'paymentIntents.get', {
    paymentIntentId: invoiceData.payment_intent,
  });

  if (paymentIntentResult.ok) {
    const lastError = paymentIntentResult.data?.last_payment_error;
    failure_reason = lastError?.message || lastError?.code || 'Declined';
  }
}

const result = {
  invoice_id,
  customer_id,
  customer_email: customer.email || 'unknown',
  customer_name: customer.name || 'Unknown Customer',
  amount_due: invoiceData.amount_due,
  currency: invoiceData.currency.toUpperCase(),
  attempt_count: invoiceData.attempt_count || 1,
  failure_reason,
  invoice_url: invoiceData.hosted_invoice_url || `https://dashboard.stripe.com/invoices/${invoice_id}`,
  next_payment_attempt: invoiceData.next_payment_attempt ? new Date(invoiceData.next_payment_attempt * 1000).toISOString() : null,
};
