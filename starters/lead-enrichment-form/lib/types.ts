import type { UIMessage } from "ai";

export type LeadInput = {
  name?: string;
  email: string;
  company?: string;
  title?: string;
  website?: string;
  message?: string;
};

export type EnrichPerson = {
  name?: string | null;
  email?: string | null;
  title?: string | null;
  seniority?: string | null;
  linkedin_url?: string | null;
  x_url?: string | null;
  location?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  headline?: string | null;
};

export type EnrichCompany = {
  name?: string | null;
  domain?: string | null;
  website?: string | null;
  industry?: string | null;
  founded?: string | number | null;
  headquarters?: string | null;
  employee_count?: string | number | null;
  funding?: string | null;
  summary?: string | null;
  products?: string[] | null;
  tech_stack?: string[] | null;
};

export type EnrichmentOutput = {
  person?: EnrichPerson | null;
  company?: EnrichCompany | null;
  website?: {
    pages_crawled?: string[] | null;
    highlights?: string[] | null;
  } | null;
  fit?: {
    score?: number | null;
    reasons?: string[] | null;
  } | null;
  next_step?: string | null;
  opener?: string | null;
  sources?: Array<string | { title?: string; url?: string }> | null;
  meta?: unknown;
};

export type StepState = {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "running" | "done" | "error";
  message?: string;
  activity?: string;
  durationMs?: number;
  index?: number;
};

export type PromoKind = "import" | "signup";

export type EnrichDataParts = {
  mode: { mode: "live" | "mock" | "byo"; label: string };
  step: StepState;
  result: EnrichmentOutput;
  promo: {
    kind: PromoKind;
    title: string;
    body: string;
    href: string;
    cta: string;
  };
  locked: {
    message: string;
    importUrl: string;
    signupUrl: string;
  };
  status: { message: string };
};

export type EnrichUIMessage = UIMessage<never, EnrichDataParts>;

export {
  IMPORT_URL,
  SIGNUP_URL,
  importPlaybookUrl,
  IMPORT_TEMPLATE_ID,
  ALT_TEMPLATE_ID,
} from "@/lib/ballet-links";

export const DEFAULT_DEMO_URL = "https://ballet.dev/api/demo/enrich";

export const STEP_TITLES = [
  "Searching live people data for your lead",
  "Crawling the company website",
  "Scoring ICP fit and writing your opener",
] as const;
