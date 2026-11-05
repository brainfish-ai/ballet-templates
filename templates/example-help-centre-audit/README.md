# Contact-driver & help-centre audit

Paste your help centre URL and get the likely reasons customers contact support, the article gaps and the top 3 fixes.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/example-help-centre-audit&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Manual run (help centre URL) |
| Steps | 2 |

## What it does

1. **read_help_centre** (code): Read the help centre home page and search for its most visible articles.
2. **audit** (code): Identify likely contact drivers, coverage gaps and the top fixes to deflect tickets.

## What you need

No secrets required.

Agents (created for you on import; edit them in Studio):

- `help-centre-auditor`: Finds likely contact drivers and coverage gaps in a help centre.

## Setup

1. Import the template. No apps or secrets are required.
2. Run it with your help centre URL, and optionally the questions customers ask most.
3. Edit the `help-centre-auditor` agent to match your product and support policies.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template example-help-centre-audit is MIT licensed.
