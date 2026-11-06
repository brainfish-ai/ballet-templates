const { competitors: rawCompetitors } = input_data as { competitors: string };

const MAX_COMPETITORS = 5;
const MAX_MEETINGS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

type Attendee = { email?: string; self?: boolean };
type CalendarEvent = {
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  attendees?: Attendee[];
  status?: string;
};

function check<T>(res: { ok: boolean; data?: T; error?: { message?: string } }, what: string): T {
  if (!res.ok) {
    throw new Error(`${what} failed: ${res.error?.message ?? 'unknown error'}. Check the app connection and try again.`);
  }
  return res.data as T;
}

// "Acme", "rival.io", "https://www.rival.io/pricing" -> { name, domain, token }
const competitors = String(rawCompetitors ?? '')
  .split(/[\n,]+/)
  .map(s => s.trim())
  .filter(Boolean)
  .slice(0, MAX_COMPETITORS)
  .map(raw => {
    const looksLikeDomain = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(raw);
    const domain = looksLikeDomain ? raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]!.toLowerCase() : null;
    const name = domain ? domain.split('.')[0]! : raw;
    return { input: raw, name, domain, token: name.toLowerCase() };
  });

if (competitors.length === 0) {
  throw new Error('Add at least one competitor (a name or a website).');
}

const news = await metaphor.map(
  competitors,
  async c => {
    try {
      const hits = await metaphor.tool('search_web', {
        query: c.domain ? `${c.name} ${c.domain} news` : `${c.name} company news`,
        num: 6,
        tbs: 'qdr:w',
      });
      return { competitor: c.input, news: JSON.stringify(hits).slice(0, 6000) };
    } catch (err) {
      return { competitor: c.input, news: `Search failed: ${(err as Error).message}` };
    }
  },
  { concurrency: 3 },
);

const now = Date.now();
const eventsRes = await metaphor.integration('google-calendar', 'events.find', {
  timeMin: new Date(now).toISOString(),
  timeMax: new Date(now + 7 * DAY_MS).toISOString(),
  singleEvents: true,
  orderBy: 'startTime',
  maxResults: 250,
});
const events = (check<{ items?: CalendarEvent[] }>(eventsRes, 'Reading your Google Calendar').items ?? []).filter(
  e => e.status !== 'cancelled',
);

const meetings: Array<{ title: string; start: string; competitor: string; attendees: string[] }> = [];
for (const e of events) {
  const title = e.summary ?? '(no title)';
  const text = `${title} ${e.description ?? ''}`.toLowerCase();
  const emails = (e.attendees ?? []).filter(a => !a.self && a.email).map(a => a.email!.toLowerCase());
  const match = competitors.find(
    c => (c.domain && emails.some(m => m.endsWith(`@${c.domain}`))) || (c.token.length > 2 && text.includes(c.token)),
  );
  if (!match) continue;
  meetings.push({ title, start: e.start?.dateTime ?? e.start?.date ?? '', competitor: match.input, attendees: emails });
  if (meetings.length >= MAX_MEETINGS) break;
}

const result = {
  competitors: news,
  meetings,
  events_checked: events.length,
};
