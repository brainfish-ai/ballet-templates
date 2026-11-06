const { renewals: raw, window_days } = input_data as { renewals: string; window_days?: number | string };

const MAX_RENEWALS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const windowDays = Math.min(Math.max(Number(window_days) || 90, 1), 365);

// Minimal CSV parser: handles quoted fields with commas and doubled quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') (cell += '"'), i++;
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',' || ch === '\t') cells.push(cell.trim()), (cell = '');
      else cell += ch;
    }
    cells.push(cell.trim());
    rows.push(cells);
  }
  return rows;
}

const rows = parseCsv(String(raw ?? ''));
const DEFAULT_COLUMNS = ['account', 'domain', 'renewal_date', 'arr', 'notes'];
const first = (rows[0] ?? []).map(h => h.toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, ''));
const hasHeader = first.includes('account') || first.includes('renewal_date');
const columns = hasHeader ? first : DEFAULT_COLUMNS;
const col = (name: string, ...aliases: string[]) => [name, ...aliases].map(n => columns.indexOf(n)).find(i => i >= 0) ?? -1;
const idx = {
  account: col('account', 'company', 'customer', 'name'),
  domain: col('domain', 'website'),
  renewal: col('renewal_date', 'renewal', 'renews', 'date'),
  arr: col('arr', 'acv', 'value'),
  notes: col('notes', 'note', 'comments'),
};

const now = Date.now();
const skipped: string[] = [];
const renewals = (hasHeader ? rows.slice(1) : rows)
  .map(cells => {
    const get = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '');
    const account = get(idx.account);
    const date = Date.parse(get(idx.renewal));
    const domain = get(idx.domain).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    if (!account || Number.isNaN(date)) {
      skipped.push(cells.join(', ').slice(0, 120));
      return null;
    }
    return {
      account,
      domain: domain || null,
      renewal_date: new Date(date).toISOString().slice(0, 10),
      days_to_renewal: Math.ceil((date - now) / DAY_MS),
      arr: Number(get(idx.arr).replace(/[^0-9.]/g, '')) || null,
      notes: get(idx.notes).slice(0, 1000),
    };
  })
  .filter((r): r is NonNullable<typeof r> => r !== null && r.days_to_renewal >= 0 && r.days_to_renewal <= windowDays)
  .sort((a, b) => a.days_to_renewal - b.days_to_renewal)
  .slice(0, MAX_RENEWALS);

type CalendarEvent = { summary?: string; status?: string; start?: { dateTime?: string; date?: string }; attendees?: Array<{ email?: string; self?: boolean }> };

let events: CalendarEvent[] = [];
if (renewals.some(r => r.domain)) {
  const res = await metaphor.integration('google-calendar', 'events.find', {
    timeMin: new Date(now).toISOString(),
    timeMax: new Date(now + 7 * DAY_MS).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });
  if (!res.ok) {
    throw new Error(`Reading your Google Calendar failed: ${res.error?.message ?? 'unknown error'}. Check the Google Calendar connection.`);
  }
  events = ((res.data as { items?: CalendarEvent[] }).items ?? []).filter(e => e.status !== 'cancelled');
}

const withCalls = renewals.map(r => {
  const calls = r.domain
    ? events
        .filter(e => (e.attendees ?? []).some(a => !a.self && a.email?.toLowerCase().endsWith(`@${r.domain}`)))
        .map(e => ({ title: e.summary ?? '(no title)', start: e.start?.dateTime ?? e.start?.date ?? '' }))
    : [];
  return { ...r, calls_this_week: calls };
});

const result = { window_days: windowDays, renewals: withCalls, skipped_rows: skipped.slice(0, 20) };
