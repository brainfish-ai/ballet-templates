const { summary, channel_id } = input_data as { summary: string; channel_id: string };

// Request approval before inviting customer-facing people
const approval = await metaphor.waitForInput({
  prompt: 'Review CS handoff before inviting team',
  details: `Channel ID: ${channel_id}\n\nHandoff Summary:\n${summary}`,
  schema: {
    type: 'object',
    properties: {
      approved: {
        type: 'boolean',
        description: 'Approve to proceed with team invites',
      },
      notes: {
        type: 'string',
        description: 'Optional notes or changes needed',
      },
    },
    required: ['approved'],
  },
});

if (!approval.approved) {
  throw new Error('CS handoff not approved');
}

const result = {
  approved: true,
  message: 'Handoff approved',
  notes: approval.notes || '',
};
