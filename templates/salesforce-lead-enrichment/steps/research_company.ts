const { company } = input_data as { company: string };

const hits = await metaphor.tool('search_web', { query: `${company} company overview products customers news`, num: 5 });

const result = { hits };
