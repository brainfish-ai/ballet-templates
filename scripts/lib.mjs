import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const templatesDir = join(root, 'templates');

export const API_VERSION = 'metaphor.run/v1';
export const KIND = 'Playbook';
export const CATEGORIES = ['support', 'sales', 'ops', 'mcp'];
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
export const MAX_YAML_BYTES = 256 * 1024;
export const MAX_CODE_BYTES = 1024 * 1024;

const CATEGORY_LABELS = { support: 'Support', sales: 'Sales', ops: 'Ops', mcp: 'MCP' };
export const categoryLabel = c => CATEGORY_LABELS[c] ?? c;

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadConfig() {
  return {
    site: readJson(join(root, 'site.config.json')),
    repos: existsSync(join(root, 'repos.json')) ? readJson(join(root, 'repos.json')) : {},
    shares: existsSync(join(root, 'shares.json')) ? readJson(join(root, 'shares.json')) : {},
  };
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    if (entry.startsWith('.')) continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) out.push(...listFiles(abs, base));
    else out.push(abs.slice(base.length + 1));
  }
  return out;
}

/** Load every template folder under `dir`. Never throws on malformed content; `validateTemplate` reports it. */
export function loadTemplates(dir = templatesDir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(name => !name.startsWith('.') && statSync(join(dir, name)).isDirectory())
    .sort()
    .map(name => loadTemplate(join(dir, name)));
}

export function loadTemplate(folder) {
  const id = folder.split('/').pop();
  const t = { id, folder, errors: [], meta: null, doc: null, yaml: '', files: {}, agents: [] };
  const metaPath = join(folder, 'template.json');
  if (existsSync(metaPath)) {
    try {
      t.meta = readJson(metaPath);
    } catch (err) {
      t.errors.push(`template.json: ${err.message}`);
    }
  } else {
    t.errors.push('template.json is missing');
  }
  const yamlPath = join(folder, 'playbook.yaml');
  if (existsSync(yamlPath)) {
    t.yaml = readFileSync(yamlPath, 'utf8');
    try {
      t.doc = parseYaml(t.yaml);
    } catch (err) {
      t.errors.push(`playbook.yaml: ${err.message}`);
    }
  } else {
    t.errors.push('playbook.yaml is missing');
  }
  for (const rel of listFiles(folder)) {
    if (/^steps\/.+\.(js|ts)$/.test(rel)) t.files[rel] = readFileSync(join(folder, rel), 'utf8');
    if (/^agents\/.+\.json$/.test(rel)) {
      try {
        t.agents.push({ file: rel, config: readJson(join(folder, rel)) });
      } catch (err) {
        t.errors.push(`${rel}: ${err.message}`);
      }
    }
  }
  return t;
}

