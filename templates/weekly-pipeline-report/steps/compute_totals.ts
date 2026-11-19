const { deals, report_date, google_sheet_id } = input_data as {
  deals: Array<{ id: string; name: string; amount: number; stage: string }>;
  report_date: string;
  google_sheet_id: string;
};

const stageGroups: Record<string, { count: number; value: number }> = {};

deals.forEach(deal => {
  const stage = deal.stage || 'unknown';
  if (!stageGroups[stage]) {
    stageGroups[stage] = { count: 0, value: 0 };
  }
  stageGroups[stage].count += 1;
  stageGroups[stage].value += deal.amount;
});

const total_count = deals.length;
const total_value = deals.reduce((sum, d) => sum + d.amount, 0);

const current_week = {
  report_date,
  total_count,
  total_value,
  stages: stageGroups,
};

let previous_week: typeof current_week | null = null;

// Get previous week's data from Google Sheets
const sheetResult = await metaphor.integration('google_sheets', 'values.get', {
  spreadsheetId: google_sheet_id,
  range: 'Sheet1!A:Z',
});

if (sheetResult.ok && sheetResult.data?.values) {
  const rows = sheetResult.data.values;
  if (rows.length > 1) {
    const lastRow = rows[rows.length - 1];
    previous_week = {
      report_date: lastRow[0] || '',
      total_count: parseInt(lastRow[1] || '0', 10),
      total_value: parseFloat(lastRow[2] || '0'),
      stages: {},
    };
  }
}

const changes = {
  total_count_change: previous_week ? current_week.total_count - previous_week.total_count : 0,
  total_value_change: previous_week ? current_week.total_value - previous_week.total_value : 0,
  total_count_pct: previous_week && previous_week.total_count > 0
    ? ((current_week.total_count - previous_week.total_count) / previous_week.total_count * 100).toFixed(1)
    : 'N/A',
  total_value_pct: previous_week && previous_week.total_value > 0
    ? ((current_week.total_value - previous_week.total_value) / previous_week.total_value * 100).toFixed(1)
    : 'N/A',
};

const result = {
  current_week,
  previous_week,
  changes,
};
