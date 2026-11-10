-- Reusable event operating rules. A row is created automatically when an event
-- is added, so future events do not need a separate hard-coded workflow.
CREATE TABLE public.event_operation_settings (
  event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  registration_mode text NOT NULL DEFAULT 'individual'
    CHECK (registration_mode IN ('individual', 'team', 'disabled')),
  registration_open boolean NOT NULL DEFAULT true,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  requires_approval boolean NOT NULL DEFAULT false,
  waitlist_enabled boolean NOT NULL DEFAULT false,
  passes_enabled boolean NOT NULL DEFAULT true,
  checkin_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  team_min_size integer NOT NULL DEFAULT 1 CHECK (team_min_size >= 1),
  team_max_size integer NOT NULL DEFAULT 1 CHECK (team_max_size >= team_min_size),
  submissions_enabled boolean NOT NULL DEFAULT false,
  judging_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER event_operation_settings_updated_at
  BEFORE UPDATE ON public.event_operation_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.event_operation_settings TO service_role;
ALTER TABLE public.event_operation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage event operation settings"
  ON public.event_operation_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can choose which extra questions appear on an event's registration form.
CREATE TABLE public.event_registration_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  field_key text NOT NULL CHECK (field_key ~ '^[a-z][a-z0-9_]{0,48}$'),
  label text NOT NULL CHECK (char_length(label) <= 100),
  field_type text NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text', 'textarea', 'select', 'checkbox')),
  required boolean NOT NULL DEFAULT false,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, field_key)
);

CREATE INDEX event_registration_fields_event_position_idx
  ON public.event_registration_fields (event_id, position);

CREATE TRIGGER event_registration_fields_updated_at
  BEFORE UPDATE ON public.event_registration_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON public.event_registration_fields TO service_role;
ALTER TABLE public.event_registration_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage event registration fields"
  ON public.event_registration_fields FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Existing registrations were previously confirmed immediately, so preserve
-- that behaviour while enabling pending/approved/rejected workflows going forward.
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted')),
  ADD COLUMN IF NOT EXISTS form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS pass_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS pass_sent_to text;

CREATE INDEX IF NOT EXISTS event_registrations_event_status_created_idx
  ON public.event_registrations (event_id, status, created_at DESC);

-- Backfill one safe, compatible configuration for each existing generic event.
INSERT INTO public.event_operation_settings (event_id)
SELECT id FROM public.events
ON CONFLICT (event_id) DO NOTHING;
