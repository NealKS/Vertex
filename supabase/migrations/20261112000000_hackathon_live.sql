BEGIN;
-- Run after the repository foundation migrations. Safe to apply again.
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)))
);
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_emails FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_emails TO service_role;
-- Add one INSERT line per admin; also add it to src/lib/admin-emails.ts (or ADMIN_EMAILS).
INSERT INTO public.admin_emails(email) VALUES ('neal.kottilingal.in@gmail.com') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_hackathon_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM auth.users u JOIN public.admin_emails a
   ON a.email = lower(btrim(u.email)) WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.is_hackathon_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_hackathon_admin() TO anon, authenticated, service_role;

ALTER TABLE public.event_registrations
 ADD COLUMN IF NOT EXISTS reviewed_by uuid,
 ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
CREATE TABLE IF NOT EXISTS public.event_announcements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
 title text NOT NULL, body text NOT NULL, pinned boolean NOT NULL DEFAULT false,
 published boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.event_announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_announcements TO authenticated;
GRANT ALL ON public.event_announcements TO service_role;
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Private transactional outbox. Email content is snapshotted at decision time so
-- retry requests have identical payloads and the same provider idempotency key.
CREATE TABLE IF NOT EXISTS public.hackathon_review_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  first_attempt_at timestamptz,
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hackathon_review_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hackathon_review_emails FROM anon, authenticated;
GRANT ALL ON public.hackathon_review_emails TO service_role;

