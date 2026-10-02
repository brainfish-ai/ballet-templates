const { company, title, email, hits } = input_data as {
  company: string;
  title?: string;
  email?: string;
  hits: unknown;
};

const res = await metaphor.agent('lead-researcher', {
  prompt: [
    `Company: ${company}`,
    title ? `Contact title: ${title}` : '',
    email ? `Contact email: ${email}` : '',
    `Search results:\n${JSON.stringify(hits)}`,
  ]
    .filter(Boolean)
    .join('\n'),
});

const ratings = ['Hot', 'Warm', 'Cold'];
const rating = ratings.includes(res?.rating) ? res.rating : 'Warm';

const result = { brief: String(res?.brief ?? '').slice(0, 2000), rating };
