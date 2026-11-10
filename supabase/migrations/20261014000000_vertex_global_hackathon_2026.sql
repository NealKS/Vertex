-- 20261014000000_vertex_global_hackathon_2026.sql
-- Vertex Global Hackathon 2026 Event & Workspace registration initialization

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
  'hackathon-workspace',
  'Vertex Global Hackathon 2026',
  '2026-10-16',
  '09:00 AM IST',
  'Main Auditorium & Hybrid Online',
  'Hackathon',
  'Vertex flagship 36-hour technical club hackathon bringing student innovators together across Sarvam AI, Abscissa, Open Innovation, and partner challenges.',
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
  published = EXCLUDED.published,
  schedule_tba = EXCLUDED.schedule_tba,
  workspace_kind = EXCLUDED.workspace_kind,
  updated_at = now();

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
  1,
  4,
  'Teams of 1-4 members. Online sprint: 01-12 Oct 2026. On-site 36h finale: 16-18 Oct 2026. Projects must be original and built during the hackathon timeline.',
  false,
  true
FROM public.events
WHERE slug = 'hackathon-workspace'
ON CONFLICT (event_id) DO UPDATE SET
  registration_open = EXCLUDED.registration_open,
  min_team_size = EXCLUDED.min_team_size,
  max_team_size = EXCLUDED.max_team_size,
  rules = EXCLUDED.rules,
  submissions_open = EXCLUDED.submissions_open,
  published = EXCLUDED.published,
  updated_at = now();
