const { team, issues } = input_data as { team: string; issues: unknown };

const res = await metaphor.agent('weekly-digest-writer', {
  prompt: `Team: ${team}\n\nIssues updated in the last 7 days (JSON):\n${JSON.stringify(issues).slice(0, 60000)}`,
});

const digest = typeof res === 'string' ? res : String(res?.digest ?? '');
const result = { text: `*Weekly digest for ${team}*\n${digest}` };
