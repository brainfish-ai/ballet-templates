# Win/loss by competitor

Reads your closed HubSpot deals and reports win rate, revenue and the top won and lost reasons against each competitor.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/win-loss-by-competitor&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | intermediate |
| Trigger | Manual run (deal property name, lookback in days) |
| Steps | 2 |

## What it does

1. **load_deals** (code): Load deals closed in the lookback window from HubSpot and group them by competitor.
2. **analyse** (code): Write the win/loss read-out per competitor, with what to change.

## What you need

No secrets required.

Integrations: `hubspot`

Agents (created for you on import; edit them in Studio):

- `win-loss-analyst`: Summarises closed deals by competitor into win/loss themes and recommendations.

## Setup

1. Import the template and connect HubSpot.
2. Find the deal property that records the competitor (for example `competitor`). Use its internal name from HubSpot Settings > Properties.
3. Run it with that property name and how many days to look back (default 90).
4. Edit the `win-loss-analyst` agent to change how the findings are written up.

## Simplifications

- The competitor comes from one deal property you name. Deals where it is empty are counted under "No competitor recorded"; if it is empty on every deal, the report says so instead of guessing.
- Won and lost reasons come from HubSpot's `closed_won_reason` and `closed_lost_reason` properties.
- Reads up to 1,000 closed deals per run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template win-loss-by-competitor is MIT licensed.
