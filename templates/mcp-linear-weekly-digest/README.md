# Linear Weekly Digest via MCP

Read recent Linear issues and post a weekly digest to Slack, using the Linear and Slack MCP servers.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/mcp-linear-weekly-digest&ref=main)

| | |
|---|---|
| Category | MCP |
| Difficulty | intermediate |
| Trigger | Manual run, or attach a weekly schedule in Studio |
| Steps | 3 |

## What it does

1. **fetch_issues** (code): List issues updated in the last 7 days from the Linear MCP server.
2. **write_digest** (code): Turn the issue list into a short weekly digest.
3. **post_digest** (code): Post the digest through the Slack MCP server.

## What you need

No secrets required.

MCP servers (connect from the registry in Studio):

- `linear`: `list_issues`
- `slack`: `slack_send_message`

Agents (created for you on import; edit them in Studio):

- `weekly-digest-writer`: Writes a weekly engineering digest from a list of Linear issues.

## Setup

1. In Studio, open MCP Servers and connect Linear and Slack from the registry (OAuth, no keys to paste). Keep the server ids `linear` and `slack`.
2. Run the playbook with your team key and a Slack channel id.
3. If a tool name or argument differs in your MCP server version, adjust the call in steps/*.ts (use Studio's tool list for the exact names).
4. Add a weekly schedule once the output looks right.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template mcp-linear-weekly-digest is MIT licensed.
