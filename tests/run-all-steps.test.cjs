#!/usr/bin/env node
/**
 * Simple test runner for Ballet template steps
 * Tests that all steps can be imported and executed with mock data
 * 
 * NOTE: This test runner strips TypeScript syntax for simple validation.
 * For full testing, use ts-node or compile TypeScript first.
 */

const fs = require('fs');
const path = require('path');
const mockMetaphor = require('./mock-metaphor.cjs');
const fixtures = require('./fixtures.cjs');

// Set up global metaphor mock
global.metaphor = mockMetaphor;

// Track test results
let passed = 0;
let failed = 0;
const errors = [];

/**
 * Test a single step file
 */
async function testStep(templateName, stepName, stepFile, inputData) {
  try {
    // Read the step file
    let code = fs.readFileSync(stepFile, 'utf8');
    
    // Strip TypeScript syntax (simple approach - works for most cases)
    // Remove type annotations like `: type` and `as Type`
    code = code.replace(/:\s*\{[^}]+\}/g, ''); // Remove `: { ... }` type annotations
    code = code.replace(/\s+as\s+\{[^}]+\}/g, ''); // Remove `as { ... }` type assertions
    code = code.replace(/\s+as\s+[A-Za-z0-9_<>[\],\s|&]+;/g, ';'); // Remove `as Type;`
    code = code.replace(/\s+as\s+any/g, ''); // Remove `as any`
    
    // Check if code already declares result
    const declaresResult = /\blet\s+result\b/.test(code) || /\bconst\s+result\b/.test(code);
    
    // Create an async function wrapper
    const wrappedCode = `
      return (async function(input_data) {
        ${declaresResult ? '' : 'let result;'}
        ${code}
        return result;
      })(input_data);
    `;
    
    // Execute the step
    const stepFunction = new Function('input_data', 'metaphor', wrappedCode);
    const result = await stepFunction(inputData, mockMetaphor);
    
    // Check that result is not null
    if (result === undefined || result === null) {
      throw new Error('Step returned null or undefined');
    }
    
    console.log(`  ✓ ${templateName}/${stepName}`);
    passed++;
    return true;
  } catch (error) {
    console.error(`  ✗ ${templateName}/${stepName}: ${error.message}`);
    errors.push({ template: templateName, step: stepName, error: error.message });
    failed++;
    return false;
  }
}

/**
 * Run tests for all templates
 */
