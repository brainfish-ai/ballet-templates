# Salesforce Lead Enrichment

Research each new Salesforce Lead on the web and write a short brief and rating back to the record.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/salesforce-lead-enrichment&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | intermediate |
| Trigger | Salesforce webhook (Lead created) |
| Steps | 3 |

## What it does

1. **research_company** (code): Search the web for what the company does and recent news.
2. **write_brief** (code): Turn the research into a short brief and a fit score.
3. **update_lead** (code): Write the brief back to the Lead record.

## What you need

No secrets required.

Integrations: `salesforce`

Agents (created for you on import; edit them in Studio):

- `lead-researcher`: Summarises a prospect company and scores fit.

## Setup

1. Connect the Salesforce integration in Ballet once.
2. Publish the playbook and copy its webhook URL.
3. In Salesforce, create a Flow on Lead creation that sends an outbound message or HTTP callout with lead_id, company, email and title to the webhook URL.
4. Create a test Lead and check the Description field.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template salesforce-lead-enrichment is MIT licensed.
