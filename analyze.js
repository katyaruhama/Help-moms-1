const APIFY_API_BASE = 'https://api.apify.com/v2';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_APIFY_ACTOR_ID = 'apify/website-content-crawler';
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
const MAX_PAGES_LIMIT = 5;
const MAX_CONTEXT_CHARS = 18000;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      service: 'Apify + LLM analyzer',
      providers: {
        openrouter: Boolean(process.env.OPENROUTER_API_KEY),
        google: Boolean(process.env.GEMINI_API_KEY)
      }
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: 'Метод не поддерживается.' });
  }

  try {
    const body = await readJsonBody(req);
    const targetUrl = normalizeUrl(body.url);
    const provider = normalizeProvider(body.provider);
    const maxPages = clampPages(body.maxPages);
    const question = normalizeQuestion(body.question);
    const model = normalizeModel(provider, body.model);

    assertRequiredEnv('APIFY_API_TOKEN');
    assertRequiredEnv(provider === 'google' ? 'GEMINI_API_KEY' : 'OPENROUTER_API_KEY');

    const items = await runApifyCrawler(targetUrl, maxPages);
    const prepared = prepareCrawlerItems(items);

    if (!prepared.context) {
      throw new PublicError('Apify вернул пустой текст. Попробуйте другую страницу или увеличьте число страниц.');
    }

    const analysis = provider === 'google'
      ? await analyzeWithGemini({ model, question, context: prepared.context, targetUrl })
      : await analyzeWithOpenRouter({ model, question, context: prepared.context, targetUrl });

    return sendJson(res, 200, {
      analysis,
      provider,
      model,
      itemCount: prepared.sources.length,
      sources: prepared.sources
    });
  } catch (error) {
    const status = error instanceof PublicError ? error.status : 500;
    return sendJson(res, status, {
      message: error instanceof PublicError
        ? error.message
        : 'Внутренняя ошибка сервера при анализе.'
    });
  }
}

async function runApifyCrawler(targetUrl, maxPages) {
  const actorId = normalizeApifyActorId(process.env.APIFY_ACTOR_ID || DEFAULT_APIFY_ACTOR_ID);
  const endpoint = `${APIFY_API_BASE}/actors/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?timeout=120`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFY_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startUrls: [{ url: targetUrl }],
      maxCrawlPages: maxPages
    })
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new PublicError(extractApiError(payload, 'Apify не смог получить данные.'), response.status);
  }

  return Array.isArray(payload) ? payload : [];
}

async function analyzeWithOpenRouter({ model, question, context, targetUrl }) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.PUBLIC_SITE_NAME || 'Mamam ryadom analyzer'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Ты аналитик русскоязычного веб-сервиса. Отвечай по-русски, структурно и только на основе переданного контекста. Если данных не хватает, прямо скажи об этом.'
        },
        {
          role: 'user',
          content: buildPrompt({ question, context, targetUrl })
        }
      ],
      temperature: 0.3
    })
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new PublicError(extractApiError(payload, 'OpenRouter не вернул ответ модели.'), response.status);
  }

  const content = payload?.choices?.[0]?.message?.content;
  return normalizeLlmText(content);
}

async function analyzeWithGemini({ model, question, context, targetUrl }) {
  const response = await fetch(`${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': process.env.GEMINI_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{
          text: 'Ты аналитик русскоязычного веб-сервиса. Отвечай по-русски, структурно и только на основе переданного контекста. Если данных не хватает, прямо скажи об этом.'
        }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: buildPrompt({ question, context, targetUrl }) }]
      }],
      generationConfig: {
        temperature: 0.3
      }
    })
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new PublicError(extractApiError(payload, 'Gemini API не вернул ответ модели.'), response.status);
  }

  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return normalizeLlmText(parts.map((part) => part.text).filter(Boolean).join('\n'));
}

function buildPrompt({ question, context, targetUrl }) {
  return [
    `URL: ${targetUrl}`,
    '',
    'Задача:',
    question,
    '',
    'Контекст, полученный через Apify:',
    context
  ].join('\n');
}

function prepareCrawlerItems(items) {
  const sources = [];
  const chunks = [];

  for (const item of items.slice(0, MAX_PAGES_LIMIT)) {
    const url = item.url || item.loadedUrl || item.crawl?.loadedUrl || '';
    const title = item.metadata?.title || item.title || '';
    const text = item.text || item.markdown || item.description || '';
    const normalizedText = String(text).replace(/\s+/g, ' ').trim();

    if (!normalizedText) {
      continue;
    }

    sources.push({ url, title });
    chunks.push([
      `Источник: ${title || url || 'без названия'}`,
      url ? `URL: ${url}` : '',
      normalizedText
    ].filter(Boolean).join('\n'));
  }

  return {
    sources,
    context: chunks.join('\n\n---\n\n').slice(0, MAX_CONTEXT_CHARS)
  };
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol');
    }
    return url.toString();
  } catch {
    throw new PublicError('Введите корректный URL с http или https.', 400);
  }
}

function normalizeProvider(value) {
  return value === 'google' ? 'google' : 'openrouter';
}

function normalizeQuestion(value) {
  const question = String(value || '').trim();
  return question || 'Сделай краткий анализ страницы: главные тезисы, практические выводы, риски и 3 следующих шага.';
}

function normalizeModel(provider, value) {
  const model = String(value || '').trim();
  if (model) {
    return model;
  }
  return provider === 'google'
    ? process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
    : process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
}

function normalizeApifyActorId(value) {
  return String(value).trim().replace('/', '~');
}

function clampPages(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_PAGES_LIMIT);
}

function normalizeLlmText(content) {
  if (Array.isArray(content)) {
    return content.map((part) => part.text || part.content || '').filter(Boolean).join('\n').trim();
  }

  const text = String(content || '').trim();
  if (!text) {
    throw new PublicError('Модель вернула пустой ответ.');
  }
  return text;
}

function assertRequiredEnv(name) {
  if (!process.env[name]) {
    throw new PublicError(`Не задана переменная окружения ${name}.`, 500);
  }
}

async function readJsonBody(req) {
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf8'));
    } catch {
      throw new PublicError('Тело запроса должно быть JSON.', 400);
    }
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new PublicError('Тело запроса должно быть JSON.', 400);
    }
  }

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new PublicError('Тело запроса должно быть JSON.', 400);
  }
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractApiError(payload, fallback) {
  if (typeof payload === 'string') {
    return payload.slice(0, 500) || fallback;
  }
  return payload?.error?.message || payload?.message || fallback;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

class PublicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
