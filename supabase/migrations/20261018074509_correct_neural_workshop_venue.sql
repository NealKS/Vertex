-- Correct the published catalogue location for the Neural Networks workshop.
UPDATE public.events
SET location = 'SVB B009, REVA University, Bengaluru'
WHERE slug = 'neural-networks-from-scratch';
