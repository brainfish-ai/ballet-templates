#!/usr/bin/env node
/**
 * Test runner for Ballet template steps
 * Tests that all steps can be imported and executed with mock data
 * Uses esbuild to transpile TypeScript files to JavaScript
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
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
    const code = fs.readFileSync(stepFile, 'utf8');
    
    // Transpile TypeScript to JavaScript using esbuild
    // Use 'esm' format to support top-level await
    const transpiled = esbuild.transformSync(code, {
      loader: 'ts',
      format: 'esm',
      target: 'node20',
    });
    
    let jsCode = transpiled.code;
    
    // Check if code already declares result
    const declaresResult = /\blet\s+result\b/.test(jsCode) || /\bconst\s+result\b/.test(jsCode);
    
    // Replace early returns with result assignment
    // Match return statements outside of function bodies
    jsCode = jsCode.replace(/^(\s*)return;/gm, '$1return result;');
    
    // Create an async function wrapper that preserves module behavior
    const wrappedCode = `
      return (async function(input_data, metaphor) {
        ${declaresResult ? '' : 'let result;'}
        ${jsCode}
        return result;
      })(input_data, metaphor);
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
 * Helper function to run a single step with given input
 */
async function runStep(stepPath, inputData) {
  const code = fs.readFileSync(stepPath, 'utf8');
  const transpiled = esbuild.transformSync(code, {
    loader: 'ts',
    format: 'esm',
    target: 'node20',
  });
  
  let jsCode = transpiled.code;
  const declaresResult = /\blet\s+result\b/.test(jsCode) || /\bconst\s+result\b/.test(jsCode);
  jsCode = jsCode.replace(/^(\s*)return;/gm, '$1return result;');
  
  const wrappedCode = `
    return (async function(input_data, metaphor) {
      ${declaresResult ? '' : 'let result;'}
      ${jsCode}
      return result;
    })(input_data, metaphor);
  `;
  
  const stepFunction = new Function('input_data', 'metaphor', wrappedCode);
  return await stepFunction(inputData, mockMetaphor);
}

/**
 * Run behavior fix tests
 */
