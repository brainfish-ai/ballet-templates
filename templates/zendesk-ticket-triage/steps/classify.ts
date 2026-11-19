// Read from native Zendesk webhook payload
const webhook = (input_data as any).event || input_data;
const ticket = webhook.ticket || {};

const ticket_id = ticket.id || '';
const subject = ticket.subject || '';
const description = ticket.description || '';

const res = await metaphor.agent('ticket-classifier', {
  prompt: `Subject: ${subject}\n\nBody:\n${description}`,
});

const allowed = ['low', 'normal', 'high', 'urgent'];
const priority = allowed.includes(res?.priority) ? res.priority : 'normal';
const tags = Array.isArray(res?.tags) ? res.tags.slice(0, 5) : [];

const result = { ticket_id, priority, tags };
