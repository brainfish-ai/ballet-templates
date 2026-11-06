const { max_tickets } = input_data as { max_tickets?: number | string };

const TRIAGED_TAG = 'l1_triaged';
const limit = Math.min(Math.max(Number(max_tickets) || 20, 1), 50);

type Ticket = {
  id: number;
  subject?: string | null;
  description?: string | null;
  status?: string;
  priority?: string | null;
  assignee_id?: number | null;
  tags?: string[];
  created_at?: string;
};

const res = await metaphor.integration('zendesk', 'tickets.list', { per_page: 100, sort_by: 'created_at', sort_order: 'desc' });
if (!res.ok) {
  throw new Error(`Reading tickets from Zendesk failed: ${res.error?.message ?? 'unknown error'}. Check the Zendesk connection.`);
}
const all = (res.data as { tickets?: Ticket[] }).tickets ?? [];
const candidates = all.filter(t => (t.status === 'new' || t.status === 'open') && !t.assignee_id && !(t.tags ?? []).includes(TRIAGED_TAG));

// Tickets already tagged l1_triaged were handled by an earlier run, so re-runs don't stack notes.
const tickets = candidates.slice(0, limit).map(t => ({
  id: t.id,
  subject: String(t.subject ?? '').slice(0, 300),
  description: String(t.description ?? '').slice(0, 4000),
  priority: t.priority ?? null,
  tags: t.tags ?? [],
  created_at: t.created_at ?? null,
}));

const result = { checked: all.length, eligible: candidates.length, tickets };
