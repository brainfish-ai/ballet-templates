#!/usr/bin/env node
/**
 * Creates the public GitHub repositories and pushes the synced content.
 *
 *   node scripts/publish-repos.mjs                 # dry run: prints the commands
 *   node scripts/publish-repos.mjs --execute       # runs them (creates PUBLIC repos)
 *   node scripts/publish-repos.mjs --only ballet-templates,awesome-ballet
 *
 * Requires the GitHub CLI (`gh auth login`) with permission to create repositories in the org.
 * Run `npm run sync` first so each sibling folder is up to date.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, loadConfig } from './lib.mjs';

const execute = process.argv.includes('--execute');
const onlyArg = process.argv.indexOf('--only');
const only = onlyArg === -1 ? null : new Set(process.argv[onlyArg + 1].split(','));
const outArg = process.argv.indexOf('--out');
const out = resolve(outArg === -1 ? join(root, '..') : process.argv[outArg + 1]);

const { site, repos } = loadConfig();
const names = [site.hubRepo, ...repos.themed.map(r => r.repo), 'ballet-playbook-starter', 'awesome-ballet'];

function run(cmd, args, cwd) {
  const printable = `${cmd} ${args.map(a => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`;
  console.log(`${cwd ? `(cd ${cwd}) ` : ''}$ ${printable}`);
  if (!execute) return 0;
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  return res.status ?? 1;
}

for (const name of names) {
  if (only && !only.has(name)) continue;
  const dir = join(out, name);
  if (!existsSync(dir)) {
    console.error(`\nskip ${name}: ${dir} does not exist (run npm run sync)`);
    continue;
  }
  const settingsPath = join(dir, '.github', 'repo-settings.json');
  const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : { description: '', topics: [] };
  const full = `${site.org}/${name}`;
  console.log(`\n# ${full}`);

  if (!existsSync(join(dir, '.git'))) {
    if (run('git', ['init', '-b', site.branch], dir) !== 0) process.exit(1);
  }
  run('git', ['add', '-A'], dir);
  run('git', ['commit', '-m', 'Initial commit'], dir);
  const create = ['repo', 'create', full, '--public', '--description', settings.description, '--source', '.', '--push'];
  if (run('gh', create, dir) !== 0) process.exit(1);
  const edit = ['repo', 'edit', full, ...settings.topics.flatMap(t => ['--add-topic', t])];
  if (name === 'ballet-playbook-starter') edit.push('--template');
  run('gh', edit, dir);
}

console.log(
  execute
    ? '\nDone. GitHub does not expose social preview upload in the API: set assets/social-preview.png in each repository under Settings, then Social preview.'
    : '\nDry run only. Re-run with --execute to create the public repositories.',
);
