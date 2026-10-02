# Generic Webhook Relay

Verify any signed incoming webhook, reshape it, and forward it to a downstream service with retries.

[![Import to Ballet](../../assets/import-to-ballet.svg)](https://app.ballet.dev/import?repo=brainfish-ai/ballet-templates&path=templates/generic-webhook-relay&ref=main)

| | |
|---|---|
| Category | Ops |
| Difficulty | beginner |
| Trigger | Generic HMAC webhook |
| Steps | 2 |

## What it does

1. **transform** (code): Reshape the verified payload before relaying.
2. **relay** (http): POST the transformed body to the downstream service.

## What you need

Secrets (add them in Studio; values never leave your workspace):

| Name | Purpose |
|---|---|
| `INBOUND_HMAC_SECRET` | HMAC-SHA256 secret the sender uses to sign webhook bodies. |
| `RELAY_TARGET_URL` | Downstream URL to POST the transformed event to. |
| `DOWNSTREAM_API_KEY` | Bearer token for the downstream service. |

## Setup

1. Add the three secrets above.
2. Edit steps/transform.ts to reshape the payload the way the downstream service expects.
3. Publish and point the sender's webhook at the URL shown in Studio.

## Files

- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)
- `steps/`: code for each code step
- `template.json`: catalog metadata

Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.

Template generic-webhook-relay is MIT licensed.
