# Lead Enrichment Form

Capture a lead, send it to a Ballet enrichment workflow, and show an enriched profile card (company, size, industry, fit score).

![Screenshot](./screenshot.svg)

This starter is a backlink and acquisition asset for [Ballet](https://ballet.dev). The Ballet hook is the primary CTA on the page.

## Matching Ballet playbook

Import [`salesforce-lead-enrichment`](../../templates/salesforce-lead-enrichment):

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/salesforce-lead-enrichment&ref=main)

Alternative for form/webhook scoring: [`inbound-lead-slack-alert`](../../templates/inbound-lead-slack-alert) ([Import](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/inbound-lead-slack-alert&ref=main)).

## Setup in 3 steps

1. Create the workflow in Ballet by importing `salesforce-lead-enrichment`, publish it, and copy the REST execute URL (or webhook URL).
2. Copy `.env.example` to `.env.local` and set `BALLET_API_KEY` plus `BALLET_WORKFLOW_URL`.
3. Deploy to Vercel (or run `npm install && npm run dev`). With no env vars, the UI runs in mock mode so previews still work.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brainfish-ai/ballet-templates&root-directory=starters/lead-enrichment-form&env=BALLET_API_KEY,BALLET_WORKFLOW_URL)

[![Open in v0](https://v0.dev/chat-static/button.svg)](https://v0.dev/chat/api/open?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbrainfish-ai%2Fballet-templates%2Fmain%2Fstarters%2Flead-enrichment-form%2Fr%2Flead-enrichment-form.json)

| Link | URL |
|---|---|
| Deploy with Vercel | https://vercel.com/new/clone?repository-url=https://github.com/brainfish-ai/ballet-templates&root-directory=starters/lead-enrichment-form&env=BALLET_API_KEY,BALLET_WORKFLOW_URL |
| Open in v0 | https://v0.dev/chat/api/open?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbrainfish-ai%2Fballet-templates%2Fmain%2Fstarters%2Flead-enrichment-form%2Fr%2Flead-enrichment-form.json |
| Import playbook | https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/salesforce-lead-enrichment&ref=main |
| Sign up free | https://app.ballet.dev/signup |

## Ballet API (real mode)

Verified from [Ballet auth docs](https://ballet.dev/docs/articles/how-do-i-authenticate-with-the-ballet-api-tWaqCPLyGT), [execute docs](https://ballet.dev/docs/articles/how-do-i-run-a-playbook-over-the-rest-api-KQIz0apagm), and live probes against `https://api.ballet.dev`:

```bash
curl -N https://api.ballet.dev/api/playbooks/$PLAYBOOK_ID/execute \
  -H "Authorization: Bearer $BALLET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "lead_id": "demo-1",
      "company": "Acme Robotics",
      "email": "jordan@acmerobotics.com",
      "title": "Head of RevOps",
      "name": "Jordan Lee",
      "website": "https://acmerobotics.com",
      "message": "Need inbound routing"
    }
  }'
```

| Piece | Value |
|---|---|
| Base host | `https://api.ballet.dev` (not `app.ballet.dev`) |
| Auth header | `Authorization: Bearer <workspace token>` |
| Token shape | `mt_live_…` from Studio → Settings → API tokens |
| Env var in this starter | `BALLET_API_KEY` (same value as docs' `BALLET_API_TOKEN`) |
| Preferred URL | `BALLET_WORKFLOW_URL=https://api.ballet.dev/api/playbooks/<id>/execute` |
| Execute body | `{ "input": { … } }` |
| Execute response | SSE stream; final `run_stop` carries `success` and `output` |
| Webhook URLs | If `BALLET_WORKFLOW_URL` contains `/webhooks/`, the body is the input object (no `{ input }` wrapper) |
| Missing env vars | Mock enrichment card (demo still works) |

Live probes without a real workspace token:

- No `Authorization` → `401 {"error":"Authentication required"}`
- Invalid Bearer → `401 {"error":"Invalid or revoked API token"}`

A successful run against a published playbook was not executed here (no real `mt_live_` token in this environment).

Never commit real keys.

## Open in v0

v0 loads apps from a public shadcn registry item JSON via:

`https://v0.dev/chat/api/open?url=<raw-json-url>`

This starter ships `r/lead-enrichment-form.json` for that purpose.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```
