# L1 ticket triage sweep

Sweeps your open, unassigned Zendesk tickets, classifies each one and drafts a first reply as an internal note for an agent to review.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/l1-ticket-triage&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Manual run; schedule it every hour or at the start of each shift |
| Steps | 3 |

## What it does

1. **load_tickets** (code): Load recent new and open tickets with no assignee that have not been triaged yet.
2. **triage** (code): Classify each ticket and draft a first reply.
3. **write_notes** (code): Add the triage to each ticket as an internal note (skipped on a dry run).

## What you need

No secrets required.

Integrations: `zendesk`

Agents (created for you on import; edit them in Studio):

- `l1-triage-agent`: Classifies a support ticket and drafts a first reply for an agent to review.

## Setup

1. Import the template and connect Zendesk.
2. Run it. It reads your most recent new and open tickets that have no assignee.
3. Each ticket gets one internal note with category, priority, sentiment, suggested group and a draft reply. Customers never see these notes.
4. Set `max_tickets` (default 20) to process more or fewer per run, and `dry_run` to preview without writing notes.
5. Edit the `l1-triage-agent` agent to match your categories, groups and tone.

## Simplifications

- Writes an internal note and adds the `l1_triaged` tag. It does not change status, priority, assignee or other tags, and never sends a public reply.
- Tickets tagged `l1_triaged` are skipped, so re-running is safe. Remove the tag to triage a ticket again.
- Checks the 100 most recently created tickets per run. For triage on every new ticket as it arrives, use the webhook-based Zendesk Ticket Triage template.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template l1-ticket-triage is MIT licensed.
