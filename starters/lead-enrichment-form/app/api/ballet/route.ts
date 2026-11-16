import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { iterateBalletSse } from "@/lib/ballet-sse";
import { triggerBalletWorkflow } from "@/lib/ballet";
import { buildMockOutput, mockBalletFrames } from "@/lib/mock-enrichment";
import {
  createBalletTranslator,
  writeLocked,
  writeMode,
  writePromos,
} from "@/lib/translate-stream";
import type { EnrichUIMessage, LeadInput } from "@/lib/types";
import {
  DEFAULT_DEMO_URL,
  IMPORT_URL,
  SIGNUP_URL,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function extractLead(body: Record<string, unknown>): LeadInput | null {
  const lead = body.lead;
  if (lead && typeof lead === "object") {
    const l = lead as Record<string, unknown>;
    if (typeof l.email === "string" && l.email.includes("@")) {
      return {
        name: typeof l.name === "string" ? l.name : undefined,
        email: l.email,
        company: typeof l.company === "string" ? l.company : undefined,
        title: typeof l.title === "string" ? l.title : undefined,
        website: typeof l.website === "string" ? l.website : undefined,
        message: typeof l.message === "string" ? l.message : undefined,
      };
    }
  }

  const messages = body.messages;
  if (Array.isArray(messages)) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i] as { role?: string; parts?: unknown[]; content?: string };
      if (msg.role !== "user") continue;
      const textPart = Array.isArray(msg.parts)
        ? msg.parts.find((p) => p && typeof p === "object" && (p as { type?: string }).type === "text")
        : null;
      const text =
        (textPart && typeof (textPart as { text?: string }).text === "string"
          ? (textPart as { text: string }).text
          : typeof msg.content === "string"
            ? msg.content
            : "") || "";
      const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (emailMatch) {
        return { email: emailMatch[0], name: text.replace(emailMatch[0], "").trim() || undefined };
      }
    }
  }
  return null;
}

async function streamMock(lead: LeadInput, reason: string) {
  const stream = createUIMessageStream<EnrichUIMessage>({
    execute: async ({ writer }) => {
      writeMode(writer, "mock", `Sample data (${reason})`);
      const translator = createBalletTranslator(writer);
      for (const frame of mockBalletFrames(lead)) {
        if (frame.delayMs) await new Promise((r) => setTimeout(r, frame.delayMs));
        translator.handle({
          type: frame.event as "run_start",
          data: frame.data as Record<string, unknown>,
        } as Parameters<typeof translator.handle>[0]);
      }
      writeLocked(writer, {
        message:
          "You used your free live run. Import the playbook to run it on your own leads.",
      });
      writePromos(writer);
    },
  });
  return createUIMessageStreamResponse({ stream });
}

async function streamDemo(lead: LeadInput, demoUrl: string) {
  const upstream = await fetch(demoUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream, application/json",
    },
    // Browser cookies are not available server-side; the client can also call
    // the demo URL directly when credentials are required. This proxy still
    // forwards the JSON body for server-to-server or cookie-less demos.
    body: JSON.stringify(lead),
    cache: "no-store",
  });

  if (upstream.status === 429) {
    const json = (await upstream.json().catch(() => ({}))) as {
      error?: string;
      importUrl?: string;
      signupUrl?: string;
    };
    const stream = createUIMessageStream<EnrichUIMessage>({
      execute: ({ writer }) => {
        writeMode(writer, "live", "Demo limit reached");
        writeLocked(writer, {
          message:
            "You used your free live run. Import the playbook to run it on your own leads.",
          importUrl: json.importUrl || IMPORT_URL,
          signupUrl: json.signupUrl || SIGNUP_URL,
        });
        writePromos(writer);
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  if (!upstream.ok) {
    throw new Error(`Demo endpoint returned ${upstream.status}`);
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    // Unexpected non-SSE payload: fall through to mock via throw
    throw new Error("Demo endpoint did not return an event stream");
  }

  const stream = createUIMessageStream<EnrichUIMessage>({
    execute: async ({ writer }) => {
      writeMode(writer, "live", "Live Ballet demo run");
      const translator = createBalletTranslator(writer);
      for await (const event of iterateBalletSse(upstream)) {
        translator.handle(event);
      }
      writeLocked(writer);
    },
  });
  return createUIMessageStreamResponse({ stream });
}

async function streamByo(lead: LeadInput) {
  const result = await triggerBalletWorkflow(
    {
      lead_id: `demo-${Date.now()}`,
      name: lead.name ?? "",
      email: lead.email,
      company: lead.company || lead.email.split("@")[1] || "unknown",
      title: lead.title ?? "",
      website: lead.website ?? "",
      message: lead.message ?? "",
    },
    () => buildMockOutput(lead),
  );

  const stream = createUIMessageStream<EnrichUIMessage>({
    execute: async ({ writer }) => {
      writeMode(
        writer,
        result.mock ? "mock" : "byo",
        result.mock ? "Sample data (BYO env incomplete)" : "Your Ballet workflow",
      );
      const translator = createBalletTranslator(writer);
      for (const frame of mockBalletFrames(lead)) {
        // Reuse timing for step UI, but replace final output with BYO result when present
        if (frame.event === "run_stop" && !result.mock) {
          translator.handle({
            type: "run_stop",
            data: {
              run: {
                status: result.success ? "completed" : "failed",
                success: result.success,
                output: result.output,
              },
            },
          });
          continue;
        }
        if (frame.delayMs) await new Promise((r) => setTimeout(r, Math.min(frame.delayMs, 200)));
        translator.handle({
          type: frame.event as "run_start",
          data: frame.data as Record<string, unknown>,
        } as Parameters<typeof translator.handle>[0]);
      }
      if (result.error) {
        writer.write({
          type: "data-status",
          id: "status",
          data: { message: result.error },
        });
      }
      writePromos(writer);
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const lead = extractLead(body);

  if (!lead?.email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const byoKey = process.env.BALLET_API_KEY?.trim();
  const byoUrl = process.env.BALLET_WORKFLOW_URL?.trim();
  if (byoKey && byoUrl) {
    try {
      return await streamByo(lead);
    } catch (err) {
      return streamMock(
        lead,
        err instanceof Error ? err.message : "BYO workflow failed",
      );
    }
  }

  const demoUrl =
    process.env.BALLET_DEMO_URL?.trim() ||
    process.env.NEXT_PUBLIC_BALLET_DEMO_URL?.trim() ||
    DEFAULT_DEMO_URL;

  try {
    return await streamDemo(lead, demoUrl);
  } catch (err) {
    return streamMock(
      lead,
      err instanceof Error ? err.message : "Demo endpoint unreachable",
    );
  }
}
