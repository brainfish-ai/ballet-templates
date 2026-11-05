const { icp, accounts } = input_data as {
  icp?: string;
  accounts: Array<{ url: string; ok: boolean; content: string }>;
};

const context = (accounts ?? []).map(a => `## ${a.url}\n${a.content}`).join('\n\n');

const scored = await metaphor.agent('icp-scorer', {
  prompt: [
    icp ? `Ideal customer profile: ${icp}` : 'Ideal customer profile: not provided. Infer a sensible B2B profile and state it.',
    '',
    'Accounts:',
    context,
  ].join('\n'),
});

const ranked = Array.isArray(scored?.accounts)
  ? [...scored.accounts].sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0))
  : [];

const result = { icp_used: scored?.icp_used ?? icp ?? null, accounts: ranked };
