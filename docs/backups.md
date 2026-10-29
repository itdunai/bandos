# Резервные копии без платного тарифа Supabase

На бесплатном тарифе Supabase не хранит бекапы. Копии делает сам сервер BandOS:
`pg_dump` → файл. Два способа, оба в **/admin → Система → Резервные копии**:

- **Автоматически раз в сутки** — зашифрованная копия приходит админам платформы
  в Telegram (лежит вне сервера и вне Supabase; лимит Telegram — 50 МБ).
- **Вручную** — «Скачать копию сейчас» (незашифрованный `.dump` по HTTPS) или
  «Отправить копию в Telegram».

В копии схемы `public` (все данные приложения), `auth` (аккаунты, хеши паролей)
и `storage` (записи о файлах). **Сами файлы** (лого, фото, аватары в бакете
`band-media`) не входят — их при необходимости скачивают из Supabase → Storage.

## Настройка

Runtime-переменные контейнера:

```env
# Supabase → Connect → «Session pooler» (IPv4). Пароль — пароль БД проекта.
SUPABASE_DB_URL=postgresql://postgres.<ref>:<пароль>@aws-0-<регион>.pooler.supabase.com:5432/postgres
# Пароль шифрования копий для Telegram, от 12 символов. Сохраните его отдельно
# (менеджер паролей): без него копию не расшифровать.
BACKUP_PASSPHRASE=...
# BACKUP_SCHEMAS=public,auth,storage   # по умолчанию; если pg_dump ругается на права — оставьте public
# BACKUP_SCHEDULER=off                 # выключить автокопию
```

Ещё нужно: Telegram-бот настроен, у вашего аккаунта (админа платформы) подключён
Telegram («Аккаунт» → «Подключить Telegram»). `pg_dump` ставится в Docker-образ
(см. `Dockerfile`), после деплоя в админке должно быть «pg_dump (PostgreSQL) 17.x».

Проверка: «Отправить копию в Telegram» → файл `bandos-ГГГГ-ММ-ДД-ЧЧММ.dump.enc`
в чате с ботом; в журнале событий — `backup.created`. Ошибки — `backup.failed`
(текст в журнале и Sentry).

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
