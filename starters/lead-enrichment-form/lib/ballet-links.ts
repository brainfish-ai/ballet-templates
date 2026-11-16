/** Conversion links for Ballet starters. */

export const SIGNUP_URL =
  "https://app.ballet.dev/signup?utm_source=v0&utm_medium=template&utm_campaign=lead-enrichment-form";

export const IMPORT_TEMPLATE_ID = "salesforce-lead-enrichment";
export const ALT_TEMPLATE_ID = "inbound-lead-slack-alert";

export function importPlaybookUrl(templateId: string = IMPORT_TEMPLATE_ID) {
  const q = new URLSearchParams({
    repo: "brainfish-ai/ballet-templates",
    path: `templates/${templateId}`,
    ref: "main",
    utm_source: "v0",
    utm_medium: "template",
    utm_campaign: "lead-enrichment-form",
  });
  return `https://app.ballet.dev/import?${q.toString().replace(/%2F/g, "/")}`;
}
