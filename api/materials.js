const SUPADATA_API_BASE = 'https://api.supadata.ai/v1';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const MAX_TRANSCRIPT_CHARS = 14000;
const JOB_POLL_ATTEMPTS = 8;
const JOB_POLL_DELAY_MS = 900;

const demoMaterials = [
  {
    id: 'gentle-boundaries',
    type: 'video',
    title: 'Как помогать после родов без вторжения',
    source: 'Демо-материал',
    url: 'https://help-moms-1.vercel.app/article-boundaries.html',
    summary: 'Главная мысль: помощь должна быть конкретной и согласованной. Передать еду, забрать аптеку или вынести мусор иногда важнее длинных разговоров и советов.',
    whyItMatters: 'Маме легче принять помощь, когда она понимает границы задачи и сохраняет контроль над личным пространством.',
    actions: [
      'Предлагать одно понятное дело',
      'Заранее согласовывать время и формат передачи',
      'Не давать советов без просьбы'
    ]
  },
  {
    id: 'small-help',
    type: 'article',
    title: 'Почему маленькая бытовая помощь имеет большой эффект',
    source: 'Демо-материал',
    url: 'https://help-moms-1.vercel.app/article-small-help.html',
    summary: 'Короткая задача снижает порог входа для помощника и убирает ощущение долга у мамы. Так поддержка становится устойчивой.',
    whyItMatters: 'Проекту проще привлекать людей, когда помощь описана как 20-60 минут, а не как неопределённая забота.',
    actions: [
      'Разбивать просьбы на маленькие задачи',
      'Показывать примерное время',
      'Публиковать только безопасную часть заявки'
    ]
  },
  {
    id: 'normal-support',
    type: 'video',
    title: 'Поддержка рядом как новая норма',
    source: 'Демо-материал',
    url: 'https://help-moms-1.vercel.app/article-normal-support.html',
    summary: 'Помощь после родов не должна выглядеть как подвиг. Она может быть обычной соседской практикой: заметить, спросить, сделать и не усложнять.',
    whyItMatters: 'Такая рамка снимает стыд с просьбы о помощи и делает участие доступным для большего числа людей.',
    actions: [
      'Говорить о помощи как о норме',
      'Показывать простые маршруты участия',
      'Благодарить без героизации'
    ]
  }
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      materials: demoMaterials,
      demoMode: true,
      supadataConfigured: Boolean(process.env.SUPADATA_API_KEY),
      llmConfigured: Boolean(process.env.OPENROUTER_API_KEY)
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: 'Метод не поддерживается.' });
  }

  try {
    const body = await readJsonBody(req);
    const url = normalizeUrl(body.url);
    const demoMode = body.demoMode === true || body.demoMode === 'true';

    if (demoMode || !process.env.SUPADATA_API_KEY) {
      return sendJson(res, 200, createDemoVideoAnalysis(url));
    }

    const [metadata, transcriptResponse] = await Promise.all([
      fetchSupadataJson('metadata', { url }),
      fetchSupadataJson('transcript', { url, text: 'true', mode: 'auto' })
    ]);

    const transcript = await resolveTranscriptJob(transcriptResponse);
    const transcriptText = normalizeTranscript(transcript);
    const analysis = process.env.OPENROUTER_API_KEY
      ? await analyzeMaterialWithOpenRouter({ url, metadata, transcriptText })
      : createFallbackSummary({ url, metadata, transcriptText });

    return sendJson(res, 200, {
      demoMode: false,
      material: {
        title: metadata?.title || 'Материал без названия',
        source: metadata?.author?.displayName || metadata?.platform || 'Supadata',
        url,
        thumbnailUrl: metadata?.media?.thumbnailUrl || '',
        analysis
      }
    });
  } catch (error) {
    return sendJson(res, error.status || 500, {
      message: error.publicMessage || 'Не удалось разобрать материал.'
    });
  }
}

