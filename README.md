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

## E2E-тесты

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
5. **PWA:** в Chrome → «Установить приложение»; режим «Играем» кэшируется для повторного открытия.

## PWA

На телефоне: «Добавить на главный экран». Service worker кэширует посещённые страницы `/play` для базового офлайн-доступа.

## Демо-данные

После регистрации скопируйте `band_id` и раскомментируйте блок в `supabase/migrations/003_seed_demo.sql`.

## Прототип

Визуальный референс: `bandos_prototype.html`
