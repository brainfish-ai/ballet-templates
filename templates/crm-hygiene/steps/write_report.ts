const { findings, totals } = input_data as {
  findings: Record<string, unknown>;
  totals: { contacts_scanned: number; companies_scanned: number; capped: boolean; stale_days: number };
};

let result: Record<string, unknown>;

if (!totals || totals.contacts_scanned + totals.companies_scanned === 0) {
  result = { headline: 'HubSpot has no contacts or companies yet. Nothing to clean up.', health_score: 100, actions: [], totals, findings };
} else {
  const out = await metaphor.agent('crm-hygiene-analyst', {
    prompt: [
      `Scanned ${totals.contacts_scanned} contacts and ${totals.companies_scanned} companies${totals.capped ? ' (capped: only the first records HubSpot returned were checked)' : ''}.`,
      `Stale means not modified for ${totals.stale_days} days.`,
      '',
      'Findings (counts and example records):',
      JSON.stringify(findings).slice(0, 60000),
    ].join('\n'),
  });
  result = {
    headline: out?.headline ?? '',
    health_score: typeof out?.health_score === 'number' ? out.health_score : null,
    actions: Array.isArray(out?.actions) ? out.actions : [],
    totals,
    findings,
  };
}
