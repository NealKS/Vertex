import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getHackathon, registerHackathonTeam } from "@/lib/hackathon.functions";
import { CountUp, ShinyText, TiltCard } from "@/components/motion-kit";
import { loadPass, mergePass, setTeamKey, type ParticipantPass } from "@/lib/participant";
import {
  SIH_2026_CONTACT_NAME,
  SIH_2026_CONTACT_PHONE,
  SIH_2026_FORM_URL,
  SIH_2026_GUIDELINES_URL,
  SIH_2026_INTERNAL_DATES,
  SIH_2026_INTERNAL_TIME,
  SIH_2026_INTERNAL_VENUE,
  SIH_2026_REGISTRATION_DEADLINE,
  SIH_2026_RULES,
  SIH_2026_SOURCE_URL,
  SIH_2026_THEME_NAMES,
  SIH_REGISTRATION_MODE,
} from "@/data/sih-2026";

const SIH_GALLERY_PHOTOS = [
  { src: "/sih-gallery-01.jpg", alt: "Ribbon-cutting ceremony at the hackathon" },
  { src: "/sih-gallery-02.jpg", alt: "Hackathon organisers and mentors with participants" },
  { src: "/sih-gallery-03.jpg", alt: "A wide view of the hackathon floor" },
  { src: "/sih-gallery-04.jpg", alt: "SIH hackathon group photo" },
  { src: "/sih-gallery-05.jpg", alt: "Hackathon opening ceremony" },
  { src: "/sih-gallery-06.jpg", alt: "Mentors speaking with a hackathon team" },
  { src: "/sih-gallery-07.jpg", alt: "Participants attending the hackathon briefing" },
] as const;

export const Route = createFileRoute("/events/sih-internal-hackathon/")({
  loader: () => getHackathon(),
  head: () => ({
    meta: [
      { title: "SIH Internal Hackathon — Vertex" },
      {
        name: "description",
        content:
          "The official Vertex workspace for SIH Internal Hackathon teams, submissions, milestones, and updates.",
      },
    ],
  }),
  component: HackathonPage,
});

