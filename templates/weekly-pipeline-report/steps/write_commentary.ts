const { current_week, previous_week, changes } = input_data as {
  current_week: {
    report_date: string;
    total_count: number;
    total_value: number;
    stages: Record<string, { count: number; value: number }>;
  };
  previous_week?: {
    report_date: string;
    total_count: number;
    total_value: number;
  } | null;
  changes: {
    total_count_change: number;
    total_value_change: number;
    total_count_pct: string;
    total_value_pct: string;
  };
};

const prompt = `Current week (${current_week.report_date}):
- Total deals: ${current_week.total_count}
- Total value: $${current_week.total_value.toFixed(2)}
- Stages: ${Object.entries(current_week.stages).map(([stage, data]) => `${stage}: ${data.count} deals / $${data.value.toFixed(2)}`).join(', ')}

${previous_week ? `Previous week: ${previous_week.total_count} deals, $${previous_week.total_value.toFixed(2)}` : 'No previous week data (first run).'}
Week-over-week change: ${changes.total_count_pct !== 'N/A' ? `${changes.total_count_pct}% deals, ${changes.total_value_pct}% value` : 'baseline'}

Write a 3-line executive summary highlighting the most important trends and insights.`;

const res = await metaphor.agent('pipeline-commentator', { prompt });

const commentary = String(res?.commentary ?? 'Pipeline report generated. Review the data for trends.').slice(0, 500);

const stage_summary = Object.entries(current_week.stages)
  .map(([stage, data]) => `${stage}: ${data.count} deals / $${data.value.toFixed(2)}`)
  .join('\n');

let change_text = '(baseline week)';
if (changes.total_count_pct !== 'N/A') {
  const pct = parseFloat(changes.total_count_pct);
  if (pct === 0) {
    change_text = '(flat)';
  } else {
    change_text = `(${pct > 0 ? 'up' : 'down'} ${Math.abs(pct)}% from last week)`;
  }
}

const slack_message = `*Weekly Pipeline Report* (${current_week.report_date})\n\n*Total*: ${current_week.total_count} deals / $${current_week.total_value.toFixed(2)} ${change_text}\n\n*By Stage*:\n${stage_summary}\n\n*AI Insight*: ${commentary}`;

const result = {
  commentary,
  slack_message,
};
