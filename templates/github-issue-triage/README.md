# GitHub Issue Triage

Label every newly opened GitHub issue with an LLM through a signed webhook.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/github-issue-triage&ref=main)

| | |
|---|---|
| Category | Ops |
| Difficulty | intermediate |
| Trigger | GitHub webhook (issues) |
| Steps | 2 |

## What it does

1. **classify** (code): Pick labels for newly opened issues; ignore every other webhook action.
2. **apply_labels** (http): Add the chosen labels to the issue.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `GITHUB_WEBHOOK_SECRET` | The secret you set on the GitHub webhook; used to verify X-Hub-Signature-256. |
| `GITHUB_TOKEN` | Fine-grained token with Issues: read and write on the target repositories. |

Integrations: `github`

Agents (created for you on import; edit them in Studio):

- `issue-labeler`: Chooses GitHub labels for a new issue.

## Setup

1. Add the two secrets above.
2. Publish the playbook and copy its webhook URL from Studio.
3. In the GitHub repo, add a webhook: payload URL from Studio, content type application/json, the same secret, and the Issues event only.
4. Open a test issue and check the labels.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `agents/`: agent definitions imported alongside the playbook
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template github-issue-triage is MIT licensed.
