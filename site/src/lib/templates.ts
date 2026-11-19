import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

export interface SecretSpec {
  name: string;
  description: string;
}

export interface McpServerSpec {
  id: string;
  name?: string;
  transport?: string;
  url?: string;
}

export interface AgentSpec {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  model?: {
    provider: string;
    model: string;
  };
}

export interface StepCall {
  kind: 'agents' | 'integration' | 'mcp' | 'tool' | 'secret' | 'http';
  title: string;
  detail?: string;
}

export interface WorkflowStep {
  id: string;
  type: 'code' | 'http';
  language?: string;
  codeFile?: string;
  code?: string;
  method?: string;
  url?: string;
  description: string;
  friendlyMessage?: string;
  fanout?: 'parallel' | 'map' | null;
  calls: StepCall[];
}

export interface CatalogItem {
  id: string;
  version: string;
  title: string;
  summary: string;
  category: string;
  persona?: string;
  tags: string[];
  difficulty: string;
  trigger: string;
  integrations: string[];
  mcpServers: string[];
  secrets: string[];
  agents: string[];
  steps: number;
  path: string;
  primaryKeyword?: string;
  seoTitle?: string;
  answer?: string;
  faq?: Array<{ q: string; a: string }>;
  sampleOutput?: string;
  setupMinutes?: number;
  whatYouNeed?: string;
  failureHandling?: string;
  nativeVsTemplate?: string;
  related?: string[];
  lastValidated?: string;
}

/** The banner on a template card: where the work starts and what Ballet leaves behind. */
export interface TemplateScene {
  /** App id (or `web`, `webhook`, `api`, `paste`) the work starts in. */
  source: string;
  /** Where in that app, e.g. "New ticket". */
  place: string;
  /** Sample item the playbook picks up. */
  subject: string;
  meta: string;
  /** Optional authentic UI chips for the source preview (e.g. status, tags). */
  chips?: string[];
  out: {
    /** App the result lands in. Omit when the result is returned to the person who ran it. */
    app?: string;
    label: string;
    text: string;
    /** Optional authentic UI chips for the output preview (e.g. label pills, priority). */
    chips?: string[];
  };
}

export interface TemplateDetail extends CatalogItem {
  useCase: string;
  useCaseLabel: string;
  scene: TemplateScene;
  modelLabel: string | null;
  modelProvider: string | null;
  setup: string[];
  notes: string[];
  secretSpecs: SecretSpec[];
  mcpServerSpecs: McpServerSpec[];
  agentSpecs: AgentSpec[];
  workflowSteps: WorkflowStep[];
  triggerKind: 'manual' | 'webhook' | 'schedule' | 'event';
  playbookYaml: string;
  importUrl: string;
  remixUrl: string | null;
  primaryCtaUrl: string;
  primaryCtaLabel: 'Remix in Ballet' | 'Import to Ballet';
  githubUrl: string;
  usesLlm: boolean;
}

interface SiteConfig {
  appUrl: string;
  org: string;
  hubRepo: string;
  branch: string;
  importMode?: 'import' | 'remix';
}

const REPO_ROOT = resolve(process.cwd(), '..');

function readJson<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

const CATEGORY_LABELS: Record<string, string> = {
  support: 'Support',
  sales: 'Sales',
  ops: 'Ops',
  mcp: 'MCP',
};

const PERSONA_LABELS: Record<string, string> = {
  'marketing-ops': 'Marketing Ops',
  revops: 'RevOps',
  'customer-ops': 'Customer Ops',
};

const INTEGRATION_LABELS: Record<string, string> = {
  slack: 'Slack',
  gmail: 'Gmail',
  'google-calendar': 'Google Calendar',
  'google-drive': 'Google Drive',
  'google-sheets': 'Google Sheets',
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  zendesk: 'Zendesk',
  freshdesk: 'Freshdesk',
  intercom: 'Intercom',
  github: 'GitHub',
  linear: 'Linear',
  stripe: 'Stripe',
  outlook: 'Outlook',
  onedrive: 'OneDrive',
  linkedin: 'LinkedIn',
  'meta-ads': 'Meta Ads',
  'google-ads': 'Google Ads',
};

