/**
 * Test fixtures for Ballet template webhooks
 */

const fixtures = {
  // Stripe native webhook - subscription updated
  stripeSubscriptionUpdated: {
    source: 'stripe',
    event: 'customer.subscription.updated',
    object: {
      id: 'sub_123',
      customer: 'cus_123',
      cancel_at_period_end: true,
      status: 'active',
      current_period_end: 1735689600,
      items: {
        data: [
          {
            plan: {
              nickname: 'Pro Plan',
              amount: 5000,
              currency: 'usd',
              interval: 'month',
            },
          },
        ],
      },
    },
    headers: {},
    raw: {
      previous_attributes: {
        cancel_at_period_end: false,
      },
    },
  },

  // Stripe native webhook - invoice payment failed
  stripeInvoicePaymentFailed: {
    source: 'stripe',
    event: 'invoice.payment_failed',
    object: {
      id: 'in_123',
      customer: 'cus_123',
      amount_due: 5000,
      currency: 'usd',
      attempt_count: 2,
      hosted_invoice_url: 'https://invoice.stripe.com/i/123',
    },
    headers: {},
    raw: {},
  },

  // Zendesk native webhook - satisfaction rating created
  zendeskSatisfactionRating: {
    source: 'zendesk',
    event: 'satisfaction_rating.created',
    ticket: {
      id: 123,
      subject: 'Test Ticket',
      description: 'Customer is unhappy with service',
      status: 'open',
      satisfaction_rating: {
        score: 'bad',
        comment: 'Response was too slow',
      },
      requester: {
        email: 'customer@example.com',
      },
    },
    headers: {},
    raw: {},
  },

  // Zendesk native webhook - ticket created
  zendeskTicketCreated: {
    source: 'zendesk',
    event: 'ticket.created',
    ticket: {
      id: 456,
      subject: 'Billing Question',
      description: 'I need help with my invoice',
      status: 'new',
      priority: 'normal',
    },
    headers: {},
    raw: {},
  },

  // HubSpot generic webhook - deal stage changed
  hubspotDealStageChanged: [
    {
      objectId: 'deal123',
      propertyName: 'dealstage',
      propertyValue: 'closedwon',
      changeSource: 'CRM',
      eventId: 1,
      subscriptionId: 12345,
      portalId: 123456,
      appId: 12345,
      occurredAt: Date.now(),
      subscriptionType: 'deal.propertyChange',
    },
  ],

  // Generic webhook - inbound lead
  genericInboundLead: {
    name: 'Jane Smith',
    email: 'jane@acme.com',
    company: 'Acme Corp',
    message: 'Interested in enterprise plan',
    slack_channel: 'C123456',
  },
};

module.exports = fixtures;
