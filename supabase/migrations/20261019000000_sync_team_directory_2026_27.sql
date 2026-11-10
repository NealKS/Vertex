-- Sync the public Members directory with the official "Vertex Club Team Directory 2026-27".
--
-- What this does
--   * For each person in the directory: UPDATE their existing row (matched by profile link name,
--     then by exact name), or INSERT a new row if they are not on the site yet.
--   * Only touches: name, role, team, head/leadership flags, and sort order.
--   * Never touches: photo, bio, skills, social links, or the sign-in link (user_id), so existing
--     profiles and logins keep working. Profile link names (slugs) of existing people are kept.
--   * Never deletes anyone. People on the site who are not in the directory are left as they are.
--   * Phone numbers from the PDF are deliberately NOT stored (member rows are public).
--
-- Before running: supabase/migrations/20261010000000_add_vertex_teams.sql must already be applied
-- (this script stops with a clear error if the four new teams are missing).
--
-- Decisions to confirm with Preetham (each is a one-line change):
--   1. coordinator_role below: 'Member' keeps the existing role wording on the site; the PDF says
--      'Coordinator'.
--   2. Preetham AK is kept as 'Founder'; the PDF says 'Patron'.

-- The guard_member_self_update trigger silently reverts name/role/team/head changes unless the
-- caller is a logged-in admin. This script runs without a login, so pause the guard while it runs.
ALTER TABLE public.members DISABLE TRIGGER guard_member_self_update;

DO $$
DECLARE
  coordinator_role constant text := 'Member';
  r record;
  target_id uuid;
  name_matches int;
