const { ticket_id, priority, tags } = input_data as {
  ticket_id: string;
  priority: string;
  tags: string[];
};

// Get existing ticket to read current tags
const ticketResult = await metaphor.integration('zendesk', 'tickets.get', {
  id: parseInt(ticket_id, 10),
});

if (!ticketResult.ok) {
  throw new Error(`Failed to fetch ticket: ${ticketResult.error?.message ?? JSON.stringify(ticketResult.error)}`);
}

const existingTags = ticketResult.data?.ticket?.tags || [];
const mergedTags = [...new Set([...existingTags, ...tags])];

// Update ticket priority and tags (flat structure, not nested)
const updateResult = await metaphor.integration('zendesk', 'tickets.update', {
  id: parseInt(ticket_id, 10),
  priority,
  tags: mergedTags,
});

if (!updateResult.ok) {
  throw new Error(`Failed to update ticket priority: ${updateResult.error?.message ?? JSON.stringify(updateResult.error)}`);
}

// Add internal note
const replyResult = await metaphor.integration('zendesk', 'tickets.reply', {
  id: parseInt(ticket_id, 10),
  body: `Auto-triage tags: ${tags.join(', ')}`,
  public: false,
});

if (!replyResult.ok) {
  throw new Error(`Failed to add internal note: ${replyResult.error?.message ?? JSON.stringify(replyResult.error)}`);
}

const result = {
  updated: true,
  ticket_id,
  priority,
  tags: mergedTags,
};
