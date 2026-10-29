# Резервные копии без платного тарифа Supabase

На бесплатном тарифе Supabase не хранит бекапы. Копию снимает `pg_dump`,
шифрует паролем и отправляет **админам платформы в Telegram** (лежит вне
хостинга и вне Supabase; лимит Telegram — 50 МБ). Статус — в
**/admin → Система → Резервные копии**.

Два способа — работает тот, что доступен:

| | GitHub Actions (основной) | Сервер приложения |
|---|---|---|
| Когда | хостинг собирает не по `Dockerfile` (нет `pg_dump`) | образ собран из `Dockerfile` |
| Расписание | ежедневно 03:00 МСК + кнопка «Run workflow» | раз в сутки + кнопки в админке |
| Ещё копия | артефакт запуска на 14 дней | «Скачать копию сейчас» |

В копии схемы `public` (все данные приложения), `auth` (аккаунты, хеши паролей)
и `storage` (записи о файлах). **Сами файлы** (лого, фото, аватары в бакете
`band-media`) не входят — их при необходимости скачивают из Supabase → Storage.

## Строка подключения к БД

Supabase → кнопка **Connect** в шапке проекта (или
`https://supabase.com/dashboard/project/<ref>?showConnect=true`) →
Connection String → Method **Session pooler** (порт 5432, пользователь
`postgres.<ref>`). Вместо `[YOUR-PASSWORD]` — пароль БД (Project Settings →
Database → Reset database password). Символы `@ : / ? # %` в пароле кодируются
(`@` → `%40`) — проще задать пароль из букв и цифр.

## Способ 1. GitHub Actions

Workflow `.github/workflows/db-backup.yml`. GitHub → репозиторий → **Settings →
Secrets and variables → Actions → New repository secret**:

| Секрет | Значение |
|---|---|
| `SUPABASE_DB_URL` | строка Session pooler (см. выше) |
| `BACKUP_PASSPHRASE` | пароль шифрования, от 12 символов. **Сохраните отдельно** — без него копию не расшифровать |
| `TELEGRAM_BOT_TOKEN` | токен бота BandOS (тот же, что на сервере) |
| `SITE_URL` | `https://<ваш-домен>` — чтобы в админке была видна последняя копия |
| `CRON_SECRET` | тот же, что в переменных сервера |

Получатели — админы платформы, у которых подключён Telegram («Аккаунт» →
«Подключить Telegram»); чаты workflow берёт из БД.

Проверка: GitHub → **Actions → DB backup → Run workflow**. Через 1–2 минуты в
Telegram придёт `bandos-ГГГГ-ММ-ДД-ЧЧММ.dump.enc`, в админке обновится
«Последняя копия». Если `pg_dump` ругается на права — переменная репозитория
(вкладка Variables) `BACKUP_SCHEMAS=public`.

## Способ 2. Сервер приложения

Нужен образ из `Dockerfile` (в нём ставится `pg_dump` 17) и runtime-переменные:

```env
SUPABASE_DB_URL=postgresql://postgres.<ref>:<пароль>@aws-0-<регион>.pooler.supabase.com:5432/postgres
BACKUP_PASSPHRASE=...
# BACKUP_SCHEMAS=public,auth,storage   # по умолчанию
# BACKUP_SCHEDULER=off                 # выключить автокопию с сервера
# PG_DUMP_PATH=/путь/к/pg_dump         # если стоит в нестандартном месте
```

В админке появятся «Скачать копию сейчас» и «Отправить копию в Telegram».
Результаты — в журнале событий: `backup.created` / `backup.failed`.

## Восстановление

Понадобятся `pg_restore` 17 (PostgreSQL client) и Node.js.

1. Расшифровать копию из Telegram:

   ```bash
   BACKUP_PASSPHRASE='…' node scripts/decrypt-backup.mjs bandos-2026-10-29-0305.dump.enc
   ```

2. Посмотреть содержимое (без восстановления):

   ```bash
   pg_restore --list bandos-2026-10-29-0305.dump | head
   ```

3. **Вернуть данные в новый (чистый) проект Supabase:**
   1. Создать проект, применить миграции `supabase/migrations/*` по порядку (схема).
   2. Залить данные — аккаунты, затем данные приложения:

      ```bash
      export DB="postgresql://postgres.<ref>:<пароль>@…pooler.supabase.com:5432/postgres"
      pg_restore --data-only --no-owner --schema=auth   --disable-triggers -d "$DB" bandos.dump
      pg_restore --data-only --no-owner --schema=public --disable-triggers -d "$DB" bandos.dump
      ```

      Если `--disable-triggers` не разрешён (не суперпользователь), выполните
      восстановление внутри сессии с `SET session_replication_role = replica;`
      (через `psql` и `pg_restore -f -`), либо без флага — тогда возможны
      ошибки порядка внешних ключей, повторите шаг ещё раз.
   3. Обновить переменные приложения (URL, ключи нового проекта) и Redirect URLs.

4. **Вернуть одну таблицу / отдельные строки** (ошибка в данных, случайное удаление):
   восстановите копию в локальный Postgres (`docker run postgres:17`, затем
   `pg_restore -d …`), найдите нужные строки и перенесите их SQL-запросом.

Проверяйте восстановление хотя бы раз заранее — копия, которую не пробовали
поднять, считается непроверенной.