export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Use cases shown as the catalog's categories, in display order. */
export const USE_CASES: Array<{ id: string; label: string; icon: string; accent: string }> = [
  { id: 'lead-management', label: 'Lead management', icon: 'funnel', accent: '#f2c14e' },
  { id: 'sales-pipeline', label: 'Sales pipeline', icon: 'chart-line-up', accent: '#5fd3a0' },
  { id: 'marketing-campaigns', label: 'Marketing campaigns', icon: 'megaphone', accent: '#f5a1c0' },
  { id: 'customer-support', label: 'Customer support', icon: 'lifebuoy', accent: '#7cc4f5' },
  { id: 'data-management', label: 'Data management', icon: 'database', accent: '#c9b8f5' },
  { id: 'project-management', label: 'Project management', icon: 'kanban', accent: '#9db4ff' },
  { id: 'tickets-incidents', label: 'Tickets & incidents', icon: 'ticket', accent: '#f5b38a' },
];

/** Use case per template. Templates not listed here fall back on their repo category. */
const TEMPLATE_USE_CASE: Record<string, string> = {
  'account-icp-scoring': 'lead-management',
  'inbound-lead-slack-alert': 'lead-management',
  'salesforce-lead-enrichment': 'lead-management',
  'meeting-prep-brief': 'sales-pipeline',
  'renewal-radar': 'sales-pipeline',
  'win-loss-by-competitor': 'sales-pipeline',
  'competitor-teardown': 'marketing-campaigns',
  'competitor-watch': 'marketing-campaigns',
  'help-centre-audit': 'customer-support',
  'l1-ticket-triage': 'customer-support',
  'support-reply-drafter': 'customer-support',
  'crm-hygiene': 'data-management',
  'daily-api-digest-slack': 'data-management',
  'generic-webhook-relay': 'data-management',
  'mcp-linear-weekly-digest': 'project-management',
  'mcp-slack-thread-to-linear': 'project-management',
  'freshdesk-ticket-summary': 'tickets-incidents',
  'github-issue-triage': 'tickets-incidents',
  'zendesk-ticket-triage': 'tickets-incidents',
};

const CATEGORY_USE_CASE: Record<string, string> = {
  support: 'customer-support',
  sales: 'sales-pipeline',
  ops: 'data-management',
  mcp: 'project-management',
};

export function formatUseCase(id: string): string {
  return USE_CASES.find(u => u.id === id)?.label ?? id;
}

/** Logo files in `public/assets/apps`, keyed by integration or MCP server id. */
const APP_LOGOS: Record<string, string> = {
  slack: 'slack.svg',
  gmail: 'gmail.svg',
  'google-calendar': 'googlecalendar.svg',
  hubspot: 'hubspot.svg',
  salesforce: 'salesforce.svg',
  zendesk: 'zendesk.svg',
  freshdesk: 'freshdesk.png',
  github: 'github.svg',
  linear: 'linear.svg',
};

/** Starting points that are not an app: drawn with an icon instead of a logo. */
export const SOURCE_ICONS: Record<string, string> = {
  web: 'globe',
  webhook: 'webhooks-logo',
  api: 'brackets-curly',
  paste: 'clipboard-text',
};

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  webhook: 'Webhook',
  api: 'API',
  paste: 'Pasted text',
};

export function appLogo(id: string): string | null {
  return APP_LOGOS[id] ? `/assets/apps/${APP_LOGOS[id]}` : null;
}

export function appLabel(id: string): string {
  return SOURCE_LABELS[id] ?? formatIntegration(id);
}

