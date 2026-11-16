#!/usr/bin/env node
/**
 * Regenerates r/lead-enrichment-form.json for Open in v0 / shadcn registry import.
 * Run from the starter root: node scripts/generate-registry.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ path: string; type: string; target?: string }[]} */
const entries = [
  { path: "app/page.tsx", type: "registry:page", target: "app/page.tsx" },
  { path: "app/layout.tsx", type: "registry:file", target: "app/layout.tsx" },
  { path: "app/globals.css", type: "registry:file", target: "app/globals.css" },
  { path: "app/api/ballet/route.ts", type: "registry:file", target: "app/api/ballet/route.ts" },
  { path: "lib/utils.ts", type: "registry:lib", target: "lib/utils.ts" },
  { path: "lib/types.ts", type: "registry:lib", target: "lib/types.ts" },
  { path: "lib/ballet-links.ts", type: "registry:lib", target: "lib/ballet-links.ts" },
  { path: "lib/ballet.ts", type: "registry:lib", target: "lib/ballet.ts" },
  { path: "lib/ballet-sse.ts", type: "registry:lib", target: "lib/ballet-sse.ts" },
  { path: "lib/mock-enrichment.ts", type: "registry:lib", target: "lib/mock-enrichment.ts" },
  { path: "lib/translate-stream.ts", type: "registry:lib", target: "lib/translate-stream.ts" },
  { path: "components/enrichment-demo.tsx", type: "registry:component", target: "components/enrichment-demo.tsx" },
  { path: "components/site-header.tsx", type: "registry:component", target: "components/site-header.tsx" },
  { path: "components/site-footer.tsx", type: "registry:component", target: "components/site-footer.tsx" },
  { path: "components/powered-by-ballet.tsx", type: "registry:component", target: "components/powered-by-ballet.tsx" },
  { path: "components/import-playbook.tsx", type: "registry:component", target: "components/import-playbook.tsx" },
  { path: "components/step-card.tsx", type: "registry:component", target: "components/step-card.tsx" },
  { path: "components/result-cards.tsx", type: "registry:component", target: "components/result-cards.tsx" },
  { path: "components/promo-cards.tsx", type: "registry:component", target: "components/promo-cards.tsx" },
  { path: "components/ui/button.tsx", type: "registry:ui", target: "components/ui/button.tsx" },
  { path: "components/ui/card.tsx", type: "registry:ui", target: "components/ui/card.tsx" },
  { path: "components/ui/badge.tsx", type: "registry:ui", target: "components/ui/badge.tsx" },
  { path: "public/ballet-mark-v2.svg", type: "registry:file", target: "public/ballet-mark-v2.svg" },
  { path: "public/import-to-ballet.svg", type: "registry:file", target: "public/import-to-ballet.svg" },
  { path: ".env.example", type: "registry:file", target: ".env.example" },
  { path: "LICENSE", type: "registry:file", target: "LICENSE" },
];

const files = entries.map((entry) => {
  const abs = path.join(root, entry.path);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing registry source: ${entry.path}`);
  }
  return {
    path: entry.path,
    content: fs.readFileSync(abs, "utf8"),
    type: entry.type,
    target: entry.target || entry.path,
  };
});

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const deps = [
  "next",
  "react",
  "react-dom",
  "ai",
  "@ai-sdk/react",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "lucide-react",
];

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "lead-enrichment-form",
  type: "registry:block",
  title: "Lead Enrichment Form",
  description:
    "Ballet starter: live streaming lead enrichment demo with AI SDK generative UI, step cards, and Import / Sign up CTAs.",
  author: "Ballet <https://ballet.dev>",
  dependencies: deps.filter((name) => pkg.dependencies?.[name]),
  registryDependencies: [],
  files,
};

const outDir = path.join(root, "r");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "lead-enrichment-form.json");
fs.writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outPath)} (${files.length} files)`);
