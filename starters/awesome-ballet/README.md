# Awesome Ballet [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

A curated list of templates, integrations, guides and examples for [Ballet](https://ballet.dev), the agent operations platform for building, running and observing deterministic workflows.

## Contents

- [Template collections](#template-collections)
- [All templates](#all-templates)
- [Concepts](#concepts)
- [Contributing](#contributing)

## Template collections

- [ballet-templates]({{HUB_URL}}): every official template, with one-click import.
{{COLLECTION_LINES}}
- [ballet-playbook-starter]({{STARTER_URL}}): GitHub template repository for publishing your own templates.

## All templates

{{ALL_TEMPLATES}}

## Concepts

- **Playbook**: a workflow of code and HTTP steps with a trigger (webhook, schedule or manual run), versioned and observable.
- **Agent**: an LLM configuration with instructions, optional tools and an output contract, called from a step with `metaphor.agent()`.
- **MCP server**: an external tool server (Linear, Slack, GitHub and others) called from a step with `metaphor.mcp()`.
- **Template**: a playbook folder (`playbook.yaml`, `steps/`, `agents/`, `template.json`) that imports into a workspace with one click.

## Contributing

Add a resource with a pull request: one line per entry, alphabetical within a section, with a short description that says what it does. Templates themselves belong in [ballet-templates]({{HUB_URL}}).

## License

[CC0](https://creativecommons.org/publicdomain/zero/1.0/)
