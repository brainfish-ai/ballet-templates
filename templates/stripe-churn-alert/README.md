# Stripe Churn Alert

Detect Stripe subscription cancellations, look up the customer in HubSpot, classify the churn reason with AI, and post an alert to Slack with a HubSpot note.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/stripe-churn-alert&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | beginner |
| Trigger | Stripe webhook (subscription updated with cancel_at_period_end) |
| Steps | 5 |

## What it does

1. **check_cancellation** (code): Verify the subscription is cancelled and fetch customer details from Stripe.
2. **lookup_hubspot** (code): Find the customer and company in HubSpot by email.
3. **classify_churn** (code): Use AI to classify the churn reason from subscription and customer context.
4. **alert_slack** (http): Post the churn alert to Slack, tagging the account owner if found.
5. **log_hubspot_note** (code): Write a note to the HubSpot contact or company with the churn details.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret from your Stripe dashboard. |
| `STRIPE_API_KEY` | Stripe secret API key starting with sk_live_ or sk_test_. |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot private app access token with contacts, companies, and notes scopes. |
| `SLACK_BOT_TOKEN` | Slack bot token with chat:write scope. |
| `SLACK_CHURN_CHANNEL` | Slack channel ID or name to post churn alerts to, for example #customer-success. |

Integrations: `stripe`, `hubspot`, `slack`

Agents (created for you on import; edit them in Studio):

- `churn-classifier`: Classifies subscription churn reasons from customer context and cancellation metadata.

## Setup

1. Add the five secrets above and invite the Slack bot to the churn alert channel.
2. Publish the playbook and copy the webhook URL from Studio.
3. In Stripe dashboard, add the webhook URL and subscribe to customer.subscription.updated events.
4. Test by cancelling a test subscription and watching the run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template stripe-churn-alert is MIT licensed.