/** Sample scenes. The names and numbers are examples, not data from a real account. */
const TEMPLATE_SCENES: Record<string, TemplateScene> = {
  'account-icp-scoring': {
    source: 'web',
    place: 'northwind.io',
    subject: '10 company URLs',
    meta: 'Series B · 180 employees · SaaS',
    chips: ['Firmographics', 'Hiring signals'],
    out: { label: 'ICP Score: 92 / 100', text: 'Strong fit · opening line drafted', chips: ['Tier 1', 'Ready'] },
  },
  'competitor-teardown': {
    source: 'web',
    place: 'rival.com/pricing',
    subject: 'Pricing & positioning',
    meta: 'Starter $29 · Pro $79 · Enterprise',
    chips: ['Tiers', 'Messaging'],
    out: { label: 'Battlecard ready', text: '3 pricing gaps & counter-angles', chips: ['Counter', 'Exported'] },
  },
  'competitor-watch': {
    source: 'google-calendar',
    place: 'Thu 2:00 pm',
    subject: 'Acme renewal call',
    meta: '3 external attendees · Rival mentioned',
    chips: ['Calendar', 'Pre-call'],
    out: { app: 'gmail', label: 'Weekly digest', text: 'Rival launched AI tier · 2 battlecards', chips: ['Inbox'] },
  },
  'crm-hygiene': {
    source: 'hubspot',
    place: 'Contacts & Deals',
    subject: '1,240 CRM records',
    meta: '38 duplicates · 112 unowned',
    chips: ['Contacts', 'Audit'],
    out: { app: 'hubspot', label: 'Cleanup plan', text: 'Merge 38 dupes · assign 112 owners', chips: ['Prioritized'] },
  },
  'daily-api-digest-slack': {
    source: 'api',
    place: 'GET /v1/orders',
    subject: '46 orders · 3 refunds',
    meta: '200 OK · JSON payload',
    chips: ['JSON', 'Daily 9am'],
    out: { app: 'slack', label: '#daily-digest', text: '46 orders, 3 refunds, revenue +8%', chips: ['Posted'] },
  },
  'freshdesk-ticket-summary': {
    source: 'freshdesk',
    place: 'Ticket #4821',
    subject: 'Cannot export CSV invoices',
    meta: 'Dana Whitfield · Billing',
    chips: ['Open', 'Urgent'],
    out: { app: 'freshdesk', label: 'Private note added', text: '3-bullet summary + repro steps', chips: ['Note'] },
  },
  'generic-webhook-relay': {
    source: 'webhook',
    place: 'POST /hooks/orders',
    subject: 'order.created event',
    meta: 'HMAC-SHA256 verified',
    chips: ['Signed', '200 OK'],
    out: { app: 'api', label: 'Downstream API', text: 'Reshaped JSON · retried on 5xx', chips: ['Delivered'] },
  },
  'github-issue-triage': {
    source: 'github',
    place: 'Issue #1482',
    subject: 'Crash uploading >2 GB files',
    meta: 'Opened by octo-dev',
    chips: ['New', 'Triage'],
    out: { app: 'github', label: 'Labels applied', text: 'Assigned team & repro checklist', chips: ['bug', 'uploads'] },
  },
  'help-centre-audit': {
    source: 'web',
    place: 'help.yourcompany.com',
    subject: '142 help articles',
    meta: 'Compared against support drivers',
    chips: ['Docs', 'Coverage'],
    out: { label: 'Audit report', text: 'Top 3 missing guides & stale pages', chips: ['3 gaps'] },
  },
  'inbound-lead-slack-alert': {
    source: 'webhook',
    place: 'Demo request form',
    subject: 'Priya Nair · Lumen Ops',
    meta: '250 seats · wants demo this week',
    chips: ['Inbound', '250 seats'],
    out: { app: 'slack', label: '#inbound-leads', text: 'Hot lead (94) · @ae-on-call pinged', chips: ['Hot lead'] },
  },
  'l1-ticket-triage': {
    source: 'zendesk',
    place: 'Unassigned queue',
    subject: '24 open L1 tickets',
    meta: 'Billing, SSO, password resets',
    chips: ['Queue', 'L1'],
    out: { app: 'zendesk', label: 'Triaged & routed', text: '14 auto-drafted · 4 escalated', chips: ['Routed'] },
  },
  'mcp-linear-weekly-digest': {
    source: 'linear',
    place: 'Last 7 days',
    subject: '23 issues updated',
    meta: '9 Done · 4 Blocked · 10 Active',
    chips: ['MCP', 'Cycle 14'],
    out: { app: 'slack', label: '#eng-weekly', text: 'Shipped highlights & 4 blockers', chips: ['Digest'] },
  },
  'mcp-slack-thread-to-linear': {
    source: 'slack',
    place: '#bugs thread',
    subject: 'Checkout fails on Safari',
    meta: '12 replies · screenshot attached',
    chips: ['Thread', '12 replies'],
    out: { app: 'linear', label: 'ENG-412 created', text: 'Title, repro steps & Slack link', chips: ['Bug', 'High'] },
  },
  'meeting-prep-brief': {
    source: 'google-calendar',
    place: 'Tomorrow · 10:30 am',
    subject: 'Intro with Brightwave',
    meta: '3 external meetings scheduled',
    chips: ['Calendar', '3 calls'],
    out: { label: 'Prep briefs ready', text: 'Company news, roles & talking points', chips: ['3 briefs'] },
  },
  'renewal-radar': {
    source: 'google-calendar',
    place: 'Wed 11:00 am',
    subject: 'Acme Corp renewal',
    meta: '3 renewals in next 14 days',
    chips: ['Renewal', '14d'],
    out: { app: 'gmail', label: 'Renewal radar', text: 'Acme flagged at-risk + call brief', chips: ['At risk'] },
  },
  'salesforce-lead-enrichment': {
    source: 'salesforce',
    place: 'Lead · Jordan Blake',
    subject: 'VP Sales at Helix (helix.io)',
    meta: 'New lead · unenriched',
    chips: ['Lead', 'New'],
    out: { app: 'salesforce', label: 'Lead enriched', text: 'Company brief + Rating: Hot', chips: ['Hot', 'Enriched'] },
  },
  'support-reply-drafter': {
    source: 'paste',
    place: 'Customer message',
    subject: '“Charged twice this month”',
    meta: 'Matched against billing policy',
    chips: ['Refund', 'Policy'],
    out: { label: 'Reply drafted', text: 'Empathetic response + cited source', chips: ['Ready'] },
  },
  'win-loss-by-competitor': {
    source: 'hubspot',
    place: 'Closed Deals',
    subject: '186 deals analyzed',
    meta: 'Closed Won & Closed Lost',
    chips: ['Deals', 'Q3-Q4'],
    out: { label: 'Win/loss report', text: 'Win rate & revenue by competitor', chips: ['Report'] },
  },
  'zendesk-ticket-triage': {
    source: 'zendesk',
    place: 'Ticket #9042',
    subject: 'Refund missing after 10 days',
    meta: 'Maya Ortiz · VIP account',
    chips: ['New', 'Billing'],
    out: { app: 'zendesk', label: 'Internal note', text: 'Priority: High · tag: billing-refund', chips: ['High', 'Note'] },
  },
};

