/**
 * Triggers a Ballet playbook from a Next.js route handler.
 *
 * Verified against Ballet public docs and live API error responses:
 * - Docs: https://ballet.dev/docs/articles/how-do-i-authenticate-with-the-ballet-api-tWaqCPLyGT
 * - Docs: https://ballet.dev/docs/articles/how-do-i-run-a-playbook-over-the-rest-api-KQIz0apagm
 * - Live probe without token → 401 {"error":"Authentication required"}
 * - Live probe with invalid Bearer → 401 {"error":"Invalid or revoked API token"}
 *
 * Real mode (both env vars set):
 *   POST BALLET_WORKFLOW_URL
 *   Authorization: Bearer <BALLET_API_KEY>   // workspace token, mt_live_…
 *   Content-Type: application/json
 *   Body for execute/run URLs: { "input": { …lead fields } }
 *   Body for webhook URLs (/webhooks/): the lead fields object itself
 *
 * Prefer:
 *   BALLET_WORKFLOW_URL=https://api.ballet.dev/api/playbooks/<PLAYBOOK_ID>/execute
 * which streams SSE and ends with a run_stop event containing output.
 *
 * Mock mode (either env var missing): returns mockFn() so the demo works offline.
 *
 * Note: Ballet docs name the token BALLET_API_TOKEN. This starter uses BALLET_API_KEY
 * as the env var name for the same Bearer token value.
 */
export type BalletTriggerResult<T> = {
  mock: boolean;
  success: boolean;
  output: T;
  runId?: string;
  error?: string;
};

function isWebhookUrl(url: string) {
  return /\/webhooks\//i.test(url);
}

async function readExecuteStream(res: Response): Promise<{
  success: boolean;
  output: unknown;
  runId?: string;
}> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(
        String(json.error ?? json.message ?? `Ballet request failed (${res.status})`),
      );
    }
    return {
      success: true,
      output: (json.output as unknown) ?? json,
      runId: typeof json.runId === "string" ? json.runId : undefined,
    };
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Ballet stream had no body");
  const decoder = new TextDecoder();
  let buffer = "";
  let result: { success: boolean; output: unknown; runId?: string } | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const event = JSON.parse(line.slice(5).trim()) as {
        type?: string;
        run?: { success?: boolean; output?: unknown; id?: string; runId?: string };
      };
      if (event.type === "run_stop" && event.run) {
        result = {
          success: Boolean(event.run.success),
          output: event.run.output,
          runId: event.run.runId ?? event.run.id,
        };
      }
    }
  }

  if (!result) throw new Error("Ballet stream ended without run_stop");
  return result;
}

export async function triggerBalletWorkflow<T>(
  input: Record<string, unknown>,
  mockFn: () => T,
): Promise<BalletTriggerResult<T>> {
  const apiKey = process.env.BALLET_API_KEY?.trim();
  const workflowUrl = process.env.BALLET_WORKFLOW_URL?.trim();

  if (!apiKey || !workflowUrl) {
    return { mock: true, success: true, output: mockFn() };
  }

  try {
    const webhook = isWebhookUrl(workflowUrl);
    const res = await fetch(workflowUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(webhook ? input : { input }),
    });

    const parsed = await readExecuteStream(res);
    return {
      mock: false,
      success: parsed.success,
      output: (parsed.output as T) ?? mockFn(),
      runId: parsed.runId,
    };
  } catch (err) {
    return {
      mock: false,
      success: false,
      output: mockFn(),
      error: err instanceof Error ? err.message : "Ballet request failed",
    };
  }
}
