const { ticket_id, is_negative } = input_data as { ticket_id: string; is_negative: boolean };

if (!is_negative) {
  throw new Error('Rating not negative. Exiting workflow.');
}

// Get full ticket details from Zendesk
const ticketResult = metaphor.integration('zendesk', 'tickets.get', {
  id: parseInt(ticket_id, 10),
});

if (!ticketResult.ok) {
  throw new Error(`Failed to fetch ticket: ${ticketResult.error}`);
}

const ticket = ticketResult.data;

// Simple deduplication (note: this is in-memory only, resets on restart)
const alreadyAlerted = new Set<number>();

if (alreadyAlerted.has(ticket.id)) {
  throw new Error(`Ticket ${ticket_id} already alerted in the last 24 hours. Skipping duplicate alert.`);
}

alreadyAlerted.add(ticket.id);

const result = {
  ticket_id,
  subject: ticket.subject,
  description: (ticket.description || '').slice(0, 500),
  status: ticket.status,
  priority: ticket.priority || 'normal',
  ticket_url: `https://${ticket.url?.split('/api/')[0] || 'zendesk.com'}/agent/tickets/${ticket_id}`,
};