function fallbackScene(entry: CatalogItem): TemplateScene {
  const apps = [...entry.integrations, ...entry.mcpServers];
  return {
    source: apps[0] ?? 'web',
    place: entry.trigger,
    subject: entry.title,
    meta: `${entry.steps} ${entry.steps === 1 ? 'step' : 'steps'}`,
    out: { app: apps[1], label: 'Ballet runs it', text: entry.summary },
  };
}

export function formatPersona(persona: string): string {
  return PERSONA_LABELS[persona] ?? persona;
}

export function formatIntegration(id: string): string {
  return (
    INTEGRATION_LABELS[id] ??
    id
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function formatModelLabel(modelId: string): string {
  const bare = modelId.includes('/') ? modelId.split('/').pop()! : modelId;
  const known: Record<string, string> = {
    default: 'Claude Sonnet 5.5',
    'claude-sonnet-5.5': 'Claude Sonnet 5.5',
    'claude-sonnet-4.5': 'Claude Sonnet 4.5',
    'claude-opus-4.5': 'Claude Opus 4.5',
    'claude-haiku-4.5': 'Claude Haiku 4.5',
    'gpt-5': 'GPT-5',
    'gpt-5-mini': 'GPT-5 mini',
  };
  return (
    known[bare] ??
    bare
      .split('-')
      .map(w => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
      .join(' ')
  );
}

function providerFromModel(modelId: string | undefined, label: string | null): string | null {
  if (!label) return null;
  if (modelId && modelId.includes('/')) {
    const prefix = modelId.split('/')[0]!.toLowerCase();
    if (prefix === 'anthropic' || prefix === 'openai' || prefix === 'google') return prefix;
  }
  if (/^claude/i.test(label)) return 'anthropic';
  if (/^gpt|^o[134]/i.test(label)) return 'openai';
  if (/^gemini/i.test(label)) return 'google';
  return null;
}

function buildImportUrl(site: SiteConfig, templateId: string): string {
  const q = new URLSearchParams({
    repo: `${site.org}/${site.hubRepo}`,
    path: `templates/${templateId}`,
    ref: site.branch,
  });
  return `${site.appUrl}/import?${q.toString().replace(/%2F/g, '/')}`;
}

function buildRemixUrl(site: SiteConfig, slug: string): string {
  return `${site.appUrl}/signup?remix=${encodeURIComponent(slug)}`;
}

function extractStepCalls(step: Record<string, unknown>, code: string): StepCall[] {
  const calls: StepCall[] = [];
  const seen = new Set<string>();
  const push = (call: StepCall) => {
    const key = `${call.kind}:${call.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      calls.push(call);
    }
  };

  if (step.type === 'http') {
    const method = String(step.method ?? 'GET').toUpperCase();
    const url = String(step.url ?? '');
    let host = url;
    try {
      if (!url.startsWith('{{')) host = new URL(url).hostname;
    } catch {
      host = url;
    }
    push({ kind: 'http', title: `${method} ${host}` });
  }

  for (const m of code.matchAll(/metaphor\.agent\(\s*['"]([^'"]+)['"]/g)) {
    push({ kind: 'agents', title: m[1]! });
  }
  for (const m of code.matchAll(/metaphor\.integration\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?/g)) {
    const label = m[2] ? `${formatIntegration(m[1]!)} · ${m[2]}` : formatIntegration(m[1]!);
    push({ kind: 'integration', title: label });
  }
  for (const m of code.matchAll(/metaphor\.mcp\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g)) {
    push({ kind: 'mcp', title: `${m[1]}/${m[2]}` });
  }
  for (const m of code.matchAll(/metaphor\.tool\(\s*['"]([^'"]+)['"]/g)) {
    push({ kind: 'tool', title: m[1]! });
  }
  for (const m of code.matchAll(/metaphor\.secret\(\s*['"]([A-Za-z0-9_]+)['"]/g)) {
    push({ kind: 'secret', title: m[1]! });
  }

  return calls;
}

function detectFanout(code: string): 'parallel' | 'map' | null {
  if (/Promise\.all|metaphor\.parallel/.test(code)) return 'parallel';
  if (/\.map\s*\(|for\s*\(/.test(code)) return 'map';
  return null;
}

function inferTriggerKind(
  triggerType: string | undefined,
  triggerText: string,
): 'manual' | 'webhook' | 'schedule' | 'event' {
  const t = (triggerType ?? triggerText).toLowerCase();
  if (t.includes('webhook')) return 'webhook';
  if (t.includes('schedule') || t.includes('cron')) return 'schedule';
  if (t.includes('event')) return 'event';
  return 'manual';
}

let cachedTemplates: TemplateDetail[] | null = null;

export function getAllTemplates(): TemplateDetail[] {
  if (cachedTemplates) return cachedTemplates;

  const site = readJson<SiteConfig>(join(REPO_ROOT, 'site.config.json'), {
    appUrl: 'https://app.ballet.dev',
    org: 'brainfish-ai',
    hubRepo: 'ballet-templates',
    branch: 'main',
    importMode: 'import',
  });
  const shares = readJson<Record<string, string>>(join(REPO_ROOT, 'shares.json'), {});
  const catalog = readJson<{ templates: CatalogItem[] }>(join(REPO_ROOT, 'catalog.json'), {
    templates: [],
  });

  cachedTemplates = catalog.templates.map(entry => {
    const folder = join(REPO_ROOT, entry.path);
    const meta = readJson<{
      setup?: string[];
      notes?: string[];
      secrets?: SecretSpec[];
      mcpServers?: McpServerSpec[];
    }>(join(folder, 'template.json'), {});

    const yamlPath = join(folder, 'playbook.yaml');
    const playbookYaml = existsSync(yamlPath) ? readFileSync(yamlPath, 'utf8') : '';
    const doc = playbookYaml
      ? (parseYaml(playbookYaml) as {
          spec?: {
            trigger?: { type?: string };
            steps?: Array<Record<string, unknown>>;
          };
        })
      : {};

    const agentSpecs: AgentSpec[] = [];
    const agentsDir = join(folder, 'agents');
    if (existsSync(agentsDir)) {
      for (const file of readdirSync(agentsDir).sort()) {
        if (!file.endsWith('.json')) continue;
        const spec = readJson<AgentSpec | null>(join(agentsDir, file), null);
        if (spec) agentSpecs.push(spec);
      }
    }

    const rawSteps = Array.isArray(doc?.spec?.steps) ? doc.spec!.steps! : [];
    const workflowSteps: WorkflowStep[] = rawSteps.map(step => {
      const codeFile = typeof step.codeFile === 'string' ? step.codeFile : undefined;
      const codePath = codeFile ? join(folder, codeFile) : undefined;
      const code = codePath && existsSync(codePath) ? readFileSync(codePath, 'utf8') : '';
      return {
        id: String(step.id ?? 'step'),
        type: step.type === 'http' ? 'http' : 'code',
        language: typeof step.language === 'string' ? step.language : undefined,
        codeFile,
        code: code || undefined,
        method: typeof step.method === 'string' ? step.method : undefined,
        url: typeof step.url === 'string' ? step.url : undefined,
        description: String(step.description ?? ''),
        friendlyMessage: typeof step.friendlyMessage === 'string' ? step.friendlyMessage : undefined,
        fanout: detectFanout(code),
        calls: extractStepCalls(step, code),
      };
    });

    const slug = shares[entry.id];
    const remix = slug ? buildRemixUrl(site, slug) : null;
    const imp = buildImportUrl(site, entry.id);
    const useRemix = site.importMode === 'remix' && remix !== null;

    const useCase = TEMPLATE_USE_CASE[entry.id] ?? CATEGORY_USE_CASE[entry.category] ?? 'data-management';
    const agentModel = agentSpecs.find(a => a.model)?.model;
    const modelLabel = !agentSpecs.length
      ? null
      : !agentModel || agentModel.model === 'default'
        ? 'Claude Sonnet 5.5'
        : formatModelLabel(agentModel.model);
    const modelProvider = providerFromModel(agentModel?.model, modelLabel);

    return {
      ...entry,
      useCase,
      useCaseLabel: formatUseCase(useCase),
      scene: TEMPLATE_SCENES[entry.id] ?? fallbackScene(entry),
      modelLabel,
      modelProvider,
      setup: Array.isArray(meta.setup) ? meta.setup : [],
      notes: Array.isArray(meta.notes) ? meta.notes : [],
      secretSpecs: Array.isArray(meta.secrets) ? meta.secrets : [],
      mcpServerSpecs: Array.isArray(meta.mcpServers) ? meta.mcpServers : [],
      agentSpecs,
      workflowSteps,
      triggerKind: inferTriggerKind(doc?.spec?.trigger?.type, entry.trigger),
      playbookYaml,
      importUrl: imp,
      remixUrl: remix,
      primaryCtaUrl: useRemix ? remix! : imp,
      primaryCtaLabel: useRemix ? 'Remix in Ballet' : 'Import to Ballet',
      githubUrl: `https://github.com/${site.org}/${site.hubRepo}/tree/${site.branch}/${entry.path}`,
      usesLlm: !entry.tags.includes('no-llm') && (entry.agents.length > 0 || entry.tags.includes('llm')),
    };
  });

  return cachedTemplates;
}

export function getTemplateById(id: string): TemplateDetail | undefined {
  return getAllTemplates().find(t => t.id === id);
}

export function getCatalogFacets(templates: TemplateDetail[]) {
  const categories = Array.from(new Set(templates.map(t => t.category)));
  const personas = Array.from(new Set(templates.map(t => t.persona).filter(Boolean))) as string[];
  const integrations = Array.from(
    new Set(templates.flatMap(t => [...t.integrations, ...t.mcpServers])),
  ).sort();
  const difficulties = ['beginner', 'intermediate', 'advanced'].filter(d =>
    templates.some(t => t.difficulty === d),
  );
  return { categories, personas, integrations, difficulties };
}
