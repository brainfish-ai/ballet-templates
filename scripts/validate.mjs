#!/usr/bin/env node
import { loadTemplates, validateTemplate, templatesDir } from './lib.mjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

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

// Check for un-awaited metaphor calls
console.log('\nChecking for un-awaited metaphor calls...');
try {
  const result = execSync(
    'grep -rn "metaphor\\.\\(integration\\|waitForInput\\|agent\\)" templates/ --include="*.ts" | grep -v "await" || true',
    { encoding: 'utf8' }
  );
  
  if (result.trim()) {
    console.error('\nERROR: Found un-awaited metaphor calls:');
    console.error(result);
    failed += 1;
  } else {
    console.log('✓ All metaphor calls have await');
  }
} catch (error) {
  console.error('Warning: Could not check for un-awaited metaphor calls');
}

if (failed > 0) {
  console.error(`\n${failed} validation errors found.`);
  process.exit(1);
}
console.log(`\n✓ All ${templates.length} templates are valid.`);
