# Weekly Pipeline Report

Pull HubSpot deals on a schedule, compute stage totals and week-over-week change, append to Google Sheets, generate AI commentary, and post to Slack.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/weekly-pipeline-report&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | intermediate |
| Trigger | Manual (set up weekly schedule with external scheduler or cron) |
| Steps | 5 |

## What it does

1. **fetch_deals** (code): Fetch all open deals from HubSpot and group by pipeline stage.
2. **compute_totals** (code): Compute stage-by-stage totals (count and value) and calculate week-over-week change from Google Sheets.
3. **append_to_sheets** (code): Append the current week's totals to Google Sheets for historical tracking.
4. **write_commentary** (code): Use AI to write a 3-line executive summary with key pipeline insights.
5. **post_to_slack** (code): Post the pipeline report and AI commentary to Slack.

## What you need

No secrets required.

Integrations: `hubspot`, `google_sheets`, `slack_bot`

Agents (created for you on import; edit them in Studio):

- `pipeline-commentator`: Writes executive summaries of weekly sales pipeline reports with key insights and trends.

## Setup

1. Connect the HubSpot, Google Sheets, and Slack Bot integrations in Ballet once.
2. Create a Google Sheet with columns: Week Ending, Total Deals, Total Value, Discovery Deals, Discovery Value, Proposal Deals, Proposal Value, Closed Deals, Closed Value. Note the Sheet ID from its URL.
3. Invite the Slack bot to your pipeline reports channel.
4. Publish the playbook and run it manually, or attach a schedule in Studio (for example weekly on Monday at 9 AM).
5. The first run establishes a baseline with no week-over-week comparison. Subsequent weeks calculate changes.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template weekly-pipeline-report is MIT licensed.
