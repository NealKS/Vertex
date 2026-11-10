-- BUILD WITH SARVAM now requires four-member teams and closes registration on 10 November 2026.
UPDATE public.event_workspaces
SET
  min_team_size = 4,
  max_team_size = 4
WHERE event_id = (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');

UPDATE public.event_operation_settings
SET
  team_min_size = 4,
  team_max_size = 4,
  registration_closes_at = '2026-11-10T23:00:00+05:30'
WHERE event_id = (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');
