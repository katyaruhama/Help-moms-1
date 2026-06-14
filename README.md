# Мамам рядом

Веб-сервис на русском языке для проекта помощи мамам после родов. Главная страница работает как вход в сайт, а ключевые сценарии вынесены на отдельные страницы: заявка для мамы, страница помощника, открытые заявки, донаты, FAQ и AI-анализ. Backend реализован через Vercel Serverless Functions.

## Публичная ссылка

- Сайт: https://help-moms-1.vercel.app/
- Заявка: https://help-moms-1.vercel.app/for-moms.html
- Открытые заявки: https://help-moms-1.vercel.app/requests.html
- AI-анализ: https://help-moms-1.vercel.app/ai-analysis.html

## Что внутри

- `index.html` — главная страница-витрина со ссылками на разделы сайта.
- `for-moms.html` — страница заявки для мамы.
- `for-helpers.html` — страница для помощников.
- `requests.html` — открытые заявки с загрузкой из backend API.
- `donate.html` — страница поддержки проекта.
- `ai-analysis.html` — отдельная страница AI-анализа.
- `faq.html` — вопросы, безопасность и границы.
- `styles/site.css` и `scripts/site.js` — общие стили и JavaScript для внутренних страниц.
- `api/analyze.js` — serverless API для Vercel: Apify -> LLM -> JSON-ответ сайту.
- `api/requests.js` — backend-роут открытых заявок.
- `api/submissions.js` — backend-роут для заявок и откликов.
- `api/support.js` — backend-роут для сообщений о поддержке проекта.
- `.env.example` — пример переменных окружения для Apify, OpenRouter и Google AI Studio.
- `vercel.json` — минимальная конфигурация Vercel.
- Формы отправляют данные на backend API. Постоянное хранение можно подключить через Supabase, Airtable, Google Sheets, Vercel KV или почтовый сервис.
- На главной есть блоки для двух аудиторий, примеры коротких задач, FAQ, донаты и карточки заявок.
- Первый экран и дополнительные спокойные фото хранятся локально в папке `assets`.
- В первом экране есть аккуратный 3D-акцент в типографике, без яркого рекламного эффекта.
- В блоке безопасности подключён спокойный фон на Vanta.js через CDN.

## Переменные окружения

Демо-режим работает без ключей. Для настоящего анализа создайте переменные в Vercel Project Settings -> Environment Variables:

- `APIFY_API_TOKEN` — обязательный токен Apify.
- `OPENROUTER_API_KEY` — нужен, если выбран OpenRouter.
- `GEMINI_API_KEY` — нужен, если выбран Google AI Studio / Gemini API.
- `APIFY_ACTOR_ID` — опционально, по умолчанию `apify/website-content-crawler`.
- `OPENROUTER_MODEL` — опционально, по умолчанию `openai/gpt-4o-mini`.
- `GEMINI_MODEL` — опционально, по умолчанию `gemini-3.5-flash`.
- `PUBLIC_SITE_URL` и `PUBLIC_SITE_NAME` — опциональны для метаданных OpenRouter.

## Локальный запуск

1. Установите Vercel CLI, если его ещё нет: `npm i -g vercel`.
2. Скопируйте `.env.example` в `.env.local` и заполните ключи.
3. Запустите `vercel dev`.
4. Откройте локальный адрес, который покажет CLI.

## Демо-режим

В блоке AI-анализа демо-режим включён по умолчанию. Он показывает пример результата без вызова Apify и LLM. Чтобы запустить настоящий анализ, снимите галочку `Демо-режим` и убедитесь, что ключи добавлены в Vercel.

## Backend

Сейчас backend принимает и валидирует запросы, но не хранит их постоянно:

- `GET /api/requests` — возвращает список открытых заявок.
- `POST /api/submissions` — принимает просьбы мам и отклики помощников.
- `POST /api/support` — принимает сообщения о поддержке проекта.
- `POST /api/analyze` — запускает демо-анализ или реальный Apify + LLM pipeline.

Для реального продакшена следующим шагом нужно подключить хранилище или уведомления: Supabase, Airtable, Google Sheets, Vercel KV, Resend/SendGrid или Telegram-бот.

## Публикация на Vercel

1. Загрузите проект в GitHub/GitLab/Bitbucket.
2. На `https://vercel.com/` создайте новый проект из репозитория.
3. Добавьте переменные окружения из блока выше.
4. Нажмите Deploy. Vercel опубликует HTML-страницы и API-функции из папки `api`.

## Перед публикацией

1. В `index.html` замените `hello@example.com` на реальный email проекта.
2. При необходимости замените примеры заявок на реальные тексты.
3. Подключите backend-роуты к постоянному хранилищу или уведомлениям.
4. Если сайт должен работать полностью офлайн, скачайте CDN-зависимости для Google Fonts, Three.js и Vanta.js в репозиторий и замените внешние ссылки локальными.

## Изображения

Использованы локальные сгенерированные изображения: `assets/hero-soft-home.jpg`, `assets/entry-support.jpg`, `assets/soft-support-photo.jpg`, `assets/help-food.jpg`, `assets/help-cleaning.jpg`, `assets/help-laundry.jpg` и `assets/help-shopping.jpg`. Фото спокойные, без лиц и яркой постановки; они поддерживают тему заботы, но не перегружают страницу.