async function fetchSupadataJson(endpoint, params) {
  const search = new URLSearchParams(params);
  const response = await fetch(`${SUPADATA_API_BASE}/${endpoint}?${search.toString()}`, {
    headers: {
      'x-api-key': process.env.SUPADATA_API_KEY
    }
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Supadata ${endpoint} вернул ошибку.`;
    throw new PublicError(message, response.status);
  }

  return payload;
}

async function resolveTranscriptJob(payload) {
  if (!payload?.jobId) {
    return payload;
  }

  for (let attempt = 0; attempt < JOB_POLL_ATTEMPTS; attempt += 1) {
    await delay(JOB_POLL_DELAY_MS);
    const job = await fetchSupadataJson(`transcript/${encodeURIComponent(payload.jobId)}`, {});

    if (job?.status === 'completed') {
      return job.result || job;
    }

    if (job?.status === 'failed') {
      throw new PublicError(job.error || 'Supadata не смог подготовить расшифровку.', 502);
    }
  }

  throw new PublicError('Расшифровка ещё готовится. Попробуйте запустить разбор ещё раз через минуту.', 202);
}

async function analyzeMaterialWithOpenRouter({ url, metadata, transcriptText }) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.PUBLIC_SITE_URL || 'https://help-moms-1.vercel.app',
      'X-Title': process.env.PUBLIC_SITE_NAME || 'Mamam ryadom materials'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
      temperature: 0.25,
      messages: [
        {
          role: 'system',
          content: 'Ты редактор проекта помощи мамам после родов. Отвечай по-русски, коротко, бережно и практично.'
        },
        {
          role: 'user',
          content: [
            `URL: ${url}`,
            `Название: ${metadata?.title || 'не указано'}`,
            `Автор/канал: ${metadata?.author?.displayName || 'не указан'}`,
            '',
            'Расшифровка или текст материала:',
            transcriptText.slice(0, MAX_TRANSCRIPT_CHARS),
            '',
            'Сделай: 1) краткое резюме, 2) почему это важно для помощи мамам после родов, 3) 3 идеи для волонтёров, 4) осторожности и границы.'
          ].join('\n')
        }
      ]
    })
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new PublicError(payload?.error?.message || 'OpenRouter не смог проанализировать материал.', response.status);
  }

  return payload?.choices?.[0]?.message?.content?.trim() || 'Модель вернула пустой ответ.';
}

function createFallbackSummary({ url, metadata, transcriptText }) {
  const title = metadata?.title || 'Материал';
  const excerpt = transcriptText.slice(0, 500);
  return [
    `Материал: ${title}`,
    '',
    'Supadata вернул расшифровку, но LLM-ключ не настроен. Ниже краткая техническая выжимка без анализа модели.',
    '',
    excerpt ? `Фрагмент текста: ${excerpt}` : `Источник доступен: ${url}`,
    '',
    'Чтобы получить полноценный анализ, добавьте OPENROUTER_API_KEY в Vercel Environment Variables.'
  ].join('\n');
}

function createDemoVideoAnalysis(url) {
  return {
    demoMode: true,
    material: {
      title: 'Демо-разбор материала о поддержке после родов',
      source: 'Демо-режим',
      url,
      thumbnailUrl: '',
      analysis: [
        'Краткое резюме',
        'Материал показывает, что после родов особенно ценна простая бытовая помощь: еда, аптека, покупки, стирка и короткая передышка.',
        '',
        'Почему это важно',
        'Такая помощь снижает нагрузку на маму, возвращает ощущение опоры и делает просьбу менее стыдной.',
        '',
        'Идеи для волонтёров',
        '1. Предлагать маленькие задачи на 20-60 минут.',
        '2. Не заходить глубже, чем просит семья.',
        '3. Помогать делом, а не советом.',
        '',
        'Границы',
        'Проект не заменяет врача, няню или экстренные службы. Важно заранее согласовывать формат помощи.'
      ].join('\n')
    }
  };
}

function normalizeTranscript(payload) {
  if (typeof payload?.content === 'string') {
    return payload.content;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content.map((chunk) => chunk.text).filter(Boolean).join(' ');
  }

  if (typeof payload?.result?.content === 'string') {
    return payload.result.content;
  }

  if (Array.isArray(payload?.result?.content)) {
    return payload.result.content.map((chunk) => chunk.text).filter(Boolean).join(' ');
  }

  return '';
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol');
    }
    return url.toString();
  } catch {
    throw new PublicError('Введите корректную ссылку на публичное видео или материал.', 400);
  }
}

async function readJsonBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8'));
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
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

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

class PublicError extends Error {
  constructor(publicMessage, status = 400) {
    super(publicMessage);
    this.publicMessage = publicMessage;
    this.status = status;
  }
}
