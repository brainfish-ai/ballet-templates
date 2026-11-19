# Closed Won CS Handoff

When a HubSpot deal moves to closed won, check required handoff fields, AI writes handoff summary, creates Slack channel, requires approval before inviting customer-facing people.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/closed-won-cs-handoff&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | intermediate |
| Trigger | HubSpot webhook (deal stage changed to closed won) |
| Steps | 6 |

## What it does

1. **fetch_deal** (code): Fetch full deal details from HubSpot and check required handoff fields.
2. **write_handoff** (code): AI writes a handoff summary for the CS team with key context, stakeholders, and success criteria.
3. **create_channel** (code): Create a Slack channel for the account with CS and sales team members.
4. **approval** (code): Review handoff summary and Slack channel before inviting customer-facing people.
5. **create_handoff_doc** (code): Create a Google Drive document with the handoff summary after approval.
6. **invite_team** (code): Invite CS team members to the Slack channel after approval.

## What you need

No secrets required.

Integrations: `hubspot`, `slack_bot`, `google_drive`

Agents (created for you on import; edit them in Studio):

- `cs-handoff-writer`: Writes customer success handoff summaries for closed won deals.

## Setup

1. Connect the HubSpot, Slack Bot, and Google Drive integrations in Ballet once.
2. Publish the playbook and copy the webhook URL from Studio.
3. In HubSpot, create a workflow that triggers when deal stage changes to closed won. The workflow should send a webhook to the Ballet URL. If using a generic HubSpot webhook, the payload will be an array like [{ objectId: '123', ... }]. Add a mapping step that extracts flow.input[0].objectId, calls hubspot deals.get to fetch deal details including deal_name, and passes cs_team_emails from the playbook input.
4. Test with a deal moved to closed won.
5. When the approval step appears, review the handoff summary and approve to proceed with team invites and document creation.

## Simplifications

- The cs_team_emails list is hardcoded in this template. In production, fetch the CS team from HubSpot deal owner, a config file, or a Ballet data table.
- Slack channel names are limited to 80 characters and can only contain lowercase letters, numbers, hyphens, and underscores. The template normalizes deal names automatically.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template closed-won-cs-handoff is MIT licensed.
