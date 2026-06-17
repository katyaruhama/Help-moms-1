const statusNode = document.querySelector('[data-auth-status]');
const logoutButton = document.querySelector('[data-auth-logout]');
const signupForm = document.querySelector('[data-auth-signup]');
const loginForm = document.querySelector('[data-auth-login]');

initAuth();

async function initAuth() {
  try {
    const supabase = await window.mamamAccount.getClient();

    await renderSession(supabase);
    supabase.auth.onAuthStateChange(() => {
      renderSession(supabase);
      window.mamamAccount.refreshCreditDisplays();
    });

    bindSignup(supabase);
    bindLogin(supabase);
    bindLogout(supabase);
  } catch (error) {
    setStatus(error.message || 'Не удалось подключить авторизацию.');
    disableAuthForms(true);
  }
}

function bindSignup(supabase) {
  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = signupForm.querySelector('[data-auth-signup-result]');
    const submit = signupForm.querySelector('[type="submit"]');
    const payload = Object.fromEntries(new FormData(signupForm).entries());

    setBusy(submit, true);
    setResult(result, 'Создаём аккаунт...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth.html`,
          data: {
            name: payload.name,
            role: payload.role
          }
        }
      });

      if (error) {
        throw error;
      }

      signupForm.reset();
      await renderSession(supabase);
      await window.mamamAccount.refreshCreditDisplays();
      setResult(result, data.session
        ? 'Аккаунт создан. Вам начислено 5 кредитов.'
        : 'Аккаунт создан. Если Supabase попросит подтверждение, проверьте настройки email confirmation.'
      );
    } catch (error) {
      setResult(result, error.message || 'Не удалось создать аккаунт.');
    } finally {
      setBusy(submit, false);
    }
  });
}

function bindLogin(supabase) {
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = loginForm.querySelector('[data-auth-login-result]');
    const submit = loginForm.querySelector('[type="submit"]');
    const payload = Object.fromEntries(new FormData(loginForm).entries());

    setBusy(submit, true);
    setResult(result, 'Входим...');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password
      });

      if (error) {
        throw error;
      }

      loginForm.reset();
      await renderSession(supabase);
      await window.mamamAccount.refreshCreditDisplays();
      setResult(result, 'Вы вошли.');
    } catch (error) {
      setResult(result, error.message || 'Не удалось войти.');
    } finally {
      setBusy(submit, false);
    }
  });
}

function bindLogout(supabase) {
  logoutButton?.addEventListener('click', async () => {
    setBusy(logoutButton, true);
    await supabase.auth.signOut();
    setBusy(logoutButton, false);
  });
}

async function renderSession(supabase) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    setStatus(error.message);
    return;
  }

  const user = data.session?.user;
  if (!user) {
    setStatus('Вы пока не вошли.');
    if (logoutButton) {
      logoutButton.hidden = true;
    }
    return;
  }

  const name = user.user_metadata?.name || user.email;
  let creditText = '';

  try {
    const profile = await window.mamamAccount.getProfile();
    creditText = profile ? ` На балансе ${window.mamamAccount.formatCredits(profile.credits)}.` : '';
  } catch {
    creditText = '';
  }

  setStatus(`Вы вошли как ${name}.${creditText}`);
  if (logoutButton) {
    logoutButton.hidden = false;
  }
}

function setStatus(message) {
  if (statusNode) {
    statusNode.textContent = message;
  }
}

function setResult(node, message) {
  if (node) {
    node.textContent = message;
  }
}

function setBusy(button, busy) {
  if (button) {
    button.disabled = busy;
  }
}

function disableAuthForms(disabled) {
  document.querySelectorAll('[data-auth-signup] input, [data-auth-signup] select, [data-auth-signup] button, [data-auth-login] input, [data-auth-login] button').forEach((control) => {
    control.disabled = disabled;
  });
}
