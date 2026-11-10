# Sarvam hackathon admin setup

The existing TanStack Start / Supabase app now has `/admin/submissions`, `/admin/teams`, and `/admin/announcements`. The admin console links to them. The public `/announcements` feed combines club posts and Sarvam event announcements, with pinned items first.

## Configure Vercel

Under **Project → Settings → Environment Variables**, set these for the deployment environment, then redeploy:

- `ADMIN_EMAILS`: comma-separated additional admin addresses. Matching is case-insensitive. `neal.kottilingal.in@gmail.com` is already included in `src/lib/admin-emails.ts`; add another fallback address on its own line there if preferred. The environment list is combined with the fallback list.
- `RESEND_API_KEY`: existing Resend API key, server only.
- `FROM_EMAIL`: a verified Resend sender, for example `Vertex Club <events@your-domain.example>`. The existing `EVENTS_FROM_EMAIL` is accepted when `FROM_EMAIL` is unset.
- `EVENTS_REPLY_TO`: optional reply-to address.
- Keep existing `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` configuration. Never prefix the service-role key, admin list or Resend key with `VITE_`.

Sign in with an email-confirmed Supabase account. Console read access accepts allowlisted addresses or existing admin/head roles. Review decisions, email retries and Sarvam announcement mutations require an allowlisted address even when the user already has an admin role. The original `/admin` console now enforces that admin/head/allowlist gate as well; judge-only and event-desk-only accounts do not open that console.

## Apply the migration

In the **Supabase project → SQL Editor**, run all of `supabase/migrations/20261109000000_sarvam_admin_review.sql` once, after existing repository migrations. Alternatively apply it using your usual Supabase migration workflow. Apply before deploying the code.

It extends existing `event_registrations` with `review_note` and `email_sent_at`, reuses `event_announcements`, and adds a private `hackathon_review_emails` outbox. It restricts direct authenticated Sarvam writes, grants the review/claim/completion RPCs only to the service role, and enables Realtime publication when the standard `supabase_realtime` publication exists. No production database has been changed by this implementation.

The Sarvam registration row remains the team and submission source of truth. Existing registrations are preserved; teams with fewer or more than 4 members are flagged and cannot be approved. All new Sarvam submissions start pending, regardless of the generic event's autoapproval setting. Existing approved/rejected records are not retroactively emailed.

## Fill email placeholders

Edit only `src/lib/hackathonEmail.ts` for event email copy and editable details:

- `WHATSAPP_GROUP_LINK`: required HTTPS invite URL.
- `INDUS_LINK`: required HTTPS Sarvam Indus credit-claim URL.
- `SARVAM_LINKS`: optional `{ label, url }` entries.
- `RULES`: review the supplied defaults.
- `SCHEDULE`: replace TBD times with the official Day 1/Day 2 schedule, in IST.

Approval is blocked before changing the submission when required links or sender/API-key configuration are missing. Rejection emails can be sent without the approval links. No real emails were sent during development.

## Live updates and email recovery

Supabase Realtime invalidates the lists. Five-second authenticated polling also runs so email-only admins (who intentionally have no direct database role) receive updates. Realtime continues to respect existing RLS; private emails are never in the public announcements query. Failed refreshes clear protected data and show an error.

A review atomically stores the decision, reviewer ID, review time, optional note and the exact email payload. Pending reviews are final through the ordinary review action. Use **Reconsider** on an approved or rejected card to move it into the Reconsideration queue without changing its decision. The queue supports both reversal directions with a required reason, private audit snapshots and updated decision emails. Apply `20261110000000_sarvam_reconsideration.sql`, then `20261111000000_sarvam_reconsideration_queue.sql` after the review migration. Approved CSV contains reversal reasons; the separate reversed-decisions export includes both outcomes. Concurrent reviews cannot send multiple decisions. Email claims are leased for 60 seconds; retries use the same payload and Resend idempotency key. On delivery failure, the decision stays saved and the console shows **Retry leader email**. Retry after one minute. Email sent means accepted by Resend, not a guarantee of inbox delivery.

Resend keeps idempotency keys for [24 hours](https://resend.com/changelog/idempotency-keys); this app stops retries after 23 hours from the first attempt. After that, verify the message in Resend and reconcile the outbox manually before any resend. A server interruption after decision storage leaves the outbox pending; an allowlisted admin can retry from the console. There is no background email scheduler.

## Validation

- `npm run lint` (existing repository warnings remain)
- `npx tsc --noEmit`
- `npm run build`
- `node scripts/test-hackathon-admin.mjs`
- Database/RLS tests use an isolated PostgreSQL runtime, not a live Supabase project:

```sh
npm install --prefix /tmp/vertex-db-check --no-audit --no-fund @electric-sql/pglite
PGLITE_MODULE=/tmp/vertex-db-check/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-hackathon-db.mjs
```

The database tests cover permissions, private rows, published announcements, four-member enforcement, duplicate decisions, competing email claims, retry snapshots and expiration. Live Supabase Auth/Realtime and real Resend delivery still need a configured deployment smoke test.

## File map

- Admin pages: `src/routes/_authenticated/admin_.submissions.tsx`, `admin_.teams.tsx`, `admin_.announcements.tsx`; shared UI in `src/components/admin/`; console links in `src/routes/_authenticated/admin.tsx`.
- Access and actions: `src/lib/admin-access.server.ts`, `roles.server.ts`, `hackathon-admin.server.ts`, `hackathon-admin.functions.ts`, `admin.functions.ts`, `sarvam.functions.ts`.
- Mapping/export: `src/lib/hackathon-admin.ts`; live updates: `src/hooks/use-live-data.ts`.
- Email copy: `src/lib/hackathonEmail.ts`; supersedes the removed `src/lib/sarvam-email.server.ts`.
- Public feed/nav: `src/lib/public.functions.ts`, `src/routes/announcements.tsx`, `src/components/SiteChrome.tsx`.
- Schema/config: migration above, `src/integrations/supabase/types.ts`, generated `src/routeTree.gen.ts`, `.env.example`.
- Tests: `scripts/test-hackathon-admin.mjs`, `scripts/test-hackathon-db.mjs`.
