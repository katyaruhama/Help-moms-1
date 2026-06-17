import { getPublicSupabaseConfig } from './_supabase.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { message: 'Метод не поддерживается.' });
  }

  const { url, anonKey } = getPublicSupabaseConfig();

  return sendJson(res, 200, {
    supabase: {
      configured: Boolean(url && anonKey),
      url,
      anonKey
    }
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}
