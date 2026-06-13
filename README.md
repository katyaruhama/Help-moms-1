# Мамам рядом

Веб-сервис на русском языке для проекта помощи мамам после родов. Внутри есть лендинг, форма заявки и блок AI-анализа: сайт умеет показывать демо-результат без платных API, а в реальном режиме делает запрос к Apify Website Content Crawler, отправляет текст страницы в LLM через OpenRouter или Google AI Studio и показывает результат на странице.

## Публичная ссылка

- Сайт: https://help-moms-1.vercel.app/
- Форма: https://help-moms-1.vercel.app/#form
- AI-анализ: https://help-moms-1.vercel.app/#ai-analysis

## Что внутри

- `index.html` — готовая страница со стилями и небольшим JavaScript.
- `api/analyze.js` — serverless API для Vercel: Apify -> LLM -> JSON-ответ сайту.
- `.env.example` — пример переменных окружения для Apify, OpenRouter и Google AI Studio.
- `vercel.json` — минимальная конфигурация Vercel.
- Форма открывает черновик письма через `mailto`.
- На странице есть блоки для двух аудиторий, примеры коротких задач, FAQ и карточки заявок с кнопками отклика.
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

## Публикация на Vercel

1. Загрузите проект в GitHub/GitLab/Bitbucket.
2. На `https://vercel.com/` создайте новый проект из репозитория.
3. Добавьте переменные окружения из блока выше.
4. Нажмите Deploy. Vercel сам опубликует статический `index.html` и API-функцию `/api/analyze`.

## Перед публикацией

1. В `index.html` замените `hello@example.com` на реальный email проекта.
2. При необходимости замените примеры заявок на реальные тексты.
3. Для полноценного сервиса подключите форму заявки к Google Forms, Airtable, Supabase, Firebase или собственному backend.
4. Если сайт должен работать полностью офлайн, скачайте CDN-зависимости для Google Fonts, Three.js и Vanta.js в репозиторий и замените внешние ссылки локальными.

## Изображения

Использованы локальные сгенерированные изображения: `assets/hero-soft-home.jpg`, `assets/entry-support.jpg`, `assets/soft-support-photo.jpg`, `assets/help-food.jpg`, `assets/help-cleaning.jpg`, `assets/help-laundry.jpg` и `assets/help-shopping.jpg`. Фото спокойные, без лиц и яркой постановки; они поддерживают тему заботы, но не перегружают страницу.
