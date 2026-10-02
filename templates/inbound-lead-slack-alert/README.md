# Inbound Lead Slack Alert

Score every form submission that hits a webhook and post it to Slack, flagging hot leads.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/inbound-lead-slack-alert&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | beginner |
| Trigger | Generic HMAC webhook |
| Steps | 2 |

## What it does

1. **score** (code): Score the lead and write a one-line reason.
2. **notify** (http): Post the lead to Slack, flagged as hot when it scores 7 or higher.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `INBOUND_HMAC_SECRET` | HMAC-SHA256 secret your form tool uses to sign webhook bodies. |
| `SLACK_BOT_TOKEN` | Slack bot token with the `chat:write` scope. |
| `SLACK_LEADS_CHANNEL` | Channel id or name to post leads to, for example `#leads`. |

Integrations: `slack`

Agents (created for you on import; edit them in Studio):

- `lead-scorer`: Scores an inbound lead from 0 to 10 with a one-line reason.

## Setup

1. Add the three secrets above and invite the Slack bot to the channel.
2. Publish the playbook and point your form tool's webhook at the URL shown in Studio.
3. Submit a test form and watch the run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template inbound-lead-slack-alert is MIT licensed.
