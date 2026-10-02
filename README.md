# Ballet Templates

Ready-to-run playbook templates for [Ballet](https://ballet.dev), the agent operations platform for building, running and observing deterministic workflows. Click **Import** next to any template and it lands in your workspace as an unpublished playbook, with its agents created and a checklist of the secrets it needs.

[![Validate](https://github.com/brainfish-ai/ballet-templates/actions/workflows/validate.yml/badge.svg)](https://github.com/brainfish-ai/ballet-templates/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## How import works

1. Click **Import** on a template below, or open it from **New playbook, then Templates** inside Ballet.
2. Sign in or create a workspace. Ballet fetches the template from this repository, pinned to an exact commit.
3. Review the steps and code on the preview screen, then confirm.
4. Add the listed secrets, connect any MCP servers, and publish.

Imported playbooks always start unpublished with triggers off, and secrets are never carried in a template.

## Templates

<!-- templates:start -->

### Support

| Template | What it does | Trigger | Import |
|---|---|---|---|
| [Freshdesk Ticket Summary](templates/freshdesk-ticket-summary) | Summarise each new Freshdesk ticket in three bullets and add it as a private note for the agent who picks it up. | Freshdesk webhook (ticket created) | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/freshdesk-ticket-summary&ref=main) |
| [Support Reply Drafter](templates/support-reply-drafter) | Paste a customer message and get a polite, source-aware draft reply to review and send. | Manual run | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/support-reply-drafter&ref=main) |
| [Zendesk Ticket Triage](templates/zendesk-ticket-triage) | Classify every new Zendesk ticket with an LLM and write the priority and tags back as an internal note. | Zendesk webhook (ticket created) | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/zendesk-ticket-triage&ref=main) |

### Sales

| Template | What it does | Trigger | Import |
|---|---|---|---|
| [Inbound Lead Slack Alert](templates/inbound-lead-slack-alert) | Score every form submission that hits a webhook and post it to Slack, flagging hot leads. | Generic HMAC webhook | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/inbound-lead-slack-alert&ref=main) |
| [Salesforce Lead Enrichment](templates/salesforce-lead-enrichment) | Research each new Salesforce Lead on the web and write a short brief and rating back to the record. | Salesforce webhook (Lead created) | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/salesforce-lead-enrichment&ref=main) |

### Ops

| Template | What it does | Trigger | Import |
|---|---|---|---|
| [Daily API Digest to Slack](templates/daily-api-digest-slack) | Pull records from any JSON API, summarise them, and post a digest to Slack on a schedule. | Manual run, or attach a daily schedule in Studio | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/daily-api-digest-slack&ref=main) |
| [Generic Webhook Relay](templates/generic-webhook-relay) | Verify any signed incoming webhook, reshape it, and forward it to a downstream service with retries. | Generic HMAC webhook | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/generic-webhook-relay&ref=main) |
| [GitHub Issue Triage](templates/github-issue-triage) | Label every newly opened GitHub issue with an LLM through a signed webhook. | GitHub webhook (issues) | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/github-issue-triage&ref=main) |

### MCP

| Template | What it does | Trigger | Import |
|---|---|---|---|
| [Linear Weekly Digest via MCP](templates/mcp-linear-weekly-digest) | Read recent Linear issues and post a weekly digest to Slack, using the Linear and Slack MCP servers. | Manual run, or attach a weekly schedule in Studio | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/mcp-linear-weekly-digest&ref=main) |
| [Slack Thread to Linear Issue via MCP](templates/mcp-slack-thread-to-linear) | Turn a Slack thread into a well-formed Linear issue using the Slack and Linear MCP servers. | Manual run | [Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/mcp-slack-thread-to-linear&ref=main) |

<!-- templates:end -->

## Focused collections

Looking for one area only? The same templates are also published as smaller repositories:

- [ballet-support-playbooks](https://github.com/brainfish-ai/ballet-support-playbooks): helpdesk triage, summaries and reply drafting
- [ballet-sales-playbooks](https://github.com/brainfish-ai/ballet-sales-playbooks): lead enrichment, scoring and alerts
- [ballet-ops-playbooks](https://github.com/brainfish-ai/ballet-ops-playbooks): signed webhooks, scheduled digests, issue triage
- [ballet-mcp-playbooks](https://github.com/brainfish-ai/ballet-mcp-playbooks): workflows built on MCP servers
- [awesome-ballet](https://github.com/brainfish-ai/awesome-ballet): a curated list of templates, integrations and write-ups

## Template format

Each template is a folder:

```text
templates/<id>/
  playbook.yaml     # metaphor.run/v1 playbook definition
  steps/*.ts        # code for each code step
  agents/*.json     # agents the playbook calls (created on import)
  template.json     # catalog metadata: category, secrets, MCP servers, setup steps
  README.md         # generated, do not edit
```

Rules the validator enforces: no inline code, no hard-coded credentials, every secret and MCP server is declared in `template.json`, every `metaphor.agent()` call has a matching agent file, and no sub-playbooks (`metaphor.flow()`).

## Contribute a template

Start from [ballet-playbook-starter](https://github.com/brainfish-ai/ballet-playbook-starter) or copy any folder here, then:

```bash
npm install
npm run validate   # check your template
npm run build      # regenerate READMEs and catalog.json
```

Open a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for the checklist.

## Scripts

| Command | What it does |
|---|---|
| `npm run validate` | Validates every template |
| `npm run build` | Regenerates template READMEs, `catalog.json` and the tables above |
| `npm run check` | Validates and fails if generated files are stale (CI) |
| `npm run sync` | Publishes the themed collection repos and `awesome-ballet` into a sibling folder |
| `npm run publish:shares` | Publishes each template as a public Ballet share and records the slugs in `shares.json` |

## License

[MIT](LICENSE). Templates are examples: review the code before you publish them against production data.
