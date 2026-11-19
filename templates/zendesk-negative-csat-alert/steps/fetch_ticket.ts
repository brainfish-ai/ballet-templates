const { ticket_id, is_negative } = input_data as { ticket_id?: string; is_negative?: boolean };

let result;

if (!is_negative || !ticket_id) {
  result = { skipped: true };
} else {
  // Get full ticket details from Zendesk
  const ticketResult = await metaphor.integration('zendesk', 'tickets.get', {
    id: parseInt(ticket_id, 10),
  });

  if (!ticketResult.ok) {
    throw new Error(`Failed to fetch ticket: ${ticketResult.error?.message ?? JSON.stringify(ticketResult.error)}`);
  }

  // Native webhook wraps ticket in .data.ticket
  const ticket = ticketResult.data?.ticket || ticketResult.data;

  // Note: No deduplication implemented (would require external storage)

  const baseUrl = ticket.url ? ticket.url.split('/api/')[0] : 'your-domain.zendesk.com';
  const ticket_url = baseUrl.startsWith('https://') ? `${baseUrl}/agent/tickets/${ticket_id}` : `https://${baseUrl}/agent/tickets/${ticket_id}`;

  result = {
    ticket_id,
    subject: ticket.subject,
    description: (ticket.description || '').slice(0, 500),
    status: ticket.status,
    priority: ticket.priority || 'normal',
    ticket_url,
  };
}
