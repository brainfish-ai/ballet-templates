# Competitor watch: weekly digest & battlecards

Emails you this week's competitor news, plus a battlecard for every upcoming meeting where a competitor comes up.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/competitor-watch&ref=main)

| | |
|---|---|
| Category | Sales |
| Difficulty | beginner |
| Trigger | Manual run (list of competitors); schedule it weekly |
| Steps | 3 |

## What it does

1. **gather_signals** (code): Search the web for each competitor's news from the last 7 days and find meetings in the next 7 days where a competitor comes up.
2. **write_digest** (code): Write the weekly digest and one battlecard per matched meeting.
3. **send_digest** (code): Email the digest to you (or to the recipients you set) from your connected Gmail.

## What you need

No secrets required.

Integrations: `google-calendar`, `gmail`

Agents (created for you on import; edit them in Studio):

- `competitor-watch-analyst`: Turns a week of competitor news into a digest and writes battlecards for upcoming meetings.

## Setup

1. Import the template and connect Google Calendar and Gmail.
2. Run it with up to 5 competitors (names or websites, one per line or comma-separated).
3. The digest is emailed to your connected Gmail address. Set `recipients` to send it to a team list instead.
4. To get it every Monday, add a weekly schedule to the playbook and save your competitors as the default input.
5. Edit the `competitor-watch-analyst` agent to change the digest format or battlecard sections.

## Simplifications

- Reports the last 7 days of news on every run. Templates can't keep state between runs yet, so it can't show only what changed since the last digest.
- A meeting gets a battlecard when an attendee's email domain or the meeting title matches a competitor. Matching on names is simple and can miss meetings or flag the wrong ones.
- Up to 5 competitors and 10 battlecards per run, to keep the run fast.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template competitor-watch is MIT licensed.
