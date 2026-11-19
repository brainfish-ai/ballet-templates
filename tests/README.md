# Ballet Templates Test Harness

This directory contains mock implementations and test fixtures for Ballet templates.

## Files

- **mock-metaphor.cjs**: Mock implementation of the `metaphor` object with realistic response shapes for various integrations (HubSpot, Slack, Stripe, Zendesk, Freshdesk, Google Sheets, Gmail, etc.)
- **fixtures.cjs**: Sample webhook payloads for Stripe, Zendesk, and HubSpot
- **run-all-steps.test.cjs**: Test runner that executes all template steps with mock data

## Usage

### Quick Validation

The main validation checks are integrated into npm scripts:

```bash
# Validate YAML structure and check for un-awaited metaphor calls
npm run check

# Run just the validation
npm run validate

# Build the catalog
npm run build
```

### Running Step Tests

Note: The step test runner requires TypeScript support. The templates are written in TypeScript and need compilation or ts-node to execute properly.

```bash
# With Node.js (limited support, strips some TypeScript syntax)
npm test

# With ts-node (recommended)
npx ts-node tests/run-all-steps.test.cjs
```

## Mock Metaphor Object

The mock metaphor object provides realistic responses for:

### HubSpot
- `contacts.search`, `contacts.get`, `contacts.update`
- `deals.get`, `deals.search`
- `api.get` (for owners endpoint)

### Slack
- `messages.send`
- `users.findByEmail`
- `channels.create`, `channels.invite`

### Stripe
- `customers.get`
- `invoices.get`
- `paymentIntents.get`

### Zendesk
- `tickets.get`, `tickets.update`, `tickets.reply`

### Freshdesk
- `tickets.list`

### Google Workspace
- `google_sheets.values.get`, `google_sheets.values.append`
- `google_drive.files.create_text`
- `gmail.messages.send`

### AI Agents
- `churn-classifier`
- `ticket-summarizer`, `ticket-classifier`
- `pipeline-commentator`
- `digest-writer`
- `lead-scorer`
- `cs-handoff-writer`
- `dunning-email-writer`

## Test Fixtures

Sample webhook payloads are provided for:

- Stripe subscription updates and payment failures
- Zendesk satisfaction ratings and ticket creation
- HubSpot deal stage changes
- Generic inbound leads

## Validation Checks

The validation script checks for:

1. Valid YAML structure in playbook.yaml files
2. Required fields in template.json files
3. Un-awaited `metaphor.integration()`, `metaphor.waitForInput()`, and `metaphor.agent()` calls
4. Proper step file references
5. Valid input/output configurations

All validation checks passed for the 9 target templates.
