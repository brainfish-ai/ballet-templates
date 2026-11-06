# Meeting prep briefs for tomorrow

Researches every company you meet tomorrow and writes a one-page brief per external meeting from your Google Calendar.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/meeting-prep-brief&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | beginner |
| Trigger | Manual run; schedule it daily before your first meeting |
| Steps | 3 |

## What it does

1. **find_meetings** (code): Read tomorrow's events from Google Calendar and keep meetings with at least one external attendee.
2. **research_companies** (code): Read each attendee company's website and recent news.
3. **write_briefs** (code): Write one brief per meeting with who is attending, company context and talking points.

## What you need

No secrets required.

Integrations: `google-calendar`

Agents (created for you on import; edit them in Studio):

- `meeting-prep-researcher`: Writes a short prep brief for each external meeting from calendar details and company research.

## Setup

1. Import the template and connect Google Calendar.
2. Run it. It reads tomorrow's events in your calendar's time zone and skips internal meetings.
3. To have briefs ready by 7am, add a daily schedule to the playbook for early morning.
4. Optionally describe what you sell in `context` so talking points are relevant. Edit the `meeting-prep-researcher` agent to change the brief format.

## Simplifications

- A meeting counts as external when at least one attendee's email domain differs from yours. Meetings with only free-mail attendees (gmail.com, outlook.com and similar) are researched by person, not company.
- Research uses each company's website and a web search; it does not read your CRM.
- Up to 8 meetings per run.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template meeting-prep-brief is MIT licensed.
