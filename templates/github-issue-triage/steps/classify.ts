const { action, title, body } = input_data as { action: string; title: string; body?: string };

const allowed = ['bug', 'enhancement', 'question', 'documentation'];

let labels: string[] = [];
if (action === 'opened') {
  const res = await metaphor.agent('issue-labeler', {
    prompt: `Title: ${title}\n\nBody:\n${(body ?? '').slice(0, 4000)}`,
  });
  labels = (Array.isArray(res?.labels) ? res.labels : []).filter((l: string) => allowed.includes(l));
}

// An empty label list is a no-op for the GitHub API, so non-"opened" events are harmless.
const result = { labels, request: { labels } };
