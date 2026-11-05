# Account list research & ICP scoring

Paste up to 10 company websites and get each one researched, scored against your ICP and ranked with an opening line.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/account-icp-scoring&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | beginner |
| Trigger | Manual run (list of company URLs) |
| Steps | 2 |

## What it does

1. **research_accounts** (code): Read each company's website.
2. **score_accounts** (code): Score every account against the ICP and rank them, with the reasons and a suggested opening line.

## What you need

No secrets required.

Agents (created for you on import; edit them in Studio):

- `icp-scorer`: Scores researched accounts against an ideal customer profile.

## Setup

1. Import the template. No apps or secrets are required.
2. Run it with up to 10 company websites, and optionally a description of your ideal customer.
3. Edit the `icp-scorer` agent to bake in your own ICP and scoring rules.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template account-icp-scoring is MIT licensed.
