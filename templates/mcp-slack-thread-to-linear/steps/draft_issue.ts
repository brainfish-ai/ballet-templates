const { thread } = input_data as { thread: unknown };

const res = await metaphor.agent('issue-drafter', {
  prompt: `Slack thread (JSON):\n${JSON.stringify(thread).slice(0, 30000)}`,
});

const result = {
  title: String(res?.title ?? 'Issue from Slack thread').slice(0, 200),
  description: String(res?.description ?? ''),
};