async function runTests() {
  console.log('Running Ballet template step tests...\n');
  
  const templatesDir = path.join(__dirname, '..', 'templates');
  const targetTemplates = [
    'stripe-churn-alert',
    'stripe-failed-payment-dunning',
    'weekly-pipeline-report',
    'zendesk-negative-csat-alert',
    'zendesk-ticket-triage',
    'daily-api-digest-slack',
    'inbound-lead-slack-alert',
    'freshdesk-sla-breach-alert',
    'closed-won-cs-handoff',
  ];
  
  for (const templateName of targetTemplates) {
    const templateDir = path.join(templatesDir, templateName);
    const stepsDir = path.join(templateDir, 'steps');
    
    if (!fs.existsSync(stepsDir)) {
      console.log(`Skipping ${templateName}: no steps directory`);
      continue;
    }
    
    console.log(`Testing ${templateName}:`);
    
    // Get all .ts files in steps directory
    const stepFiles = fs.readdirSync(stepsDir)
      .filter(f => f.endsWith('.ts'))
      .map(f => ({
        name: f.replace('.ts', ''),
        path: path.join(stepsDir, f),
      }));
    
    for (const { name, path: stepPath } of stepFiles) {
      // Create appropriate input data based on template and step
      let inputData = {};
      
      if (templateName === 'stripe-churn-alert') {
        if (name === 'check_cancellation') {
          inputData = fixtures.stripeSubscriptionUpdated;
        } else if (name === 'lookup_hubspot') {
          inputData = { customer_email: 'test@example.com', customer_name: 'Test Customer', skipped: false };
        } else if (name === 'classify_churn') {
          inputData = {
            subscription: { plan_name: 'Pro', amount: 5000, currency: 'USD', cancellation_reason: 'too expensive', customer_name: 'Test Customer' },
            hubspot_notes: 'Recent activity',
            skipped: false,
          };
        } else if (name === 'alert_slack') {
          inputData = { slack_message: 'Test alert', slack_channel: 'C123', skipped: false };
        } else if (name === 'log_hubspot_note') {
          inputData = { contact_id: '123', company_id: null, churn_summary: 'Test summary', subscription_end: '2024-12-31', skipped: false };
        }
      } else if (templateName === 'stripe-failed-payment-dunning') {
        if (name === 'fetch_failure_details') {
          inputData = { event: fixtures.stripeInvoicePaymentFailed };
        } else if (name === 'apply_dunning_rules') {
          inputData = {
            failure_details: {
              customer_name: 'Test Customer',
              amount_due: 5000,
              currency: 'USD',
              attempt_count: 2,
              failure_reason: 'card_declined',
              invoice_url: 'https://invoice.stripe.com/i/123',
              next_payment_attempt: null,
            },
          };
        } else if (name === 'lookup_hubspot') {
          inputData = { customer_email: 'test@example.com', payment_status: 'payment_failed', failure_summary: 'Payment failed' };
        } else if (name === 'alert_slack') {
          inputData = { slack_message: 'Test alert', slack_channel: 'C123' };
        } else if (name === 'draft_customer_email') {
          inputData = {
            should_draft: true,
            customer_email: 'test@example.com',
            customer_name: 'Test Customer',
            invoice_url: 'https://invoice.stripe.com/i/123',
            amount_due: 5000,
            currency: 'USD',
          };
        }
      } else if (templateName === 'zendesk-negative-csat-alert') {
        if (name === 'filter_rating') {
          inputData = { event: fixtures.zendeskSatisfactionRating };
        } else if (name === 'fetch_ticket') {
          inputData = { ticket_id: '123', is_negative: true };
        } else if (name === 'lookup_hubspot') {
          inputData = { requester_email: 'test@example.com' };
        } else if (name === 'summarize_ticket') {
          inputData = {
            ticket: { ticket_id: '123', subject: 'Test', description: 'Test desc', status: 'open', priority: 'normal', ticket_url: 'https://test.zendesk.com/tickets/123' },
            rating_comment: 'Too slow',
            hubspot_notes: 'Recent notes',
          };
        } else if (name === 'alert_owner') {
          inputData = { slack_message: 'Test alert', slack_channel: 'C123', owner_email: 'owner@example.com' };
        }
      } else if (templateName === 'zendesk-ticket-triage') {
        if (name === 'classify') {
          inputData = { event: fixtures.zendeskTicketCreated };
        } else if (name === 'post_note') {
          inputData = { ticket_id: '123', priority: 'high', tags: ['billing', 'urgent'] };
        }
      } else if (templateName === 'weekly-pipeline-report') {
        if (name === 'fetch_deals') {
          inputData = { report_date: '2024-01-01' };
        } else if (name === 'compute_totals') {
          inputData = {
            deals: [{ id: '1', name: 'Deal 1', amount: 50000, stage: 'proposal' }],
            report_date: '2024-01-01',
            google_sheet_id: 'sheet123',
          };
        } else if (name === 'append_to_sheets') {
          inputData = {
            report_date: '2024-01-01',
            totals: { total_count: 10, total_value: 100000, stages: { proposal: { count: 5, value: 50000 } } },
            google_sheet_id: 'sheet123',
          };
        } else if (name === 'write_commentary') {
          inputData = {
            current_week: { report_date: '2024-01-01', total_count: 10, total_value: 100000, stages: {} },
            previous_week: { report_date: '2023-12-25', total_count: 8, total_value: 80000 },
            changes: { total_count_change: 2, total_value_change: 20000, total_count_pct: '25', total_value_pct: '25' },
          };
        } else if (name === 'post_to_slack') {
          inputData = { slack_message: 'Test report', slack_channel: 'C123' };
        }
      } else if (templateName === 'daily-api-digest-slack') {
        if (name === 'summarize') {
          inputData = { records: [{ id: 1, name: 'Record 1' }] };
        } else if (name === 'post_digest') {
          inputData = { digest_text: 'Test digest', slack_channel: 'C123' };
        }
      } else if (templateName === 'inbound-lead-slack-alert') {
        if (name === 'score') {
          inputData = { name: 'Test', email: 'test@example.com', company: 'Test Corp', message: 'Interested' };
        } else if (name === 'notify') {
          inputData = { slack_text: 'New lead', slack_channel: 'C123' };
        }
      } else if (templateName === 'freshdesk-sla-breach-alert') {
        if (name === 'check_sla') {
          inputData = { alert_threshold_hours: 2 };
        } else if (name === 'alert_slack') {
          inputData = {
            tickets: [{ id: 1, subject: 'Test', due_by: new Date(Date.now() + 3600000).toISOString(), responder_id: 123, priority: 3 }],
            slack_channel: 'C123',
          };
        }
      } else if (templateName === 'closed-won-cs-handoff') {
        if (name === 'fetch_deal') {
          inputData = { deal_id: 'deal123', cs_team_emails: ['cs@example.com'] };
        } else if (name === 'write_handoff') {
          inputData = { deal: { id: 'deal123', name: 'Test Deal', amount: 100000, close_date: '2024-01-01' } };
        } else if (name === 'create_channel') {
          inputData = { deal_name: 'Test Deal', handoff_summary: 'Summary here' };
        } else if (name === 'approval') {
          inputData = { summary: 'Test summary', channel_id: 'C123' };
        } else if (name === 'create_handoff_doc') {
          inputData = { deal_name: 'Test Deal', handoff_summary: 'Summary here' };
        } else if (name === 'invite_team') {
          inputData = { channel_id: 'C123', cs_team_emails: ['cs@example.com'] };
        }
      }
      
      await testStep(templateName, name, stepPath, inputData);
    }
    
    console.log('');
  }
  
  // Print summary
  console.log('═'.repeat(50));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50));
  
  if (errors.length > 0) {
    console.log('\nFailed tests:');
    errors.forEach(({ template, step, error }) => {
      console.log(`  ${template}/${step}: ${error}`);
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
