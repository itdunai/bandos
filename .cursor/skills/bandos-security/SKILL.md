---
name: bandos-security
description: >-
  Security audit and hardening for BandOS (Next.js + Supabase multi-tenant).
  Use when reviewing auth, RLS, invitations, public RPCs, server actions,
  redirects, or URL/XSS risks in this repository.
---

# BandOS Security

## Stack threat model

- **Client**: anon Supabase key only — no service role in app code.
- **Boundary**: PostgreSQL RLS + `SECURITY DEFINER` RPCs with explicit checks.
- **Tenancy**: `band_id` via `user_band_ids()` / `is_band_admin()`.

## Audit checklist

### Database (supabase/migrations/)

1. **RLS** (`002_rls.sql`, `012_security_hardening.sql`)
   - `band_members` INSERT: admins only — never `OR user_id = auth.uid()`.
   - `invitations` SELECT: admins only — use `get_invitation_by_token()` for accept flow.
2. **SECURITY DEFINER RPCs** — each must:
   - `SET search_path = public`
   - Verify `auth.uid()` where acting on behalf of user
   - Gate public data (`rider_public`, `repertoire_public`)
3. **Membership paths**: `create_band_with_admin`, `accept_invitation` only.

### Application

4. **Server actions** (`src/app/actions/`) — use `src/lib/band/assert-access.ts`:
   - `requireBandMember(bandId)` / `requireBandAdmin(bandId)`
   - `requireSetlistMember` / `requireSongMember` / `requireEventMember` / `requireTodoMember` for id-only handlers
   - `tryBandAdmin(bandId)` when the action returns `{ error }` (e.g. `createInvitation`)
   - RLS remains backup; app layer must gate first.
5. **Redirects** — `sanitizeRedirectPath()` in `src/lib/safe-redirect.ts`; reject `//`, schemes, backslashes.
6. **External URLs** — `sanitizeExternalUrl()` in `src/lib/safe-url.ts` on save and render (`href`).
7. **Public routes** — `src/lib/supabase/middleware.ts`: `/`, `/login`, `/register`, `/invite`, `/rider/`, `/repertoire/`.
8. **XSS** — React text nodes only; no `dangerouslySetInnerHTML` for user content.

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
