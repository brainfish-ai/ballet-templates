#!/usr/bin/env node
/**
 * Publishes each template as a public Ballet share link (`/p/<slug>`) and records the slug in
 * shares.json so READMEs can offer a "Remix" button next to the Import button.
 *
 *   BALLET_API_URL=https://api.ballet.dev BALLET_API_TOKEN=... node scripts/publish-shares.mjs            # dry run
 *   BALLET_API_URL=... BALLET_API_TOKEN=... node scripts/publish-shares.mjs --execute
 *   ... --only zendesk-ticket-triage,github-issue-triage --force
 *
 * Uses a dedicated workspace: each template is imported there with POST /api/playbooks/import and then
 * shared with POST /api/playbook-shares. Existing slugs in shares.json are kept unless --force is set.
 * After running, set "importMode" to "remix" in site.config.json (or leave "import") and run `npm run build`.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, templatesDir, loadTemplates, validateTemplate } from './lib.mjs';

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const force = args.includes('--force');
const onlyIndex = args.indexOf('--only');
const only = onlyIndex === -1 ? null : new Set(args[onlyIndex + 1].split(','));

const apiUrl = (process.env.BALLET_API_URL ?? '').replace(/\/$/, '');
const token = process.env.BALLET_API_TOKEN ?? '';
const sharesPath = join(root, 'shares.json');
const shares = JSON.parse(readFileSync(sharesPath, 'utf8'));

if (execute && (!apiUrl || !token)) {
  console.error('Set BALLET_API_URL and BALLET_API_TOKEN to publish shares.');
  process.exit(1);
}

function readTemplateFiles(folder, base = '') {
  const files = {};
  for (const name of readdirSync(folder)) {
    const full = join(folder, name);
    const rel = base ? `${base}/${name}` : name;
    if (statSync(full).isDirectory()) {
      Object.assign(files, readTemplateFiles(full, rel));
    } else if (rel !== 'README.md') {
      files[rel] = readFileSync(full, 'utf8');
    }
  }
  return files;
}

async function call(path, body) {
  const res = await fetch(`${apiUrl}/api${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: text };
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${json.error ?? text}`);
  return json;
}

const templates = loadTemplates(templatesDir).filter(t => !only || only.has(t.id));
let failed = 0;

for (const t of templates) {
  const errors = validateTemplate(t);
  if (errors.length > 0) {
    console.error(`skip ${t.id}: fails validation (${errors[0]})`);
    failed += 1;
    continue;
  }
  if (shares[t.id] && !force) {
    console.log(`keep ${t.id}: ${shares[t.id]}`);
    continue;
  }
  if (!execute) {
    console.log(`would publish ${t.id}`);
    continue;
  }
  try {
    const imported = await call('/playbooks/import', { bundle: { files: readTemplateFiles(t.folder) } });
    const share = await call('/playbook-shares', { playbookId: imported.playbookId });
    shares[t.id] = share.slug;
    writeFileSync(sharesPath, `${JSON.stringify(shares, null, 2)}\n`);
    console.log(`ok   ${t.id}: ${share.url}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${t.id}: ${err.message}`);
  }
}

if (!execute) console.log('\nDry run. Pass --execute to publish.');
process.exit(failed > 0 ? 1 : 0);
