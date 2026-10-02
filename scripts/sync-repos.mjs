#!/usr/bin/env node
/**
 * Publishes the starter repo and awesome-ballet into sibling folders from this hub, so they never
 * drift. All templates live in this hub; there are no per-topic copies.
 *
 *   node scripts/sync-repos.mjs [--out <dir>] [--ref <branch|tag>] [--mode import|remix]
 *
 * Nothing is committed or pushed. Run scripts/publish-repos.mjs for that.
 */
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, symlinkSync, unlinkSync, lstatSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  root,
  loadConfig,
  loadTemplates,
  validateTemplate,
  renderCatalogTable,
  repoUrl,
} from './lib.mjs';
import { writeSocialPreview } from './social-preview.mjs';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const out = resolve(arg('out') ?? join(root, '..'));
const { site: hubSite, repos, shares } = loadConfig();
const ref = arg('ref') ?? hubSite.branch;
const importMode = arg('mode') ?? hubSite.importMode;
const templates = loadTemplates();

const problems = templates.flatMap(validateTemplate);
if (problems.length > 0) {
  console.error(problems.map(p => `- ${p}`).join('\n'));
  process.exit(1);
}

const GENERATED = ['templates', 'scripts', 'assets', '.github'];
const COMMON_FILES = ['LICENSE', '.gitignore', 'package-lock.json'];

function fill(text, tokens) {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => (key in tokens ? tokens[key] : m));
}

function resetDest(dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of GENERATED) rmSync(join(dest, name), { recursive: true, force: true });
}

function copyCommon(dest, repoName) {
  mkdirSync(join(dest, 'scripts'), { recursive: true });
  for (const f of ['lib.mjs', 'validate.mjs', 'build.mjs']) cpSync(join(root, 'scripts', f), join(dest, 'scripts', f));
  cpSync(join(root, 'assets'), join(dest, 'assets'), { recursive: true });
  cpSync(join(root, '.github'), join(dest, '.github'), { recursive: true });
  for (const f of COMMON_FILES) if (existsSync(join(root, f))) cpSync(join(root, f), join(dest, f));
  const lockPath = join(dest, 'package-lock.json');
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    lock.name = repoName;
    if (lock.packages?.['']) lock.packages[''].name = repoName;
    writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  pkg.name = repoName;
  pkg.scripts = { validate: pkg.scripts.validate, build: pkg.scripts.build, check: pkg.scripts.check };
  writeFileSync(join(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
}

function writeSettings(dest, { description, topics }) {
  mkdirSync(join(dest, '.github'), { recursive: true });
  writeFileSync(join(dest, '.github', 'repo-settings.json'), JSON.stringify({ description, topics }, null, 2) + '\n');
}

function runBuild(dest) {
  const link = join(dest, 'node_modules');
  let created = false;
  if (!existsSync(link)) {
    symlinkSync(join(root, 'node_modules'), link, 'dir');
    created = true;
  }
  const res = spawnSync('node', ['scripts/build.mjs'], { cwd: dest, stdio: 'inherit' });
  if (created && lstatSync(link).isSymbolicLink()) unlinkSync(link);
  if (res.status !== 0) throw new Error(`build failed in ${dest}`);
}

const starterName = 'ballet-playbook-starter';
const awesomeName = 'awesome-ballet';

function baseTokens(extra = {}) {
  return {
    ORG: hubSite.org,
    HUB: hubSite.hubRepo,
    HUB_URL: repoUrl(hubSite, hubSite.hubRepo),
    STARTER_URL: repoUrl(hubSite, starterName),
    APP_URL: hubSite.appUrl,
    ...extra,
  };
}

{
  const dest = join(out, starterName);
  console.log(`\n== ${starterName}`);
  resetDest(dest);
  copyCommon(dest, starterName);
  cpSync(join(root, 'starters', starterName, 'templates'), join(dest, 'templates'), { recursive: true });
  const site = { ...hubSite, hubRepo: starterName, branch: ref, importMode: 'import' };
  writeFileSync(join(dest, 'site.config.json'), JSON.stringify(site, null, 2) + '\n');
  writeFileSync(join(dest, 'shares.json'), '{}\n');
  const tokens = baseTokens({ REPO: starterName });
  writeFileSync(
    join(dest, 'README.md'),
    fill(readFileSync(join(root, 'starters', starterName, 'README.md'), 'utf8'), tokens),
  );
  const description = 'GitHub template repository for publishing Ballet playbook templates with a one-click import button.';
  writeSettings(dest, {
    description,
    topics: ['ai-agents', 'workflow-automation', 'playbook-templates', 'template-repository', 'ballet'],
  });
  writeSocialPreview(join(dest, 'assets', 'social-preview'), { title: 'Ballet Playbook Starter', tagline: description });
  runBuild(dest);
}

{
  const dest = join(out, awesomeName);
  console.log(`\n== ${awesomeName}`);
  mkdirSync(dest, { recursive: true });
  rmSync(join(dest, 'assets'), { recursive: true, force: true });
  mkdirSync(join(dest, 'assets'), { recursive: true });
  const rows = renderCatalogTable(templates, {
    site: hubSite,
    repo: hubSite.hubRepo,
    shares,
    ref,
    pathPrefix: `${repoUrl(hubSite, hubSite.hubRepo)}/tree/${ref}/templates`,
  });
  const tokens = baseTokens({ ALL_TEMPLATES: rows });
  writeFileSync(join(dest, 'README.md'), fill(readFileSync(join(root, 'starters', awesomeName, 'README.md'), 'utf8'), tokens));
  cpSync(join(root, 'starters', awesomeName, 'LICENSE'), join(dest, 'LICENSE'));
  writeFileSync(join(dest, '.gitignore'), '.DS_Store\n');
  const description = 'A curated list of Ballet templates, integrations, guides and examples.';
  writeSettings(dest, { description, topics: ['awesome', 'awesome-list', 'ai-agents', 'workflow-automation', 'mcp', 'ballet'] });
  writeSocialPreview(join(dest, 'assets', 'social-preview'), { title: 'Awesome Ballet', tagline: description });
}

writeSettings(root, {
  description: 'Importable Ballet playbook templates for support, sales, ops and MCP workflows.',
  topics: repos.hubTopics,
});
writeSocialPreview(join(root, 'assets', 'social-preview'), {
  title: 'Ballet Templates',
  tagline: 'Importable playbook templates for support, sales, ops and MCP workflows.',
});

console.log(`\nSynced 2 repos into ${out} (import mode: ${importMode}, ref: ${ref}).`);
