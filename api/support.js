export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: 'Метод не поддерживается.' });
  }

  try {
    const body = await readJsonBody(req);
    const name = clean(body.name);
    const contact = clean(body.contact);
    const supportType = clean(body.supportType);

    if (!name || !contact || !supportType) {
      return sendJson(res, 400, {
        message: 'Заполните имя, контакт и формат поддержки.'
      });
    }

    return sendJson(res, 200, {
      ok: true,
      id: `support_${Date.now()}`,
      message: 'Спасибо. Координатор свяжется с вами и предложит самый удобный формат поддержки.'
    });
  } catch {
    return sendJson(res, 400, { message: 'Тело запроса должно быть JSON.' });
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

function clean(value) {
  return String(value || '').trim().slice(0, 1200);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
