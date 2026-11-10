# Vertex hackathon admin

## Theme

The header includes a light/dark toggle on desktop and mobile. It follows the system preference until explicitly selected, remembers the choice locally, synchronizes tabs, and applies before rendering to avoid a light flash. Shared cards, dialogs, forms, buttons and glass surfaces use the theme palette.

## What was built

- `/admin/submissions`: compact idea cards, details, status/track filters, search, live refresh, allowlist-only approval/rejection, leader email delivery/retry, and approved-only CSV export.
- `/admin/teams`: searchable team details, status and four-member validation filters.
- `/admin/announcements`: create, edit, pin and delete updates, shared with public `/announcements`.
- Server-side verified-session checks, normalized email allowlist and transactional review/email outbox. Admin/head roles allow reading; mutations remain allowlist-only.
- Development mock mode: fake verified session for `neal.kottilingal.in@gmail.com`, eight four-person teams, three announcements, localStorage persistence, cross-tab updates, simulated submissions, reset, and the real email template rendered as a preview. No Supabase requests or email sends are needed for these mock pages.

## Try locally without Supabase

Copy `.env.example` to `.env` only if you do not already have one; otherwise add `VITE_MOCK_MODE=true` to the existing file. Run `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 3000` and open `/admin/submissions`.

Mock mode requires both the exact flag `true` and `import.meta.env.DEV`. Production builds disable the fake session and exclude the mock store even if the flag is set. Do not configure this flag on Vercel. Real server functions still enforce authentication and the allowlist. Set the flag to `false` and restart to use Supabase.

Use **Simulate new submission**, then approve/reject a pending card to inspect its email preview. Sample approval links use `example.invalid`; they are visibly placeholders. **Reset sample data** restores eight submissions and three announcements. Browser data lives under `vertex-hackathon-mock-v1`; it is never synced to Supabase.

## Reconsideration workflow

Approved and rejected cards each have **Reconsider**. This moves the team into a separate Reconsideration section while preserving its current status. The section uses the same cards, search, status counts and track filters. **Approve** or **Reject** reverses the decision with a mandatory reason; **Keep current decision** returns it unchanged without email. Completed reviews return to the main list.

Both reversal directions preserve private decision/email history and use a new email idempotency key. Updated selection/withdrawal emails retain the existing design and event details, with distinct subject, heading, explanation and reason. Pending submissions retain the original email copy. In-flight delivery blocks reversal for one minute.

Approved and rejected CSV exports include the prior decision and reversal reason, with reversed rows listed first and marked **REVERSED DECISION**. Exports include only the team leader’s contact details, plus the approving/rejecting reviewer’s email. Reviewer email is resolved from the recorded reviewer account ID during export (its current email); missing/deleted reviewers are marked unavailable. Other members’ personal details stay in the admin detail view, not the CSV. CSV cannot store cell colors; the explicit label distinguishes these rows in any spreadsheet viewer. **Export reversed decisions (CSV)** includes the latest reversal for both currently approved and rejected teams; full history remains in the private audit table. Queued approved teams remain approved in the export until a reversal is confirmed.

## Full submission view

Click a team/project banner in submissions or reconsideration to open the complete idea and saved presentation/attachment links. The team lead name and email remain visible on the card. **Member personal details** shows every field collected by the Sarvam form: name, email, contact number, USN/SRN, college, branch and year, with the team lead identified. The Teams page uses the same details view. Missing values are labelled, never invented.

The current Sarvam form does not collect presentation uploads. Saved HTTP(S) presentation URLs and attachment links are displayed if present in the registration data; private storage paths are not converted into public URLs. This change does not add an upload flow or alter access permissions.

## Migration and deployment

Run `supabase/migrations/20261109000000_sarvam_admin_review.sql`, then `supabase/migrations/20261110000000_sarvam_reconsideration.sql`, then `supabase/migrations/20261111000000_sarvam_reconsideration_queue.sql`, after the existing migrations and before deploying. It adds review metadata, a private email outbox, service-only review/claim/completion RPCs, write restrictions and Realtime publication support. No live migration was run during development.

Set these in **Vercel → Project Settings → Environment Variables**, then redeploy:

| Variable                                                    | Value to supply                                                                                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_EMAILS`                                              | Comma-separated authorized email addresses. Trimmed and case-insensitive; combines with the fallback in `src/lib/admin-emails.ts`. |
| `RESEND_API_KEY`                                            | Resend API key, server only.                                                                                                       |
| `FROM_EMAIL`                                                | Verified Resend sender address.                                                                                                    |
| `SUPABASE_URL`, `VITE_SUPABASE_URL`                         | Supabase project URL.                                                                                                              |
| `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Project publishable/anon key.                                                                                                      |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | Server-only service-role key; never prefix with `VITE_`.                                                                           |

Copy Supabase values from **Project Settings → API**. No real credentials are included in `.env.example`; `.env` and local environment overrides are ignored by Git.

## Fill before real approvals

Edit `src/lib/hackathonEmail.ts`: `WHATSAPP_GROUP_LINK`, `INDUS_LINK`, `SARVAM_LINKS`, `RULES`, and `SCHEDULE`. Approval requires the first two HTTPS links and configured email delivery. Mock placeholders do not change the real configuration.

## Validation

- `npm run lint` (pre-existing repository warnings remain).
- `npx tsc --noEmit` and `npm run build` with the mock flag enabled.
- `node scripts/test-hackathon-admin.mjs` and `node scripts/test-mock-mode.mjs`: allowlist normalization, CSV escaping/approved-only output, email content, sample data, storage persistence, live events, announcement CRUD and production guards.
- Browser checks: review previews, search/filters, simulated live submissions, teams, admin/public announcements and 390px mobile layout.
- Isolated database/RLS tests: see `docs/hackathon-admin-setup.md` for the optional PGlite command.

Tested in mock mode; real login, realtime and email need checking after migration.
