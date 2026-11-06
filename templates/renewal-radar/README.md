# Renewal radar

Paste your upcoming renewals and get each account risk-scored, with a pre-call brief for any customer call this week, emailed to you.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/renewal-radar&ref=main)

| | |
|---|---|
| Category | Support |
| Difficulty | beginner |
| Trigger | Manual run (pasted list or CSV of renewals); schedule it weekly |
| Steps | 3 |

## What it does

1. **match_calls** (code): Parse the renewal list, keep renewals in the window and match customer calls in the next 7 days by attendee email domain.
2. **score_risk** (code): Score each renewal's risk, suggest the next action and write a pre-call brief for matched calls.
3. **send_radar** (code): Email the radar to you (or the recipients you set) from your connected Gmail.

## What you need

No secrets required.

Integrations: `google-calendar`, `gmail`

Agents (created for you on import; edit them in Studio):

- `renewal-risk-analyst`: Scores upcoming renewals for churn risk and writes pre-call briefs.

## Setup

1. Import the template and connect Google Calendar and Gmail.
2. Run it with your renewals pasted as CSV with a header row: account, domain, renewal_date, arr, notes. Only account and renewal_date are required; add domain so customer calls can be matched.
3. The radar is emailed to your connected Gmail address. Set `recipients` to send it to the team instead.
4. To get it every Monday, add a weekly schedule and save your renewal list as the default input.
5. Edit the `renewal-risk-analyst` agent to match how your team scores risk.

## Simplifications

- Renewals come from the list you paste, not from a CRM or billing system. Keep the list current, or swap the first step for your CRM integration.
- Risk is scored from your notes, the renewal date, ARR and whether a call is booked. It does not read product usage or support tickets.
- Customer calls are matched by attendee email domain in the next 7 days. Accounts without a domain never match a call.
- Up to 50 renewals per run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template renewal-radar is MIT licensed.
