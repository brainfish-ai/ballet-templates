# Daily API Digest to Slack

Pull records from any JSON API, summarise them, and post a digest to Slack on a schedule.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/daily-api-digest-slack&ref=main)

| | |
|---|---|
| Category | Ops |
| Difficulty | beginner |
| Trigger | Manual run, or attach a daily schedule in Studio |
| Steps | 3 |

## What it does

1. **fetch_data** (http): Fetch records from the vendor API.
2. **summarize** (code): Reduce the records to counts and a short written digest.
3. **post_digest** (http): Post the digest to Slack.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `DIGEST_API_URL` | Full URL of the JSON endpoint to read, without the query string. |
| `DIGEST_API_TOKEN` | Bearer token for that API. |
| `SLACK_BOT_TOKEN` | Slack bot token with the `chat:write` scope. |
| `SLACK_DIGEST_CHANNEL` | Channel id or name to post to, for example `#ops`. |

Integrations: `slack`

Agents (created for you on import; edit them in Studio):

- `digest-writer`: Writes a short, factual digest of a batch of API records.

## Setup

1. Add the four secrets above.
2. Run the playbook once manually to check the digest.
3. In Studio, add a schedule (for example `0 9 * * *`) to run it every morning.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template daily-api-digest-slack is MIT licensed.
