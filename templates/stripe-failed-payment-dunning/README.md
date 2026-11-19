# Stripe Failed Payment Dunning

Detect Stripe payment failures, apply retry and escalation rules, update HubSpot, send Slack alerts, and draft a customer email needing approval before sending.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/stripe-failed-payment-dunning&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | intermediate |
| Trigger | Stripe webhook (invoice.payment_failed) |
| Steps | 5 |

## What it does

1. **fetch_failure_details** (code): Fetch invoice and customer details from Stripe and extract failure metadata.
2. **apply_dunning_rules** (code): Apply retry and escalation rules based on failure count and invoice amount.
3. **lookup_hubspot** (code): Find the customer in HubSpot and update the payment_status property.
4. **alert_slack** (code): Post the payment failure alert to Slack, tagging the account owner or billing team.
5. **draft_customer_email** (code): Draft a customer-facing email with payment retry instructions (requires manual approval).

## What you need

No secrets required.

Integrations: `stripe`, `hubspot`, `slack_bot`, `gmail`

Agents (created for you on import; edit them in Studio):

- `dunning-email-writer`: Writes customer-facing payment failure emails with empathy and clarity.

## Setup

1. Connect the Stripe, HubSpot, Slack Bot, and Gmail integrations in Ballet once.
2. In HubSpot, create a custom contact property 'stripe_payment_notes' (single-line text) under Settings > Properties > Contact Properties to store payment failure notes.
3. Create a custom HubSpot property called payment_status (text field) on contacts and companies.
4. Invite the Slack bot to your billing alerts channel.
5. Publish the playbook and copy the webhook URL from Studio.
6. In Stripe dashboard, add the webhook URL and subscribe to invoice.payment_failed events.
7. Test by creating a test invoice with a declined test card and watching the run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template stripe-failed-payment-dunning is MIT licensed.
