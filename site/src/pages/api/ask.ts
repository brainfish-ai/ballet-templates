import type { APIRoute } from 'astro';
import { experimental_decide } from 'ai';
import {
  ASK_TEMPLATES,
  JEV_MODEL,
  JEV_TIMEOUT_MS,
  buildAskQuestions,
  checkRateLimit,
  matchCatalogBrowseQuery,
  normalizeQuery,
  rankAskMatches,
} from '../../lib/ask';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!checkRateLimit(request, 'ask')) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const query = normalizeQuery((body as { query?: unknown })?.query);
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const browseResult = matchCatalogBrowseQuery(query);
  if (browseResult) {
    return new Response(JSON.stringify(browseResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await experimental_decide({
      model: JEV_MODEL,
      state: {
        request: query,
        templates: ASK_TEMPLATES,
      },
      questions: buildAskQuestions(ASK_TEMPLATES),
      abortSignal: AbortSignal.timeout(JEV_TIMEOUT_MS),
    });

    const ranked = rankAskMatches(result.answers);
    return new Response(JSON.stringify(ranked), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Decision request failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
