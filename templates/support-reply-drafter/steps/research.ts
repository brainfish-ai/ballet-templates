const { message } = input_data as { message: string };

const query = message.replace(/\s+/g, ' ').trim().slice(0, 200);
const hits = await metaphor.tool('search_web', { query, num: 3 });

const result = { sources: hits };