function HackathonPage() {
  const data = Route.useLoaderData();
  const [registering, setRegistering] = useState(false);

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-6 py-32 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Workspace unavailable
          </p>
          <h1 className="mt-4 font-display text-5xl">SIH is being prepared.</h1>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { event, workspace, milestones, announcements, statements, roster } = data;
  const eventEnded = new Date() > new Date("2026-09-10T23:59:59+05:30");
  const registrationOpen = !eventEnded && Boolean(workspace?.registration_open);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere />
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
            <div className="chip w-fit rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
              <span
                className={`h-1.5 w-1.5 rounded-full ${eventEnded ? "bg-silver" : registrationOpen ? "bg-emerald-300 shadow-[0_0_12px_rgb(110,231,183)]" : "bg-amber-300"}`}
              />
              {eventEnded ? "Event ended" : registrationOpen ? "Registration open" : "Registration status pending"}
            </div>
            <picture>
              <source srcSet="/sih-2026-logo-480.webp 480w, /sih-2026-logo-720.webp 720w, /sih-2026-logo.png 1200w" type="image/webp" />
              <img
                src="/sih-2026-logo.png"
                alt="Smart India Hackathon 2026 — Ministry of Education, AICTE, MoE's Innovation Cell"
                width={480}
                height={52}
                className="mt-8 h-auto w-full max-w-md"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Vertex presents
                </p>
                <h1 className="text-silver-gradient mt-4 font-display text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-7xl">
                  SIH Internal
                  <br />
                  Hackathon.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {eventEnded
                    ? "The SIH Internal Hackathon has ended. Explore the official statements and view the final results below."
                    : SIH_REGISTRATION_MODE === "external"
                    ? `Register via the official Microsoft Form by ${SIH_2026_REGISTRATION_DEADLINE}. Explore the statements and themes below — then submit your team on the Form.`
                    : "Form your team, choose an official problem statement, build the idea, and submit it through one controlled workspace."}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {eventEnded ? (
                    <span className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      Event ended
                    </span>
                  ) : SIH_REGISTRATION_MODE === "external" ? (
                    <a
                      href={SIH_2026_FORM_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                    >
                      Register on Microsoft Forms <ArrowRight size={15} />
                    </a>
                  ) : registrationOpen ? (
                    <button
                      onClick={() => setRegistering(true)}
                      className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                    >
                      Register your team <ArrowRight size={15} />
                    </button>
                  ) : (
                    <span className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      Registration will open here
                    </span>
                  )}
                  <a
                    href="#statements"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Browse statements
                  </a>
                  <a
                    href="/events/sih-internal-hackathon/results"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    View results
                  </a>
                </div>
                {SIH_REGISTRATION_MODE === "external" && !eventEnded && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Deadline: {SIH_2026_REGISTRATION_DEADLINE} · Contact: {SIH_2026_CONTACT_NAME} — {SIH_2026_CONTACT_PHONE}
                  </p>
                )}
              </div>
              <div className="glass-panel edge-highlight rounded-2xl p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Event desk
                </div>
                <dl className="mt-5 grid gap-4 text-sm">
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Dates</dt>
                    <dd className="text-right">{SIH_2026_INTERNAL_DATES}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className="text-right">{SIH_2026_INTERNAL_TIME}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Venue</dt>
                    <dd className="max-w-[170px] text-right text-xs leading-4">{SIH_2026_INTERNAL_VENUE}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Deadline</dt>
                    <dd className="text-right font-mono text-xs">{SIH_2026_REGISTRATION_DEADLINE}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Team size</dt>
                    <dd>
                      {workspace
                        ? workspace.min_team_size === workspace.max_team_size
                          ? `Exactly ${workspace.min_team_size} members`
                          : `${workspace.min_team_size}–${workspace.max_team_size} members`
                        : "To be confirmed"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Problem statements</dt>
                    <dd>{statements.length || "Being verified"}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="text-right text-xs">{SIH_2026_CONTACT_NAME} — {SIH_2026_CONTACT_PHONE}</dd>
                  </div>
                </dl>
                {SIH_REGISTRATION_MODE === "external" && !eventEnded && (
                  <a
                    href={SIH_2026_FORM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary mt-5 w-full justify-center rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
                  >
                    Open registration form <ArrowRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {SIH_REGISTRATION_MODE === "external" && !eventEnded && (
          <section className="border-y border-hairline bg-surface-2">
            <div className="mx-auto max-w-6xl px-6 py-8">
              <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver">
                    SIH 2026 · Registration
                  </p>
                  <h2 className="mt-2 font-display text-2xl">Registration is on Microsoft Forms.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    This site now shows the official problem statements, themes and updates. To register
                    your team for the REVA internal hackathon ({SIH_2026_INTERNAL_DATES}, {SIH_2026_INTERNAL_TIME}), use the official Form. Last date: {SIH_2026_REGISTRATION_DEADLINE}.
                  </p>
                </div>
                <a
                  href={SIH_2026_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary shrink-0 rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                >
                  Register here — Forms <ArrowRight size={15} />
                </a>
              </div>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                For queries: {SIH_2026_CONTACT_NAME} · {SIH_2026_CONTACT_PHONE}
              </p>
            </div>
          </section>
        )}

        {SIH_REGISTRATION_MODE === "internal" && registering && workspace && (
          <Registration statements={statements} onClose={() => setRegistering(false)} />
        )}

        <TabbedWorkspace
          statements={statements}
          announcements={announcements}
          milestones={milestones}
          roster={roster}
          eventEnded={eventEnded}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function Registration({
  statements,
  onClose,
}: {
  statements: {
    id: string;
    statement_code: string;
    title: string;
    theme: string | null;
  }[];
  onClose: () => void;
}) {
  const register = useServerFn(registerHackathonTeam);
  const [submitting, setSubmitting] = useState(false);
  const [pass, setPass] = useState<ParticipantPass | null>(null);
  const [success, setSuccess] = useState<{
    teamName: string;
    token: string;
    joinCode: string;
    checkinCode: string;
  } | null>(null);

  useEffect(() => setPass(loadPass()), []);

  const joinLink = success
    ? `${window.location.origin}/events/sih-internal-hackathon/join?code=${success.joinCode}`
    : "";
  const whatsappLink = success
    ? `https://wa.me/?text=${encodeURIComponent(`Join my SIH team "${success.teamName}" — open this link and enter your details: ${joinLink}`)}`
    : "";

  if (success)
    return (
      <section className="relative border-y border-hairline bg-surface-2">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="glass-strong rounded-2xl p-7 text-center">
            <Check className="mx-auto h-9 w-9 rounded-full bg-emerald-300 p-2 text-black" />
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-silver">
              Team registered
            </p>
            <h2 className="mt-3 font-display text-4xl">{success.teamName}</h2>

            <div className="mt-7 grid gap-4 text-left sm:grid-cols-2">
              <div className="surface-card rounded-xl p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  1 · Invite your team
                </p>
                <p className="mt-2 font-mono text-lg tracking-widest">{success.joinCode}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Share this code or the invite link. Teammates open it and enter their own details
                  until the roster reaches 6.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary rounded-lg px-3 py-2 font-mono text-[9px] uppercase tracking-widest"
                  >
                    Share on WhatsApp
                  </a>
                  <button
                    onClick={() =>
                      navigator.clipboard
                        .writeText(joinLink)
                        .then(() => toast.success("Invite link copied."))
                    }
                    className="btn-ghost rounded-lg px-3 py-2 font-mono text-[9px] uppercase tracking-widest"
                  >
                    <Copy size={12} /> Copy link
                  </button>
                  <button
                    onClick={() =>
                      navigator.clipboard
                        .writeText(success.joinCode)
                        .then(() => toast.success("Join code copied."))
                    }
                    className="btn-ghost rounded-lg px-3 py-2 font-mono text-[9px] uppercase tracking-widest"
                  >
                    Copy code
                  </button>
                </div>
              </div>
              <div className="surface-card rounded-xl p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  2 · Keep your team key
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  This private key opens your team console — roster, submissions, updates. It is
                  shown once; store it somewhere safe.
                </p>
                <button
                  onClick={() =>
                    navigator.clipboard
                      .writeText(success.token)
                      .then(() => toast.success("Team key copied."))
                  }
                  className="btn-primary mt-3 rounded-lg px-3 py-2 font-mono text-[9px] uppercase tracking-widest"
                >
                  <Copy size={12} /> Copy team key
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="rounded-xl bg-white p-4">
                <QRCodeSVG
                  value={success.checkinCode}
                  size={150}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <p className="max-w-md text-xs leading-5 text-muted-foreground">
                Event-day check-in QR — save it or screenshot it. It cannot edit your team.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/events/sih-internal-hackathon/team"
                className="btn-primary rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
              >
                Open team console <ArrowRight size={14} />
              </Link>
              <button
                onClick={onClose}
                className="btn-ghost rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </section>
    );

  return (
    <section id="register" className="border-y border-hairline bg-surface-2">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver">
              Step one · 30 seconds
            </p>
            <h2 className="mt-2 font-display text-4xl">Register as team lead.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Only your own details are needed now. You will get an invite link to share — your
              teammates fill in their own information and the roster locks at 6.
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <form
          className="glass-panel mt-8 rounded-2xl p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSubmitting(true);
            try {
              const result = await register({
                data: {
                  name: String(form.get("teamName")),
                  leadName: String(form.get("leadName")),
                  leadEmail: String(form.get("leadEmail")),
                  leadGender: String(form.get("leadGender")) as
                    "female" | "male" | "prefer_not_to_say",
                  leadPhone: String(form.get("leadPhone")),
                  leadSrn: String(form.get("leadSrn")),
                  leadBranch: String(form.get("leadBranch")),
                  leadYear: String(form.get("leadYear")),
                  problemStatementId: String(form.get("problemStatementId")),
                },
              });
              sessionStorage.removeItem("vertex-sih-team-key");
              setTeamKey(result.token);
              mergePass({
                name: String(form.get("leadName")),
                email: String(form.get("leadEmail")),
                gender: String(form.get("leadGender")) as ParticipantPass["gender"],
                phone: String(form.get("leadPhone")),
                srn: String(form.get("leadSrn")),
                branch: String(form.get("leadBranch")),
                year: String(form.get("leadYear")),
              });
              setSuccess(result);
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Registration failed. Please try again.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field name="teamName" label="Team name" required />
            <Field name="leadName" label="Your full name" required defaultValue={pass?.name} />
            <Field
              name="leadEmail"
              label="Your email"
              type="email"
              required
              defaultValue={pass?.email}
            />
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Gender (SIH eligibility)
              </span>
              <select
                name="leadGender"
                defaultValue={pass?.gender ?? "prefer_not_to_say"}
                className="field-input rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
            <Field name="leadSrn" label="SRN" defaultValue={pass?.srn} />
            <Field name="leadPhone" label="Phone" defaultValue={pass?.phone} />
            <Field name="leadBranch" label="Branch" defaultValue={pass?.branch} />
            <Field name="leadYear" label="Year" defaultValue={pass?.year} />
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Problem statement (optional — you can change it later in the team console)
              </span>
              <select
                name="problemStatementId"
                defaultValue=""
                className="field-input rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">Decide later</option>
                {statements.map((statement) => (
                  <option key={statement.id} value={statement.id}>
                    {statement.statement_code} · {statement.title.slice(0, 80)}
                    {statement.theme ? ` — ${statement.theme}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            disabled={submitting}
            className="btn-primary mt-8 rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50"
          >
            {submitting ? "Registering…" : "Create team & get invite link"} <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </section>
  );
}
function Field({
  name,
  label,
  type = "text",
  required = false,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="field-input rounded-lg px-3 py-2.5 text-sm"
      />
    </label>
  );
}
function Eyebrow({ number, label, title }: { number: string; label: string; title: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
        {number} · {label}
      </div>
      <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">{title}</h2>
    </div>
  );
}

const TABS_INTERNAL = [
  { id: "updates", label: "Updates & Rules" },
  { id: "statements", label: "Problem Statements" },
  { id: "themes", label: "Themes" },
  { id: "teams", label: "Teams" },
] as const;
const TABS_EXTERNAL = [
  { id: "updates", label: "Updates & Rules" },
  { id: "statements", label: "Problem Statements" },
  { id: "themes", label: "Themes" },
] as const;
const TABS = (SIH_REGISTRATION_MODE === "external" ? TABS_EXTERNAL : TABS_INTERNAL) as typeof TABS_INTERNAL;
type TabId = (typeof TABS)[number]["id"];

function TabbedWorkspace({
  statements,
  announcements,
  milestones,
  roster,
  eventEnded,
}: {
  statements: {
    id: string;
    statement_code: string;
    title: string;
    organization: string | null;
    category: string | null;
    theme: string | null;
    description: string | null;
  }[];
  announcements: { id: string; title: string; body: string }[];
  milestones: {
    id: string;
    title: string;
    description: string | null;
    starts_at: string | null;
  }[];
  roster: {
    id: string;
    name: string;
    status: string;
    members: { name: string; branch: string | null; year: string | null; isLead: boolean }[];
  }[];
  eventEnded: boolean;
}) {
  const [tab, setTab] = useState<TabId>("updates");
  const themes = [
    ...new Set(statements.map((s) => s.theme).filter((t): t is string => Boolean(t))),
  ].sort();

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="sticky top-[57px] z-30 -mx-6 border-b border-hairline bg-background/85 px-6 py-3 backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                tab === item.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              {item.id === "statements" && statements.length > 0 && (
                <span className="ml-2 opacity-60">{statements.length}</span>
              )}
              {item.id === "teams" && roster.length > 0 && (
                <span className="ml-2 opacity-60">{roster.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {tab === "updates" && (
          <UpdatesTab announcements={announcements} milestones={milestones} eventEnded={eventEnded} />
        )}
        {tab === "statements" && <StatementsTab statements={statements} themes={themes} />}
        {tab === "themes" && <ThemesTab counts={countByTheme(statements)} />}
        {SIH_REGISTRATION_MODE === "internal" && tab === "teams" && <TeamsTab roster={roster} />}
      </div>
    </section>
  );
}

function countByTheme(statements: { theme: string | null }[]) {
  const counts = new Map<string, number>();
  for (const statement of statements) {
    if (!statement.theme) continue;
    counts.set(statement.theme, (counts.get(statement.theme) ?? 0) + 1);
  }
  return counts;
}

function UpdatesTab({
  announcements,
  milestones,
  eventEnded,
}: {
  announcements: { id: string; title: string; body: string }[];
  milestones: { id: string; title: string; description: string | null; starts_at: string | null }[];
  eventEnded: boolean;
}) {
  return (
    <div className="space-y-12">
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-silver">
            <Users size={14} /> Faculty coordinator
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-mono text-sm font-bold">
              KM
            </div>
            <div>
              <p className="font-display text-[18px] font-semibold leading-tight text-foreground">Prof. Kiran M</p>
              <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-silver">
                SPOC — SIH 2026 · REVA University
              </p>
              <p className="mt-2 text-[13px] font-medium leading-5 text-foreground">
                Head of Department, Artificial Intelligence &amp; Data Science
              </p>
              <p className="text-[12px] leading-5 text-muted-foreground">
                School of Computer Science and Engineering
              </p>
              <a href="tel:9035505082" className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 font-mono text-[11px] font-bold tracking-widest text-background">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> 9035505082
              </a>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-2xl p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-silver">
            <FileText size={14} /> Rules
          </div>
          <ul className="mt-4 space-y-3 text-[13px] font-medium leading-6 text-foreground">
            {SIH_2026_RULES.map((rule) => (
              <li key={rule} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-silver" />
                <span className="text-foreground">{rule}</span>
              </li>
            ))}
          </ul>
          <a
            href={SIH_2026_GUIDELINES_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost mt-5 inline-flex rounded-lg px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest"
          >
            Read official SIH guidelines
          </a>
        </div>
        {SIH_REGISTRATION_MODE === "external" ? (
          <div className="rounded-2xl bg-foreground p-6 text-background shadow-lg">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-white/70">
              <Users size={14} /> {eventEnded ? "Event status" : "Registration"}
            </div>
            <p className="mt-3 font-display text-xl font-semibold leading-tight text-white">
              {eventEnded ? "Event ended" : "On Microsoft Forms"}
            </p>
            <p className="mt-2 text-[13px] font-medium leading-6 text-white/80">
              {eventEnded
                ? "Registration is closed. The final nominated and waitlisted teams are published on the results page."
                : "Register for the REVA internal hackathon via the official Form. Choose your problem statement here, then submit on the Form."}
            </p>
            <div className="mt-4 grid gap-2 border-y border-white/15 py-3 font-mono text-[11px]">
              <div className="flex justify-between gap-2"><span className="text-white/60">Deadline</span><span className="font-bold text-white">{SIH_2026_REGISTRATION_DEADLINE}</span></div>
              <div className="flex justify-between gap-2"><span className="text-white/60">Dates</span><span className="font-bold text-white">{SIH_2026_INTERNAL_DATES}</span></div>
              <div className="text-white/80 leading-4"><span className="text-white/60">Venue</span> <span className="font-medium text-white">{SIH_2026_INTERNAL_VENUE}</span></div>
            </div>
            {!eventEnded && (
              <a
                href={SIH_2026_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full justify-center rounded-lg bg-white px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-foreground hover:bg-white/90"
              >
                Open Form <ArrowRight size={14} />
              </a>
            )}
            <p className="mt-3 text-center font-mono text-[10px] font-semibold uppercase tracking-widest text-white/60">
              Queries: {SIH_2026_CONTACT_NAME} · {SIH_2026_CONTACT_PHONE}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-silver">
              <Users size={14} /> Team access
            </div>
            <p className="mt-4 text-[13px] font-medium leading-7 text-foreground">
              Already registered? Open the private team console with the team key you saved at
              registration — invites, roster, and submissions live there.
            </p>
            <Link
              to="/events/sih-internal-hackathon/team"
              className="btn-ghost mt-5 inline-flex rounded-lg px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest"
            >
              Open team console <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
      <HackathonGallery />
      {(announcements.length > 0 || milestones.length > 0) && (
        <div className="grid gap-8 lg:grid-cols-2">
          {announcements.length > 0 && (
            <div>
              <h2 className="font-display text-2xl">Announcements</h2>
              <div className="mt-4 grid gap-3">
                {announcements.map((item) => (
                  <article key={item.id} className="surface-card rounded-xl p-5">
                    <h3 className="font-display text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
          {milestones.length > 0 && (
            <div>
              <h2 className="font-display text-2xl">Timeline</h2>
              <ol className="mt-4 border-l border-hairline pl-5">
                {milestones.map((item) => (
                  <li
                    key={item.id}
                    className="relative pb-6 before:absolute before:-left-[1.4rem] before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-silver"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-widest text-silver">
                      {item.starts_at
                        ? new Date(item.starts_at).toLocaleDateString()
                        : "Date to be announced"}
                    </div>
                    <h3 className="mt-1 font-display text-lg">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HackathonGallery() {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const showPrevious = useCallback(() => {
    setActivePhotoIndex((index) =>
      index === null ? null : (index - 1 + SIH_GALLERY_PHOTOS.length) % SIH_GALLERY_PHOTOS.length,
    );
  }, []);
  const showNext = useCallback(() => {
    setActivePhotoIndex((index) =>
      index === null ? null : (index + 1) % SIH_GALLERY_PHOTOS.length,
    );
  }, []);
  const closeLightbox = useCallback(() => setActivePhotoIndex(null), []);

  const renderPhotoSet = (duplicate = false) => (
    <div className="sih-gallery-set" aria-hidden={duplicate}>
      {SIH_GALLERY_PHOTOS.map((photo, index) =>
        duplicate ? (
          <figure className="sih-gallery-card" key={`duplicate-${photo.src}-${index}`}>
            <img
              src={photo.src}
              alt=""
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </figure>
        ) : (
          <button
            aria-label={`View photo ${index + 1}: ${photo.alt}`}
            className="sih-gallery-card"
            key={photo.src}
            onClick={() => setActivePhotoIndex(index)}
            type="button"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </button>
        ),
      )}
    </div>
  );

  return (
    <section aria-label="SIH hackathon photo gallery" className="overflow-hidden">
      <Eyebrow number="04" label="Event moments" title="Built together." />
      <div className="sih-gallery-viewport mt-6" aria-label="SIH hackathon photo gallery">
        <div className="sih-gallery-track">
          {renderPhotoSet()}
          {renderPhotoSet(true)}
        </div>
      </div>
      {activePhotoIndex !== null && (
        <HackathonGalleryLightbox
          photoIndex={activePhotoIndex}
          onClose={closeLightbox}
          onNext={showNext}
          onPrevious={showPrevious}
        />
      )}
    </section>
  );
}

function HackathonGalleryLightbox({
  photoIndex,
  onClose,
  onPrevious,
  onNext,
}: {
  photoIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const photo = SIH_GALLERY_PHOTOS[photoIndex];
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, onNext, onPrevious]);

  return (
    <div
      aria-label="Hackathon photo viewer"
      aria-modal="true"
      className="sih-gallery-lightbox fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="sih-gallery-lightbox-panel relative flex max-h-full w-full max-w-6xl flex-col rounded-2xl border border-white/15 bg-[#101211] p-3 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            Photo {photoIndex + 1} of {SIH_GALLERY_PHOTOS.length}
          </p>
          <button
            aria-label="Close photo viewer"
            className="sih-gallery-lightbox-control"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={18} />
            <span>Close</span>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <img
            key={photo.src}
            alt={photo.alt}
            className="max-h-[calc(100dvh-10rem)] max-w-full rounded-lg object-contain"
            decoding="async"
            src={photo.src}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 sm:mt-4">
          <button
            aria-label="Previous photo"
            className="sih-gallery-lightbox-control"
            onClick={onPrevious}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={18} />
            <span>Previous</span>
          </button>
          <p className="hidden max-w-[60%] truncate text-center text-xs text-white/60 sm:block">
            {photo.alt}
          </p>
          <button
            aria-label="Next photo"
            className="sih-gallery-lightbox-control"
            onClick={onNext}
            type="button"
          >
            <span>Next</span>
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatementsTab({
  statements,
  themes,
}: {
  statements: {
    id: string;
    statement_code: string;
    title: string;
    organization: string | null;
    category: string | null;
    theme: string | null;
    description: string | null;
  }[];
  themes: string[];
}) {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("");
  const [category, setCategory] = useState<"" | "Software" | "Hardware">("");
  const [organization, setOrganization] = useState("");
  const [active, setActive] = useState<{
    code: string;
    title: string;
    org: string | null;
    theme: string | null;
    category: string | null;
    description: string | null;
  } | null>(null);

  const organizations = [
    ...new Set(statements.map((s) => s.organization).filter((o): o is string => Boolean(o))),
  ].sort();
  const themeCounts = new Map<string, number>();
  for (const s of statements)
    if (s.theme) themeCounts.set(s.theme, (themeCounts.get(s.theme) ?? 0) + 1);
  const hwCount = statements.filter((s) => s.category === "Hardware").length;

  const filtered = statements.filter((statement) => {
    if (category && statement.category !== category) return false;
    if (theme && statement.theme !== theme) return false;
    if (organization && statement.organization !== organization) return false;
    if (query) {
      const haystack =
        `${statement.statement_code} ${statement.title} ${statement.organization ?? ""} ${statement.theme ?? ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const clearAll = () => {
    setQuery("");
    setTheme("");
    setCategory("");
    setOrganization("");
  };
  const filtersOn = Boolean(query || theme || category || organization);

  return (
    <div>
      {/* Filter rail */}
      <div className="glass-panel sticky top-[110px] z-20 space-y-3 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search code, title, ministry…"
            className="field-input min-w-[200px] flex-1 rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex overflow-hidden rounded-lg border border-hairline">
            {(
              [
                ["", "All"],
                ["Software", "Software"],
                ["Hardware", "Hardware"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value || "all"}
                onClick={() => setCategory(value)}
                className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  category === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {value === "Hardware" && ` ${hwCount}`}
              </button>
            ))}
          </div>
          <select
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            className="field-input max-w-[220px] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All ministries</option>
            {organizations.map((org) => (
              <option key={org} value={org}>
                {org.length > 44 ? `${org.slice(0, 44)}…` : org}
              </option>
            ))}
          </select>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {filtered.length} / {statements.length}
          </span>
          {filtersOn && (
            <button
              onClick={clearAll}
              className="font-mono text-[10px] uppercase tracking-widest text-silver hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            onClick={() => setTheme("")}
            className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              theme === ""
                ? "border-silver text-foreground"
                : "border-hairline text-muted-foreground hover:border-silver"
            }`}
          >
            All tracks
          </button>
          {themes.map((item) => (
            <button
              key={item}
              onClick={() => setTheme(theme === item ? "" : item)}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                theme === item
                  ? "border-silver text-foreground"
                  : "border-hairline text-muted-foreground hover:border-silver"
              }`}
            >
              {item}
              <span className="ml-1.5 opacity-60">{themeCounts.get(item) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setActive({
                  code: item.statement_code,
                  title: item.title,
                  org: item.organization,
                  theme: item.theme,
                  category: item.category,
                  description: item.description,
                })
              }
              className="surface-card rounded-xl p-4 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="chip rounded-md px-2 py-0.5 font-mono text-[10px] text-silver">
                  {item.statement_code}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                    item.category === "Hardware"
                      ? "bg-amber-300/15 text-amber-300"
                      : "bg-emerald-300/10 text-emerald-300"
                  }`}
                >
                  {item.category === "Hardware" ? "HW" : "SW"}
                </span>
              </div>
              <h3 className="mt-3 line-clamp-2 font-display text-[15px] leading-snug">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{item.organization}</p>
              {item.theme && (
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-silver">
                  {item.theme}
                </p>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="glass-panel mt-6 rounded-2xl p-8 text-center">
          <p className="font-display text-2xl">Nothing matches those filters.</p>
          <button
            onClick={clearAll}
            className="btn-ghost mt-4 rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
          >
            Clear filters
          </button>
        </div>
      )}

      {active && <StatementModal statement={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function StatementModal({
  statement,
  onClose,
}: {
  statement: {
    code: string;
    title: string;
    org: string | null;
    theme: string | null;
    category: string | null;
    description: string | null;
  };
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="glass-strong max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip rounded-md px-2 py-1 font-mono text-[10px] text-silver">
              {statement.code}
            </span>
            {statement.category && (
              <span className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {statement.category}
              </span>
            )}
            {statement.theme && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                {statement.theme}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <h2 className="mt-4 font-display text-2xl leading-tight">{statement.title}</h2>
        {statement.org && <p className="mt-2 text-sm text-muted-foreground">{statement.org}</p>}
        {statement.description ? (
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {statement.description}
          </p>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            Full description available on the official SIH portal.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={`https://sih.gov.in/sih2026PS`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
          >
            Verify on sih.gov.in
          </a>
          <button
            onClick={() =>
              navigator.clipboard
                .writeText(`${statement.code} — ${statement.title}${statement.org ? ` — ${statement.org}` : ""} — https://sih.gov.in/sih2026PS`)
                .then(() => toast.success("Statement copied."))
            }
            className="rounded-lg border border-hairline bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-silver hover:text-foreground"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
function ThemesTab({ counts }: { counts: Map<string, number> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SIH_2026_THEME_NAMES.map((theme) => (
        <a
          key={theme}
          href={SIH_2026_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="surface-card flex items-center justify-between rounded-xl p-4"
        >
          <span className="text-sm">{theme}</span>
          {counts.get(theme) ? (
            <span className="chip rounded-md px-2 py-1 font-mono text-[10px] text-silver">
              {counts.get(theme)}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  registered: "border-hairline text-muted-foreground",
  in_review: "border-sky-300/40 text-sky-300",
  shortlisted: "border-amber-300/50 text-amber-300",
  selected: "border-emerald-300/50 text-emerald-300",
  waitlisted: "border-purple-300/40 text-purple-300",
  rejected: "border-red-400/40 text-red-300",
  withdrawn: "border-hairline text-muted-foreground line-through",
};

function TeamsTab({
  roster,
}: {
  roster: {
    id: string;
    name: string;
    status: string;
    members: { name: string; branch: string | null; year: string | null; isLead: boolean }[];
  }[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filtered = roster.filter((team) => {
    if (status && team.status !== status) return false;
    if (query) {
      const haystack = `${team.name} ${team.members.map((m) => m.name).join(" ")}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const totalStudents = roster.reduce((sum, team) => sum + team.members.length, 0);
  const fullTeams = roster.filter((team) => team.members.length >= 6).length;

  return (
    <div>
      {roster.length > 0 && (
        <div className="grid max-w-3xl grid-cols-3 gap-px border border-hairline bg-hairline">
          <div className="bg-background p-4">
            <div className="font-display text-3xl tracking-tight">
              <CountUp to={roster.length} />
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Teams
            </div>
          </div>
          <div className="bg-background p-4">
            <div className="font-display text-3xl tracking-tight">
              <CountUp to={totalStudents} />
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Students
            </div>
          </div>
          <div className="bg-background p-4">
            <div className="font-display text-3xl tracking-tight">
              <CountUp to={fullTeams} suffix="/6" />
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Full rosters
            </div>
          </div>
        </div>
      )}

      {roster.length > 3 && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a team or teammate…"
            className="field-input min-w-[220px] flex-1 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="field-input rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {["registered", "in_review", "shortlisted", "selected", "waitlisted"].map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <ShinyText
            text={`${filtered.length} shown`}
            className="font-mono text-[10px] uppercase tracking-widest"
          />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((team) => (
            <Reveal key={team.id}>
              <TiltCard>
                <article className="glare-card surface-card flex h-full flex-col rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl leading-tight">{team.name}</h3>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                        STATUS_STYLES[team.status] ?? STATUS_STYLES.registered
                      }`}
                    >
                      {team.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  {/* Roster slots */}
                  <div className="mt-4 flex items-center gap-1.5">
                    {Array.from({ length: 6 }).map((_, slot) => {
                      const member = team.members[slot];
                      return (
                        <span
                          key={slot}
                          title={member ? member.name : "Open slot"}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[9px] ${
                            member
                              ? member.isLead
                                ? "border-accent/60 bg-accent/10 text-accent"
                                : "border-hairline bg-surface-2 text-muted-foreground"
                              : "border-dashed border-hairline text-transparent"
                          }`}
                        >
                          {member
                            ? member.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : "+"}
                        </span>
                      );
                    })}
                    <span className="ml-1 font-mono text-[10px] tracking-widest text-muted-foreground">
                      {team.members.length}/6
                    </span>
                  </div>

                  <div className="mt-4 border-t border-hairline pt-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {team.members
                        .map((member) => `${member.name}${member.isLead ? " · lead" : ""}`)
                        .join(" · ")}
                    </p>
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="glass-panel mt-6 rounded-2xl p-8 text-center">
          <p className="font-display text-2xl">
            {roster.length === 0 ? "No teams registered yet." : "No teams match that search."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {roster.length === 0
              ? "Be the first — hit “Register your team” above."
              : "Try a different name or clear the status filter."}
          </p>
        </div>
      )}
    </div>
  );
}
