const { ticket, rating_comment, hubspot_notes } = input_data as {
  ticket: {
    ticket_id: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    ticket_url: string;
  };
  rating_comment?: string;
  hubspot_notes?: string;
};

const prompt = `Ticket #${ticket.ticket_id}: ${ticket.subject}
Description: ${ticket.description}
Status: ${ticket.status}
Priority: ${ticket.priority}
Customer feedback: ${rating_comment ?? 'No comment provided'}
HubSpot notes: ${hubspot_notes ?? 'None'}

Summarize why the customer is unhappy and what action the CS team should take.`;

const res = await metaphor.agent('ticket-summarizer', { prompt });

const summary = String(res?.summary ?? 'Customer left negative feedback. Review ticket for details.').slice(0, 300);
const suggested_action = String(res?.suggested_action ?? 'Follow up with the customer').slice(0, 200);

const slack_message = `:warning: *Negative CSAT Alert*\n*Ticket*: #${ticket.ticket_id} - ${ticket.subject}\n*Priority*: ${ticket.priority}\n*Feedback*: ${rating_comment ?? 'No comment'}\n*Summary*: ${summary}\n*Suggested Action*: ${suggested_action}\nView ticket: ${ticket.ticket_url}`;

const result = {
  summary,
  suggested_action,
  slack_message,
};
