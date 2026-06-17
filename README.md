# Мамам рядом

Веб-сервис на русском языке для проекта помощи мамам после родов. Главная страница работает как вход в сайт, а ключевые сценарии вынесены на отдельные страницы: заявка для мамы, страница помощника, открытые заявки, донаты, FAQ, AI-анализ, материалы и регистрация. Backend реализован через Vercel Serverless Functions.

## Публичная ссылка

- Сайт: https://help-moms-1.vercel.app/
- Заявка: https://help-moms-1.vercel.app/for-moms.html
- Открытые заявки: https://help-moms-1.vercel.app/requests.html
- AI-анализ: https://help-moms-1.vercel.app/ai-analysis.html
- Материалы: https://help-moms-1.vercel.app/materials.html
- Регистрация: https://help-moms-1.vercel.app/auth.html

## Что внутри

- `index.html` — главная страница-витрина со ссылками на разделы сайта.
- `for-moms.html` — страница заявки для мамы.
- `for-helpers.html` — страница для помощников.
- `requests.html` — открытые заявки с загрузкой из backend API.
- `donate.html` — страница поддержки проекта.
- `ai-analysis.html` — отдельная страница AI-анализа сайтов, публичных страниц и каналов о волонтёрстве и помощи мамам.
- `materials.html` — подборка полезных видео и материалов плюс AI-разбор видео через Supadata и LLM.
- `auth.html` — регистрация, вход и выход пользователей через Supabase Auth.
- `faq.html` — вопросы, безопасность и границы.
- `article-boundaries.html`, `article-small-help.html`, `article-normal-support.html` — короткие вдохновляющие статьи, на которые ведут фотографии на главной.
- `styles/site.css` и `scripts/site.js` — общие стили и JavaScript для внутренних страниц.
- `styles/soft-motion.css` и `scripts/soft-motion.js` — бережные анимации с пользовательским переключателем: появление блоков при скролле, дыхание логотипа и мягкий shimmer на тэги.
- `api/analyze.js` — serverless API для Vercel: Apify -> LLM -> JSON-ответ сайту.
- `api/requests.js` — backend-роут открытых заявок.
- `api/submissions.js` — backend-роут для заявок и откликов.
- `api/support.js` — backend-роут для сообщений о поддержке проекта.
- `api/materials.js` — backend-роут материалов: демо-библиотека и разбор публичных видео через Supadata + OpenRouter.
- `api/config.js` — отдаёт публичную конфигурацию Supabase для браузера.
- `api/_supabase.js` — серверная проверка Supabase-сессии и списание кредитов через service role key.
- `scripts/account.js` — клиентский помощник Supabase: сессия, access token, профиль и показ баланса кредитов.
- `tests/` — тесты API и ключевых HTML/JS возможностей на встроенном `node:test`.
- `.env.example` — пример переменных окружения для Apify, OpenRouter, Google AI Studio, Supadata и Supabase.
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
- `SUPADATA_API_KEY` — нужен для реального разбора публичных видео и постов на странице материалов.
- `SUPABASE_URL` — URL проекта Supabase.
- `SUPABASE_ANON_KEY` — публичный anon key Supabase для регистрации и входа.
- `SUPABASE_SERVICE_ROLE_KEY` — приватный ключ Supabase только для backend API на Vercel. Нельзя добавлять в GitHub или клиентский JavaScript.
- `APIFY_ACTOR_ID` — опционально, по умолчанию `apify/website-content-crawler`.
- `OPENROUTER_MODEL` — опционально, по умолчанию `openai/gpt-4o-mini`.
- `GEMINI_MODEL` — опционально, по умолчанию `gemini-3.5-flash`.
- `PUBLIC_SITE_URL` и `PUBLIC_SITE_NAME` — опциональны для метаданных OpenRouter.

## Локальный запуск

1. Установите Vercel CLI, если его ещё нет: `npm i -g vercel`.
2. Скопируйте `.env.example` в `.env.local` и заполните ключи.
3. Запустите `vercel dev`.
4. Откройте локальный адрес, который покажет CLI.

## Тесты

Запуск:

```bash
npm test
```

Тесты проверяют демо-режимы API, валидацию форм, публичную конфигурацию Supabase, наличие страницы регистрации и основные точки входа на сайте.

Отдельные security-проверки смотрят, что:

- API отвечает с базовыми защитными заголовками.
- Неподдерживаемые HTTP-методы отклоняются.
- Некорректные URL не проходят в AI/Supadata API.
- Открытые заявки не содержат контактов и точных адресов.
- Публичные файлы не содержат реальные API-токены.
- Клиентский рендеринг экранирует значения, пришедшие из API.

## Демо-режим

В блоке AI-анализа демо-режим включён по умолчанию. Он показывает пример результата без вызова Apify и LLM. Чтобы запустить настоящий анализ, снимите галочку `Демо-режим` и убедитесь, что ключи добавлены в Vercel.

По умолчанию используется Apify Website Content Crawler, он подходит для обычных сайтов и доступных публичных страниц. Для отдельных соцсетей или каналов можно заменить `APIFY_ACTOR_ID` на профильный actor из Apify, если у платформы другой формат входных данных или ограничения доступа.

## Supabase Auth

Страница `auth.html` использует Supabase Auth для регистрации, входа и выхода пользователей.

Чтобы включить регистрацию:

1. Используйте Supabase project `Project 1` в организации `katyaruhama`.
2. В Vercel добавьте `SUPABASE_URL`, `SUPABASE_ANON_KEY` и `SUPABASE_SERVICE_ROLE_KEY`.
3. В Supabase Auth settings включите email/password signups и выключите обязательное подтверждение email.
4. В Supabase Auth settings добавьте URL сайта в разрешённые redirect URLs, например `https://help-moms-1.vercel.app/auth.html`.
5. Не добавляйте `SUPABASE_SERVICE_ROLE_KEY` на клиент и не публикуйте его в GitHub. Для браузера используется только публичный anon key.

После регистрации триггер Supabase создаёт профиль пользователя и начисляет 5 кредитов. Демо-режимы не списывают кредиты. Реальный AI-анализ сайта или видео списывает 1 кредит через backend API.

## Supabase Database

В проекте `Project 1` применены миграции `create_profiles_and_credit_ledger`, `tighten_function_execute_privileges` и `remove_profile_rpc_and_fix_search_path`.

- `public.profiles` — профиль пользователя, роль и текущий баланс кредитов.
- `public.credit_ledger` — история начислений и списаний.
- `public.handle_new_user()` — триггер после создания `auth.users`, начисляет 5 стартовых кредитов.
- `public.consume_user_credit()` — защищённая server-only RPC-функция для списания 1 кредита.

RLS включён. Пользователь видит только свой профиль и свою историю кредитов. Из браузера нельзя обновить `credits` напрямую.

## Backend

Сейчас backend принимает и валидирует запросы, но не хранит их постоянно:

- `GET /api/requests` — возвращает список открытых заявок.
- `POST /api/submissions` — принимает просьбы мам и отклики помощников.
- `POST /api/support` — принимает сообщения о поддержке проекта.
- `POST /api/analyze` — запускает демо-анализ или реальный Apify + LLM pipeline.
- `GET /api/materials` — возвращает демо-библиотеку материалов.
- `POST /api/materials` — запускает демо-разбор или реальный Supadata transcript + OpenRouter анализ.
- `GET /api/config` — возвращает публичные `SUPABASE_URL` и `SUPABASE_ANON_KEY` для клиентской авторизации.

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
