# Weekly Pipeline Report

Pull HubSpot deals every Monday, compute stage totals and week-over-week change, append to Google Sheets, generate AI commentary, and post to Slack.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/weekly-pipeline-report&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | intermediate |
| Trigger | Schedule (every Monday at 9am) |
| Steps | 5 |

## What it does

1. **fetch_deals** (code): Fetch all open deals from HubSpot and group by pipeline stage.
2. **compute_totals** (code): Compute stage-by-stage totals (count and value) and calculate week-over-week change from Google Sheets.
3. **append_to_sheets** (code): Append the current week's totals to Google Sheets for historical tracking.
4. **write_commentary** (code): Use AI to write a 3-line executive summary with key pipeline insights.
5. **post_to_slack** (http): Post the pipeline report and AI commentary to Slack.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `HUBSPOT_ACCESS_TOKEN` | HubSpot private app access token with deals scope. Or swap for Salesforce credentials if using Salesforce. |
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API key or service account credentials with spreadsheets scope. |
| `GOOGLE_SHEET_ID` | The Google Sheet ID where weekly pipeline data is logged (from the sheet URL). |
| `SLACK_BOT_TOKEN` | Slack bot token with chat:write scope. |
| `SLACK_PIPELINE_CHANNEL` | Slack channel ID or name to post pipeline reports to, for example #sales. |

Agents (created for you on import; edit them in Studio):

- `pipeline-commentator`: Writes executive summaries of weekly sales pipeline reports with key insights and trends.

## Setup

1. Add the five secrets above and invite the Slack bot to the pipeline channel.
2. Create a Google Sheet with columns: Week Ending, Total Deals, Total Value, Discovery Deals, Discovery Value, Proposal Deals, Proposal Value, Closed Deals, Closed Value. Share it with your service account email or make it editable via the API key.
3. Publish the playbook with the weekly schedule enabled (default: Mondays at 9am).
4. The first run establishes a baseline with no week-over-week comparison. Subsequent weeks calculate changes.
5. To use Salesforce, edit the fetch_deals step to call Salesforce APIs.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template weekly-pipeline-report is MIT licensed.
