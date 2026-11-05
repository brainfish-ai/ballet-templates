const { competitor_url } = input_data as { competitor_url: string };

const raw = competitor_url.trim();
const base = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
const urls = [base.origin, `${base.origin}/pricing`];

const pages = await metaphor.map(
  urls,
  async (url: string) => {
    try {
      const page = await metaphor.tool('read_url', { url });
      return { url, ok: true, content: JSON.stringify(page).slice(0, 20000) };
    } catch (err) {
      return { url, ok: false, content: `Could not read ${url}: ${(err as Error).message}` };
    }
  },
  { concurrency: 2 },
);

const result = { pages };
