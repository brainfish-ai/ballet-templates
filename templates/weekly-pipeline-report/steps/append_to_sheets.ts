const { report_date, totals, google_sheet_id } = input_data as {
  report_date: string;
  totals: {
    total_count: number;
    total_value: number;
    stages: Record<string, { count: number; value: number }>;
  };
  google_sheet_id: string;
};

// Build row dynamically from actual stage names
const row = [
  report_date,
  totals.total_count.toString(),
  totals.total_value.toFixed(2),
];

// Add each stage's count and value
Object.keys(totals.stages).sort().forEach(stage => {
  const data = totals.stages[stage];
  row.push(data.count.toString());
  row.push(data.value.toFixed(2));
});

// Append to Google Sheets
const appendResult = await metaphor.integration('google_sheets', 'values.append', {
  spreadsheetId: google_sheet_id,
  range: 'Sheet1!A:Z',
  values: [row],
  valueInputOption: 'USER_ENTERED',
});

if (!appendResult.ok) {
  throw new Error(`Failed to append to Google Sheets: ${appendResult.error?.message ?? JSON.stringify(appendResult.error)}`);
}

const result = { appended: true, row };
