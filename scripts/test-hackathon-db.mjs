import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite");
const db = new PGlite();
await db.exec(`
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000099','Neal.Kottilingal.In@gmail.com',now()), ('00000000-0000-4000-8000-000000000098','outsider@example.test',now());
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE TABLE public.events(id uuid PRIMARY KEY, slug text UNIQUE, published boolean DEFAULT true);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_events ON public.events FOR SELECT TO authenticated USING (published);
GRANT SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
CREATE TABLE public.event_registrations(id uuid PRIMARY KEY, event_id uuid REFERENCES public.events(id), status text DEFAULT 'pending', reviewed_by uuid, reviewed_at timestamptz, form_data jsonb DEFAULT '{}', email text);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_registrations ON public.event_registrations FOR ALL TO authenticated USING (current_setting('test.staff',true) = 'yes') WITH CHECK (current_setting('test.staff',true) = 'yes');
GRANT ALL ON public.event_registrations TO authenticated, service_role;
CREATE TABLE public.event_announcements(id uuid PRIMARY KEY, event_id uuid REFERENCES public.events(id), title text, body text, published boolean DEFAULT true);
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_announcements ON public.event_announcements FOR SELECT TO authenticated,anon USING(published);
CREATE POLICY manage_announcements ON public.event_announcements FOR ALL TO authenticated USING(current_setting('test.staff',true) = 'yes') WITH CHECK(current_setting('test.staff',true) = 'yes');
GRANT SELECT ON public.event_announcements TO anon;
GRANT ALL ON public.event_announcements TO authenticated,service_role;
CREATE TABLE public.announcements(id uuid PRIMARY KEY);
INSERT INTO public.events VALUES ('00000000-0000-4000-8000-000000000001','build-with-sarvam',true), ('00000000-0000-4000-8000-000000000002','other',true);
INSERT INTO public.event_registrations(id,event_id,form_data,email) VALUES
('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','{"members":[{},{},{},{}]}','private@example.test'),
('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001','{"members":[{},{}]}','small@example.test'),
('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000002','{"members":[{},{},{},{}]}','other@example.test');
INSERT INTO public.event_announcements VALUES ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001','Public update','Public body',true);
`);
const sql = await readFile(
  new URL("../supabase/migrations/20261112000000_hackathon_live.sql", import.meta.url),
  "utf8",
);
await db.exec(sql);
await db.exec(sql); // Must be repeatable in SQL Editor.
const id = "00000000-0000-4000-8000-000000000011";
const reviewer = "00000000-0000-4000-8000-000000000099";
const outsider = "00000000-0000-4000-8000-000000000098";
const review = (status = "approved", who = reviewer) =>
  db.query("select review_sarvam_submission($1,$2,$3,$4,$5) as ok", [
    id,
    status,
    who,
    "",
    { to: ["private@example.test"], subject: "Decision" },
  ]);
await db.exec("SET ROLE authenticated; SET test.staff='yes';");
await db.query("select set_config('request.jwt.claim.sub',$1,false)", [outsider]);
assert.equal((await db.query("select is_hackathon_admin() as ok")).rows[0].ok, false);
assert.equal(
  (await db.query("select * from event_registrations where id=$1", [id])).rows.length,
  0,
);
assert.equal(
  (
    await db.query("update event_registrations set status='approved' where id=$1 returning id", [
      id,
    ])
  ).rows.length,
  0,
);
await assert.rejects(() => review(), /permission denied/);
assert.equal((await db.query("delete from event_announcements returning id")).rows.length, 0);
await assert.rejects(
  () => db.query("insert into admin_emails values ('outsider@example.test')"),
  /permission denied/,
);
await db.query("select set_config('request.jwt.claim.sub',$1,false)", [reviewer]);
assert.equal((await db.query("select is_hackathon_admin() as ok")).rows[0].ok, true);
assert.equal(
  (await db.query("select * from event_registrations where id=$1", [id])).rows.length,
  1,
);
assert.equal(
  (await db.query("update event_registrations set status='pending' where id=$1 returning id", [id]))
    .rows.length,
  1,
);
assert.equal(
  (await db.query("update event_announcements set title='Admin update' returning id")).rows.length,
  1,
);
await db.exec("SET ROLE anon;");
assert.equal((await db.query("select * from event_announcements")).rows.length, 1);
await assert.rejects(() => db.query("select * from hackathon_review_emails"), /permission denied/);
await db.exec("SET ROLE service_role;");
assert.equal((await review()).rows[0].ok, true);
assert.equal((await review()).rows[0].ok, false);
const claims = await Promise.all([
  db.query("select * from claim_sarvam_review_email($1)", [id]),
  db.query("select * from claim_sarvam_review_email($1)", [id]),
]);
assert.equal(
  claims.reduce((n, r) => n + r.rows.length, 0),
  1,
);
const claim = claims.find((r) => r.rows.length).rows[0];
await db.query("select complete_sarvam_review_email($1,$2)", [id, claim.claimed_at]);
assert.equal((await db.query("select * from claim_sarvam_review_email($1)", [id])).rows.length, 0);
await db.query("select queue_sarvam_reconsideration($1,true)", [id]);
assert.equal(
  (
    await db.query(
      "select reconsider_sarvam_submission($1,'rejected',$2,'Reconsidered',$3) as ok",
      [id, reviewer, { to: ["private@example.test"], subject: "Updated" }],
    )
  ).rows[0].ok,
  true,
);
const next = (
  await db.query("select * from hackathon_review_emails where registration_id=$1", [id])
).rows[0];
assert.notEqual(next.id, claim.id);
assert.equal(
  (await db.query("select * from hackathon_review_history where registration_id=$1", [id])).rows
    .length,
  1,
);
await db.query("select complete_sarvam_review_email($1,$2)", [id, claim.claimed_at]);
assert.equal(
  (await db.query("select email_sent_at from event_registrations where id=$1", [id])).rows[0]
    .email_sent_at,
  null,
);
await db.close();
console.log(
  "Live migration passed twice: seeded admin, RLS read/update/write restrictions, public announcements, duplicate decisions, email claims, reversal audit and stale completion protection.",
);
