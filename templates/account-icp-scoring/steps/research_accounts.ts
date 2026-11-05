const { account_urls } = input_data as { account_urls: string };

const MAX_ACCOUNTS = 10;

const urls = [
  ...new Set(
    String(account_urls ?? '')
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (/^https?:\/\//i.test(s) ? s : `https://${s}`)),
  ),
].slice(0, MAX_ACCOUNTS);

const accounts = await metaphor.map(
  urls,
  async (url: string) => {
    try {
      const page = await metaphor.tool('read_url', { url });
      return { url, ok: true, content: JSON.stringify(page).slice(0, 8000) };
    } catch (err) {
      return { url, ok: false, content: `Could not read ${url}: ${(err as Error).message}` };
    }
  },
  { concurrency: 3 },
);

const result = { accounts };
