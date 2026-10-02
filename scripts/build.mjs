#!/usr/bin/env node
/**
 * Generates everything derived from templates/:
 *   - templates/<id>/README.md
 *   - catalog.json (read by the in-app gallery)
 *   - the template tables inside README.md between the marker comments
 *
 * `--check` fails if any generated file is out of date (used in CI).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  root,
  loadConfig,
  loadTemplates,
  validateTemplate,
  catalogEntry,
  renderTemplateReadme,
  renderCatalogTable,
  categoryLabel,
  CATEGORIES,
} from './lib.mjs';

const check = process.argv.includes('--check');
const { site, shares } = loadConfig();
const templates = loadTemplates();

const problems = templates.flatMap(validateTemplate);
if (problems.length > 0) {
  console.error(problems.map(p => `- ${p}`).join('\n'));
  process.exit(1);
}

const outputs = new Map();

for (const t of templates) {
  outputs.set(
    join(t.folder, 'README.md'),
    renderTemplateReadme(t, { site, repo: site.hubRepo, shares, ref: site.branch }),
  );
}

const catalog = {
  version: 1,
  repo: `${site.org}/${site.hubRepo}`,
  ref: site.branch,
  templates: templates.map(catalogEntry),
};
outputs.set(join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');

const readmePath = join(root, 'README.md');
if (existsSync(readmePath)) {
  const current = readFileSync(readmePath, 'utf8');
  const start = '<!-- templates:start -->';
  const end = '<!-- templates:end -->';
  const a = current.indexOf(start);
  const b = current.indexOf(end);
  if (a !== -1 && b !== -1 && b > a) {
    const sections = CATEGORIES.map(category => {
      const list = templates.filter(t => t.meta.category === category);
      if (list.length === 0) return '';
      return `### ${categoryLabel(category)}\n\n${renderCatalogTable(list, { site, repo: site.hubRepo, shares, ref: site.branch })}\n`;
    })
      .filter(Boolean)
      .join('\n');
    outputs.set(readmePath, `${current.slice(0, a + start.length)}\n\n${sections}\n${current.slice(b)}`);
  }
}

let stale = 0;
for (const [path, content] of outputs) {
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (existing === content) continue;
  if (check) {
    stale += 1;
    console.error(`stale: ${path.replace(root + '/', '')}`);
  } else {
    writeFileSync(path, content);
    console.log(`wrote ${path.replace(root + '/', '')}`);
  }
}

if (check && stale > 0) {
  console.error('\nGenerated files are out of date. Run `npm run build` and commit the result.');
  process.exit(1);
}
if (!check) console.log(`\nBuilt ${templates.length} templates.`);
