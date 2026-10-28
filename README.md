# BandOS

Единое пространство для музыкальной группы: треки, сет-листы, график, список дел и режим **ИГРАЕМ**.

Публичный каталог групп на главной `/` — для заказчиков (профиль, репертуар, техрайдер).

## Стек

- **Next.js 16** (App Router, `proxy.ts`)
- **Supabase** (PostgreSQL, Auth, RLS)
- **Tailwind CSS 4**
- **Playwright** (E2E)

## Быстрый старт

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. В SQL Editor выполните миграции **по порядку**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/004_slug_transliterate.sql`
   - `supabase/migrations/005_song_source_url.sql`
   - `supabase/migrations/006_todos_details.sql`
   - `supabase/migrations/007_band_profile.sql`
   - `supabase/migrations/008_repertoire_public.sql`
   - `supabase/migrations/009_song_time_signature.sql`
   - `supabase/migrations/010_public_bands_catalog.sql`
   - `supabase/migrations/011_unified_public_band.sql`
   - `supabase/migrations/012_security_hardening.sql`
   - `supabase/migrations/013_member_permissions.sql`
   - `supabase/migrations/014_finances.sql`
   - `supabase/migrations/015_finances_view_permission.sql`
   - `supabase/migrations/016_band_media.sql` — лого/фото группы, публичная страница
   - `supabase/migrations/017_administrator_preset.sql` — пресет «Администратор»
   - `supabase/migrations/019_band_city.sql` — поле «Город» группы
   - `supabase/migrations/020_restore_band_media_storage.sql` — **обязательно**: bucket `band-media` для лого/фото/аватаров
   - `supabase/migrations/021_platform_admin.sql` — панель `/admin` (статистика, журнал)
   - `supabase/migrations/022_site_pages.sql` — политика конфиденциальности (`/privacy`, редактирование в `/admin/privacy`)
   - `supabase/migrations/023_releases.sql`
   - `supabase/migrations/024_public_releases.sql`
   - `supabase/migrations/025_band_contacts.sql`
   - `supabase/migrations/026_event_other_rent.sql`
   - `supabase/migrations/027_privilege_escalation_guards.sql` — **обязательно**: запрет самоназначения прав (platform admin, роль/права в группе)
3. **Authentication → Providers → Email** — включите Email
4. Для локальной разработки отключите «Confirm email» (или подтверждайте вручную)
5. **Authentication → URL Configuration**:
   - Site URL: `http://bandos.loc`
   - Redirect URLs: `http://bandos.loc/auth/callback`

### 2. Переменные окружения

```bash
cp .env.local.example .env.local
```

Заполните `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.

Опционально для мониторинга ошибок:

- `SENTRY_DSN` — серверные ошибки (server actions, API, SSR)
- `NEXT_PUBLIC_SENTRY_DSN` — клиентские ошибки (браузер)

В production приложение валидирует env при старте (fail-fast). Если обязательные переменные не заданы, сервер вернёт явную ошибку конфигурации вместо «тихих» сбоев.

Картинки (лого, фото группы, аватары) загружаются **через сервер** в Supabase Storage (bucket `band-media`). После деплоя на Timeweb файлы не пропадают. Старые URL вида `/media/...` нужно перезагрузить.

### Платформенная админка

Для владельца проекта (не путать с админом группы):

```env
PLATFORM_ADMIN_EMAILS=your@email.com
```

Опционально `SUPABASE_SERVICE_ROLE_KEY` — для автовыдачи флага в БД с страницы `/admin`.

1. Примените миграции `021_platform_admin.sql` и `022_site_pages.sql`
2. Откройте `/admin` под своим аккаунтом
3. Если статистика пустая — выполните SQL из подсказки на странице или нажмите «Выдать права в БД»
4. Политика конфиденциальности: публичная страница `/privacy`, редактирование `/admin/privacy`. В шаблоне замените данные в `[квадратных скобках]` на реквизиты оператора.

**Если `/admin` отдаёт 404 на Timeweb:**

- 404 — это «маршрут не найден», а не «нет доступа» (без прав будет редирект на `/` или `/login`).
- Убедитесь, что задеплоен коммит с `src/app/admin/` (после `928edbf`). Пересоберите образ **без кэша**.
- Проверьте версию: `GET /api/health` должен вернуть `"features":{"platformAdmin":true}`. Если поля нет — на сервере старая сборка.
- `PLATFORM_ADMIN_EMAILS` задаётся в **runtime** переменных контейнера (не только при сборке), email должен совпадать с аккаунтом входа.

### Telegram-уведомления и заявки

Бот присылает напоминания о репетициях и концертах (за сутки), о сроках по делам (в 9:00 по времени участника) и новые заявки «Заказать выступление». Участник подключает бота сам: «Участники» → «Мой профиль» → «Подключить Telegram».

1. Примените миграцию `028_telegram_and_bookings.sql`.
2. Задайте **runtime**-переменные контейнера:

```env
TELEGRAM_BOT_TOKEN=...            # от @BotFather
TELEGRAM_WEBHOOK_SECRET=...       # 16+ символов: A-Z a-z 0-9 _ -
CRON_SECRET=...                   # 16+ символов, для служебных маршрутов
SUPABASE_SERVICE_ROLE_KEY=...     # webhook и рассылка работают без пользователя
# TELEGRAM_BOT_USERNAME=bandosfunapp   # необязательно, иначе берётся из getMe
# TELEGRAM_SCHEDULER=off               # выключить встроенный таймер рассылки
# TELEGRAM_API_BASE=https://...        # прокси Bot API, если api.telegram.org недоступен с хостинга
```

3. После деплоя один раз зарегистрируйте webhook и команды бота:

```bash
curl -X POST https://<домен>/api/telegram/setup -H "Authorization: Bearer <CRON_SECRET>"
```

Диагностика связи сервера с Telegram (доступен ли Bot API, время ответа, ошибки webhook):

```bash
curl -X POST https://<домен>/api/telegram/diag -H "Authorization: Bearer <CRON_SECRET>"
```

Рассылку запускает сам сервер — раз в 10 минут (`src/lib/telegram/scheduler.ts`), внешний cron не нужен. Повторные запуски безопасны: отправленное фиксируется в `notification_log`. Для ручного запуска: `POST /api/cron/reminders` с тем же заголовком.

Приём заявок включается в профиле группы («Заявки на выступления»); заявки видят админы и участники с правом «Профиль группы» — раздел «Заявки».

### Проверка версии деплоя

Чтобы быстро понимать, какой коммит реально работает на сервере:

1. Перед сборкой передавайте `BUILD_SHA` (например, короткий hash коммита).
2. Проверяйте `GET /api/health` — в ответе будет `build.sha`.

Пример:

```json
{
  "ok": true,
  "build": { "sha": "928edbf", "nodeEnv": "production" },
  "features": { "platformAdmin": true }
}
```

### Sentry (ошибки и мониторинг)

Если добавляете Sentry в прод:

1. Укажите `SENTRY_DSN` и `NEXT_PUBLIC_SENTRY_DSN` в runtime переменных.
2. Для Docker build пробросьте `NEXT_PUBLIC_SENTRY_DSN` и `BUILD_SHA`.
3. После деплоя проверьте, что ошибки приходят с тегом `build_sha`.

### Кеш публичных страниц (ISR)

Публичные маршруты кешируются на 60 секунд:

- `/` — каталог групп (персональные блоки для авторизованных подгружаются отдельно)
- `/rider/[slug]`, `/repertoire/[slug]` — публичная страница группы

При изменении профиля, медиа или публичности репертуара кеш сбрасывается через `revalidateTag`.

### 3. Запуск

```bash
npm install
npm run dev
```

Откройте [http://bandos.loc](http://bandos.loc) или `http://localhost:3000`.

