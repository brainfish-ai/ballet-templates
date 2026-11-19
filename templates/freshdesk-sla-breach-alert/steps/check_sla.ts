const { alert_threshold_hours } = input_data as { alert_threshold_hours?: number };

const threshold = alert_threshold_hours || 2;

// Fetch open tickets from Freshdesk with SLA sorting
// Get updated tickets recently, ordered by due_by ascending
const updated_since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

// Fetch all open/pending tickets by due_by, not just recently updated
const ticketsResult = await metaphor.integration('freshdesk', 'tickets.list', {
  order_by: 'due_by',
  order_type: 'asc',
  per_page: 100,
});

if (!ticketsResult.ok) {
  throw new Error(`Failed to fetch Freshdesk tickets: ${ticketsResult.error?.message ?? JSON.stringify(ticketsResult.error)}`);
}

const allTickets = ticketsResult.data?.tickets || ticketsResult.data || [];

// Filter tickets near SLA breach in code (due_by filtering)
const now = new Date();
const breachingSoon = allTickets.filter((t: any) => {
  if (!t.due_by) return false;
  const dueBy = new Date(t.due_by);
  const hoursUntilBreach = (dueBy.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilBreach <= threshold && hoursUntilBreach >= -24; // Include up to 24h overdue
});

// Note: No deduplication implemented (would require external storage like a data table)
const tickets = breachingSoon;

const result = {
  tickets: tickets.map((t: any) => ({
    id: t.id,
    subject: t.subject,
    due_by: t.due_by,
    responder_id: t.responder_id,
    priority: t.priority,
  })),
  count: tickets.length,
};