const SECRET_TEMPLATE = /\{\{\s*secrets?\.([A-Za-z0-9_]+)\s*\}\}/g;
const SECRET_CALL = /metaphor\.secret\(\s*['"]([A-Za-z0-9_]+)['"]/g;
const AGENT_CALL = /metaphor\.agent\(\s*['"]([^'"]+)['"]/g;
const MCP_CALL = /metaphor\.mcp\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g;
const TOOL_CALL = /metaphor\.tool\(\s*['"]([^'"]+)['"]/g;
const FLOW_CALL = /metaphor\.flow\(/;

function matchAll(re, text) {
  return [...text.matchAll(new RegExp(re.source, re.flags))];
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => collectStrings(v, out));
  return out;
}

/** Static dependency scan of one template: secrets, agents, MCP servers, tools. */
export function scanDependencies(t) {
  const secrets = new Set();
  const agents = new Set();
  const tools = new Set();
  const mcp = new Map();
  const doc = t.doc;
  if (!doc) return { secrets, agents, tools, mcp, usesFlow: false };

  for (const s of collectStrings(doc)) {
    for (const m of matchAll(SECRET_TEMPLATE, s)) secrets.add(m[1]);
  }
  const webhook = doc.spec?.trigger?.webhook;
  if (webhook?.credentialRef) secrets.add(webhook.credentialRef);

  for (const step of doc.spec?.steps ?? []) {
    if (step.type === 'http' && step.auth) {
      for (const key of ['tokenRef', 'userRef', 'passRef', 'valueRef']) {
        if (step.auth[key]) secrets.add(step.auth[key]);
      }
    }
  }

  let usesFlow = false;
  for (const code of Object.values(t.files)) {
    for (const m of matchAll(SECRET_CALL, code)) secrets.add(m[1]);
    for (const m of matchAll(AGENT_CALL, code)) agents.add(m[1]);
    for (const m of matchAll(TOOL_CALL, code)) tools.add(m[1]);
    for (const m of matchAll(MCP_CALL, code)) {
      if (!mcp.has(m[1])) mcp.set(m[1], new Set());
      mcp.get(m[1]).add(m[2]);
    }
    if (FLOW_CALL.test(code)) usesFlow = true;
  }
  return { secrets, agents, tools, mcp, usesFlow };
}

const SECRET_LITERALS = [
  /sk-[A-Za-z0-9]{20,}/,
  /xox[abprs]-[A-Za-z0-9-]{10,}/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

const PLATFORM_TOOLS = new Set(['search_web', 'read_url', 'send_email', 'html_to_pdf']);

/** Returns a list of human-readable problems; empty means valid. */
export function validateTemplate(t) {
  const errors = [...t.errors];
  const meta = t.meta;
  const doc = t.doc;
  const where = msg => `${t.id}: ${msg}`;

  if (meta) {
    if (meta.id !== t.id) errors.push(`template.json id "${meta.id}" must equal folder name "${t.id}"`);
    for (const key of ['title', 'summary', 'trigger']) {
      if (typeof meta[key] !== 'string' || !meta[key].trim()) errors.push(`template.json: "${key}" is required`);
    }
    if (typeof meta.summary === 'string' && meta.summary.length > 200) errors.push('template.json: summary must be 200 characters or fewer');
    if (!CATEGORIES.includes(meta.category)) errors.push(`template.json: category must be one of ${CATEGORIES.join(', ')}`);
    if (!DIFFICULTIES.includes(meta.difficulty)) errors.push(`template.json: difficulty must be one of ${DIFFICULTIES.join(', ')}`);
    if (!Array.isArray(meta.tags) || meta.tags.length === 0) errors.push('template.json: tags must be a non-empty array');
    if (!Array.isArray(meta.secrets)) errors.push('template.json: secrets must be an array');
    if (!Array.isArray(meta.setup) || meta.setup.length === 0) errors.push('template.json: setup must be a non-empty array');
    for (const s of meta.secrets ?? []) {
      if (!/^[A-Z][A-Z0-9_]*$/.test(s.name ?? '')) errors.push(`template.json: secret "${s.name}" must be UPPER_SNAKE_CASE`);
      if (!s.description) errors.push(`template.json: secret "${s.name}" needs a description`);
    }
  }

  if (doc) {
    if (doc.apiVersion !== API_VERSION) errors.push(`apiVersion must be ${API_VERSION}`);
    if (doc.kind !== KIND) errors.push(`kind must be ${KIND}`);
    if (doc.metadata?.id !== t.id) errors.push(`metadata.id "${doc.metadata?.id}" must equal folder name "${t.id}"`);
    if (!doc.metadata?.name) errors.push('metadata.name is required');
    if (t.yaml.length > MAX_YAML_BYTES) errors.push('playbook.yaml exceeds 256KB');
    const steps = doc.spec?.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      errors.push('spec.steps must be a non-empty array');
    } else {
      const seen = new Set();
      steps.forEach((step, i) => {
        const label = `step[${i}]`;
        if (!step.id) return errors.push(`${label}.id is required`);
        if (seen.has(step.id)) errors.push(`${label}.id "${step.id}" is duplicated`);
        seen.add(step.id);
        if (step.type === 'http') {
          if (!step.method) errors.push(`${label}.method is required`);
          if (!step.url) errors.push(`${label}.url is required`);
        } else if (step.type === 'code') {
          if (!['javascript', 'typescript'].includes(step.language)) {
            errors.push(`${label}.language must be javascript or typescript`);
          }
          if (!step.codeFile) {
            errors.push(`${label}.codeFile is required (inline code is not allowed in templates)`);
          } else if (/(^|\/)\.\.(\/|$)/.test(step.codeFile) || step.codeFile.startsWith('/')) {
            errors.push(`${label}.codeFile must be a relative path inside the template`);
          } else if (!(step.codeFile in t.files)) {
            errors.push(`${label}.codeFile "${step.codeFile}" does not exist`);
          } else if (t.files[step.codeFile].length > MAX_CODE_BYTES) {
            errors.push(`${step.codeFile} exceeds 1MB`);
          }
        } else {
          errors.push(`${label}.type must be "code" or "http"`);
        }
        if (!step.description) errors.push(`${label} (${step.id}) needs a description for the README`);
        if (step.id && !/^[a-z][a-z0-9_]*$/.test(step.id)) errors.push(`${label}.id "${step.id}" must be snake_case`);
      });
      const referenced = new Set(steps.map(s => s.codeFile).filter(Boolean));
      for (const file of Object.keys(t.files)) {
        if (!referenced.has(file)) errors.push(`${file} is not referenced by any step`);
      }
    }
  }

  const deps = scanDependencies(t);
  if (deps.usesFlow) errors.push('metaphor.flow() is not allowed: sub-playbooks are not bundled with templates');

  if (meta?.secrets) {
    const declared = new Set(meta.secrets.map(s => s.name));
    for (const name of deps.secrets) {
      if (!declared.has(name)) errors.push(`secret ${name} is used but not declared in template.json`);
    }
    for (const name of declared) {
      if (!deps.secrets.has(name)) errors.push(`secret ${name} is declared in template.json but never used`);
    }
  }

  const agentIds = new Map();
  for (const { file, config } of t.agents) {
    const base = file.replace(/^agents\//, '').replace(/\.json$/, '');
    if (config.id !== base) errors.push(`${file}: id "${config.id}" must equal the file name`);
    for (const key of ['name', 'instructions']) {
      if (!config[key]) errors.push(`${file}: "${key}" is required`);
    }
    if (!config.model?.provider || !config.model?.model) errors.push(`${file}: model.provider and model.model are required`);
    if (config.model?.apiKeySecret) errors.push(`${file}: BYOK keys are not allowed in templates`);
    if (/api[_-]?key|secret|password/i.test(config.instructions ?? '') && /[:=]\s*\S{12,}/.test(config.instructions ?? '')) {
      errors.push(`${file}: instructions look like they contain a credential`);
    }
    agentIds.set(config.id, file);
  }
  for (const id of deps.agents) {
    if (!agentIds.has(id)) errors.push(`agent "${id}" is called from a step but agents/${id}.json is missing`);
  }
  for (const id of agentIds.keys()) {
    if (!deps.agents.has(id)) errors.push(`agents/${id}.json is not called by any step`);
  }

  for (const id of deps.tools) {
    if (!PLATFORM_TOOLS.has(id)) errors.push(`tool "${id}" is not a platform tool; templates cannot ship custom tools`);
  }

  const declaredMcp = new Set((meta?.mcpServers ?? []).map(s => s.id));
  for (const id of deps.mcp.keys()) {
    if (!declaredMcp.has(id)) errors.push(`MCP server "${id}" is used but not declared in template.json mcpServers`);
  }
  for (const id of declaredMcp) {
    if (!deps.mcp.has(id)) errors.push(`MCP server "${id}" is declared but never called`);
  }

  const everything = [t.yaml, ...Object.values(t.files), ...t.agents.map(a => JSON.stringify(a.config))].join('\n');
  for (const re of SECRET_LITERALS) {
    if (re.test(everything)) errors.push('looks like a hard-coded credential; use a secret reference instead');
  }

  return errors.map(e => (e.startsWith(t.id + ':') ? e : where(e)));
}

export function importUrl(site, repo, templateId, ref) {
  const q = new URLSearchParams({
    repo: `${site.org}/${repo}`,
    path: `templates/${templateId}`,
    ref: ref ?? site.branch,
  });
  return `${site.appUrl}/import?${q.toString().replace(/%2F/g, '/')}`;
}

export function remixUrl(site, slug) {
  return `${site.appUrl}/signup?remix=${encodeURIComponent(slug)}`;
}

export function repoUrl(site, repo) {
  return `https://github.com/${site.org}/${repo}`;
}

/** Primary CTA for a template plus an optional fallback link. */
export function ctaLinks({ site, shares }, repo, templateId, ref) {
  const slug = shares?.[templateId];
  const remix = slug ? remixUrl(site, slug) : null;
  const imp = importUrl(site, repo, templateId, ref);
  if (site.importMode === 'remix' && remix) return { primary: remix, fallback: imp };
  return { primary: imp, fallback: remix };
}

export function catalogEntry(t) {
  const deps = scanDependencies(t);
  return {
    id: t.id,
    title: t.meta.title,
    summary: t.meta.summary,
    category: t.meta.category,
    tags: t.meta.tags,
    difficulty: t.meta.difficulty,
    trigger: t.meta.trigger,
    integrations: t.meta.integrations ?? [],
    mcpServers: (t.meta.mcpServers ?? []).map(s => s.id),
    secrets: t.meta.secrets.map(s => s.name),
    agents: [...deps.agents].sort(),
    steps: t.doc.spec.steps.length,
    path: `templates/${t.id}`,
  };
}

function mdEscape(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function renderTemplateReadme(t, ctx) {
  const { site, repo, shares, ref, assetsPath = '../../assets/import-to-ballet.svg' } = ctx;
  const { primary, fallback } = ctaLinks({ site, shares }, repo, t.id, ref);
  const deps = scanDependencies(t);
  const steps = t.doc.spec.steps;
  const lines = [];
  lines.push(`# ${t.meta.title}`, '', t.meta.summary, '');
  lines.push(`[![Import to Ballet](${assetsPath})](${primary})`, '');
  if (fallback) {
    lines.push(`Prefer another route? [${fallback.includes('/signup?remix=') ? 'Remix it on Ballet' : 'Import from GitHub'}](${fallback}).`, '');
  }
  lines.push('| | |', '|---|---|');
  lines.push(`| Category | ${categoryLabel(t.meta.category)} |`);
  lines.push(`| Difficulty | ${t.meta.difficulty} |`);
  lines.push(`| Trigger | ${mdEscape(t.meta.trigger)} |`);
  lines.push(`| Steps | ${steps.length} |`);
  lines.push('');
  lines.push('## What it does', '');
  steps.forEach((step, i) => {
    lines.push(`${i + 1}. **${step.id}** (${step.type}): ${step.description}`);
  });
  lines.push('');
  lines.push('## What you need', '');
  if (t.meta.secrets.length > 0) {
    lines.push('Secrets (add them in Studio; values never leave your workspace):', '', '| Name | Purpose |', '|---|---|');
    for (const s of t.meta.secrets) lines.push(`| \`${s.name}\` | ${mdEscape(s.description)} |`);
    lines.push('');
  } else {
    lines.push('No secrets required.', '');
  }
  if ((t.meta.integrations ?? []).length > 0) {
    lines.push(`Integrations: ${t.meta.integrations.map(i => `\`${i}\``).join(', ')}`, '');
  }
  if ((t.meta.mcpServers ?? []).length > 0) {
    lines.push('MCP servers (connect from the registry in Studio):', '');
    for (const s of t.meta.mcpServers) lines.push(`- \`${s.id}\`: ${(s.tools ?? []).map(x => `\`${x}\``).join(', ')}`);
    lines.push('');
  }
  if (t.agents.length > 0) {
    lines.push('Agents (created for you on import; edit them in Studio):', '');
    for (const { config } of t.agents) lines.push(`- \`${config.id}\`: ${config.description ?? config.name}`);
    lines.push('');
  }
  lines.push('## Setup', '');
  t.meta.setup.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push('');
  lines.push('## Files', '');
  lines.push('- `playbook.yaml`: the playbook definition (`metaphor.run/v1`)');
  lines.push('- `steps/`: code for each code step');
  if (t.agents.length > 0) lines.push('- `agents/`: agent definitions imported alongside the playbook');
  lines.push('- `template.json`: catalog metadata');
  lines.push('');
  lines.push('Imported playbooks arrive unpublished with triggers off. Read the step code, add your secrets, then publish.', '');
  lines.push(`Template ${t.id} is MIT licensed.`, '');
  void deps;
  return lines.join('\n');
}

export function renderCatalogTable(templates, ctx) {
  const { site, repo, shares, ref, pathPrefix = 'templates' } = ctx;
  const lines = ['| Template | What it does | Trigger | Import |', '|---|---|---|---|'];
  for (const t of templates) {
    const { primary } = ctaLinks({ site, shares }, repo, t.id, ref);
    lines.push(
      `| [${mdEscape(t.meta.title)}](${pathPrefix}/${t.id}) | ${mdEscape(t.meta.summary)} | ${mdEscape(t.meta.trigger)} | [Import](${primary}) |`,
    );
  }
  return lines.join('\n');
}
