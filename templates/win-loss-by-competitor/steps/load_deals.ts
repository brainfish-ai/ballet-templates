const { competitor_property, days } = input_data as { competitor_property: string; days?: number | string };

const MAX_DEALS = 1000;
const PAGE_SIZE = 100;
const NONE = 'No competitor recorded';

const property = String(competitor_property ?? '').trim();
if (!/^[a-z0-9_]+$/i.test(property)) {
  throw new Error('competitor_property must be the internal HubSpot property name, for example "competitor".');
}
const lookbackDays = Math.min(Math.max(Number(days) || 90, 1), 730);
const since = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

type Deal = { id: string; properties?: Record<string, string | null | undefined> };
type SearchPage = { results?: Deal[]; total?: number; paging?: { next?: { after?: string } } };

const deals: Deal[] = [];
let after: string | undefined;
do {
  const res = await metaphor.integration('hubspot', 'deals.search', {
    filterGroups: [
      {
        filters: [
          { propertyName: 'hs_is_closed', operator: 'EQ', value: 'true' },
          { propertyName: 'closedate', operator: 'GTE', value: String(since) },
        ],
      },
    ],
    properties: ['dealname', 'amount', 'closedate', 'hs_is_closed_won', 'closed_won_reason', 'closed_lost_reason', property],
    sorts: [{ propertyName: 'closedate', direction: 'DESCENDING' }],
    limit: PAGE_SIZE,
    ...(after ? { after } : {}),
  });
  if (!res.ok) {
    throw new Error(`Reading deals from HubSpot failed: ${res.error?.message ?? 'unknown error'}. Check the HubSpot connection.`);
  }
  const page = res.data as SearchPage;
  deals.push(...(page.results ?? []));
  after = page.paging?.next?.after;
} while (after && deals.length < MAX_DEALS);

type Bucket = { competitor: string; won: number; lost: number; won_revenue: number; lost_revenue: number; won_reasons: string[]; lost_reasons: string[] };
const buckets = new Map<string, Bucket>();
let withCompetitor = 0;

for (const d of deals.slice(0, MAX_DEALS)) {
  const p = d.properties ?? {};
  const raw = String(p[property] ?? '').trim();
  // Multi-select properties come back as "a;b"; count the deal against each competitor.
  const names = raw ? raw.split(';').map(s => s.trim()).filter(Boolean) : [NONE];
  if (raw) withCompetitor++;
  const won = String(p.hs_is_closed_won) === 'true';
  const amount = Number(p.amount) || 0;
  const reason = String((won ? p.closed_won_reason : p.closed_lost_reason) ?? '').trim();
  for (const name of names) {
    const b = buckets.get(name) ?? { competitor: name, won: 0, lost: 0, won_revenue: 0, lost_revenue: 0, won_reasons: [], lost_reasons: [] };
    if (won) {
      b.won++;
      b.won_revenue += amount;
      if (reason) b.won_reasons.push(reason.slice(0, 300));
    } else {
      b.lost++;
      b.lost_revenue += amount;
      if (reason) b.lost_reasons.push(reason.slice(0, 300));
    }
    buckets.set(name, b);
  }
}

const competitors = [...buckets.values()]
  .map(b => ({
    ...b,
    deals: b.won + b.lost,
    win_rate: b.won + b.lost > 0 ? Math.round((b.won / (b.won + b.lost)) * 100) : 0,
    won_reasons: b.won_reasons.slice(0, 25),
    lost_reasons: b.lost_reasons.slice(0, 25),
  }))
  .sort((a, b) => b.deals - a.deals);

const result = {
  competitor_property: property,
  lookback_days: lookbackDays,
  deals_read: Math.min(deals.length, MAX_DEALS),
  deals_with_competitor: withCompetitor,
  competitors,
};
