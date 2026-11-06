const { renewals, window_days } = input_data as {
  renewals: Array<{ account: string; renewal_date: string; days_to_renewal: number; arr: number | null; calls_this_week: Array<{ title: string; start: string }> } & Record<string, unknown>>;
  window_days: number;
};

let result: Record<string, unknown>;

if (!renewals || renewals.length === 0) {
  result = {
    subject: 'Renewal radar: nothing renewing soon',
    body: `No renewals in the next ${window_days} days were found in the list you provided. Check the renewal_date column (YYYY-MM-DD works best).`,
    accounts: [],
  };
} else {
  const out = await metaphor.agent('renewal-risk-analyst', {
    prompt: [`Renewals in the next ${window_days} days, soonest first:`, JSON.stringify(renewals).slice(0, 60000)].join('\n'),
  });
  const accounts = Array.isArray(out?.accounts) ? out.accounts : [];
  const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
  accounts.sort((a: { risk?: string }, b: { risk?: string }) => (order[a.risk ?? 'low'] ?? 3) - (order[b.risk ?? 'low'] ?? 3));

  const lines: string[] = ['Renewal radar', '', out?.summary ?? '', ''];
  for (const a of accounts) {
    const r = renewals.find(x => x.account === a.account);
    const arr = r?.arr ? `, ARR ${r.arr.toLocaleString('en-US')}` : '';
    lines.push(`== [${String(a.risk ?? '').toUpperCase()}] ${a.account}: renews ${r?.renewal_date ?? '?'} (${r?.days_to_renewal ?? '?'} days${arr}) ==`);
    for (const reason of a.reasons ?? []) lines.push(`- ${reason}`);
    if (a.next_action) lines.push(`Next action: ${a.next_action}`);
    if (a.call_brief) lines.push('', `Pre-call brief (${(r?.calls_this_week ?? []).map(c => `${c.title}, ${c.start}`).join('; ')}):`, a.call_brief);
    lines.push('');
  }
  const high = accounts.filter((a: { risk?: string }) => a.risk === 'high').length;
  result = {
    subject: `Renewal radar: ${renewals.length} renewal${renewals.length === 1 ? '' : 's'}, ${high} at high risk`,
    body: lines.join('\n'),
    accounts,
  };
}
