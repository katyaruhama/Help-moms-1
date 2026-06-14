const requestKindLabels = {
  food: 'еда',
  cleaning: 'уборка',
  shopping: 'покупки',
  laundry: 'стирка'
};

document.querySelectorAll('[data-api-form]').forEach((form) => {
  const requestId = new URLSearchParams(window.location.search).get('request');
  const responseMessage = form.querySelector('textarea[name="message"]');

  if (requestId && form.querySelector('[name="type"][value="response"]') && responseMessage && !responseMessage.value) {
    responseMessage.value = `Откликаюсь на заявку: ${requestId}. `;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = form.querySelector('[data-form-result]');
    const submit = form.querySelector('[type="submit"]');
    const endpoint = form.dataset.apiForm;
    const payload = Object.fromEntries(new FormData(form).entries());

    if (submit) {
      submit.disabled = true;
    }
    if (result) {
      result.textContent = 'Отправляем...';
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось отправить форму.');
      }

      form.reset();
      if (result) {
        result.textContent = data.message || 'Готово. Координатор увидит заявку.';
      }
    } catch (error) {
      if (result) {
        result.textContent = error.message;
      }
    } finally {
      if (submit) {
        submit.disabled = false;
      }
    }
  });
});

document.querySelectorAll('[data-requests-list]').forEach(async (list) => {
  try {
    const response = await fetch('/api/requests');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось загрузить заявки.');
    }

    list.innerHTML = '';
    data.requests.forEach((request) => {
      const card = document.createElement('article');
      card.className = 'card request-card';
      card.dataset.kind = request.kind;
      card.innerHTML = `
        <div>
          <span class="tag">${requestKindLabels[request.kind] || request.kind}</span>
          <h3>${escapeHtml(request.title)}</h3>
          <div class="request-meta">${escapeHtml(request.meta)}</div>
        </div>
        <p>${escapeHtml(request.description)}</p>
        <div class="pill-row">
          <span class="pill">${escapeHtml(request.place)}</span>
          <span class="pill">${escapeHtml(request.time)}</span>
          <span class="pill">${escapeHtml(request.duration)}</span>
        </div>
        <a class="button button-green" href="requests.html?request=${encodeURIComponent(request.id)}#respond">Откликнуться</a>
      `;
      list.appendChild(card);
    });
  } catch (error) {
    list.innerHTML = `<div class="page-note">${escapeHtml(error.message)}</div>`;
  }
});

const analyzerForm = document.querySelector('[data-analyzer-form]');

if (analyzerForm) {
  const result = document.querySelector('[data-analysis-result]');
  const meta = document.querySelector('[data-analysis-meta]');

  analyzerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submit = analyzerForm.querySelector('[type="submit"]');
    const payload = Object.fromEntries(new FormData(analyzerForm).entries());
    payload.maxPages = Number(payload.maxPages || 1);
    payload.demoMode = payload.demoMode === 'on';

    if (submit) {
      submit.disabled = true;
    }
    result.textContent = payload.demoMode
      ? 'Готовим демо-анализ...'
      : 'Запускаем Apify и LLM...';
    meta.textContent = '';

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось выполнить анализ.');
      }

      result.textContent = data.analysis;
      meta.textContent = data.demoMode
        ? 'Режим: демо'
        : `Провайдер: ${data.provider}. Модель: ${data.model}. Страниц: ${data.itemCount}.`;
    } catch (error) {
      result.textContent = error.message;
    } finally {
      if (submit) {
        submit.disabled = false;
      }
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