BEGIN
  IF (SELECT count(*) FROM public.teams
      WHERE id IN ('creative-design', 'social-media', 'core-editor', 'associate')) < 4 THEN
    RAISE EXCEPTION 'Missing teams. Apply 20261010000000_add_vertex_teams.sql first.';
  END IF;

  FOR r IN
    SELECT * FROM (VALUES
      -- slug, name, role, team_id, is_head, is_leadership, sort_order, slugs to look for (in priority order)

      -- Leadership
      ('preetham-ak', 'Preetham AK', 'Founder', NULL, false, true, 1, ARRAY['preetham-ak']),
      ('pavan-achar', 'Pavan Achar', 'President', NULL, false, true, 2, ARRAY['pavan-achar']),
      ('madan-kumar', 'Madan Kumar', 'Vice President', NULL, false, true, 3, ARRAY['madan-kumar']),

      -- Event Management
      ('pawan-kumar', 'Pawan Kumar', 'Team Head', 'events', true, false, 1, ARRAY['pawan-kumar']),
      ('parinitha-n', 'Parinitha N', 'Team Co-Head', 'events', true, false, 2, ARRAY['parinitha-n']),
      ('raghaveer-singh', 'Raghaveer Singh', 'Coordinator', 'events', false, false, 3, ARRAY['raghuveer-singh', 'raghaveer-singh']),
      ('shivam-vishwakarma', 'Shivam Vishwakarma', 'Coordinator', 'events', false, false, 4, ARRAY['shivam', 'shivam-vishwakarma']),
      ('ashish-j', 'Ashish J', 'Coordinator', 'events', false, false, 5, ARRAY['ashish-j']),
      ('jeevith', 'Jeevith', 'Coordinator', 'events', false, false, 6, ARRAY['jeevith-r', 'jeevith']),
      ('namratha-n-raj', 'Namratha N Raj', 'Coordinator', 'events', false, false, 7, ARRAY['namratha-n-raju', 'namratha-n-raj']),
      ('vedhashree-r', 'Vedhashree R', 'Coordinator', 'events', false, false, 8, ARRAY['vedashree-r', 'vedhashree-r']),
      ('soha-afshaan', 'Soha Afshaan', 'Coordinator', 'events', false, false, 9, ARRAY['soha-afshaan']),
      ('riva-idrees', 'Riva Idrees', 'Coordinator', 'events', false, false, 10, ARRAY['riva-idrees']),

      -- Media
      ('rahul-ne', 'Rahul NE', 'Team Head', 'media', true, false, 1, ARRAY['rahul-ne']),
      ('chaitali-kk', 'Chaitali KK', 'Team Co-Head', 'media', true, false, 2, ARRAY['chaithali-k-k', 'chaitali-kk']),
      ('raghav-k', 'Raghav K', 'Coordinator', 'media', false, false, 3, ARRAY['raghava', 'raghav-k']),
      ('manish-suregaonkar', 'Manish Suregaonkar', 'Coordinator', 'media', false, false, 4, ARRAY['manish-suregaonkar']),
      ('manthan-prabhu', 'Manthan Prabhu', 'Coordinator', 'media', false, false, 5, ARRAY['manthan-prabhu']),
      ('mohana-priya', 'Mohana Priya', 'Coordinator', 'media', false, false, 6, ARRAY['mohana-priya']),
      ('niveditha', 'Niveditha', 'Coordinator', 'media', false, false, 7, ARRAY['niveditha']),

      -- PR & Marketing
      ('nagendhra-mahesha', 'Nagendhra Mahesha', 'Team Head', 'pr', true, false, 1, ARRAY['nagendra-mahesha', 'nagendhra-mahesha']),
      ('snigdha-m', 'Snigdha M', 'Team Co-Head', 'pr', true, false, 2, ARRAY['snigdha-m']),
      ('priyanshu-mahato', 'Priyanshu Mahato', 'Coordinator', 'pr', false, false, 3, ARRAY['priyanshu-mahato']),
      ('thanaya-s', 'Thanaya S', 'Coordinator', 'pr', false, false, 4, ARRAY['thanaya-s']),
      ('sedrah-maryam', 'Sedrah Maryam', 'Coordinator', 'pr', false, false, 5, ARRAY['sedrah-maryam']),
      ('lahari-reddy', 'Lahari Reddy', 'Coordinator', 'pr', false, false, 6, ARRAY['lahari-reddy']),
      ('janavi-kb', 'Janavi KB', 'Coordinator', 'pr', false, false, 7, ARRAY['k-b-janavi', 'janavi-kb']),
      ('chandana-s', 'Chandana S', 'Coordinator', 'pr', false, false, 8, ARRAY['chandana-s']),

      -- Technical
      ('mohammed-tasowuff', 'Mohammed Tasowuff', 'Team Head', 'tech', true, false, 1, ARRAY['mohammed-tasowuff']),
      ('chinmayi-kc', 'Chinmayi KC', 'Team Co-Head', 'tech', true, false, 2, ARRAY['chinmayi-k-c', 'chinmayi-kc']),
      ('ganesh-naik', 'Ganesh Naik', 'Coordinator', 'tech', false, false, 3, ARRAY['ganesh-naik']),
      ('karthik-t', 'Karthik T', 'Coordinator', 'tech', false, false, 4, ARRAY['karthik-t']),
      ('shalini-m', 'Shalini M', 'Coordinator', 'tech', false, false, 5, ARRAY['shalini-m']),
      ('dhruthi-c', 'Dhruthi C', 'Coordinator', 'tech', false, false, 6, ARRAY['dhruthi-c']),
      ('najunda-chithra', 'Najunda Chithra', 'Coordinator', 'tech', false, false, 7, ARRAY['najunda-chithra']),
      ('shafia-anum', 'Shafia Anum', 'Coordinator', 'tech', false, false, 8, ARRAY['shafia-anum']),
      ('navya-k', 'Navya K', 'Coordinator', 'tech', false, false, 9, ARRAY['navya-k']),

      -- Sponsorship
      ('parth-mehta', 'Parth Mehta', 'Team Head', 'sponsorship', true, false, 1, ARRAY['parth-mehta']),
      ('rithika', 'Rithika', 'Team Co-Head', 'sponsorship', true, false, 2, ARRAY['rithika']),
      ('jeevan-sn', 'Jeevan SN', 'Coordinator', 'sponsorship', false, false, 3, ARRAY['s-n-jeevan', 'jeevan-sn']),
      ('suman-am', 'Suman AM', 'Coordinator', 'sponsorship', false, false, 4, ARRAY['suman-am']),
      ('donta-saranya-manibala', 'Donta Saranya Manibala', 'Coordinator', 'sponsorship', false, false, 5, ARRAY['donta-saranya-manibala']),

      -- Creative and Design
      ('akash-gouda', 'Akash Gouda', 'Team Head', 'creative-design', true, false, 1, ARRAY['akash-gouda']),
      ('prakrithi-kumar', 'Prakrithi Kumar', 'Team Co-Head', 'creative-design', true, false, 2, ARRAY['prakrithi-kumar']),
      ('karthik-d', 'Karthik D', 'Coordinator', 'creative-design', false, false, 3, ARRAY['karthik-d']),
      ('rahul', 'Rahul', 'Coordinator', 'creative-design', false, false, 4, ARRAY['rahul']),
      ('gayathri-hunashal', 'Gayathri Hunashal', 'Coordinator', 'creative-design', false, false, 5, ARRAY['gayathri-hunashal']),
      ('c-sanjana-reddy', 'C Sanjana Reddy', 'Coordinator', 'creative-design', false, false, 6, ARRAY['c-sanjana-reddy']),

      -- Social Media
      ('sai-brundha', 'Sai Brundha', 'Team Head', 'social-media', true, false, 1, ARRAY['sai-brundha']),
      ('daksha-ujjini', 'Daksha Ujjini', 'Coordinator', 'social-media', false, false, 2, ARRAY['daksha-ujjini']),
      ('siya-agarwal', 'Siya Agarwal', 'Coordinator', 'social-media', false, false, 3, ARRAY['siya-agarwal']),

      -- Core Editor
      ('ba-haveesh', 'BA Haveesh', 'Editor', 'core-editor', false, false, 1, ARRAY['ba-haveesh']),
      ('vishnu', 'Vishnu', 'Editor', 'core-editor', false, false, 2, ARRAY['vishnu']),
      ('vittal', 'Vittal', 'Editor', 'core-editor', false, false, 3, ARRAY['vittal']),

      -- Associate
      ('debarghya-das', 'Debarghya Das', 'Associate', 'associate', false, false, 1, ARRAY['debarghya-das']),
      ('r-mahipal-reddy', 'R Mahipal Reddy', 'Associate', 'associate', false, false, 2, ARRAY['r-mahipal-reddy']),
      ('vimalan-s', 'Vimalan S', 'Associate', 'associate', false, false, 3, ARRAY['vimalan-s']),
      ('mithun-kumar', 'Mithun Kumar', 'Associate', 'associate', false, false, 4, ARRAY['mithun-kumar']),
      ('dhakshitha-d', 'Dhakshitha D', 'Associate', 'associate', false, false, 5, ARRAY['dhakshitha-d'])
    ) AS v(slug, name, role, team_id, is_head, is_leadership, sort_order, match_slugs)
  LOOP
    target_id := NULL;

    -- 1) existing row by profile link name, in priority order
    SELECT m.id INTO target_id
    FROM unnest(r.match_slugs) WITH ORDINALITY AS s(slug, ord)
    JOIN public.members m ON m.slug = s.slug
    ORDER BY s.ord
    LIMIT 1;

    -- 2) otherwise an existing row with exactly the same name (ignoring spaces, dots, case)
    IF target_id IS NULL THEN
      SELECT count(*) INTO name_matches
      FROM public.members m
      WHERE regexp_replace(lower(m.name), '[^a-z0-9]', '', 'g')
          = regexp_replace(lower(r.name), '[^a-z0-9]', '', 'g');
      IF name_matches = 1 THEN
        SELECT m.id INTO target_id
        FROM public.members m
        WHERE regexp_replace(lower(m.name), '[^a-z0-9]', '', 'g')
            = regexp_replace(lower(r.name), '[^a-z0-9]', '', 'g');
      END IF;
    END IF;

    IF target_id IS NULL THEN
      INSERT INTO public.members (slug, name, role, team_id, is_head, is_leadership, sort_order)
      VALUES (
        r.slug, r.name,
        CASE WHEN r.role = 'Coordinator' THEN coordinator_role ELSE r.role END,
        r.team_id, r.is_head, r.is_leadership, r.sort_order
      );
    ELSE
      UPDATE public.members
      SET name = r.name,
          role = CASE WHEN r.role = 'Coordinator' THEN coordinator_role ELSE r.role END,
          team_id = r.team_id,
          is_head = r.is_head,
          is_leadership = r.is_leadership,
          sort_order = r.sort_order
      WHERE id = target_id;
    END IF;
  END LOOP;
END
$$;

ALTER TABLE public.members ENABLE TRIGGER guard_member_self_update;