-- Policy predicates must not depend on the caller's visibility of unpublished events.
CREATE OR REPLACE FUNCTION public.is_sarvam_event(p_event_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS(SELECT 1 FROM public.events WHERE id = p_event_id AND slug = 'build-with-sarvam');
$$;
REVOKE ALL ON FUNCTION public.is_sarvam_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_sarvam_event(uuid) TO authenticated, service_role;

-- The app allowlist and the database admin list must both include each reviewer.
-- All Sarvam writes go through authenticated, allowlist-checked server actions.
-- Restrictive policies also block older permissive staff policies and direct REST calls.
DROP POLICY IF EXISTS sarvam_registrations_server_insert ON public.event_registrations;
CREATE POLICY sarvam_registrations_server_insert ON public.event_registrations
 AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (NOT public.is_sarvam_event(event_id));
DROP POLICY IF EXISTS sarvam_registrations_server_update ON public.event_registrations;
CREATE POLICY sarvam_registrations_server_update ON public.event_registrations
 AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (NOT public.is_sarvam_event(event_id))
 WITH CHECK (NOT public.is_sarvam_event(event_id));
DROP POLICY IF EXISTS sarvam_registrations_server_delete ON public.event_registrations;
CREATE POLICY sarvam_registrations_server_delete ON public.event_registrations
 AS RESTRICTIVE FOR DELETE TO authenticated
 USING (NOT public.is_sarvam_event(event_id));
DROP POLICY IF EXISTS sarvam_announcements_server_insert ON public.event_announcements;
CREATE POLICY sarvam_announcements_server_insert ON public.event_announcements
 AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (NOT public.is_sarvam_event(event_id));
DROP POLICY IF EXISTS sarvam_announcements_server_update ON public.event_announcements;
CREATE POLICY sarvam_announcements_server_update ON public.event_announcements
 AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (NOT public.is_sarvam_event(event_id))
 WITH CHECK (NOT public.is_sarvam_event(event_id));
DROP POLICY IF EXISTS sarvam_announcements_server_delete ON public.event_announcements;
CREATE POLICY sarvam_announcements_server_delete ON public.event_announcements
 AS RESTRICTIVE FOR DELETE TO authenticated
 USING (NOT public.is_sarvam_event(event_id));

CREATE OR REPLACE FUNCTION public.review_sarvam_submission(
  p_id uuid, p_status text, p_reviewer uuid, p_note text, p_payload jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE changed_id uuid;
BEGIN
  IF p_status NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  UPDATE public.event_registrations SET status = p_status, reviewed_by = p_reviewer,
    reviewed_at = now(), review_note = nullif(p_note, '')
  WHERE id = p_id AND status = 'pending'
    AND event_id IN (SELECT id FROM public.events WHERE slug = 'build-with-sarvam')
    AND (p_status <> 'approved' OR jsonb_array_length(form_data->'members') = 4)
  RETURNING id INTO changed_id;
  IF changed_id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.hackathon_review_emails(registration_id, payload) VALUES (p_id, p_payload);
  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION public.claim_sarvam_review_email(p_id uuid)
RETURNS SETOF public.hackathon_review_emails LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  UPDATE public.hackathon_review_emails SET claimed_at = now(), first_attempt_at = coalesce(first_attempt_at, now())
  WHERE registration_id = p_id AND sent_at IS NULL
    AND (claimed_at IS NULL OR claimed_at < now() - interval '60 seconds')
    -- Resend retains idempotency keys for 24h. Never blindly retry past that window.
    AND (first_attempt_at IS NULL OR first_attempt_at > now() - interval '23 hours')
  RETURNING *;
$$;
CREATE OR REPLACE FUNCTION public.complete_sarvam_review_email(p_id uuid, p_claimed_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  UPDATE public.hackathon_review_emails SET sent_at = now()
  WHERE registration_id = p_id AND claimed_at = p_claimed_at AND sent_at IS NULL;
  IF FOUND THEN
    UPDATE public.event_registrations SET email_sent_at = now() WHERE id = p_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.review_sarvam_submission(uuid,text,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_sarvam_review_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_sarvam_review_email(uuid,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_sarvam_submission(uuid,text,uuid,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_sarvam_review_email(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_sarvam_review_email(uuid,timestamptz) TO service_role;

DO $$
DECLARE target text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH target IN ARRAY ARRAY['event_registrations','event_announcements','announcements'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = target) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', target);
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- Private snapshots preserve the rejected decision and its original email.
CREATE TABLE IF NOT EXISTS public.hackathon_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  previous_review jsonb NOT NULL,
  previous_email jsonb,
  changed_by uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hackathon_review_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hackathon_review_history FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.hackathon_review_history TO service_role;

-- Called only by the allowlist-checked server action. Normal review stays pending-only.
CREATE OR REPLACE FUNCTION public.reconsider_sarvam_submission(
  p_id uuid, p_status text, p_reviewer uuid, p_note text, p_payload jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE previous public.event_registrations%ROWTYPE;
DECLARE old_email public.hackathon_review_emails%ROWTYPE;
BEGIN
  IF p_status IS DISTINCT FROM 'approved' OR coalesce(length(trim(p_note)), 0) = 0
    OR length(p_note) > 2000 THEN RAISE EXCEPTION 'Approval and reconsideration reason required'; END IF;
  SELECT * INTO previous FROM public.event_registrations
    WHERE id = p_id AND status = 'rejected'
      AND event_id IN (SELECT id FROM public.events WHERE slug = 'build-with-sarvam')
    FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF jsonb_array_length(previous.form_data->'members') IS DISTINCT FROM 4 THEN RETURN false; END IF;
  SELECT * INTO old_email FROM public.hackathon_review_emails WHERE registration_id = p_id FOR UPDATE;
  -- Let in-flight rejection delivery finish before replacing its outbox.
  IF old_email.sent_at IS NULL AND old_email.claimed_at >= now() - interval '60 seconds'
    THEN RAISE EXCEPTION 'Previous email is processing; retry after one minute'; END IF;
  INSERT INTO public.hackathon_review_history(registration_id, previous_review, previous_email, changed_by, reason)
    VALUES (p_id, jsonb_build_object('status', previous.status, 'reviewed_by', previous.reviewed_by,
      'reviewed_at', previous.reviewed_at, 'review_note', previous.review_note, 'email_sent_at', previous.email_sent_at),
      CASE WHEN old_email.id IS NOT NULL THEN to_jsonb(old_email) ELSE NULL END, p_reviewer, trim(p_note));
  UPDATE public.event_registrations SET status = 'approved', reviewed_by = p_reviewer,
    reviewed_at = now(), review_note = trim(p_note), email_sent_at = NULL WHERE id = p_id;
  DELETE FROM public.hackathon_review_emails WHERE registration_id = p_id;
  -- A new ID gives the approval its own provider idempotency key.
  INSERT INTO public.hackathon_review_emails(registration_id, payload) VALUES (p_id, p_payload);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reconsider_sarvam_submission(uuid,text,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconsider_sarvam_submission(uuid,text,uuid,text,jsonb) TO service_role;

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS reconsidering boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reversal_reason text,
  ADD COLUMN IF NOT EXISTS previous_status text;

-- Preserve CSV metadata for reversals made before this migration.
UPDATE public.event_registrations r SET reversal_reason = h.reason,
  previous_status = h.previous_review->>'status'
FROM (SELECT DISTINCT ON (registration_id) registration_id, reason, previous_review
      FROM public.hackathon_review_history ORDER BY registration_id, created_at DESC, id DESC) h
WHERE r.id = h.registration_id;

-- Queueing retains the original decision and sends no email.
CREATE OR REPLACE FUNCTION public.queue_sarvam_reconsideration(p_id uuid, p_queued boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF p_queued IS NULL THEN RETURN false; END IF;
  UPDATE public.event_registrations SET reconsidering = p_queued
  WHERE id = p_id AND status IN ('approved','rejected')
    AND event_id IN (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_sarvam_reconsideration(uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_sarvam_reconsideration(uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.reconsider_sarvam_submission(
  p_id uuid, p_status text, p_reviewer uuid, p_note text, p_payload jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE previous public.event_registrations%ROWTYPE;
DECLARE old_email public.hackathon_review_emails%ROWTYPE;
BEGIN
  IF (p_status IS NULL OR p_status NOT IN ('approved', 'rejected')) OR coalesce(length(trim(p_note)), 0) = 0
    OR length(p_note) > 2000 THEN RAISE EXCEPTION 'New decision and reconsideration reason required'; END IF;
  SELECT * INTO previous FROM public.event_registrations
    WHERE id = p_id AND reconsidering AND status IN ('approved','rejected') AND status <> p_status
      AND event_id IN (SELECT id FROM public.events WHERE slug = 'build-with-sarvam')
    FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_status = 'approved' AND jsonb_array_length(previous.form_data->'members') IS DISTINCT FROM 4 THEN RETURN false; END IF;
  SELECT * INTO old_email FROM public.hackathon_review_emails WHERE registration_id = p_id FOR UPDATE;
  -- Let in-flight rejection delivery finish before replacing its outbox.
  IF old_email.sent_at IS NULL AND old_email.claimed_at >= now() - interval '60 seconds'
    THEN RAISE EXCEPTION 'Previous email is processing; retry after one minute'; END IF;
  INSERT INTO public.hackathon_review_history(registration_id, previous_review, previous_email, changed_by, reason)
    VALUES (p_id, jsonb_build_object('status', previous.status, 'reviewed_by', previous.reviewed_by,
      'reviewed_at', previous.reviewed_at, 'review_note', previous.review_note, 'email_sent_at', previous.email_sent_at),
      CASE WHEN old_email.id IS NOT NULL THEN to_jsonb(old_email) ELSE NULL END, p_reviewer, trim(p_note));
  UPDATE public.event_registrations SET status = p_status, reconsidering = false, previous_status = previous.status, reversal_reason = trim(p_note), reviewed_by = p_reviewer,
    reviewed_at = now(), review_note = trim(p_note), email_sent_at = NULL WHERE id = p_id;
  DELETE FROM public.hackathon_review_emails WHERE registration_id = p_id;
  -- A new ID gives the approval its own provider idempotency key.
  INSERT INTO public.hackathon_review_emails(registration_id, payload) VALUES (p_id, p_payload);
  RETURN true;
END;
$$;


-- Restrictive policies stop older staff policies from bypassing the email list.
DROP POLICY IF EXISTS sarvam_registrations_read_guard ON public.event_registrations;
CREATE POLICY sarvam_registrations_read_guard ON public.event_registrations AS RESTRICTIVE FOR SELECT TO anon, authenticated
 USING (NOT public.is_sarvam_event(event_id) OR public.is_hackathon_admin());
DROP POLICY IF EXISTS sarvam_registrations_admin_read ON public.event_registrations;
CREATE POLICY sarvam_registrations_admin_read ON public.event_registrations FOR SELECT TO authenticated
 USING (public.is_sarvam_event(event_id) AND public.is_hackathon_admin());
DROP POLICY IF EXISTS sarvam_registrations_server_update ON public.event_registrations;
CREATE POLICY sarvam_registrations_server_update ON public.event_registrations AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (NOT public.is_sarvam_event(event_id) OR public.is_hackathon_admin())
 WITH CHECK (NOT public.is_sarvam_event(event_id) OR public.is_hackathon_admin());
DROP POLICY IF EXISTS sarvam_registrations_admin_update ON public.event_registrations;
CREATE POLICY sarvam_registrations_admin_update ON public.event_registrations FOR UPDATE TO authenticated
 USING (public.is_sarvam_event(event_id) AND public.is_hackathon_admin())
 WITH CHECK (public.is_sarvam_event(event_id) AND public.is_hackathon_admin());

DROP POLICY IF EXISTS sarvam_announcements_server_insert ON public.event_announcements;
DROP POLICY IF EXISTS sarvam_announcements_server_update ON public.event_announcements;
DROP POLICY IF EXISTS sarvam_announcements_server_delete ON public.event_announcements;
DROP POLICY IF EXISTS hackathon_announcements_insert_guard ON public.event_announcements;
CREATE POLICY hackathon_announcements_insert_guard ON public.event_announcements AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_hackathon_admin());
DROP POLICY IF EXISTS hackathon_announcements_update_guard ON public.event_announcements;
CREATE POLICY hackathon_announcements_update_guard ON public.event_announcements AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_hackathon_admin()) WITH CHECK (public.is_hackathon_admin());
DROP POLICY IF EXISTS hackathon_announcements_delete_guard ON public.event_announcements;
CREATE POLICY hackathon_announcements_delete_guard ON public.event_announcements AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_hackathon_admin());
DROP POLICY IF EXISTS hackathon_announcements_admin ON public.event_announcements;
CREATE POLICY hackathon_announcements_admin ON public.event_announcements FOR ALL TO authenticated USING (public.is_hackathon_admin()) WITH CHECK (public.is_hackathon_admin());
DROP POLICY IF EXISTS hackathon_announcements_public ON public.event_announcements;
CREATE POLICY hackathon_announcements_public ON public.event_announcements FOR SELECT TO anon, authenticated USING (published);
GRANT EXECUTE ON FUNCTION public.is_sarvam_event(uuid) TO anon;
COMMIT;
