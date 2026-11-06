const { stale_days } = input_data as { stale_days?: number | string };

const MAX_RECORDS = 2000;
const PAGE_SIZE = 100;
const EXAMPLES = 10;
const staleDays = Math.min(Math.max(Number(stale_days) || 180, 7), 3650);
const staleBefore = Date.now() - staleDays * 24 * 60 * 60 * 1000;

type HsRecord = { id: string; properties?: Record<string, string | null | undefined>; updatedAt?: string };
type ListPage = { results?: HsRecord[]; paging?: { next?: { after?: string } } };

async function listAll(operation: 'contacts.list' | 'companies.list', properties: string[], label: string) {
  const records: HsRecord[] = [];
  let after: string | undefined;
  do {
    const res = await metaphor.integration('hubspot', operation, { limit: PAGE_SIZE, properties, ...(after ? { after } : {}) });
    if (!res.ok) {
      throw new Error(`Reading ${label} from HubSpot failed: ${res.error?.message ?? 'unknown error'}. Check the HubSpot connection.`);
    }
    const page = res.data as ListPage;
    records.push(...(page.results ?? []));
    after = page.paging?.next?.after;
  } while (after && records.length < MAX_RECORDS);
  return records.slice(0, MAX_RECORDS);
}

const contacts = await listAll('contacts.list', ['email', 'firstname', 'lastname', 'company', 'jobtitle', 'hubspot_owner_id', 'lastmodifieddate'], 'contacts');
const companies = await listAll('companies.list', ['name', 'domain', 'industry', 'country', 'hubspot_owner_id', 'hs_lastmodifieddate'], 'companies');

const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === '';
const label = (r: HsRecord, keys: string[]) => keys.map(k => r.properties?.[k]).filter(v => !blank(v)).join(' ') || `#${r.id}`;
const modifiedAt = (r: HsRecord, key: string) => Date.parse(String(r.properties?.[key] ?? r.updatedAt ?? '')) || 0;

function duplicates(records: HsRecord[], key: string, normalise: (v: string) => string, name: string[]) {
  const groups = new Map<string, HsRecord[]>();
  for (const r of records) {
    const raw = r.properties?.[key];
    if (blank(raw)) continue;
    const k = normalise(String(raw));
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const dupes = [...groups.entries()].filter(([, rs]) => rs.length > 1).sort((a, b) => b[1].length - a[1].length);
  return {
    groups: dupes.length,
    records: dupes.reduce((n, [, rs]) => n + rs.length, 0),
    examples: dupes.slice(0, EXAMPLES).map(([value, rs]) => ({ value, ids: rs.map(r => r.id), names: rs.map(r => label(r, name)) })),
  };
}

function check(records: HsRecord[], test: (r: HsRecord) => boolean, name: string[]) {
  const hits = records.filter(test);
  return { count: hits.length, examples: hits.slice(0, EXAMPLES).map(r => ({ id: r.id, name: label(r, name) })) };
}

const contactName = ['firstname', 'lastname', 'email'];
const companyName = ['name', 'domain'];

const findings = {
  contacts: {
    duplicate_emails: duplicates(contacts, 'email', v => v.trim().toLowerCase(), contactName),
    missing_email: check(contacts, r => blank(r.properties?.email), contactName),
    missing_name: check(contacts, r => blank(r.properties?.firstname) && blank(r.properties?.lastname), contactName),
    missing_company: check(contacts, r => blank(r.properties?.company), contactName),
    no_owner: check(contacts, r => blank(r.properties?.hubspot_owner_id), contactName),
    stale: check(contacts, r => modifiedAt(r, 'lastmodifieddate') > 0 && modifiedAt(r, 'lastmodifieddate') < staleBefore, contactName),
  },
  companies: {
    duplicate_domains: duplicates(companies, 'domain', v => v.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''), companyName),
    missing_domain: check(companies, r => blank(r.properties?.domain), companyName),
    missing_industry: check(companies, r => blank(r.properties?.industry), companyName),
    no_owner: check(companies, r => blank(r.properties?.hubspot_owner_id), companyName),
    stale: check(companies, r => modifiedAt(r, 'hs_lastmodifieddate') > 0 && modifiedAt(r, 'hs_lastmodifieddate') < staleBefore, companyName),
  },
};

const result = {
  totals: {
    contacts_scanned: contacts.length,
    companies_scanned: companies.length,
    capped: contacts.length >= MAX_RECORDS || companies.length >= MAX_RECORDS,
    stale_days: staleDays,
  },
  findings,
};
