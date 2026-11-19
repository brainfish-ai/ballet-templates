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
2. **notify** (code): Post the lead to Slack, flagged as hot when it scores 7 or higher.

## What you need

No secrets required.

Integrations: `slack_bot`

Agents (created for you on import; edit them in Studio):

- `lead-scorer`: Scores an inbound lead from 0 to 10 with a one-line reason.

## Setup

1. Connect the Slack Bot integration in Ballet once and invite the bot to your lead alerts channel.
2. Publish the playbook and point your form tool's webhook at the URL shown in Studio.
3. Configure your form tool to send HMAC-SHA256 signatures if needed.
4. Submit a test form and watch the run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template inbound-lead-slack-alert is MIT licensed.
