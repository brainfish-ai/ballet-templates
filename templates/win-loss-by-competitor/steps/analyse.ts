const { competitor_property, lookback_days, deals_read, deals_with_competitor, competitors } = input_data as {
  competitor_property: string;
  lookback_days: number;
  deals_read: number;
  deals_with_competitor: number;
  competitors: Array<Record<string, unknown>>;
};

const stats = { lookback_days, deals_read, deals_with_competitor };
let result: Record<string, unknown>;

if (!deals_read) {
  result = { headline: `No closed deals in the last ${lookback_days ?? 90} days.`, competitors: [], recommendations: [], stats };
} else if (!deals_with_competitor) {
  result = {
    headline: `None of the ${deals_read} closed deals has a value in "${competitor_property}". Check the property name, or start filling it in on deals.`,
    competitors: [],
    recommendations: [`Make "${competitor_property}" required when a deal is closed so the next report has data.`],
    stats,
  };
} else {
  const out = await metaphor.agent('win-loss-analyst', {
    prompt: [
      `Closed deals in the last ${lookback_days} days: ${deals_read} (${deals_with_competitor} with a competitor recorded).`,
      '',
      'Per competitor (counts, revenue, win rate and the raw won/lost reasons):',
      JSON.stringify(competitors ?? []).slice(0, 60000),
    ].join('\n'),
  });
  const byName = new Map((competitors ?? []).map(c => [String(c.competitor), c]));
  result = {
    headline: out?.headline ?? '',
    competitors: (Array.isArray(out?.competitors) ? out.competitors : []).map((c: Record<string, unknown>) => {
      const s = byName.get(String(c.competitor));
      return s
        ? { ...c, deals: s.deals, won: s.won, lost: s.lost, win_rate: s.win_rate, won_revenue: s.won_revenue, lost_revenue: s.lost_revenue }
        : c;
    }),
    recommendations: Array.isArray(out?.recommendations) ? out.recommendations : [],
    stats,
  };
}
