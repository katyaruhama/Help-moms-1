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
  assertSecurityHeaders(response);
  assert.ok(Array.isArray(response.body.requests));
  assert.ok(response.body.requests.length >= 3);
  assert.ok(response.body.requests.every((request) => request.id && request.title));
});

test('GET /api/requests does not expose private contact data', async () => {
  const response = await callApi(requestsHandler);
  const serialized = JSON.stringify(response.body.requests);

  assert.equal(response.statusCode, 200);
  assert.doesNotMatch(serialized, /@|email|телефон|phone|address|адрес/i);
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
  assertSecurityHeaders(response);
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
  assertSecurityHeaders(response);
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
  assertSecurityHeaders(response);
  assert.equal(response.body.demoMode, true);
  assert.match(response.body.analysis, /Демо-анализ/);
});

test('POST /api/analyze rejects invalid URLs', async () => {
  const response = await callApi(analyzeHandler, {
    method: 'POST',
    body: {
      url: 'javascript:alert(1)',
      provider: 'openrouter',
      question: 'Проверь источник',
      demoMode: true
    }
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /корректный URL/i);
});

test('POST /api/analyze requires login for real analysis', async () => {
  const previousApify = process.env.APIFY_API_TOKEN;
  const previousOpenRouter = process.env.OPENROUTER_API_KEY;

  process.env.APIFY_API_TOKEN = 'apify_api_test_value';
  process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-value';

  try {
    const response = await callApi(analyzeHandler, {
      method: 'POST',
      body: {
        url: 'https://help-moms-1.vercel.app/',
        provider: 'openrouter',
        question: 'Проверь источник',
        demoMode: false
      }
    });

    assert.equal(response.statusCode, 401);
    assert.match(response.body.message, /Войдите/);
  } finally {
    restoreEnv('APIFY_API_TOKEN', previousApify);
    restoreEnv('OPENROUTER_API_KEY', previousOpenRouter);
  }
});

test('GET /api/materials returns demo library', async () => {
  const response = await callApi(materialsHandler);

  assert.equal(response.statusCode, 200);
  assertSecurityHeaders(response);
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
  assertSecurityHeaders(response);
  assert.equal(response.body.demoMode, true);
  assert.match(response.body.material.analysis, /Краткое резюме/);
});

test('POST /api/materials rejects invalid URLs', async () => {
  const response = await callApi(materialsHandler, {
    method: 'POST',
    body: {
      url: 'file:///etc/passwd',
      demoMode: true
    }
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /корректную ссылку/i);
});

test('POST /api/materials requires login for real material analysis', async () => {
  const previousSupadata = process.env.SUPADATA_API_KEY;
  process.env.SUPADATA_API_KEY = 'sd_test_key_for_real_mode';

  try {
    const response = await callApi(materialsHandler, {
      method: 'POST',
      body: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        demoMode: false
      }
    });

    assert.equal(response.statusCode, 401);
    assert.match(response.body.message, /Войдите|Сессия/);
  } finally {
    restoreEnv('SUPADATA_API_KEY', previousSupadata);
  }
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
    assertSecurityHeaders(response);
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

test('API endpoints reject unsupported methods', async () => {
  const endpoints = [
    analyzeHandler,
    configHandler,
    materialsHandler,
    requestsHandler,
    submissionsHandler,
    supportHandler
  ];

  for (const handler of endpoints) {
    const response = await callApi(handler, { method: 'PATCH' });
    assert.equal(response.statusCode, 405);
    assertSecurityHeaders(response);
    assert.match(response.body.message, /Метод не поддерживается/);
  }
});

test('API responses do not leak configured secret values', async () => {
  const previousApify = process.env.APIFY_API_TOKEN;
  const previousOpenRouter = process.env.OPENROUTER_API_KEY;
  const previousGemini = process.env.GEMINI_API_KEY;
  const previousSupadata = process.env.SUPADATA_API_KEY;
  const previousServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.APIFY_API_TOKEN = 'apify_api_secret_test_value';
  process.env.OPENROUTER_API_KEY = 'sk-or-v1-secret-test-value';
  process.env.GEMINI_API_KEY = 'gemini-secret-test-value';
  process.env.SUPADATA_API_KEY = 'sd_secret_test_value';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret-test-value';

  try {
    const responses = [
      await callApi(analyzeHandler),
      await callApi(materialsHandler)
    ];
    const serialized = JSON.stringify(responses.map((response) => response.body));

    assert.doesNotMatch(serialized, /apify_api_secret_test_value/);
    assert.doesNotMatch(serialized, /sk-or-v1-secret-test-value/);
    assert.doesNotMatch(serialized, /gemini-secret-test-value/);
    assert.doesNotMatch(serialized, /sd_secret_test_value/);
    assert.doesNotMatch(serialized, /service-role-secret-test-value/);
  } finally {
    restoreEnv('APIFY_API_TOKEN', previousApify);
    restoreEnv('OPENROUTER_API_KEY', previousOpenRouter);
    restoreEnv('GEMINI_API_KEY', previousGemini);
    restoreEnv('SUPADATA_API_KEY', previousSupadata);
    restoreEnv('SUPABASE_SERVICE_ROLE_KEY', previousServiceRole);
  }
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function assertSecurityHeaders(response) {
  assert.match(response.headers['content-type'], /application\/json/);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.equal(response.headers['cache-control'], 'no-store');
}
