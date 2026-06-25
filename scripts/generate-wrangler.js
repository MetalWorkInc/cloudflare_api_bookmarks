/**
 * generate-wrangler.js
 *
 * Reads wrangler.toml (public template with placeholders) and replaces
 * each placeholder with the corresponding environment variable value.
 * Writes the result to wrangler.generated.toml for use during CI/CD deploy.
 *
 * Required environment variables (set in Cloudflare dashboard > Build settings):
 *   CF_KV_BINDING       — KV namespace binding name   (default: STORAGE_KV)
 *   CF_KV_ID            — KV namespace ID
 *   CF_KV_PREVIEW_ID    — KV namespace preview ID
 *   CF_D1_BINDING       — D1 binding name             (default: datastoraged01)
 *   CF_D1_NAME          — D1 database name            (default: datastoraged01)
 *   CF_D1_ID            — D1 database ID
 *   CF_WORKER_VAR_X     — Value for WORKER_VAR_X
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'wrangler.toml');
const OUTPUT = path.join(__dirname, '..', 'wrangler.generated.toml');

const replacements = {
  'replace-with-secret-or-build-var': process.env.CF_WORKER_VAR_X,
  'replace_binding_kv_name':          process.env.CF_KV_BINDING    || 'STORAGE_KV',
  'replace-with-kv-namespace-id':     process.env.CF_KV_ID,
  'replace-with-kv-preview-id':       process.env.CF_KV_PREVIEW_ID,
  'replace_binding_storage_name':     process.env.CF_D1_BINDING    || 'datastoraged01',
  'replace_storage_name':             process.env.CF_D1_NAME       || 'datastoraged01',
  'replace-with-d1-database-id':      process.env.CF_D1_ID,
};

const missing = Object.entries(replacements)
  .filter(([, v]) => v === undefined || v === '')
  .map(([k]) => k);

if (missing.length > 0) {
  console.error('[generate-wrangler] Missing required environment variables for placeholders:');
  missing.forEach((k) => console.error(`  - ${k}`));
  process.exit(1);
}

let content = fs.readFileSync(SOURCE, 'utf8');

for (const [placeholder, value] of Object.entries(replacements)) {
  content = content.split(placeholder).join(value);
}

fs.writeFileSync(OUTPUT, content, 'utf8');
console.log(`[generate-wrangler] Generated ${OUTPUT}`);
