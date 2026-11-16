/** Parse Ballet demo/run SSE frames into typed events. */

export type BalletSseEvent =
  | { type: "run_start"; data: Record<string, unknown> }
  | {
      type: "run_delta";
      data: {
        delta?:
          | string
          | {
              type?: string;
              message?: string;
              phase?: string;
              [key: string]: unknown;
            };
        message?: string;
        phase?: string;
      };
    }
  | {
      type: "step_start";
      data: {
        index?: number;
        step?: {
          id?: string;
          description?: string;
          friendlyMessage?: string;
        };
      };
    }
  | {
      type: "step_delta";
      data: {
        stepId?: string;
        delta?:
          | string
          | {
              type?: string;
              text?: string;
              message?: string;
              [key: string]: unknown;
            };
      };
    }
  | {
      type: "step_stop";
      data: {
        stepId?: string;
        result?: {
          status?: string;
          durationMs?: number;
          output?: unknown;
        };
      };
    }
  | {
      type: "run_stop";
      data: {
        run?: {
          status?: string;
          output?: unknown;
          success?: boolean;
        };
      };
    }
  | { type: "error"; data: Record<string, unknown> }
  | { type: "ping"; data: Record<string, unknown> }
  | { type: "unknown"; name: string; data: Record<string, unknown> };

export function parseSseChunk(
  buffer: string,
): { events: BalletSseEvent[]; rest: string } {
  const events: BalletSseEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const frame of parts) {
    if (!frame.trim()) continue;
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      else if (line.startsWith(":")) continue;
    }
    const raw = dataLines.join("\n");
    let data: Record<string, unknown> = {};
    if (raw) {
      try {
        data = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        data = { raw };
      }
    }
    switch (eventName) {
      case "run_start":
        events.push({ type: "run_start", data });
        break;
      case "run_delta":
        events.push({
          type: "run_delta",
          data: data as Extract<BalletSseEvent, { type: "run_delta" }>["data"],
        });
        break;
      case "step_start":
        events.push({
          type: "step_start",
          data: data as Extract<BalletSseEvent, { type: "step_start" }>["data"],
        });
        break;
      case "step_delta":
        events.push({
          type: "step_delta",
          data: data as Extract<BalletSseEvent, { type: "step_delta" }>["data"],
        });
        break;
      case "step_stop":
        events.push({
          type: "step_stop",
          data: data as Extract<BalletSseEvent, { type: "step_stop" }>["data"],
        });
        break;
      case "run_stop":
        events.push({
          type: "run_stop",
          data: data as Extract<BalletSseEvent, { type: "run_stop" }>["data"],
        });
        break;
      case "error":
        events.push({ type: "error", data });
        break;
      case "ping":
        events.push({ type: "ping", data });
        break;
      default:
        events.push({ type: "unknown", name: eventName, data });
    }
  }

  return { events, rest };
}

export async function* iterateBalletSse(
  res: Response,
): AsyncGenerator<BalletSseEvent> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Demo stream had no body");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;
    for (const event of parsed.events) yield event;
  }
  if (buffer.trim()) {
    const parsed = parseSseChunk(buffer + "\n\n");
    for (const event of parsed.events) yield event;
  }
}

export function deltaMessage(delta: unknown): string | undefined {
  if (!delta) return undefined;
  if (typeof delta === "string") return delta;
  if (typeof delta === "object") {
    const d = delta as Record<string, unknown>;
    for (const key of ["message", "text", "content", "phase"]) {
      if (typeof d[key] === "string" && d[key]) return String(d[key]);
    }
    if (typeof d.type === "string" && typeof d.value === "string") return d.value;
  }
  return undefined;
}
