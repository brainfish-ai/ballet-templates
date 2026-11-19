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
4. **alert_slack** (http): Post the payment failure alert to Slack, tagging the account owner or billing team.
5. **draft_customer_email** (code): Draft a customer-facing email with payment retry instructions (requires manual approval).

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret from your Stripe dashboard. |
| `STRIPE_API_KEY` | Stripe secret API key starting with sk_live_ or sk_test_. |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot private app access token with contacts, companies, and notes scopes. |
| `SLACK_BOT_TOKEN` | Slack bot token with chat:write scope. |
| `SLACK_BILLING_CHANNEL` | Slack channel ID or name to post payment failure alerts to, for example #billing-alerts. |

Integrations: `stripe`, `hubspot`, `slack`, `gmail`

Agents (created for you on import; edit them in Studio):

- `dunning-email-writer`: Writes customer-facing payment failure emails with empathy and clarity.

## Setup

1. Add the five secrets above and invite the Slack bot to the billing alerts channel.
2. Create a custom HubSpot property called payment_status (text field) on contacts and companies.
3. Connect Gmail with drafts scope.
4. Publish the playbook and copy the webhook URL from Studio.
5. In Stripe dashboard, add the webhook URL and subscribe to invoice.payment_failed events.
6. Test by creating a test invoice with a declined test card and watching the run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template stripe-failed-payment-dunning is MIT licensed.
