# Invoice approval workflow

Record an approve or reject decision on an invoice, notify finance, and keep an audit trail of the run.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/invoice-approval&ref=main)

| | |
|---|---|
| Category | Ops |
| Difficulty | beginner |
| Trigger | Generic HMAC webhook (approve or reject) |
| Steps | 2 |

## What it does

1. **validate_decision** (code): Normalise the decision and write a short audit summary for finance.
2. **notify_finance** (http): POST the approval outcome to your finance webhook.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `INBOUND_HMAC_SECRET` | HMAC-SHA256 secret your approval UI uses to sign webhook bodies. |
| `FINANCE_WEBHOOK_URL` | HTTPS endpoint that receives the approval outcome JSON for your finance system or Slack incoming webhook. |

Agents (created for you on import; edit them in Studio):

- `invoice-approval-scribe`: Writes a short audit summary for an invoice approve or reject decision.

## Setup

1. Add the two secrets above.
2. Publish the playbook and copy its webhook URL from Studio.
3. Point the invoice-approval-inbox starter at that URL with BALLET_WORKFLOW_URL, or use the REST execute endpoint with BALLET_API_KEY.
4. Approve or reject a sample invoice and confirm the finance webhook receives the outcome.

## Simplifications

- This template records the human decision from your UI. It does not auto-approve invoices.
- Replace FINANCE_WEBHOOK_URL with Slack, email, or your AP system as needed.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template invoice-approval is MIT licensed.
