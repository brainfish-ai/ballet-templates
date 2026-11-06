const { triaged, dry_run } = input_data as {
  triaged: Array<{
    id: number;
    tags: string[];
    subject: string;
    error: string | null;
    triage: {
      category: string;
      priority: string;
      sentiment: string;
      suggested_group: string;
      summary: string;
      draft_reply: string;
      needs_human: boolean;
    } | null;
  }>;
  dry_run?: boolean | string;
};

const TRIAGED_TAG = 'l1_triaged';
const isDryRun = dry_run === true || dry_run === 'true';

const results = [];
for (const t of triaged ?? []) {
  if (!t.triage) {
    results.push({ id: t.id, status: 'skipped', reason: t.error ?? 'No triage returned' });
    continue;
  }
  const x = t.triage;
  const note = [
    '[L1 triage]',
    `Category: ${x.category} | Priority: ${x.priority} | Sentiment: ${x.sentiment} | Suggested group: ${x.suggested_group}`,
    x.needs_human ? 'Needs a human: yes (do not send the draft as-is)' : 'Needs a human: review the draft before sending',
    '',
    `Summary: ${x.summary}`,
    '',
    'Draft reply:',
    x.draft_reply,
  ].join('\n');

  if (isDryRun) {
    results.push({ id: t.id, status: 'preview', note });
    continue;
  }

  const reply = await metaphor.integration('zendesk', 'tickets.reply', { id: t.id, body: note, public: false });
  if (!reply.ok) {
    results.push({ id: t.id, status: 'failed', reason: reply.error?.message ?? 'Could not add the note' });
    continue;
  }
  // Tag after the note so a failed note is retried next run. Keep existing tags (update replaces the list).
  const tag = await metaphor.integration('zendesk', 'tickets.update', { id: t.id, tags: [...new Set([...(t.tags ?? []), TRIAGED_TAG])] });
  results.push({ id: t.id, status: tag.ok ? 'noted' : 'noted_not_tagged', category: x.category, priority: x.priority });
}

const count = (s: string) => results.filter(r => r.status === s).length;
const result = {
  dry_run: isDryRun,
  noted: count('noted') + count('noted_not_tagged'),
  previewed: count('preview'),
  failed: count('failed'),
  skipped: count('skipped'),
  tickets: results,
  message:
    (triaged ?? []).length === 0
      ? 'No new or open unassigned tickets to triage.'
      : isDryRun
        ? `Previewed triage for ${count('preview')} ticket(s). Nothing was written to Zendesk.`
        : `Added triage notes to ${count('noted') + count('noted_not_tagged')} ticket(s).`,
};
