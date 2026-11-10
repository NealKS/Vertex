# Hackathon deployment and recovery

Follow [PR_NOTES.md](PR_NOTES.md) for the migration, both admin lists, environment variables and deployment checklist. The feature uses real Supabase sessions and data only.

## Email recovery

A decision atomically stores the status, reviewer email/user ID, time and exact leader-only email payload. Email claims are leased for 60 seconds; failed/uncertain deliveries retry that same payload and idempotency key. The UI offers **Resend email** when delivery is unconfirmed. There is no background email scheduler.

Retries stop after 23 hours from the first attempt to stay within the provider's 24-hour idempotency window. After that, verify delivery in Resend and reconcile the outbox before resending. A reversal creates a new decision/email key and preserves the previous snapshot. An in-flight email blocks reversal for one minute.

If PDF generation fails, the approval email explains that the guide will follow separately. The row is marked `guide_missing`. Once that email is confirmed sent, **Resend email** regenerates the guide and atomically rotates to a new outbox key, preserving the previous delivery in history. Concurrent retries cannot create duplicate guide sends. A repeated PDF failure leaves the original state available for another retry.

Approved teams must contain exactly four saved members. Existing approved/rejected registrations are not retroactively emailed. Reconsideration leaves their status intact until an opposite decision is selected; **Keep current decision** returns the team without sending email.

## Isolated database tests

These tests do not connect to Supabase or execute SQL against a remote database:

```sh
npm install --prefix /tmp/vertex-db-check --no-audit --no-fund @electric-sql/pglite
PGLITE_MODULE=/tmp/vertex-db-check/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-hackathon-db.mjs
```

They apply the live migration twice, validate the admin seed, reject unlisted access and self-grants, check public announcements, reviewer identity, four-member enforcement, duplicate decisions, competing email claims, reversal history and guide recovery. Pure application tests are `node scripts/test-hackathon-admin.mjs` and `node scripts/test-hackathon-message.mjs`.

## Implementation map

- App allowlist: `src/lib/admin-emails.ts`, `src/lib/admin-access.server.ts`.
- Server checks/actions: `src/lib/hackathon-admin.server.ts`, `src/lib/hackathon-admin.functions.ts`.
- Email copy and PDF data: `src/lib/hackathonEmail.ts`.
- Message builder and in-memory PDF: `src/lib/hackathon-message.server.ts`, `src/lib/hackathon-guide.server.ts`.
- Export mapping: `src/lib/hackathon-admin.ts`; subscriptions/polling: `src/hooks/use-live-data.ts`.
- Schema/RLS: `supabase/migrations/20261112000000_hackathon_live.sql`.
