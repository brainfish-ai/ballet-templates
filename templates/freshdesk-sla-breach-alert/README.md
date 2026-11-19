# Freshdesk SLA Breach Alert

Scheduled check of Freshdesk tickets near or over SLA, deduplicates already-alerted tickets, sends Slack alert to owner or channel.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/freshdesk-sla-breach-alert&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Schedule (every 15 minutes) |
| Steps | 2 |

## What it does

1. **check_sla** (code): Fetch tickets near or over SLA from Freshdesk, deduplicate tickets already alerted in the last 24 hours.
2. **alert_slack** (code): Post Slack alert for each ticket breaching SLA, tagging the assigned agent or posting to the channel.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `FRESHDESK_DOMAIN` | Your Freshdesk subdomain, for example acme for acme.freshdesk.com. |
| `FRESHDESK_API_KEY` | Freshdesk API key (used as Basic auth username). |
| `SLACK_BOT_TOKEN` | Slack bot token with chat:write scope. |

Integrations: `freshdesk`, `slack`

## Setup

1. Add the three secrets above and invite the Slack bot to the alert channel.
2. Publish the playbook with the schedule trigger enabled.
3. Set slack_channel input to your channel ID or name.
4. Optionally adjust alert_threshold_hours to your SLA buffer.
5. The first run checks for breaching tickets; alerts appear in Slack within 15 minutes.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template freshdesk-sla-breach-alert is MIT licensed.
