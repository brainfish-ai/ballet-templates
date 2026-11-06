const { context, date, meetings } = input_data as {
  context?: string;
  date: string;
  meetings: Array<Record<string, unknown>>;
};

let result: Record<string, unknown>;

if (!meetings || meetings.length === 0) {
  result = { date, briefs: [], message: `No external meetings on ${date}. Nothing to prepare.` };
} else {
  const out = await metaphor.agent('meeting-prep-researcher', {
    prompt: [
      context ? `What we sell: ${context}` : 'What we sell: not provided. Keep talking points general.',
      `Date: ${date}`,
      '',
      'Meetings (with attendees and research on each company):',
      JSON.stringify(meetings).slice(0, 80000),
    ].join('\n'),
  });
  const briefs = Array.isArray(out?.briefs) ? out.briefs : [];
  result = { date, briefs, message: `${briefs.length} brief${briefs.length === 1 ? '' : 's'} for ${date}.` };
}
