-- Build with Sarvam: a dedicated two-day team hackathon workspace.
INSERT INTO public.events (
  slug,
  title,
  event_date,
  start_time,
  location,
  tag,
  description,
  published,
  schedule_tba,
  workspace_kind
)
VALUES (
  'build-with-sarvam',
  'BUILD WITH SARVAM',
  '2026-11-13',
  '13–14 November',
  'REVA University',
  'Hackathon',
  'A two-day AI innovation hackathon by VERTEX Club in collaboration with Sarvam AI.',
  true,
  false,
  'hackathon'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  event_date = EXCLUDED.event_date,
  start_time = EXCLUDED.start_time,
  location = EXCLUDED.location,
  tag = EXCLUDED.tag,
  description = EXCLUDED.description,
  published = true,
  schedule_tba = false,
  workspace_kind = EXCLUDED.workspace_kind;

INSERT INTO public.event_workspaces (
  event_id,
  registration_open,
  min_team_size,
  max_team_size,
  rules,
  submissions_open,
  published
)
SELECT
  id,
  true,
  2,
  4,
  'Teams must have 2–4 members. The winning team receives the existing cash prize plus 25K worth of Sarvam API credits. Every participant receives 500 API credits.',
  false,
  true
FROM public.events
WHERE slug = 'build-with-sarvam'
ON CONFLICT (event_id) DO UPDATE SET
  registration_open = true,
  min_team_size = 2,
  max_team_size = 4,
  rules = EXCLUDED.rules,
  published = true;

INSERT INTO public.event_operation_settings (
  event_id,
  registration_mode,
  registration_open,
  requires_approval,
  waitlist_enabled,
  passes_enabled,
  checkin_enabled,
  email_enabled,
  team_min_size,
  team_max_size,
  submissions_enabled,
  judging_enabled
)
SELECT
  id,
  'team',
  true,
  true,
  false,
  false,
  true,
  false,
  2,
  4,
  false,
  true
FROM public.events
WHERE slug = 'build-with-sarvam'
ON CONFLICT (event_id) DO UPDATE SET
  registration_mode = 'team',
  registration_open = true,
  requires_approval = true,
  team_min_size = 2,
  team_max_size = 4,
  passes_enabled = false,
  judging_enabled = true;
