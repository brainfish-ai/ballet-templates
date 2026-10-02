const { team } = input_data as { team: string };

const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const issues = await metaphor.mcp('linear', 'list_issues', {
  team,
  updatedAt: weekAgo,
  limit: 100,
});

const result = { issues };
