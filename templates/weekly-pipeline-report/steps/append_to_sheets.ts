const { report_date, totals } = input_data as {
  report_date: string;
  totals: {
    total_count: number;
    total_value: number;
    stages: Record<string, { count: number; value: number }>;
  };
};

const sheetsApiKey = metaphor.secret('GOOGLE_SHEETS_API_KEY');
const sheetId = metaphor.secret('GOOGLE_SHEET_ID');

const discovery = totals.stages['discovery'] ?? { count: 0, value: 0 };
const proposal = totals.stages['proposal'] ?? { count: 0, value: 0 };
const closed = totals.stages['closedwon'] ?? { count: 0, value: 0 };

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

const appendRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:Z:append?valueInputOption=RAW&key=${sheetsApiKey}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  },
);

if (!appendRes.ok) {
  const errorText = await appendRes.text();
  throw new Error(`Google Sheets append failed: ${appendRes.status} ${errorText}`);
}

const result = { appended: true, row };
