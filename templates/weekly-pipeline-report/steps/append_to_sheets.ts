const { report_date, totals, google_sheet_id } = input_data as {
  report_date: string;
  totals: {
    total_count: number;
    total_value: number;
    stages: Record<string, { count: number; value: number }>;
  };
  google_sheet_id: string;
};

const discovery = totals.stages['discovery'] || { count: 0, value: 0 };
const proposal = totals.stages['proposal'] || { count: 0, value: 0 };
const closed = totals.stages['closedwon'] || { count: 0, value: 0 };

const row = [
  report_date,
  totals.total_count.toString(),
  totals.total_value.toFixed(2),
  discovery.count.toString(),
  discovery.value.toFixed(2),
  proposal.count.toString(),
  proposal.value.toFixed(2),
  closed.count.toString(),
  closed.value.toFixed(2),
];

// Append to Google Sheets
const appendResult = metaphor.integration('google_sheets', 'values.append', {
  spreadsheetId: google_sheet_id,
  range: 'Sheet1!A:Z',
  values: [row],
  valueInputOption: 'USER_ENTERED',
});

if (!appendResult.ok) {
  throw new Error(`Failed to append to Google Sheets: ${appendResult.error}`);
}

const result = { appended: true, row };
