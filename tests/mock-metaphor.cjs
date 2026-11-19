/**
 * Mock metaphor object for testing Ballet templates
 */

const mockMetaphor = {
  /**
   * Mock integration call
   * Returns realistic response shapes for various integrations
   */
  integration: async (integrationId, action, params) => {
    // HubSpot mocks
    if (integrationId === 'hubspot') {
      if (action === 'contacts.search') {
        return {
          ok: true,
          data: {
            results: [
              {
                id: '12345',
                properties: {
                  email: params.filterGroups?.[0]?.filters?.[0]?.value || 'test@example.com',
                  firstname: 'Test',
                  lastname: 'User',
                  hubspot_owner_id: '67890',
                  hs_latest_source: 'Direct traffic',
                  notes_last_updated: 'Recent activity',
                },
              },
            ],
          },
        };
      }
      if (action === 'contacts.get') {
        return {
          ok: true,
          data: {
            id: params.contactId,
            properties: {
              email: 'test@example.com',
              firstname: 'Test',
              lastname: 'User',
              hubspot_owner_id: '67890',
              hs_latest_source: 'Direct traffic',
            },
            associations: {
              companies: {
                results: [{ id: 'comp123' }],
              },
            },
          },
        };
      }
      if (action === 'contacts.update') {
        return { ok: true, data: { id: params.contactId } };
      }
      if (action === 'api.get') {
        return {
          ok: true,
          data: {
            data: {
              email: 'owner@example.com',
            },
          },
        };
      }
      if (action === 'deals.get') {
        return {
          ok: true,
          data: {
            properties: {
              dealname: 'Test Deal',
              amount: 100000,
              closedate: '2024-01-01',
              hubspot_owner_id: '67890',
              hs_priority: 'high',
            },
            associations: {
              contacts: { results: [] },
              companies: { results: [] },
            },
          },
        };
      }
      if (action === 'deals.search') {
        return {
          ok: true,
          data: {
            results: [
              {
                id: 'deal123',
                properties: {
                  dealname: 'Test Deal',
                  amount: '50000',
                  dealstage: 'proposal',
                  closedate: '2024-12-31',
                  pipeline: 'default',
                  hubspot_owner_id: '67890',
                },
              },
            ],
            paging: {},
          },
        };
      }
    }

    // Slack mocks
    if (integrationId === 'slack_bot') {
      if (action === 'messages.send') {
        return {
          ok: true,
          data: {
            ts: '1234567890.123456',
            channel: params.channel,
          },
        };
      }
      if (action === 'users.findByEmail') {
        return {
          ok: true,
          data: {
            user: {
              id: 'U123456',
              name: 'Test User',
            },
          },
        };
      }
      if (action === 'channels.create') {
        return {
          ok: true,
          data: {
            channel: {
              id: 'C123456',
              name: params.name,
            },
          },
        };
      }
      if (action === 'channels.invite') {
        return { ok: true, data: {} };
      }
    }

    // Stripe mocks
    if (integrationId === 'stripe') {
      if (action === 'customers.get') {
        return {
          ok: true,
          data: {
            id: params.customerId,
            email: 'customer@example.com',
            name: 'Test Customer',
          },
        };
      }
      if (action === 'invoices.get') {
        return {
          ok: true,
          data: {
            id: params.invoiceId,
            customer: 'cus_123',
            amount_due: 5000,
            currency: 'usd',
            attempt_count: 1,
            hosted_invoice_url: 'https://invoice.stripe.com/i/123',
            payments: [{ id: 'pi_123' }],
          },
        };
      }
      if (action === 'paymentIntents.get') {
        return {
          ok: true,
          data: {
            id: params.paymentIntentId,
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined',
            },
          },
        };
      }
    }

    // Zendesk mocks
    if (integrationId === 'zendesk') {
      if (action === 'tickets.get') {
        return {
          ok: true,
          data: {
            ticket: {
              id: params.id,
              subject: 'Test Ticket',
              description: 'Test description',
              status: 'open',
              priority: 'normal',
              url: 'https://test.zendesk.com/api/v2/tickets/123',
            },
          },
        };
      }
      if (action === 'tickets.update') {
        return { ok: true, data: {} };
      }
      if (action === 'tickets.reply') {
        return { ok: true, data: {} };
      }
    }

    // Freshdesk mocks
    if (integrationId === 'freshdesk') {
      if (action === 'tickets.list') {
        return {
          ok: true,
          data: {
            tickets: [
              {
                id: 1,
                subject: 'Test Ticket',
                due_by: new Date(Date.now() + 3600000).toISOString(),
                responder_id: 123,
                priority: 3,
              },
            ],
          },
        };
      }
    }

    // Google Sheets mocks
    if (integrationId === 'google_sheets') {
      if (action === 'values.get') {
        return {
          ok: true,
          data: {
            values: [
              ['Date', 'Count', 'Value'],
              ['2024-01-01', '10', '50000'],
            ],
          },
        };
      }
      if (action === 'values.append') {
        return { ok: true, data: {} };
      }
    }

    // Google Drive mocks
    if (integrationId === 'google_drive') {
      if (action === 'files.create_text') {
        return {
          ok: true,
          data: {
            id: 'doc123',
            name: params.name,
            webViewLink: 'https://docs.google.com/document/d/doc123',
          },
        };
      }
    }

    // Gmail mocks
    if (integrationId === 'gmail') {
      if (action === 'messages.send') {
        return {
          ok: true,
          data: {
            id: 'msg123',
            threadId: 'thread123',
          },
        };
      }
    }

    // Default fallback
    return { ok: true, data: {} };
  },

  /**
   * Mock waitForInput - always approves
   */
  waitForInput: async (options) => {
    return {
      approved: true,
    };
  },

  /**
   * Mock agent - returns appropriate responses based on agent name
   */
  agent: async (name, options) => {
    if (name === 'churn-classifier') {
      return {
        category: 'price',
        summary: 'Customer cancelled due to pricing concerns',
      };
    }
    if (name === 'ticket-summarizer') {
      return {
        summary: 'Customer is unhappy with response time',
        suggested_action: 'Follow up within 24 hours',
      };
    }
    if (name === 'ticket-classifier') {
      return {
        priority: 'high',
        tags: ['billing', 'urgent'],
      };
    }
    if (name === 'pipeline-commentator') {
      return {
        commentary: 'Pipeline is up 15% from last week with strong growth in proposal stage',
      };
    }
    if (name === 'digest-writer') {
      return {
        digest: 'Daily activity summary shows 25 new records with no major issues',
      };
    }
    if (name === 'lead-scorer') {
      return {
        score: 8,
        reason: 'Enterprise company with clear use case',
      };
    }
    if (name === 'cs-handoff-writer') {
      return {
        summary: 'Account handoff summary with key stakeholders and success criteria',
      };
    }
    if (name === 'dunning-email-writer') {
      return {
        email_body: 'Dear customer, your payment failed. Please update your payment method.',
      };
    }
    return { result: 'Mock AI response' };
  },
};

module.exports = mockMetaphor;
