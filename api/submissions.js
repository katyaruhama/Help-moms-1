export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: 'Метод не поддерживается.' });
  }

  try {
    const body = await readJsonBody(req);
    const type = clean(body.type || 'request');
    const name = clean(body.name);
    const contact = clean(body.contact);
    const message = clean(body.message);

    if (!name || !contact || !message) {
      return sendJson(res, 400, {
        message: 'Заполните имя, контакт и описание.'
      });
    }

    const submission = {
      id: `sub_${Date.now()}`,
      type,
      name,
      contact,
      createdAt: new Date().toISOString()
    };

    return sendJson(res, 200, {
      ok: true,
      submission,
      message: type === 'response'
        ? 'Отклик принят. Координатор свяжется с вами, когда заявка будет подтверждена.'
        : 'Заявка принята. Координатор свяжется с вами для уточнения деталей.'
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