### 4. Первый вход

**Основатель группы:**
1. `/register` — регистрация аккаунта
2. `/new-band` — создание группы
3. Главная группы: `/{slug}` — профиль, ближайшее событие
4. `/members` — пригласите участников по ссылке

**Приглашённый участник:**
1. Открыть `/invite/{token}`
2. «Регистрация» → `/invite/{token}/join` (без создания новой группы)
3. Или «Войти», если аккаунт уже есть

**Несколько групп:** переключатель в шапке (десктоп — сайдбар, мобилка — под логотипом).

**Заказчик:** главная `/` — каталог групп с публичным профилем или репертуаром.

## Разделы

| Маршрут | Описание |
|---------|----------|
| `/` | Каталог групп (публичный) |
| `/{slug}` | Главная группы (профиль + ближайшее событие) |
| `/{slug}/todos` | Список дел |
| `/{slug}/songs` | Треки |
| `/{slug}/setlists` | Сет-листы (с длительностью) |
| `/{slug}/schedule` | График |
| `/{slug}/finances` | Финансы (баланс, доходы, расходы) |
| `/{slug}/play` | ИГРАЕМ |
| `/{slug}/metronome` | Метроном |
| `/rider/{slug}` | Публичная страница (профиль, райдер, репертуар) |
| `/repertoire/{slug}` | То же (старые ссылки) |

## Тесты

### Unit (Vitest)

```bash
npm run test
```

Покрытие критичной логики без БД: права участников, расчёт финансов, безопасность путей загрузки.

### E2E (Playwright)

```bash
npx playwright install chromium
E2E_EMAIL=user@example.com E2E_PASSWORD=secret E2E_BAND_SLUG=gorizont npm run test:e2e
```

Сценарии:
- `e2e/band-flow.spec.ts` — логин → трек → сет-лист → «Играем»
- `e2e/finances.spec.ts` — логин → добавить расход (нужен admin)
- `e2e/auth-navigation.spec.ts` — логин → создание группы, переключатель

## Smoke-тест после миграций

1. **Безопасность (012):** нельзя вступить в чужую группу как admin через API; invite только по токену.
2. **Права (013):** музыкант не редактирует треки; менеджер — график и дела.
3. **Финансы (014–015):** admin задаёт баланс, добавляет расход; менеджер видит, музыкант — нет (без права `finances`).
4. **Гонорар:** концерт с fee → «Учесть в финансах» на форме или в графике.
5. **Медиа (016 + 020):** загрузка лого/фото на `/{slug}?edit=1`, аватар в `/members`; URL из Supabase Storage. После миграции 020 перезагрузите старые картинки.
6. **Администратор (017):** пресет с полными правами (кроме роли создателя).
7. **PWA:** в Chrome → «Установить приложение»; режим «Играем» кэшируется для повторного открытия.

## PWA

На телефоне: «Добавить на главный экран». Service worker кэширует посещённые страницы `/play` для базового офлайн-доступа.

**Офлайн «Играем»:** откройте сет-лист онлайн хотя бы раз — данные сохранятся в браузере. Без сети: `/{slug}/play/offline` → выберите сохранённый сет-лист. В режиме игры отображается статус сети и время последнего сохранения.

## Демо-данные

После регистрации скопируйте `band_id` и раскомментируйте блок в `supabase/migrations/003_seed_demo.sql`.

## Прототип

Визуальный референс: `bandos_prototype.html`
