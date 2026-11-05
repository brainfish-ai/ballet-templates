# Competitor pricing & positioning teardown

Paste a competitor's website and get their pricing, positioning, key messages and the angles to counter them.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/example-competitor-teardown&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | beginner |
| Trigger | Manual run (competitor URL) |
| Steps | 2 |

## What it does

1. **read_site** (code): Read the competitor's homepage and pricing page.
2. **teardown** (code): Summarise pricing, positioning, target audience and messaging, and suggest how to counter them.

## What you need

No secrets required.

Agents (created for you on import; edit them in Studio):

- `competitor-analyst`: Turns a competitor's website into a pricing and positioning teardown.

## Setup

1. Import the template. No apps or secrets are required.
2. Run it with a competitor's website, and optionally a one-line description of your product.
3. Edit the `competitor-analyst` agent to focus on the angles your team cares about.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template example-competitor-teardown is MIT licensed.
