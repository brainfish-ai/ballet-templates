# Zendesk Negative CSAT Alert

Detect bad Zendesk satisfaction ratings, look up HubSpot account context, generate an AI summary of the ticket, and ping the account owner in Slack with deduplication.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/zendesk-negative-csat-alert&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Zendesk webhook (satisfaction rating received) |
| Steps | 5 |

## What it does

1. **filter_rating** (code): Check if the rating qualifies as negative and deserves an alert.
2. **fetch_ticket** (code): Fetch full ticket details from Zendesk including subject, description, and status.
3. **lookup_hubspot** (code): Find the requester in HubSpot and fetch account owner and recent notes.
4. **summarize_ticket** (code): Use AI to summarize the ticket and the customer's frustration.
5. **alert_owner** (code): Post the CSAT alert to Slack, tagging the account owner or the fallback channel.

## What you need

No secrets required.

Integrations: `zendesk`, `hubspot`, `slack_bot`

Agents (created for you on import; edit them in Studio):

- `ticket-summarizer`: Summarizes support tickets with negative CSAT feedback and suggests next actions.

## Setup

1. Connect the Zendesk, HubSpot, and Slack Bot integrations in Ballet once.
2. Enable satisfaction ratings in Zendesk (Admin > Tickets > Satisfaction).
3. Invite the Slack bot to your CSAT alerts channel.
4. Publish the playbook; Ballet registers the Zendesk webhook for you.
5. Test by submitting a bad satisfaction rating on a test ticket and watching the run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template zendesk-negative-csat-alert is MIT licensed.
