-- Operational history for the Neural Networks workshop.
-- This table is intentionally not exposed to browser clients: server functions
-- authorize workshop managers before reading or writing it.
CREATE TABLE IF NOT EXISTS public.neural_network_workshop_registration_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL
    REFERENCES public.neural_network_workshop_registrations(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'pass_sent', 'pass_resent')),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neural_workshop_registration_activity_registration_created_idx
  ON public.neural_network_workshop_registration_activity (registration_id, created_at DESC);

ALTER TABLE public.neural_network_workshop_registration_activity ENABLE ROW LEVEL SECURITY;

-- Server-only service-role access. No browser policy is created deliberately.
GRANT ALL ON public.neural_network_workshop_registration_activity TO service_role;
REVOKE ALL ON public.neural_network_workshop_registration_activity FROM anon, authenticated;
