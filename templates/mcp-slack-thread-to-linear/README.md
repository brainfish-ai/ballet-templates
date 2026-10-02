# Slack Thread to Linear Issue via MCP

Turn a Slack thread into a well-formed Linear issue using the Slack and Linear MCP servers.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/mcp-slack-thread-to-linear&ref=main)

| | |
|---|---|
| Category | MCP |
| Difficulty | intermediate |
| Trigger | Manual run |
| Steps | 3 |

## What it does

1. **read_thread** (code): Read the thread through the Slack MCP server.
2. **draft_issue** (code): Draft a title and description from the conversation.
3. **create_issue** (code): Create the issue through the Linear MCP server.

## What you need

No secrets required.

MCP servers (connect from the registry in Studio):

- `slack`: `slack_read_thread`
- `linear`: `save_issue`

Agents (created for you on import; edit them in Studio):

- `issue-drafter`: Turns a Slack conversation into a clear engineering issue.

## Setup

1. In Studio, open MCP Servers and connect Slack and Linear from the registry. Keep the server ids `slack` and `linear`.
2. Run the playbook with a channel id, the thread's parent timestamp, and your Linear team.
3. If a tool name or argument differs in your MCP server version, adjust the call in steps/*.ts (use Studio's tool list for the exact names).

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template mcp-slack-thread-to-linear is MIT licensed.
