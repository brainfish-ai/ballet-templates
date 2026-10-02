# Freshdesk Ticket Summary

Summarise each new Freshdesk ticket in three bullets and add it as a private note for the agent who picks it up.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/freshdesk-ticket-summary&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Freshdesk webhook (ticket created) |
| Steps | 2 |

## What it does

1. **summarize** (code): Summarise the ticket into three short bullets.
2. **add_note** (http): Add the summary as a private note on the ticket.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `FRESHDESK_WEBHOOK_SECRET` | Shared secret used to verify inbound Freshdesk webhooks (HMAC-SHA256). |
| `FRESHDESK_DOMAIN` | Your Freshdesk subdomain, for example `acme` for acme.freshdesk.com. |
| `FRESHDESK_API_KEY` | Freshdesk API key (used as the Basic auth username). |
| `FRESHDESK_API_PASSWORD` | Basic auth password. Freshdesk accepts any value, for example `X`. |

Integrations: `freshdesk`

Agents (created for you on import; edit them in Studio):

- `ticket-summarizer`: Condenses a support ticket into three bullets.

## Setup

1. Add the four secrets above.
2. Publish the playbook and copy its webhook URL from Studio.
3. In Freshdesk, create an automation rule on ticket creation that calls the webhook with the ticket fields.
4. Create a test ticket and watch the run in Studio.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template freshdesk-ticket-summary is MIT licensed.
