const { competitor_url, your_product, pages } = input_data as {
  competitor_url: string;
  your_product?: string;
  pages: Array<{ url: string; ok: boolean; content: string }>;
};

const context = (pages ?? []).map(p => `## ${p.url}\n${p.content}`).join('\n\n');

const result = await metaphor.agent('competitor-analyst', {
  prompt: [
    `Competitor: ${competitor_url}`,
    your_product ? `Our product: ${your_product}` : 'Our product: not provided.',
    '',
    'Website content:',
    context,
  ].join('\n'),
});
