# Freshdesk SLA Breach Alert

Scheduled check of Freshdesk tickets near or over SLA, deduplicates already-alerted tickets, sends Slack alert to owner or channel.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/freshdesk-sla-breach-alert&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Manual (attach a schedule in Studio, for example every 15 minutes) |
| Steps | 2 |

## What it does

1. **check_sla** (code): Fetch tickets near or over SLA from Freshdesk, deduplicate tickets already alerted in the last 24 hours.
2. **alert_slack** (code): Post Slack alert for each ticket breaching SLA, tagging the assigned agent or posting to the channel.

## What you need

No secrets required.

Integrations: `freshdesk`, `slack_bot`

## Setup

1. Connect the Freshdesk and Slack Bot integrations in Ballet once.
2. Invite the Slack bot to your alert channel.
3. Publish the playbook and run it manually, or attach a schedule in Studio (for example every 15 minutes).
4. Set slack_channel input to your channel ID or name.
5. Optionally adjust alert_threshold_hours to your SLA buffer.
6. Each run checks for breaching tickets and posts alerts to Slack.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template freshdesk-sla-breach-alert is MIT licensed.
