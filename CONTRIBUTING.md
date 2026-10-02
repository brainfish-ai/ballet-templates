# Contributing a template

Thanks for adding to Ballet Templates. One template per pull request keeps review fast.

## Checklist

- [ ] Folder name is `kebab-case` and equals `metadata.id` in `playbook.yaml` and `id` in `template.json`.
- [ ] `playbook.yaml` uses `apiVersion: metaphor.run/v1` and `kind: Playbook`.
- [ ] Every step has an `id` (snake_case) and a one-line `description`; the descriptions become the README.
- [ ] Code steps use `codeFile: steps/<id>.ts` (TypeScript preferred). No inline `code`.
- [ ] Every agent called with `metaphor.agent('<id>')` has `agents/<id>.json` with `"model": { "provider": "gateway", "model": "default" }`. Ballet substitutes the workspace default model on import.
- [ ] Every secret is referenced by name (`{{ secret.NAME }}`, `tokenRef`, `credentialRef` or `metaphor.secret`) and listed in `template.json` with a description. Never commit a real key.
- [ ] MCP servers are declared in `template.json` under `mcpServers` with the tools you call. Use only tool names that exist on the server.
- [ ] No `metaphor.flow()` calls, custom tools or custom `metaphor.tool()` ids. Platform tools (`search_web`, `read_url`, `send_email`, `html_to_pdf`) are fine.
- [ ] `npm run build` has been run and the generated files are committed.

## Run the checks

```bash
npm install
npm run check
```

CI runs the same command on every pull request.

## Review criteria

- It solves a real, repeatable job in one sentence.
- It runs safely: reads before it writes, retries on writes, never auto-sends customer-facing messages without a human step unless that is the point of the template.
- The README setup steps are enough for someone who has never used Ballet.

## Licensing

By contributing you agree your template is released under the MIT license in this repository.