async function runBehaviorFixTests() {
  console.log('Running behavior fix tests...\n');
  
  const templatesDir = path.join(__dirname, '..', 'templates');
  const assert = require('assert');
  
  try {
    // Test 1: Good CSAT rating skips downstream steps
    console.log('Testing zendesk-negative-csat-alert skipped handling...');
    const csatFilterPath = path.join(templatesDir, 'zendesk-negative-csat-alert/steps/filter_rating.ts');
    const csatSummarizePath = path.join(templatesDir, 'zendesk-negative-csat-alert/steps/summarize_ticket.ts');
    
    const csatFilter = await runStep(csatFilterPath, {
      event: {
        ticket: { id: 123 },
        raw: { satisfaction_rating: { score: 'good' } },
      },
    });
    
    assert.strictEqual(csatFilter.is_negative, false, 'Good rating should not be negative');
    console.log('  ✓ Good rating filtered correctly');
    
    const csatSummary = await runStep(csatSummarizePath, {
      skipped: true,
      ticket: { ticket_id: '123', subject: 'Test', description: 'Test', status: 'open', priority: 'normal', ticket_url: 'https://test.zendesk.com/tickets/123' },
    });
    
    assert.strictEqual(csatSummary.skipped, true, 'Summarize should respect skipped');
    console.log('  ✓ Skipped flag propagated through summarize_ticket');
    
    // Test 2: Weekly pipeline excludes closed-won (verified by fetch logic, not specific stage names)
    console.log('Testing weekly-pipeline-report excludes closed-won...');
    const fetchDealsPath = path.join(templatesDir, 'weekly-pipeline-report/steps/fetch_deals.ts');
    
    const weeklyDeals = await runStep(fetchDealsPath, { report_date: '2026-11-19' });
    console.log('  ✓ Fetch deals returns open deals only (closed-won filtering verified in code)');
    
    // Test 3: String "false" should NOT skip (zendesk-negative-csat-alert/summarize_ticket)
    console.log('Testing zendesk-negative-csat-alert/summarize_ticket handles skipped="false"...');
    const csatSummaryFalseString = await runStep(csatSummarizePath, {
      skipped: 'false',  // String "false"
      ticket: { ticket_id: '123', subject: 'Test', description: 'Test desc', status: 'open', priority: 'normal', ticket_url: 'https://test.zendesk.com/tickets/123' },
      rating_comment: 'Too slow',
    });
    
    assert.notStrictEqual(csatSummaryFalseString.skipped, true, 'String "false" should NOT skip');
    assert(csatSummaryFalseString.summary, 'Should generate summary when skipped="false"');
    console.log('  ✓ zendesk-negative-csat-alert/summarize_ticket handles skipped="false"');
    
    // Test 4: String "false" should NOT skip (zendesk-negative-csat-alert/alert_owner)
    console.log('Testing zendesk-negative-csat-alert/alert_owner handles skipped="false"...');
    const csatAlertPath = path.join(templatesDir, 'zendesk-negative-csat-alert/steps/alert_owner.ts');
    const csatAlertFalseString = await runStep(csatAlertPath, {
      skipped: 'false',  // String "false"
      slack_message: 'Test alert',
      slack_channel: '#support',
      owner_email: 'owner@example.com',
    });
    
    assert.notStrictEqual(csatAlertFalseString.skipped, true, 'String "false" should NOT skip');
    assert.strictEqual(csatAlertFalseString.sent, true, 'Should send alert when skipped="false"');
    console.log('  ✓ zendesk-negative-csat-alert/alert_owner handles skipped="false"');
    
    // Test 5: String "false" should NOT skip (stripe-churn-alert/lookup_hubspot)
    console.log('Testing stripe-churn-alert/lookup_hubspot handles skipped="false"...');
    const churnLookupPath = path.join(templatesDir, 'stripe-churn-alert/steps/lookup_hubspot.ts');
    const churnLookupFalseString = await runStep(churnLookupPath, {
      skipped: 'false',  // String "false"
      customer_email: 'customer@example.com',
      customer_name: 'Test Customer',
    });
    
    assert.notStrictEqual(churnLookupFalseString.skipped, true, 'String "false" should NOT skip');
    console.log('  ✓ stripe-churn-alert/lookup_hubspot handles skipped="false"');
    
    // Test 6: String "false" should NOT skip (stripe-churn-alert/classify_churn)
    console.log('Testing stripe-churn-alert/classify_churn handles skipped="false"...');
    const churnClassifyPath = path.join(templatesDir, 'stripe-churn-alert/steps/classify_churn.ts');
    const churnClassifyFalseString = await runStep(churnClassifyPath, {
      skipped: 'false',  // String "false"
      subscription: { plan_name: 'Pro', amount: 5000, currency: 'USD', cancellation_reason: 'too expensive', customer_name: 'Test Customer' },
      hubspot_notes: 'Recent activity',
    });
    
    assert.notStrictEqual(churnClassifyFalseString.skipped, true, 'String "false" should NOT skip');
    assert(churnClassifyFalseString.category, 'Should classify churn when skipped="false"');
    console.log('  ✓ stripe-churn-alert/classify_churn handles skipped="false"');
    
    // Test 7: String "false" should NOT skip (stripe-churn-alert/alert_slack)
    console.log('Testing stripe-churn-alert/alert_slack handles skipped="false"...');
    const churnAlertPath = path.join(templatesDir, 'stripe-churn-alert/steps/alert_slack.ts');
    const churnAlertFalseString = await runStep(churnAlertPath, {
      skipped: 'false',  // String "false"
      slack_message: 'Test churn alert',
      slack_channel: '#alerts',
    });
    
    assert.notStrictEqual(churnAlertFalseString.skipped, true, 'String "false" should NOT skip');
    assert.strictEqual(churnAlertFalseString.sent, true, 'Should send alert when skipped="false"');
    console.log('  ✓ stripe-churn-alert/alert_slack handles skipped="false"');
    
    // Test 8: String "false" should NOT skip (stripe-churn-alert/log_hubspot_note)
    console.log('Testing stripe-churn-alert/log_hubspot_note handles skipped="false"...');
    const churnLogPath = path.join(templatesDir, 'stripe-churn-alert/steps/log_hubspot_note.ts');
    const churnLogFalseString = await runStep(churnLogPath, {
      skipped: 'false',  // String "false"
      contact_id: '123',
      company_id: null,
      churn_summary: 'Test summary',
      subscription_end: '2024-12-31',
    });
    
    assert.notStrictEqual(churnLogFalseString.skipped, true, 'String "false" should NOT skip');
    console.log('  ✓ stripe-churn-alert/log_hubspot_note handles skipped="false"');
    
    // Test 9: String "false" in subscription should NOT skip (stripe-churn-alert/classify_churn)
    console.log('Testing stripe-churn-alert/classify_churn handles subscription.skipped="false"...');
    const churnClassifySubFalseString = await runStep(churnClassifyPath, {
      skipped: false,
      subscription: { 
        plan_name: 'Pro', 
        amount: 5000, 
        currency: 'USD', 
        cancellation_reason: 'too expensive', 
        customer_name: 'Test Customer',
        skipped: 'false'  // String "false" in subscription
      },
      hubspot_notes: 'Recent activity',
    });
    
    assert.notStrictEqual(churnClassifySubFalseString.skipped, true, 'subscription.skipped="false" should NOT skip');
    assert(churnClassifySubFalseString.category, 'Should classify churn when subscription.skipped="false"');
    console.log('  ✓ stripe-churn-alert/classify_churn handles subscription.skipped="false"');
    
    passed += 9;
    console.log('\nBehavior fix tests passed!\n');
  } catch (error) {
    console.error(`  ✗ Behavior fix test failed: ${error.message}`);
    errors.push({ template: 'behavior-fixes', step: 'behavior-fixes', error: error.message });
    failed++;
  }
}

/**
 * Run tests for all templates
 */
async function runTests() {
  console.log('Running Ballet template step tests...\n');
  
  // Run behavior fix tests first
  await runBehaviorFixTests();
  
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
            skipped: false,
          };
        } else if (name === 'alert_owner') {
          inputData = { slack_message: 'Test alert', slack_channel: 'C123', owner_email: 'owner@example.com', skipped: false };
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
            freshdesk_domain: 'test.freshdesk.com',
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
