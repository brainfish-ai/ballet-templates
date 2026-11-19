const { ticket_id, priority, tags } = input_data as {
  ticket_id: string;
  priority: string;
  tags: string[];
};

// Update ticket priority and tags (flat structure, not nested)
const updateResult = await metaphor.integration('zendesk', 'tickets.update', {
  id: parseInt(ticket_id, 10),
  priority,
  tags,
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
  tags,
};
