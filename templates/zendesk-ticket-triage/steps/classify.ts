const { subject, description } = input_data as { subject: string; description: string };

const res = await metaphor.agent('ticket-classifier', {
  prompt: `Subject: ${subject}\n\nBody:\n${description}`,
});

const allowed = ['low', 'normal', 'high', 'urgent'];
const priority = allowed.includes(res?.priority) ? res.priority : 'normal';
const tags = Array.isArray(res?.tags) ? res.tags.slice(0, 5) : [];

const result = { priority, tags };
