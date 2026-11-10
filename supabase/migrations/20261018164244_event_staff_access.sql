-- A volunteer is scoped to one event. This is deliberately separate from
-- user_roles: assigning a door volunteer must never make them a club admin.
CREATE TABLE IF NOT EXISTS public.event_staff_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(btrim(email))),
  permission text NOT NULL CHECK (permission IN ('manager', 'checkin', 'viewer')),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS event_staff_access_event_active_idx
  ON public.event_staff_access (event_id, active);

ALTER TABLE public.event_staff_access ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.event_staff_access TO service_role;

CREATE POLICY "Admins manage event staff access"
  ON public.event_staff_access FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE TRIGGER event_staff_access_updated_at
  BEFORE UPDATE ON public.event_staff_access
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
