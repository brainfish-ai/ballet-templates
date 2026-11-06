# HubSpot CRM hygiene report

Scans HubSpot contacts and companies for duplicates, missing fields, unowned and stale records, and writes a prioritised cleanup plan.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/crm-hygiene&ref=main)

| | |
|---|---|
| Category | Ops |
| Difficulty | beginner |
| Trigger | Manual run; schedule it weekly |
| Steps | 2 |

## What it does

1. **scan_records** (code): Read contacts and companies from HubSpot and count duplicates, missing fields, unowned and stale records.
2. **write_report** (code): Turn the findings into a prioritised cleanup report with example records to fix first.

## What you need

No secrets required.

Integrations: `hubspot`

Agents (created for you on import; edit them in Studio):

- `crm-hygiene-analyst`: Turns CRM data-quality counts into a prioritised cleanup plan.

## Setup

1. Import the template and connect HubSpot.
2. Run it. It only reads from HubSpot and never changes a record.
3. Optionally set `stale_days` (default 180) for when a record counts as stale.
4. To get the report every week, add a weekly schedule to the playbook.

## Simplifications

- Report only: it lists what to fix but does not merge, assign or update records.
- Reads up to 2,000 contacts and 2,000 companies per run, in HubSpot's default order, so very large portals are only partly checked.
- Duplicates are exact matches on email (contacts) and domain (companies), ignoring case and a leading www.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template crm-hygiene is MIT licensed.
