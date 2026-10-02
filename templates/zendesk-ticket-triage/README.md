# Zendesk Ticket Triage

Classify every new Zendesk ticket with an LLM and write the priority and tags back as an internal note.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/zendesk-ticket-triage&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Zendesk webhook (ticket created) |
| Steps | 2 |

## What it does

1. **classify** (code): Use an LLM to assign a priority and tags to the ticket.
2. **post_note** (http): Write the classification back to Zendesk as an internal note.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `ZENDESK_API_TOKEN` | Zendesk API token used to register the webhook and update tickets. |
| `ZENDESK_SUBDOMAIN` | Your Zendesk subdomain, for example `acme` for acme.zendesk.com. |

Integrations: `zendesk`

Agents (created for you on import; edit them in Studio):

- `ticket-classifier`: Assigns a priority and tags to an incoming support ticket.

## Setup

1. Connect Zendesk and add the two secrets above.
2. Publish the playbook; Ballet registers the Zendesk webhook for you.
3. Create a test ticket and watch the run in Studio.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template zendesk-ticket-triage is MIT licensed.
