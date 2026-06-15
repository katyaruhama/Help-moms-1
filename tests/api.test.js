import test from 'node:test';
import assert from 'node:assert/strict';

import analyzeHandler from '../api/analyze.js';
import configHandler from '../api/config.js';
import materialsHandler from '../api/materials.js';
import requestsHandler from '../api/requests.js';
import submissionsHandler from '../api/submissions.js';
import supportHandler from '../api/support.js';
import { callApi } from './helpers.js';

test('GET /api/requests returns open requests', async () => {
  const response = await callApi(requestsHandler);

  assert.equal(response.statusCode, 200);
  assert.ok(Array.isArray(response.body.requests));
  assert.ok(response.body.requests.length >= 3);
  assert.ok(response.body.requests.every((request) => request.id && request.title));
});

test('POST /api/submissions validates required fields', async () => {
  const response = await callApi(submissionsHandler, {
    method: 'POST',
    body: { name: 'Анна' }
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /Заполните/);
});

test('POST /api/submissions accepts a valid request', async () => {
  const response = await callApi(submissionsHandler, {
    method: 'POST',
    body: {
      name: 'Анна',
      contact: '@anna',
      message: 'Нужна еда после выписки',
      type: 'request'
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.submission.type, 'request');
});

test('POST /api/support accepts a valid support message', async () => {
  const response = await callApi(supportHandler, {
    method: 'POST',
    body: {
      name: 'Мария',
      contact: 'maria@example.com',
      supportType: 'время'
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
});

test('POST /api/analyze returns demo analysis without external keys', async () => {
  const response = await callApi(analyzeHandler, {
    method: 'POST',
    body: {
      url: 'https://help-moms-1.vercel.app/',
      provider: 'openrouter',
      maxPages: 1,
      question: 'Что полезно для проекта?',
      demoMode: true
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.demoMode, true);
  assert.match(response.body.analysis, /Демо-анализ/);
});

test('GET /api/materials returns demo library', async () => {
  const response = await callApi(materialsHandler);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.demoMode, true);
  assert.ok(response.body.materials.length >= 3);
});

test('POST /api/materials returns demo material analysis', async () => {
  const response = await callApi(materialsHandler, {
    method: 'POST',
    body: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      demoMode: true
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.demoMode, true);
  assert.match(response.body.material.analysis, /Краткое резюме/);
});

test('GET /api/config exposes only public Supabase config', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousAnonKey = process.env.SUPABASE_ANON_KEY;
  const previousSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'public-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'secret-service-role-key';

  try {
    const response = await callApi(configHandler);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.supabase.configured, true);
    assert.equal(response.body.supabase.url, 'https://example.supabase.co');
    assert.equal(response.body.supabase.anonKey, 'public-anon-key');
    assert.equal(JSON.stringify(response.body).includes('secret-service-role-key'), false);
  } finally {
    restoreEnv('SUPABASE_URL', previousUrl);
    restoreEnv('SUPABASE_ANON_KEY', previousAnonKey);
    restoreEnv('SUPABASE_SERVICE_ROLE_KEY', previousSecret);
  }
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
