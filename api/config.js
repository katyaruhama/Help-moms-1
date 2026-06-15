export default function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { message: 'Метод не поддерживается.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return sendJson(res, 200, {
    supabase: {
      configured: Boolean(supabaseUrl && supabaseAnonKey),
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    }
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
