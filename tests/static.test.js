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

  assert.match(script, /@supabase\/supabase-js/);
  assert.match(script, /auth\.signUp/);
  assert.match(script, /auth\.signInWithPassword/);
  assert.match(script, /\/api\/config/);
});

test('materials page keeps library and video analysis entry points', async () => {
  const html = await readFile('materials.html', 'utf8');

  assert.match(html, /data-materials-list/);
  assert.match(html, /data-material-form/);
  assert.match(html, /#video-analysis/);
});

test('custom cursor assets are connected on key pages', async () => {
  const pages = ['index.html', 'auth.html', 'materials.html', 'requests.html'];

  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    assert.match(html, /styles\/cursor\.css/, `${page} should load cursor styles`);
    assert.match(html, /scripts\/cursor\.js/, `${page} should load cursor script`);
  }

  const script = await readFile('scripts/cursor.js', 'utf8');
  assert.match(script, /bottle/);
  assert.match(script, /ladle/);
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
