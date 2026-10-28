# Почта: SMTP и шаблоны писем

Встроенная почта Supabase — только для разработки: несколько писем в час и
часто попадает в спам. Перед приглашением пользователей подключите свой SMTP.

## 1. SMTP-провайдер

Подойдёт любой с SMTP: [Resend](https://resend.com), [Postmark](https://postmarkapp.com),
[Unisender Go](https://www.unisender.com/ru/products/go/), Яндекс 360 для бизнеса.

1. Зарегистрируйтесь у провайдера и **подтвердите домен** (DNS-записи SPF, DKIM;
   желательно DMARC `v=DMARC1; p=none`). Без этого письма уйдут в спам.
2. Создайте адрес отправителя, например `noreply@<ваш-домен>`.
3. Supabase → **Authentication → Emails → SMTP Settings** → Enable custom SMTP:
   - Sender email: `noreply@<ваш-домен>`
   - Sender name: `BandOS`
   - Host / Port / Username / Password — из кабинета провайдера
4. Supabase → **Authentication → Rate Limits** → «Rate limit for sending emails»
   поднимите до 30–100 в час (после подключения SMTP поле становится доступным).

## 2. URL Configuration

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://<ваш-домен>`
- **Redirect URLs**: `https://<ваш-домен>/auth/callback**`

Звёздочки обязательны: приложение передаёт `?next=…` (например, путь приглашения).
Если адреса нет в списке, Supabase подставит Site URL и ссылка из письма сломается.

## 3. Шаблоны писем

Supabase → **Authentication → Emails → Templates**. Ссылки строятся через
`token_hash` — так они работают, даже если письмо открыли на другом устройстве
(стандартные `{{ .ConfirmationURL }}` работают только в том же браузере).

`{{ .RedirectTo }}` уже содержит `/auth/callback?next=…`, поэтому параметры
дописываются через `&`.

### Confirm signup

Subject: `Подтвердите email в BandOS`

```html
<h2>Добро пожаловать в BandOS!</h2>
<p>Подтвердите email, чтобы войти в аккаунт:</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Подтвердить email</a></p>
<p style="color:#888;font-size:12px">Если вы не регистрировались в BandOS — просто проигнорируйте письмо.</p>
```

### Reset password

Subject: `Смена пароля в BandOS`

```html
<h2>Смена пароля</h2>
<p>Кто-то (надеемся, вы) запросил смену пароля для аккаунта BandOS.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Задать новый пароль</a></p>
<p style="color:#888;font-size:12px">Ссылка действует 1 час. Если вы не запрашивали смену пароля — проигнорируйте письмо, пароль не изменится.</p>
```

### Change email address

Subject: `Подтвердите новый email в BandOS`

```html
<h2>Смена email</h2>
<p>Подтвердите смену email с {{ .Email }} на {{ .NewEmail }}:</p>
<p><a href="{{ .SiteURL }}/auth/callback?next=/account&token_hash={{ .TokenHash }}&type=email_change">Подтвердить</a></p>
```

### Magic link

Сейчас не используется. Если включите:

```html
<p><a href="{{ .SiteURL }}/auth/callback?next=/&token_hash={{ .TokenHash }}&type=magiclink">Войти в BandOS</a></p>
```

## 4. Проверка

1. Зарегистрируйте тестовый аккаунт на Gmail, Яндексе и Mail.ru — письмо должно
   прийти во «Входящие», не в «Спам».
2. Откройте ссылку подтверждения **на телефоне** (не в том браузере, где
   регистрировались) — должен произойти вход.
3. `/login` → «Забыли пароль?» → письмо → новый пароль → вход.
4. Регистрация по ссылке-приглашению → после подтверждения открывается приглашение.
5. Удалите тестовые аккаунты: `/account` → «Удаление аккаунта».
