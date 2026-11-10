# Vertex live hackathon admin

## What changed

- Removed development mock sessions, sample data and preview flows. Submissions and teams use the same `event_registrations` rows written by the public Sarvam form. Supabase Realtime refreshes lists with a five-second polling fallback.
- Hackathon reads, decisions, exports and announcement writes require a verified signed-in email in both the app allowlist and database admin list. Existing admin/head roles alone do not grant hackathon access.
- One-click approval, rejection and reversal record the deciding admin email and time. Emails go only to the team leader, with transactional outbox claims, duplicate protection and a **Resend email** recovery action.
- Reconsideration preserves the current decision until reversed, does not navigate away when queued, and supports search, track/status filters and counts. Reversal reasons are recorded automatically; previous decisions and email snapshots remain in private history.
- Approval emails contain the final event copy and an in-memory, three-page A4 PDF guide generated with `pdf-lib`. Rejections have the supplied copy and no attachment. PDF failure sends the approval without its guide, flags the card and allows a fresh guide resend.
- Approved, rejected and reversed CSV exports contain live data, leader contacts only, saved reviewer email, timestamp and `INITIAL`/`REVERSED` markers. Prior status and reversal reason are included; reversed rows appear first. CSV uses UTF-8 BOM, quoting and spreadsheet-formula protection.
- Team detail dialogs show the complete idea, saved HTTP(S) presentation links and member details. The existing form does not collect PPT uploads; this change does not add uploads. Public announcements, responsive cards and the existing light/dark theme remain available.

## Migration: run manually before deploying

Run **`supabase/migrations/20261112000000_hackathon_live.sql`** after the existing foundation migrations in Supabase SQL Editor. This is the single, rerunnable migration for this feature. It creates/seeds `admin_emails`, adds review/guide/reconsideration metadata and private outbox/history tables, installs service-only review RPCs, updates RLS and enables Realtime for the affected tables when the standard publication exists.

**No SQL was run against the user's database.** Migration idempotency and permissions were exercised only in isolated PGlite tests.

`neal.kottilingal.in@gmail.com` is included in BOTH places:

1. `src/lib/admin-emails.ts`: add one quoted email line to `FALLBACK_ADMIN_EMAILS` (or use server-only `ADMIN_EMAILS`).
2. The migration: add one `INSERT INTO public.admin_emails(email) VALUES ('new-admin@example.org') ON CONFLICT DO NOTHING;` line. Use a lowercase, trimmed email and apply this insert yourself.

An admin must exist in both lists and sign in with a confirmed Supabase email. The database list cannot be edited by browser clients. RLS uses that list for Sarvam submission reads/status updates and event announcement writes; published event announcements remain anonymously readable. Existing club announcement permissions are unchanged.

## Vercel environment variables

Set these in **Project Settings → Environment Variables**, then redeploy:

| Variable                                                    | Value                                                                                                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_EMAILS`                                              | Comma-separated additional allowed emails; trimmed and case-insensitive. Also seed each in `admin_emails`. Neal is already a fallback. |
| `RESEND_API_KEY`                                            | Server-only Resend API key.                                                                                                            |
| `FROM_EMAIL`                                                | `Vertex Club <events@abscissa.dev>` (default); verify the sender domain in Resend.                                                     |
| `EVENTS_REPLY_TO`                                           | `events@abscissa.dev` (default).                                                                                                       |
| `SUPABASE_URL`, `VITE_SUPABASE_URL`                         | The same Supabase project URL.                                                                                                         |
| `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY` | The same project publishable/anon key.                                                                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | Server-only service-role key. Never prefix this or the Resend key with `VITE_`.                                                        |

Copy Supabase values from **Supabase → Project Settings → API** (API Keys for keys). The browser reads exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; server auth uses the unprefixed equivalents. `.env.example` contains no credentials. `.env` and local overrides are gitignored. No mock flag is needed or supported.

Email copy, links, rules, prizes and schedule live in `src/lib/hackathonEmail.ts`; the supplied final values are filled in, with no event placeholders. PDF generation uses no runtime filesystem access.

## Validation and manual deployment checklist

Passed locally: `npm run lint` (0 errors, 317 existing warnings), `npx tsc --noEmit`, `npm run build`, `npm run test:registration`, `node scripts/test-hackathon-admin.mjs`, `node scripts/test-hackathon-message.mjs`, and isolated database/RLS tests documented in `hackathon-admin-setup.md`. The generated three-page PDF was rendered and visually checked.

After configuring a test deployment and applying the migration:

- [ ] Sign in as Neal; verify submissions, teams and announcements load. Confirm an unlisted account cannot read submissions, export, decide, retry or write announcements, even with a legacy admin/head role.
- [ ] Submit an actual four-member team through the public Sarvam form; verify it appears live on another admin tab. Temporarily disconnect Realtime and verify polling catches updates.
- [ ] Approve and reject separate pending teams; verify recorded admin email/time, one email to the leader only, exact copy, approval PDF and no rejection attachment. Double-click/retry must not duplicate delivery.
- [ ] Exercise provider failure: decision stays saved; **Resend email** retries the same outbox. Exercise PDF failure: approval sends without the guide and a later successful resend includes it.
- [ ] Queue approved/rejected teams without navigation, then reverse each direction. Confirm new-decision email, automatic reversal reason and private history.
- [ ] Export all three CSVs; verify actual status, reversed marker/reason, reviewer email, leader-only contacts and correct dates/escaping.
- [ ] Create/edit/pin/delete event announcements; check public `/announcements` in a signed-out tab.
- [ ] Check team details/PPT links, filters, dark/light modes and a 390px-wide screen.

Real Supabase login, Realtime and Resend delivery still require this configured-deployment check. No real emails were sent during development. Email sent means accepted by Resend, not guaranteed inbox delivery.
