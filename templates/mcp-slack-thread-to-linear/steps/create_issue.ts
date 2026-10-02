const { team, title, description } = input_data as { team: string; title: string; description: string };

const issue = await metaphor.mcp('linear', 'save_issue', {
  team,
  title,
  description,
});

const result = { issue };
