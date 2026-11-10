-- Keep complete team registration data with the existing durable registration.
-- event_registrations_event_email_key already enforces event/email uniqueness.
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS workspace_registration jsonb;

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_workspace_registration_object
  CHECK (workspace_registration IS NULL OR jsonb_typeof(workspace_registration) = 'object');
