import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const textExtensions = new Set([
  '.css',
  '.example',
  '.html',
  '.js',
  '.json',
  '.md'
]);

const ignoredDirectories = new Set([
  '.git',
  'node_modules'
]);

test('public source files do not contain real API tokens', async () => {
  const files = await listTextFiles('.');
  const tokenPatterns = [
    /apify_api_[A-Za-z0-9_-]{20,}/,
    /sk-or-v1-[A-Za-z0-9_-]{20,}/,
    /sd_[A-Fa-f0-9]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/
  ];

  for (const file of files) {
    const content = await readFile(file, 'utf8');

    for (const pattern of tokenPatterns) {
      assert.doesNotMatch(content, pattern, `${file} appears to contain a real token`);
    }
  }
});

test('client files do not reference Supabase service role secrets', async () => {
  const clientFiles = (await listTextFiles('.')).filter((file) => {
    return file.endsWith('.html') || file.startsWith(`scripts/`) || file.startsWith(`styles/`);
  });

  for (const file of clientFiles) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /SUPABASE_SERVICE_ROLE_KEY|service_role/i, `${file} should not mention service role keys`);
  }
});

test('server-only Supabase service role stays inside API code', async () => {
  const apiHelper = await readFile('api/_supabase.js', 'utf8');
  assert.match(apiHelper, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(apiHelper, /consume_user_credit/);
});

test('client rendering code escapes API-provided values before using innerHTML', async () => {
  const script = await readFile('scripts/site.js', 'utf8');

  assert.match(script, /function escapeHtml/);
  assert.match(script, /escapeHtml\(request\.title\)/);
  assert.match(script, /escapeHtml\(request\.description\)/);
  assert.match(script, /escapeHtml\(material\.title\)/);
  assert.match(script, /escapeHtml\(material\.summary\)/);
});

async function listTextFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(root, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      files.push(...await listTextFiles(path));
      continue;
    }

    if (entry.isFile() && textExtensions.has(getExtension(entry.name))) {
      files.push(path.replace(/^\.\//, ''));
    }
  }

  return files;
}

function getExtension(filename) {
  if (filename === '.env.example') {
    return '.example';
  }

  const index = filename.lastIndexOf('.');
  return index === -1 ? '' : filename.slice(index);
}
