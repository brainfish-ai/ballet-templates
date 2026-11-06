const { competitors, meetings } = input_data as {
  competitors: Array<{ competitor: string; news: string }>;
  meetings: Array<{ title: string; start: string; competitor: string; attendees: string[] }>;
};

const newsContext = (competitors ?? []).map(c => `## ${c.competitor}\n${c.news}`).join('\n\n');
const meetingContext =
  (meetings ?? []).length > 0
    ? meetings.map((m, i) => `${i + 1}. "${m.title}" at ${m.start} (competitor: ${m.competitor}; attendees: ${m.attendees.join(', ') || 'none'})`).join('\n')
    : 'No upcoming meetings mention a competitor.';

const out = await metaphor.agent('competitor-watch-analyst', {
  prompt: ['News from the last 7 days, by competitor:', newsContext, '', 'Meetings in the next 7 days:', meetingContext].join('\n'),
});

const digest = Array.isArray(out?.digest) ? out.digest : [];
const battlecards = Array.isArray(out?.battlecards) ? out.battlecards : [];

const lines: string[] = ['Competitor watch: the last 7 days', ''];
for (const d of digest) {
  lines.push(`== ${d.competitor} ==`, d.summary ?? '');
  for (const item of d.items ?? []) lines.push(`- ${item.headline}${item.why_it_matters ? `: ${item.why_it_matters}` : ''}${item.url ? ` (${item.url})` : ''}`);
  lines.push('');
}
if (battlecards.length > 0) {
  lines.push('Battlecards for upcoming meetings', '');
  for (const b of battlecards) {
    lines.push(`== ${b.meeting} (${b.start}) vs ${b.competitor} ==`);
    for (const [label, items] of [
      ['Their pitch', b.their_pitch],
      ['Where we win', b.where_we_win],
      ['Landmines to set', b.landmines],
      ['Objection handling', b.objections],
    ] as const) {
      if (Array.isArray(items) && items.length > 0) lines.push(`${label}:`, ...items.map((x: string) => `- ${x}`));
    }
    lines.push('');
  }
} else {
  lines.push('No upcoming meetings mention a competitor this week.', '');
}

const result = {
  subject: `Competitor watch: ${digest.map((d: { competitor: string }) => d.competitor).join(', ') || 'weekly digest'}`,
  body: lines.join('\n'),
  digest,
  battlecards,
};
