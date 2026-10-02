const { subject, description } = input_data as { subject: string; description: string };

const res = await metaphor.agent('ticket-summarizer', {
  prompt: `Subject: ${subject}\n\nBody:\n${description}`,
});

const bullets: string[] = Array.isArray(res?.bullets) ? res.bullets.slice(0, 3) : [];
const note = bullets.length > 0 ? `Summary\n${bullets.map(b => `- ${b}`).join('\n')}` : 'Summary unavailable.';

const result = { note };
