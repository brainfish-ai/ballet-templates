import type { APIRoute } from 'astro';
import { streamText } from 'ai';
import {
  PROMPT_MAX_TOKENS,
  PROMPT_MODEL,
  PROMPT_SYSTEM,
  checkRateLimit,
  getAskTemplate,
  normalizeQuery,
} from '../../lib/ask';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!checkRateLimit(request, 'prompt')) {
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

  const parsed = body as { query?: unknown; nearestId?: unknown };
  const query = normalizeQuery(parsed?.query);
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const nearest =
    typeof parsed?.nearestId === 'string' ? getAskTemplate(parsed.nearestId) : undefined;

  const userLines = [`User request: ${query}`];
  if (nearest) {
    userLines.push(
      `Closest existing template (use as a starting point if helpful): "${nearest.name}" — ${nearest.summary}`,
    );
  }

  try {
    const result = streamText({
      model: PROMPT_MODEL,
      system: PROMPT_SYSTEM,
      prompt: userLines.join('\n'),
      maxOutputTokens: PROMPT_MAX_TOKENS,
      abortSignal: AbortSignal.timeout(20_000),
    });

    const reader = result.textStream.getReader();
    const first = await reader.read();
    if (first.done) {
      return new Response(JSON.stringify({ error: 'Empty response from model' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(first.value));
      },
      async pull(controller) {
        const next = await reader.read();
        if (next.done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(next.value));
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prompt generation failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
