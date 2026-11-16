import type { UIMessageStreamWriter } from "ai";
import type { BalletSseEvent } from "@/lib/ballet-sse";
import { deltaMessage } from "@/lib/ballet-sse";
import type {
  EnrichDataParts,
  EnrichmentOutput,
  EnrichUIMessage,
  StepState,
} from "@/lib/types";
import { IMPORT_URL, SIGNUP_URL, STEP_TITLES } from "@/lib/types";

type Writer = UIMessageStreamWriter<EnrichUIMessage>;

function asOutput(value: unknown): EnrichmentOutput {
  if (value && typeof value === "object") return value as EnrichmentOutput;
  return {};
}

function titleForStep(index: number | undefined, step?: { friendlyMessage?: string; description?: string; id?: string }) {
  if (typeof index === "number" && STEP_TITLES[index]) return STEP_TITLES[index];
  return step?.friendlyMessage || step?.description || step?.id || "Working";
}

export function writeMode(
  writer: Writer,
  mode: EnrichDataParts["mode"]["mode"],
  label: string,
) {
  writer.write({ type: "data-mode", id: "mode", data: { mode, label } });
}

export function writeLocked(
  writer: Writer,
  opts?: { message?: string; importUrl?: string; signupUrl?: string },
) {
  writer.write({
    type: "data-locked",
    id: "locked",
    data: {
      message:
        opts?.message ||
        "You used your free live run. Import the playbook to run it on your own leads.",
      importUrl: opts?.importUrl || IMPORT_URL,
      signupUrl: opts?.signupUrl || SIGNUP_URL,
    },
  });
}

export function writePromos(writer: Writer) {
  writer.write({
    type: "data-promo",
    id: "promo-import",
    data: {
      kind: "import",
      title: "Import this playbook into Ballet",
      body: "Bring the enrichment workflow into your workspace and run it on your CRM leads.",
      href: IMPORT_URL,
      cta: "Import to Ballet",
    },
  });
  writer.write({
    type: "data-promo",
    id: "promo-signup",
    data: {
      kind: "signup",
      title: "Sign up free",
      body: "Create a Ballet workspace and automate the handoffs between your systems.",
      href: SIGNUP_URL,
      cta: "Sign up free",
    },
  });
}

export function createBalletTranslator(writer: Writer) {
  const steps = new Map<string, StepState>();

  function upsert(step: StepState) {
    steps.set(step.id, step);
    writer.write({ type: "data-step", id: `step-${step.id}`, data: step });
  }

  return {
    handle(event: BalletSseEvent) {
      switch (event.type) {
        case "run_start": {
          writer.write({
            type: "data-status",
            id: "status",
            data: { message: "Run started" },
          });
          break;
        }
        case "run_delta": {
          const message =
            deltaMessage(event.data.delta) ||
            (typeof event.data.message === "string" ? event.data.message : undefined);
          if (message) {
            writer.write({
              type: "data-status",
              id: "status",
              data: { message },
            });
          }
          break;
        }
        case "step_start": {
          const id = event.data.step?.id || `step-${event.data.index ?? steps.size}`;
          upsert({
            id,
            index: event.data.index,
            title: titleForStep(event.data.index, event.data.step),
            description: event.data.step?.description,
            status: "running",
            message: event.data.step?.friendlyMessage,
            activity: "",
          });
          break;
        }
        case "step_delta": {
          const id = event.data.stepId || [...steps.keys()].at(-1);
          if (!id) break;
          const prev = steps.get(id);
          const activity = deltaMessage(event.data.delta);
          upsert({
            id,
            title: prev?.title || id,
            description: prev?.description,
            index: prev?.index,
            status: "running",
            message: prev?.message,
            activity: activity
              ? `${prev?.activity ? `${prev.activity}\n` : ""}${activity}`
              : prev?.activity,
            durationMs: prev?.durationMs,
          });
          break;
        }
        case "step_stop": {
          const id =
            event.data.stepId ||
            [...steps.keys()].at(-1) ||
            `step-${steps.size}`;
          const prev = steps.get(id);
          const status = String(event.data.result?.status || "completed").toLowerCase();
          upsert({
            id,
            title: prev?.title || id,
            description: prev?.description,
            index: prev?.index,
            status: status.includes("fail") || status.includes("error") ? "error" : "done",
            message: prev?.message,
            activity: prev?.activity,
            durationMs: event.data.result?.durationMs,
          });
          break;
        }
        case "run_stop": {
          const output = asOutput(event.data.run?.output);
          writer.write({ type: "data-result", id: "result", data: output });
          writePromos(writer);
          break;
        }
        case "error": {
          const message =
            String(event.data.message || event.data.error || "Ballet run failed");
          writer.write({
            type: "data-status",
            id: "status",
            data: { message },
          });
          break;
        }
        default:
          break;
      }
    },
  };
}
