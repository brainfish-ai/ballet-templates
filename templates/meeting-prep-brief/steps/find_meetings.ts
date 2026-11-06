const MAX_MEETINGS = 8;
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com']);

type CalendarEvent = {
  summary?: string;
  description?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  organizer?: { email?: string };
  attendees?: Array<{ email?: string; displayName?: string; self?: boolean; resource?: boolean; responseStatus?: string }>;
};

function check<T>(res: { ok: boolean; data?: T; error?: { message?: string } }, what: string): T {
  if (!res.ok) {
    throw new Error(`${what} failed: ${res.error?.message ?? 'unknown error'}. Check the Google Calendar connection.`);
  }
  return res.data as T;
}

// Offset (ms) of `timeZone` from UTC at `date`.
function tzOffset(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(date)
      .map(p => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}

const calendar = check<{ id?: string; timeZone?: string }>(
  await metaphor.integration('google-calendar', 'me.get', {}),
  'Reading your calendar',
);
const timeZone = calendar.timeZone || 'UTC';
const myDomain = String(calendar.id ?? '').split('@')[1]?.toLowerCase() ?? '';

// Tomorrow 00:00 -> 24:00 in the calendar's time zone.
const now = new Date();
const local = new Date(now.getTime() + tzOffset(now, timeZone));
const startLocalUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1);
const start = new Date(startLocalUtc - tzOffset(new Date(startLocalUtc), timeZone));
const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
const date = new Date(startLocalUtc).toISOString().slice(0, 10);

const events = (
  check<{ items?: CalendarEvent[] }>(
    await metaphor.integration('google-calendar', 'events.find', {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    }),
    "Reading tomorrow's events",
  ).items ?? []
).filter(e => e.status !== 'cancelled' && e.start?.dateTime);

const meetings = [];
for (const e of events) {
  const me = (e.attendees ?? []).find(a => a.self);
  if (me?.responseStatus === 'declined') continue;
  const external = (e.attendees ?? []).filter(a => {
    if (a.self || a.resource || !a.email) return false;
    const domain = a.email.split('@')[1]?.toLowerCase() ?? '';
    return domain && domain !== myDomain && !domain.endsWith('calendar.google.com');
  });
  if (external.length === 0) continue;
  const companies = [...new Set(external.map(a => a.email!.split('@')[1]!.toLowerCase()).filter(d => !FREE_MAIL.has(d)))];
  meetings.push({
    title: e.summary ?? '(no title)',
    start: e.start?.dateTime,
    end: e.end?.dateTime,
    agenda: String(e.description ?? '').replace(/<[^>]+>/g, ' ').slice(0, 1500),
    attendees: external.map(a => ({ name: a.displayName ?? null, email: a.email })),
    companies,
  });
  if (meetings.length >= MAX_MEETINGS) break;
}

const result = { date, time_zone: timeZone, events_checked: events.length, meetings };
