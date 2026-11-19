const { report_date, totals, google_sheet_id } = input_data as {
  report_date: string;
  totals: {
    total_count: number;
    total_value: number;
    stages: Record<string, { count: number; value: number }>;
  };
  google_sheet_id: string;
};

// Check if sheet has headers, and write them if not
let needsHeaders = false;
try {
  const readResult = await metaphor.integration('google_sheets', 'values.get', {
    spreadsheetId: google_sheet_id,
    range: 'Sheet1!A1:Z1',
  });
  
  if (!readResult.ok) {
    if (readResult.error?.message === 'No data found') {
      needsHeaders = true;
    } else {
      throw new Error(`Failed to read Google Sheet: ${readResult.error?.message ?? JSON.stringify(readResult.error)}`);
    }
  } else if (!readResult.data?.values || readResult.data.values.length === 0) {
    needsHeaders = true;
  }
} catch (err) {
  throw err;
}

// Build headers and row dynamically
const stageNames = Object.keys(totals.stages).sort();
const headers = ['Report Date', 'Total Deals', 'Total Value'];
stageNames.forEach(stage => {
  headers.push(`${stage} Count`);
  headers.push(`${stage} Value`);
});

const row = [
  report_date,
  totals.total_count.toString(),
  totals.total_value.toFixed(2),
];

// Add each stage's count and value
stageNames.forEach(stage => {
  const data = totals.stages[stage];
  row.push(data.count.toString());
  row.push(data.value.toFixed(2));
});

// Write headers if needed
if (needsHeaders) {
  const headerResult = await metaphor.integration('google_sheets', 'values.update', {
    spreadsheetId: google_sheet_id,
    range: 'Sheet1!A1:Z1',
    values: [headers],
    valueInputOption: 'USER_ENTERED',
  });
  
  if (!headerResult.ok) {
    throw new Error(`Failed to write headers to Google Sheet: ${headerResult.error?.message ?? JSON.stringify(headerResult.error)}`);
  }
}

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

const result = { appended: true, row, headers_written: needsHeaders };
