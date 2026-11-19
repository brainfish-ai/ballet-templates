const { alert_threshold_hours } = input_data as { alert_threshold_hours?: number };

const threshold = alert_threshold_hours ?? 2;
const domain = metaphor.secret('FRESHDESK_DOMAIN');
const apiKey = metaphor.secret('FRESHDESK_API_KEY');

// Fetch open tickets from Freshdesk
const ticketsRes = await fetch(`https://${domain}.freshdesk.com/api/v2/tickets?filter=new_and_my_open`, {
  headers: {
    'Authorization': `Basic ${btoa(apiKey + ':X')}`,
  },
});

if (!ticketsRes.ok) {
  throw new Error(`Freshdesk API error: ${ticketsRes.status} ${ticketsRes.statusText}`);
}

const allTickets = await ticketsRes.json() as Array<{
  id: number;
  subject: string;
  due_by: string;
  responder_id: number | null;
  priority: number;
}>;

// Filter tickets near SLA breach
const now = new Date();
const breachingSoon = allTickets.filter(t => {
  const dueBy = new Date(t.due_by);
  const hoursUntilBreach = (dueBy.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilBreach <= threshold && hoursUntilBreach >= -24; // Include up to 24h overdue
});

// Deduplicate: check if we alerted this ticket in the last 24 hours
// In a real implementation, you would query a data table or cache
// For this template, we'll use a simple in-memory approach that works per-run
const alreadyAlerted = new Set<number>();
const tickets = breachingSoon.filter(t => !alreadyAlerted.has(t.id));

const result = {
  tickets: tickets.map(t => ({
    id: t.id,
    subject: t.subject,
    due_by: t.due_by,
    responder_id: t.responder_id,
    priority: t.priority,
  })),
  count: tickets.length,
};
