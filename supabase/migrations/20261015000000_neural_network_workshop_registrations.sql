-- Neural Networks from Scratch workshop registrations.
CREATE TABLE public.neural_network_workshop_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  srn text NOT NULL CHECK (btrim(srn) <> ''),
  department text NOT NULL CHECK (btrim(department) <> ''),
  phone text NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  email text NOT NULL CHECK (btrim(email) <> ''),
  year text NOT NULL CHECK (year IN ('1st Year', '2nd Year', '3rd Year')),
  attend_reason text NOT NULL CHECK (btrim(attend_reason) <> ''),
  expectation text NOT NULL CHECK (btrim(expectation) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT neural_network_workshop_registrations_srn_key UNIQUE (srn)
);

REVOKE ALL ON public.neural_network_workshop_registrations FROM anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.neural_network_workshop_registrations TO authenticated;
GRANT ALL ON public.neural_network_workshop_registrations TO service_role;

ALTER TABLE public.neural_network_workshop_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read neural network workshop registrations"
  ON public.neural_network_workshop_registrations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update neural network workshop registrations"
  ON public.neural_network_workshop_registrations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete neural network workshop registrations"
  ON public.neural_network_workshop_registrations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed the public event card used by the existing events feed.
INSERT INTO public.events (
  slug, title, event_date, start_time, location, tag, description, published
)
VALUES (
  'neural-networks-from-scratch',
  'Neural Networks from Scratch: The Math Behind the Magic',
  '2026-10-28',
  '8:30 AM to 12:30 PM',
  'SVB B009, REVA University, Bengaluru',
  'Workshop',
  'A focused workshop on the mathematics behind neural networks, led by Mohammed Tasawuff. Organized by Vertex Club, REVA University.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  event_date = EXCLUDED.event_date,
  start_time = EXCLUDED.start_time,
  location = EXCLUDED.location,
  tag = EXCLUDED.tag,
  description = EXCLUDED.description,
  published = EXCLUDED.published;
