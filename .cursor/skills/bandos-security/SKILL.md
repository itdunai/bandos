---
name: bandos-security
description: >-
  Security audit and hardening for BandOS (Next.js + Supabase multi-tenant).
  Use when reviewing auth, RLS, invitations, public RPCs, server actions,
  redirects, or URL/XSS risks in this repository.
---

# BandOS Security

## Stack threat model

- **Client**: anon Supabase key only — service role never reaches the browser.
- **Service role** (`src/lib/supabase/service.ts`): server-only jobs without a user — Telegram webhook, reminder scheduler, booking notifications, audit log. Never use it where a specific user acts (use `createClient` from `lib/supabase/server`).
- **Boundary**: PostgreSQL RLS + `SECURITY DEFINER` RPCs with explicit checks.
- **Tenancy**: `band_id` via `user_band_ids()` / `is_band_admin()` / `member_has_permission()` (all require `is_active`).
- **Public data**: only via RPCs (`get_public_band_page`, `get_public_bands_catalog`, `submit_booking_request`). No anon SELECT policies on tenant tables.

## Audit checklist

### Database (supabase/migrations/)

1. **RLS** (`002_rls.sql`, `012_security_hardening.sql`)
   - `band_members` INSERT: admins only — never `OR user_id = auth.uid()`.
   - `invitations` SELECT: admins only — use `get_invitation_by_token()` for accept flow.
2. **SECURITY DEFINER RPCs** — each must:
   - `SET search_path = public`
   - Verify `auth.uid()` where acting on behalf of user
   - Gate public data (`rider_public`, `repertoire_public`)
3. **Membership paths**: `create_band_with_admin`, `accept_invitation` only. `bands` has no INSERT policy.
4. **Privileged columns** are guarded by triggers, not policies: `profiles.is_platform_admin`, `band_members` role/permissions/is_active (027), `bands` slug/created_by/finance_opening_balance (029).
5. **Service-only tables** (RLS on, no policies): `telegram_link_tokens`, `notification_log`. User-facing changes go through RPCs (`create_telegram_link_token`, `update_telegram_settings`).

### Application

4. **Server actions** (`src/app/actions/`) — use `src/lib/band/assert-access.ts`:
   - `requireBandMember(bandId)` / `requireBandAdmin(bandId)`
   - `requireSetlistMember` / `requireSongMember` / `requireEventMember` / `requireTodoMember` for id-only handlers
   - `tryBandAdmin(bandId)` when the action returns `{ error }` (e.g. `createInvitation`)
   - RLS remains backup; app layer must gate first.
   - **Every export of a `"use server"` file is a public endpoint** with attacker-chosen arguments. Internal helpers live in `src/lib/` (e.g. `lib/band/event-finance.ts`), never in `actions/`.
   - **Bind child ids to the checked parent**: after `requireSetlistMember(setlistId)`, item queries add `.eq("setlist_id", setlistId)`; ids from forms (song, setlist, photo URL) must belong to the same band.
5. **Redirects** — `sanitizeRedirectPath()` in `src/lib/safe-redirect.ts`; reject `//`, schemes, backslashes.
6. **External URLs** — `sanitizeExternalUrl()` in `src/lib/safe-url.ts` on save and render (`href`).
7. **Public routes** — `src/lib/supabase/middleware.ts`: `/`, `/login`, `/register`, `/invite`, `/rider/`, `/repertoire/`, `/privacy`.
   - `src/proxy.ts` matcher excludes `api/health`, `api/telegram`, `api/cron`: those routes authenticate themselves by secret (`TELEGRAM_WEBHOOK_SECRET` header, `Authorization: Bearer CRON_SECRET`, compared with `timingSafeEqual`).
8. **XSS** — React text nodes only; no `dangerouslySetInnerHTML` for user content. Telegram messages use `parse_mode=HTML` → `escapeHtml()` every user value.
9. **Headers** — `next.config.ts`: `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
10. **Secrets in logs** — never send invitation/link tokens to Sentry (`tokenPrefix` only).

## Commands

```bash
npm audit
npm run build
```

## Fix priority

1. Critical: RLS privilege escalation (`band_members` INSERT).
2. High: invitation token leak, open redirects.
3. Medium: RPC caller binding, invite email match, URL allowlist, public RPC field gating.

## Related Cursor tools

- Run **Security Review** subagent on branch/uncommitted diff before releases.
- Reference [Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) for general OWASP patterns; this skill covers BandOS-specific rules.
