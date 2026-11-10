-- Production already has the workshop approval/QR workflow. This migration
-- adds delivery tracking plus event-scoped desk permissions without replacing it.
ALTER TABLE public.neural_network_workshop_registrations
  ADD COLUMN IF NOT EXISTS pass_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS public.neural_network_workshop_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
  permission text NOT NULL CHECK (permission IN ('manager', 'checkin', 'viewer')),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neural_network_workshop_staff ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.neural_network_workshop_staff TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.neural_network_workshop_staff TO authenticated;

CREATE POLICY "Admins manage neural workshop staff"
  ON public.neural_network_workshop_staff FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER neural_network_workshop_staff_updated_at
  BEFORE UPDATE ON public.neural_network_workshop_staff
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
