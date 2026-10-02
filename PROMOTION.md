# Promotion plan

How we get the template repos in front of the people who would use them. Every post links to **one template** and its **Import to Ballet** button, so a reader is one click from a working playbook.

## Principles

- Lead with the outcome ("triage Zendesk tickets with an agent"), not the product.
- One template per post. Each template README already carries the import button; link the template folder, not the repo root.
- Every claim is something the reader can verify: the code is in the repo, and the import preview shows all steps before anything is created.
- Never post to a community whose rules forbid self-promotion. Read the rules first, and answer questions before sharing a link.

## Channels

Every template lives in `ballet-templates`. Link the individual template folder for the audience you are posting to.

| Audience                    | Templates (category)    | Where to share                                              |
| --------------------------- | ----------------------- | ----------------------------------------------------------- |
| Support and CX ops          | support                 | Support Driven, r/CustomerSuccess, Zendesk/Freshdesk groups |
| RevOps, sales ops, founders | sales                   | RevOps Co-op, r/salesforce, LinkedIn                        |
| Platform and DevOps         | ops                     | Hacker News, r/devops, dev.to                               |
| MCP builders                | mcp                     | MCP Discord/GitHub discussions, r/mcp                       |
| Anyone writing a template   | `ballet-playbook-starter` | Show HN, dev.to "build your first playbook"              |
| Curators                    | `awesome-ballet`        | Awesome-list submissions (below)                            |

## Weekly cadence (10 templates, 10 weeks)

One template per week, in this order (easiest to verify first). Each week:

1. Mon: post the template (short demo clip or screenshot, plus the import link) to the primary channel for its audience.
2. Wed: cross-post as a how-it-works write-up on dev.to or LinkedIn.
3. Fri: reply to every comment and issue; log requests as new template ideas in the hub's issues.

| Week | Template                      | Primary audience |
| ---- | ----------------------------- | ---------------- |
| 1    | `zendesk-ticket-triage`       | Support          |
| 2    | `inbound-lead-slack-alert`    | Sales            |
| 3    | `github-issue-triage`         | Ops              |
| 4    | `freshdesk-ticket-summary`    | Support          |
| 5    | `salesforce-lead-enrichment`  | Sales            |
| 6    | `generic-webhook-relay`       | Ops              |
| 7    | `support-reply-drafter`       | Support          |
| 8    | `daily-api-digest-slack`      | Ops              |
| 9    | `mcp-linear-weekly-digest`    | MCP              |
| 10   | `mcp-slack-thread-to-linear`  | MCP              |

## Launch sequence

1. **Before anything public**: publish the repos (`node scripts/publish-repos.mjs --execute`), upload `assets/social-preview.png` to each repo's Settings → Social preview (GitHub has no API for it), and publish remix shares (`node scripts/publish-shares.mjs --execute`) if you want the Remix button.
2. **Smoke test**: click Import from a logged-out browser on every template README, sign up, and confirm the preview and import both work.
3. **Awesome lists**: submit `awesome-ballet`, and add Ballet to relevant lists (agent frameworks, MCP clients, workflow automation) following each list's contribution guide. One PR per list, with the list's required format and no marketing language.
4. **Show HN**: "Show HN: Open templates for AI agent workflows, one click to import". Link the hub repo, post on a weekday morning US time, and stay in the thread for the first few hours.
5. **Product Hunt**: only once at least four templates have real usage feedback; lead with the template gallery, not the platform.
6. **Ongoing**: the weekly cadence above, plus a monthly "template of the month" post featuring a community contribution.

## Community contributions

- `CONTRIBUTING.md` explains how to add a template; CI validates the folder format and secret hygiene on every PR.
- Credit contributors in the README table and in the post that features their template.
## What to measure

Use only numbers GitHub and the Ballet app already give us:

- Stars and traffic per repo (GitHub Insights → Traffic), by referrer.
- Imports per template (count playbooks with `source.path` set, grouped by path).
- Imports that reach a published playbook (activation).
- Issues and PRs opened by non-maintainers.

Review monthly; retire or rewrite templates that get views but no imports.
