const SUPABASE_PROJECT_URL = 'https://qjkwxxdnbvkeeqszipit.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xsRKshVn6_moxufvAV-YDw_N-GUrN82';

export function getPublicSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_PROJECT_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY
  };
}

export async function requireAuthenticatedUser(req) {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    throw new PublicHttpError('Войдите в аккаунт, чтобы запускать реальный анализ.', 401);
  }

  const { url, anonKey } = getPublicSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const user = await parseJson(response);

  if (!response.ok || !user?.id) {
    throw new PublicHttpError('Сессия истекла. Войдите снова.', 401);
  }

  return user;
}

export async function consumeCreditForUser(userId, actionType, reference) {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new PublicHttpError('На сервере не настроен SUPABASE_SERVICE_ROLE_KEY для списания кредитов.', 500);
  }

  const response = await fetch(`${url}/rest/v1/rpc/consume_user_credit`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_action: actionType,
      p_reference: reference || null
    })
  });
  const payload = await parseJson(response);
  const result = Array.isArray(payload) ? payload[0] : payload;

  if (!response.ok) {
    throw new PublicHttpError(result?.message || 'Не удалось списать кредит.', response.status);
  }

  if (!result?.ok) {
    throw new PublicHttpError(result?.message || 'Недостаточно кредитов.', 402, {
      creditsRemaining: Number(result?.credits_remaining || 0)
    });
  }

  return {
    creditsRemaining: Number(result.credits_remaining)
  };
}

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export class PublicHttpError extends Error {
  constructor(message, status = 400, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
