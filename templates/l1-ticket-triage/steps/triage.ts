const { tickets } = input_data as {
  tickets: Array<{ id: number; subject: string; description: string; priority: string | null; tags: string[]; created_at: string | null }>;
};

const triaged = await metaphor.map(
  tickets ?? [],
  async t => {
    try {
      const out = await metaphor.agent('l1-triage-agent', {
        prompt: [`Ticket #${t.id}`, `Subject: ${t.subject || '(none)'}`, `Current priority: ${t.priority ?? 'not set'}`, '', t.description || '(no description)'].join('\n'),
      });
      return { id: t.id, tags: t.tags, subject: t.subject, triage: out, error: null };
    } catch (err) {
      return { id: t.id, tags: t.tags, subject: t.subject, triage: null, error: (err as Error).message };
    }
  },
  { concurrency: 4 },
);

const result = { triaged };
