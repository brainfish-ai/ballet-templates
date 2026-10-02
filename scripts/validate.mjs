#!/usr/bin/env node
import { loadTemplates, validateTemplate, templatesDir } from './lib.mjs';

const dir = process.argv[2] ?? templatesDir;
const templates = loadTemplates(dir);

if (templates.length === 0) {
  console.error(`No templates found in ${dir}`);
  process.exit(1);
}

let failed = 0;
for (const t of templates) {
  const errors = validateTemplate(t);
  if (errors.length === 0) {
    console.log(`ok   ${t.id} (${t.doc.spec.steps.length} steps)`);
  } else {
    failed += 1;
    console.error(`FAIL ${t.id}`);
    for (const e of errors) console.error(`  - ${e}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${templates.length} templates failed validation.`);
  process.exit(1);
}
console.log(`\nAll ${templates.length} templates are valid.`);
