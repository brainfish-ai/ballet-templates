const { meetings } = input_data as {
  meetings: Array<{ title: string; companies: string[]; attendees: Array<{ name: string | null; email: string }> } & Record<string, unknown>>;
};

const domains = [...new Set((meetings ?? []).flatMap(m => m.companies ?? []))].slice(0, 10);

const research = new Map<string, string>();
await metaphor.map(
  domains,
  async (domain: string) => {
    const parts: string[] = [];
    try {
      const page = await metaphor.tool('read_url', { url: `https://${domain}` });
      parts.push(`Website:\n${JSON.stringify(page).slice(0, 6000)}`);
    } catch (err) {
      parts.push(`Website could not be read: ${(err as Error).message}`);
    }
    try {
      const hits = await metaphor.tool('search_web', { query: `${domain} company news`, num: 5, tbs: 'qdr:m' });
      parts.push(`Recent news:\n${JSON.stringify(hits).slice(0, 4000)}`);
    } catch (err) {
      parts.push(`News search failed: ${(err as Error).message}`);
    }
    research.set(domain, parts.join('\n\n'));
  },
  { concurrency: 3 },
);

const result = {
  meetings: (meetings ?? []).map(m => ({
    ...m,
    research: (m.companies ?? []).map(d => ({ domain: d, notes: research.get(d) ?? 'Not researched (limit reached).' })),
  })),
};
