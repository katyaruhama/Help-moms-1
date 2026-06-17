import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('main pages link to registration page', async () => {
  const pages = [
    'index.html',
    'for-moms.html',
    'for-helpers.html',
    'requests.html',
    'materials.html',
    'donate.html',
    'faq.html'
  ];

  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    assert.match(html, /href="auth\.html"/, `${page} should link to auth.html`);
  }
});

test('auth page has signup and login forms', async () => {
  const html = await readFile('auth.html', 'utf8');

  assert.match(html, /data-auth-signup/);
  assert.match(html, /data-auth-login/);
  assert.match(html, /scripts\/auth\.js/);
});

test('auth script uses Supabase signup and password login', async () => {
  const script = await readFile('scripts/auth.js', 'utf8');
  const accountScript = await readFile('scripts/account.js', 'utf8');

  assert.match(accountScript, /@supabase\/supabase-js/);
  assert.match(accountScript, /\/api\/config/);
  assert.match(accountScript, /\.from\('profiles'\)/);
  assert.match(accountScript, /\.maybeSingle\(\)/);
  assert.match(accountScript, /getAccessToken/);
  assert.match(script, /auth\.signUp/);
  assert.match(script, /auth\.signInWithPassword/);
  assert.match(script, /refreshCreditDisplays/);
});

test('analysis forms send Authorization header for paid requests', async () => {
  const siteScript = await readFile('scripts/site.js', 'utf8');
  const indexHtml = await readFile('index.html', 'utf8');

  assert.match(siteScript, /buildAuthorizedHeaders/);
  assert.match(siteScript, /headers\.Authorization = `Bearer \$\{token\}`/);
  assert.match(indexHtml, /buildAnalysisHeaders/);
  assert.match(indexHtml, /headers\.Authorization = `Bearer \$\{token\}`/);
});

test('materials page keeps library and video analysis entry points', async () => {
  const html = await readFile('materials.html', 'utf8');

  assert.match(html, /data-materials-list/);
  assert.match(html, /data-material-form/);
  assert.match(html, /#video-analysis/);
});

test('soft motion assets are connected on key pages', async () => {
  const pages = ['index.html', 'auth.html', 'materials.html', 'requests.html'];

  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    assert.match(html, /styles\/soft-motion\.css/, `${page} should load soft motion styles`);
    assert.match(html, /scripts\/soft-motion\.js/, `${page} should load soft motion script`);
  }

  const script = await readFile('scripts/soft-motion.js', 'utf8');
  const styles = await readFile('styles/soft-motion.css', 'utf8');
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /localStorage/);
  assert.match(script, /aria-pressed/);
  assert.match(styles, /motion-toggle/);
  assert.match(styles, /prefers-reduced-motion/);
});
