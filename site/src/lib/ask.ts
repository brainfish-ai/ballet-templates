import catalog from '../../../catalog.json';

export const JEV_MODEL = 'typesafe-ai/jev';
export const PROMPT_MODEL = 'anthropic/claude-sonnet-5.5';
export const MAX_QUERY_CHARS = 300;
export const MATCH_THRESHOLD = 0.5;
export const COVERS_THRESHOLD = 0.5;
export const JEV_TIMEOUT_MS = 4_000;
export const PROMPT_MAX_TOKENS = 1_200;

export type AskTemplate = {
  id: string;
  name: string;
  summary: string;
  apps: string[];
  category: string;
};

export interface AskMatch {
  id: string;
  probability: number;
}

export interface AskResult {
  matches: AskMatch[];
  found: boolean;
}

export const ASK_TEMPLATES: AskTemplate[] = (catalog.templates ?? []).map((t) => ({
  id: t.id,
  name: t.title,
  summary: t.summary,
  apps: [...(t.integrations ?? []), ...(t.mcpServers ?? [])],
  category: t.category,
}));

const TEMPLATE_BY_ID = new Map(ASK_TEMPLATES.map((t) => [t.id, t]));

export function getAskTemplate(id: string | undefined | null): AskTemplate | undefined {
  if (!id) return undefined;
  return TEMPLATE_BY_ID.get(id);
}

const APP_ALIASES: Record<string, string[]> = {
  hubspot: ['hubspot'],
  salesforce: ['salesforce', 'sfdc'],
  zendesk: ['zendesk'],
  freshdesk: ['freshdesk'],
  slack: ['slack'],
  gmail: ['gmail'],
  'google-calendar': ['google calendar', 'gcal', 'calendar'],
  github: ['github'],
  linear: ['linear'],
  intercom: ['intercom'],
  stripe: ['stripe'],
  outlook: ['outlook'],
  linkedin: ['linkedin'],
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  support: ['support', 'customer support', 'tickets', 'ticket'],
  sales: ['sales', 'pipeline', 'deals', 'crm', 'leads', 'lead'],
  ops: ['ops', 'operations', 'data', 'webhook', 'api'],
  mcp: ['mcp'],
};

const BROWSE_WORDS = new Set([
  'all',
  'any',
  'show',
  'list',
  'find',
  'get',
  'see',
  'browse',
  'template',
  'templates',
  'playbook',
  'playbooks',
  'workflow',
  'workflows',
  'automation',
  'automations',
  'integration',
  'integrations',
  'for',
  'with',
  'using',
  'on',
  'in',
  'the',
  'me',
  'my',
]);

export function matchCatalogBrowseQuery(
  query: string,
  templates: AskTemplate[] = ASK_TEMPLATES,
): AskResult | null {
  const lower = query.toLowerCase();
  const tokens = lower.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;

  const matchedApps = Object.entries(APP_ALIASES)
    .filter(([, aliases]) => aliases.some(a => lower.includes(a)))
    .map(([id]) => id);

  const matchedCategories = Object.entries(CATEGORY_ALIASES)
    .filter(([, aliases]) => aliases.some(a => tokens.includes(a) || lower.includes(a)))
    .map(([id]) => id);

  if (!matchedApps.length && !matchedCategories.length) return null;

  const hasBrowseIntent =
    tokens.some(t => ['all', 'list', 'show', 'browse', 'templates', 'playbooks'].includes(t)) ||
    tokens.every(
      t =>
        BROWSE_WORDS.has(t) ||
        Object.values(APP_ALIASES).some(aliases => aliases.some(a => a.split(' ').includes(t))) ||
        Object.values(CATEGORY_ALIASES).some(aliases => aliases.some(a => a.split(' ').includes(t))),
    );

  if (!hasBrowseIntent) return null;

  const hits = templates.filter(t => {
    const appOk = !matchedApps.length || matchedApps.some(a => t.apps.includes(a));
    const catOk = !matchedCategories.length || matchedCategories.includes(t.category);
    return appOk && catOk;
  });

  if (!hits.length) return null;

  return {
    matches: hits.slice(0, 6).map((t, i) => ({
      id: t.id,
      probability: Number((0.95 - i * 0.05).toFixed(2)),
    })),
    found: true,
  };
}

export function normalizeQuery(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_CHARS);
}

export function buildAskQuestions(templates: AskTemplate[] = ASK_TEMPLATES) {
  const criteria: Record<string, string> = {
    none: 'None of the templates match the request.',
  };
  for (const t of templates) {
    const apps = t.apps.length ? ` Apps: ${t.apps.join(', ')}.` : '';
    criteria[t.id] = `${t.name} (${t.category}): ${t.summary}${apps}`;
  }

  return {
    match: {
      type: 'choice' as const,
      instructions:
        'Which template best matches the user request? Pick "none" if no template fits.',
      criteria,
    },
    covers: {
      type: 'boolean' as const,
      instructions: 'Does the chosen template cover the user request without major changes?',
    },
  };
}

export function rankAskMatches(answers: {
  match?: { choice?: string; probabilities?: Record<string, number> };
  covers?: { probability?: number };
}): AskResult {
  const probs = answers.match?.probabilities ?? {};
  const matches: AskMatch[] = Object.entries(probs)
    .filter(([id, p]) => id !== 'none' && TEMPLATE_BY_ID.has(id) && typeof p === 'number' && p > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, probability]) => ({ id, probability }));

  const choice = answers.match?.choice;
  const top = matches[0];
  const coversProb = answers.covers?.probability ?? 0;

  const found = Boolean(
    choice &&
      choice !== 'none' &&
      top &&
      top.probability >= MATCH_THRESHOLD &&
      coversProb >= COVERS_THRESHOLD,
  );

  return { matches, found };
}

export const PROMPT_SYSTEM = [
  'You write one paste-ready prompt that a user can paste into Ballet to build an automation playbook.',
  'Output only the prompt itself in clean, concise Markdown (bold section labels like **Apps to connect:**, **Trigger:**, **Steps:** and a numbered list; no top-level # headings, no preamble, no code fences, no commentary).',
  'Include:',
  '1. The goal in one clear sentence.',
  '2. **Apps to connect:** (or ask the user which apps to connect if none were specified).',
  '3. **Trigger:** (schedule, webhook/app event, or ask the user to confirm the trigger).',
  '4. **Steps:** Concise numbered steps for what the playbook and any agent should do.',
  '5. A final line asking to keep the playbook unpublished with triggers off until every step is reviewed.',
  'Keep it concise, practical, and under 180 words.',
].join('\n');

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(request: Request, scope: string): boolean {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local';
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const entry = rateBuckets.get(key);

  if (!entry || now >= entry.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (rateBuckets.size > 500) {
      for (const [k, v] of rateBuckets) {
        if (now >= v.resetAt) rateBuckets.delete(k);
      }
    }
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}
