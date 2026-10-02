const { records } = input_data as { records: unknown };

const list: unknown[] = Array.isArray(records)
  ? records
  : Array.isArray((records as { records?: unknown[] } | null)?.records)
    ? (records as { records: unknown[] }).records
    : [];

const res = await metaphor.agent('digest-writer', {
  prompt: `Total records: ${list.length}\n\nSample (first 50):\n${JSON.stringify(list.slice(0, 50))}`,
});

const digest = typeof res === 'string' ? res : String(res?.digest ?? '');
const text = `*Daily digest* (${list.length} records)\n${digest}`;

const result = { count: list.length, text };
