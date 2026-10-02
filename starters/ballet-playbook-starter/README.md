# Ballet Playbook Starter

Use this repository as a GitHub template to publish your own [Ballet](https://ballet.dev) playbook templates with a one-click **Import to Ballet** button.

Click **Use this template** at the top of the page, then follow the steps below.

## 1. Rename the example

The example lives in `templates/my-first-playbook/`. Rename the folder and change the same id in three places: the folder name, `metadata.id` in `playbook.yaml`, and `id` in `template.json`.

## 2. Edit the playbook

| File | What to change |
|---|---|
| `playbook.yaml` | Trigger, input schema and steps (`metaphor.run/v1`) |
| `steps/*.ts` | Code for each code step |
| `agents/*.json` | Agents your steps call with `metaphor.agent('<id>')` |
| `template.json` | Title, summary, category, secrets, MCP servers and setup steps |

Rules that keep templates safe to import: no inline code, no credentials in files, every secret declared in `template.json`, every agent called has a file, and no `metaphor.flow()` sub-playbooks.

## 3. Check and build

```bash
npm install
npm run check    # validates the template and fails if generated files are stale
npm run build    # regenerates each template README and catalog.json
```

Set `org` and `hubRepo` in `site.config.json` to your GitHub owner and this repository's name so the generated Import links point at your repo.

## 4. Share it

Push to GitHub. The generated `templates/<id>/README.md` contains an **Import to Ballet** button that opens:

```text
{{APP_URL}}/import?repo=<owner>/<repo>&path=templates/<id>&ref=main
```

Anyone who clicks it can review and import your template. Ballet shows an "unverified source" notice for repositories outside its curated set, and the reader always sees the code before anything is created.

## Want it listed in the official collection?

Open a pull request against [{{ORG}}/{{HUB}}](https://github.com/{{ORG}}/{{HUB}}).

## License

[MIT](LICENSE)
