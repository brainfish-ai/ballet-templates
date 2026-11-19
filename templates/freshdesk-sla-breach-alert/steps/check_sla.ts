const { alert_threshold_hours } = input_data as { alert_threshold_hours?: number };

const threshold = alert_threshold_hours || 2;

// Fetch open tickets from Freshdesk with SLA sorting
// Get updated tickets recently, ordered by due_by ascending
const updated_since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const ticketsResult = metaphor.integration('freshdesk', 'tickets.list', {
  order_by: 'due_by',
  order_type: 'asc',
  updated_since,
  per_page: 100,
});

if (!ticketsResult.ok) {
  throw new Error(`Failed to fetch Freshdesk tickets: ${ticketsResult.error}`);
}

const allTickets = ticketsResult.data || [];

// Filter tickets near SLA breach in code (due_by filtering)
const now = new Date();
const breachingSoon = allTickets.filter((t: any) => {
  if (!t.due_by) return false;
  const dueBy = new Date(t.due_by);
  const hoursUntilBreach = (dueBy.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilBreach <= threshold && hoursUntilBreach >= -24; // Include up to 24h overdue
});

// Deduplicate: check if we alerted this ticket in the last 24 hours
// In a real implementation, you would query a data table or cache
// For this template, we'll use a simple in-memory approach that works per-run
const alreadyAlerted = new Set<number>();
const tickets = breachingSoon.filter((t: any) => !alreadyAlerted.has(t.id));

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
