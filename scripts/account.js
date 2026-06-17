window.mamamAccount = (() => {
  let configPromise = null;
  let clientPromise = null;

  async function getConfig() {
    if (!configPromise) {
      configPromise = fetch('/api/config')
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Не удалось загрузить настройки Supabase.');
          }
          return data.supabase;
        });
    }

    return configPromise;
  }

  async function getClient() {
    if (!clientPromise) {
      clientPromise = getConfig().then(async (config) => {
        if (!config.configured) {
          throw new Error('Supabase не настроен.');
        }

        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        return createClient(config.url, config.anonKey);
      });
    }

    return clientPromise;
  }

  async function getSession() {
    const client = await getClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function getAccessToken() {
    const session = await getSession();
    return session?.access_token || '';
  }

  async function getProfile() {
    const client = await getClient();
    const session = await getSession();

    if (!session?.user) {
      return null;
    }

    const { data, error } = await client
      .from('profiles')
      .select('id, email, display_name, role, credits')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async function refreshCreditDisplays() {
    const nodes = document.querySelectorAll('[data-credit-balance]');

    if (!nodes.length) {
      return null;
    }

    try {
      const profile = await getProfile();

      nodes.forEach((node) => {
        node.textContent = profile
          ? formatCredits(profile.credits)
          : 'Войдите, чтобы получить 5 кредитов';
      });

      return profile;
    } catch {
      nodes.forEach((node) => {
        node.textContent = 'Войдите, чтобы использовать кредиты';
      });
      return null;
    }
  }

  function formatCredits(value) {
    const credits = Number(value || 0);
    const ending = credits === 1 ? 'кредит' : credits >= 2 && credits <= 4 ? 'кредита' : 'кредитов';
    return `${credits} ${ending}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    refreshCreditDisplays();
  });

  return {
    formatCredits,
    getAccessToken,
    getClient,
    getProfile,
    refreshCreditDisplays
  };
})();
