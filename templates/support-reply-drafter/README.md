# Support Reply Drafter

Paste a customer message and get a polite, source-aware draft reply to review and send.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/support-reply-drafter&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Manual run |
| Steps | 2 |

## What it does

1. **research** (code): Look up public documentation relevant to the question, when the agent decides it needs it.
2. **draft** (code): Write the draft reply.

## What you need

No secrets required.

Agents (created for you on import; edit them in Studio):

- `support-reply-writer`: Drafts a polite, accurate customer support reply for human review.

## Setup

1. Import the template. No secrets are required.
2. Run it from Studio with a customer message and optional product notes.
3. Edit the `support-reply-writer` agent to add your own tone and policies.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template support-reply-drafter is MIT licensed.
