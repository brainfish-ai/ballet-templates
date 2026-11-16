/**
 * Triggers a Ballet playbook from a Next.js route handler.
 *
 * Auth and payload follow Ballet's public REST docs:
 * - Authorization: Bearer <workspace API token>
 * - Execute body: { input: {...} }
 * - Webhook body: the event payload itself (URL contains /webhooks/)
 *
 * Set BALLET_API_KEY (workspace token) and BALLET_WORKFLOW_URL
 * (execute URL or webhook URL). When either is missing, mockFn runs
 * so the demo works without credentials.
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
      throw new Error(String(json.error ?? json.message ?? `Ballet request failed (${res.status})`));
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
