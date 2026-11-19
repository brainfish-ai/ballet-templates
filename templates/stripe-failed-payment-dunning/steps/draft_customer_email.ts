const { should_draft, customer_email, customer_name, invoice_url, amount_due, currency } = input_data as {
  should_draft: boolean;
  customer_email: string;
  customer_name: string;
  invoice_url: string;
  amount_due: number;
  currency: string;
};

let result;

if (!should_draft || !customer_email || customer_email === 'unknown') {
  result = { drafted: false, sent: false, message: 'Email draft skipped per dunning rules or missing customer email.' };
} else {

const amount_formatted = `${currency} ${(amount_due / 100).toFixed(2)}`;

const prompt = `Customer: ${customer_name}
Invoice amount: ${amount_formatted}
Invoice URL: ${invoice_url}

Write a professional, empathetic email to the customer notifying them that their payment failed and asking them to update their payment method. Keep it short (3 to 4 sentences). Include the invoice amount and a link to retry the payment.`;

const res = await metaphor.agent('dunning-email-writer', { prompt });

const email_body = String(res?.email_body ?? `Hi ${customer_name},\n\nWe noticed that your recent payment of ${amount_formatted} was declined. Please update your payment method to avoid service interruption.\n\nYou can retry the payment here: ${invoice_url}\n\nThank you!`);

const subject = `Payment Update Needed: ${amount_formatted} invoice`;

// Request approval before sending
const approval = metaphor.waitForInput({
  prompt: `Review and approve email to ${customer_name} (${customer_email})`,
  details: `Subject: ${subject}\n\n${email_body}`,
  schema: {
    type: 'object',
    properties: {
      approved: {
        type: 'boolean',
        description: 'Approve to send this email',
      },
      edited_body: {
        type: 'string',
        description: 'Optional: edit the email body before sending',
      },
    },
    required: ['approved'],
  },
});

  if (!approval.approved) {
    result = { drafted: true, sent: false, message: 'Email not sent: approval denied.' };
  } else {
    const final_body = approval.edited_body || email_body;

    // Send the email
    const sendResult = metaphor.integration('gmail', 'messages.send', {
      to: [customer_email],
      subject,
      body: final_body,
      contentType: 'text/plain',
    });

    if (!sendResult.ok) {
      throw new Error(`Failed to send email: ${sendResult.error}`);
    }

    result = {
      drafted: true,
      sent: true,
      to: customer_email,
      message: `Email sent to ${customer_email}`,
    };
  }
}
