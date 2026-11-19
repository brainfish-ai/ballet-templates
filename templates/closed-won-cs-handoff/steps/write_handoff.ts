const { deal } = input_data as {
  deal: { id: string; name: string; amount: string; close_date: string; owner_id: string; priority: string };
};

const res = await metaphor.agent('cs-handoff-writer', {
  prompt: `Write a handoff summary for the CS team. Deal: ${deal.name}, ARR: $${deal.amount}, Close date: ${deal.close_date}. Priority: ${deal.priority ?? 'normal'}.`,
});

const summary = res?.summary ?? 'No summary generated.';

const result = { summary };
