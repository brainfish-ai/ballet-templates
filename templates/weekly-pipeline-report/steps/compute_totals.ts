const { deals, report_date } = input_data as {
  deals: Array<{ id: string; name: string; amount: number; stage: string }>;
  report_date: string;
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

const sheetsApiKey = metaphor.secret('GOOGLE_SHEETS_API_KEY');
const sheetId = metaphor.secret('GOOGLE_SHEET_ID');

let previous_week: typeof current_week | null = null;

try {
  const sheetRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:Z?key=${sheetsApiKey}`,
  );

  if (sheetRes.ok) {
    const sheetData = await sheetRes.json() as { values?: string[][] };
    const rows = sheetData.values ?? [];
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      previous_week = {
        report_date: lastRow[0] ?? '',
        total_count: parseInt(lastRow[1] ?? '0', 10),
        total_value: parseFloat(lastRow[2] ?? '0'),
        stages: {},
      };
    }
  }
} catch (err) {
  previous_week = null;
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
