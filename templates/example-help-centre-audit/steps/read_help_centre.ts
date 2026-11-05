const { help_centre_url } = input_data as { help_centre_url: string };

const raw = help_centre_url.trim();
const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);

let home = '';
try {
  home = JSON.stringify(await metaphor.tool('read_url', { url: url.href })).slice(0, 20000);
} catch (err) {
  home = `Could not read ${url.href}: ${(err as Error).message}`;
}

let articles = '';
try {
  const hits = await metaphor.tool('search_web', { query: `site:${url.hostname} how to`, num: 10 });
  articles = JSON.stringify(hits).slice(0, 15000);
} catch (err) {
  articles = `Search failed: ${(err as Error).message}`;
}

const result = { home, articles };
