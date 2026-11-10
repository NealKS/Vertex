import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  KeyRound,
  Lock,
  MapPin,
  PlusCircle,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  hackathonWorkspaceData,
  type HackathonFaq,
  type HackathonPhase,
  type HackathonProblemStatement,
  type HackathonResult,
  type HackathonRule,
  type HackathonTheme,
  type HackathonTrack,
} from "@/data/hackathon-workspace";
import {
  getHackathonWorkspaceRegistrations,
  getHackathonWorkspaceViewer,
  registerForHackathonWorkspace,
  type RegistrationRecord,
} from "@/lib/hackathon-workspace.functions";

type WorkspaceTab =
  | "event-desk"
  | "registration"
  | "rules"
  | "problem-statements"
  | "themes"
  | "faqs"
  | "results";

export const Route = createFileRoute("/hackathon-workspace")({
  head: () => ({
    meta: [
      { title: "Hackathon Workspace — Vertex" },
      {
        name: "description",
        content:
          "The unified Hackathon Workspace across all four tracks: Sarvam AI, Abscissa, Open Innovation, and Partner Track.",
      },
    ],
  }),
  component: HackathonWorkspacePage,
});

function HackathonWorkspacePage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("event-desk");
  const [selectedTrackId, setSelectedTrackId] = useState(hackathonWorkspaceData.tracks[0].id);

  // Administrative State (Verified via Supabase Session)
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizerInfo, setOrganizerInfo] = useState<{
    name: string;
    roles: string[];
  } | null>(null);

  // Configurable Workspace Entities
  const [workspaceInfo, setWorkspaceInfo] = useState({
    title: hackathonWorkspaceData.title,
    description: hackathonWorkspaceData.description,
    registrationDeadline: hackathonWorkspaceData.registrationDeadline,
    eventDateLabel: hackathonWorkspaceData.eventDateLabel,
    registrationOpen: hackathonWorkspaceData.registrationStatus === "Open",
  });
  const [tracks, setTracks] = useState<HackathonTrack[]>([...hackathonWorkspaceData.tracks]);
  const [phases, setPhases] = useState<HackathonPhase[]>([...hackathonWorkspaceData.phases]);
  const [rules, setRules] = useState<HackathonRule[]>([...hackathonWorkspaceData.rules]);
  const [themes, setThemes] = useState<HackathonTheme[]>([...hackathonWorkspaceData.themes]);
  const [problemStatements, setProblemStatements] = useState<
    Record<string, HackathonProblemStatement[]>
  >({ ...hackathonWorkspaceData.problemStatements });
  const [results, setResults] = useState<HackathonResult[]>([...hackathonWorkspaceData.results]);

  // Registrations state
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [recentPass, setRecentPass] = useState<RegistrationRecord | null>(null);

  // Registration Form State
  const [regType, setRegType] = useState<"individual" | "team">("individual");
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; email: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const registerFn = useServerFn(registerForHackathonWorkspace);
  const checkViewerFn = useServerFn(getHackathonWorkspaceViewer);
  const getRegistrationsFn = useServerFn(getHackathonWorkspaceRegistrations);

  // Check verified organizer session on mount
  useEffect(() => {
    let mounted = true;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(async ({ data }) => {
        if (!mounted) return;
        if (data.session) {
          try {
            const viewer = await checkViewerFn();
            if (viewer.isOrganizer && mounted) {
              setIsAdmin(true);
              setOrganizerInfo({ name: viewer.name, roles: viewer.roles });
              try {
                const list = await getRegistrationsFn();
                if (mounted) setRegistrations(list);
              } catch {
                // Non-fatal if list fetch fails
              }
            }
          } catch {
            // Not staff or session unverified
          }
        }
      });
    });
    return () => {
      mounted = false;
    };
  }, [checkViewerFn, getRegistrationsFn]);

  const handleRegistrationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    const participantName = String(form.get("participantName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const collegeOrUsn = String(form.get("collegeOrUsn") || "").trim();
    const teamName = String(form.get("teamName") || "").trim();
    const track = String(form.get("track") || hackathonWorkspaceData.tracks[0].name) as
      | "SARVAM AI"
      | "ABSCISSA"
      | "OPEN INNOVATION"
      | "TO BE ANNOUNCED";

    if (!participantName || !email) {
      toast.error("Please fill in your name and email.");
      setSubmitting(false);
      return;
    }

    if (regType === "team" && !teamName) {
      toast.error("Please provide a team name for team registration.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await registerFn({
        data: {
          registrationType: regType,
          participantName,
          email,
          phone,
          collegeOrUsn,
          teamName: regType === "team" ? teamName : undefined,
          teamSize: regType === "team" ? teamMembers.length + 1 : 1,
          teamMembers,
          track,
        },
      });

      if (res && res.success) {
        setRecentPass(res.registration);
        setRegistrations((prev) => [res.registration, ...prev]);
        toast.success("Registration successfully submitted!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Results: Draft results are NEVER shown to public users
  const visibleResults = isAdmin
    ? results
    : results.filter((result) => result.status === "published");

  const selectedTrack =
    tracks.find((track) => track.id === selectedTrackId) ?? tracks[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-14">
        {/* Organizer Bar Notification */}
        {isAdmin && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 font-mono text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>
                ORGANIZER DESK ACTIVE: Authenticated as {organizerInfo?.name || "Staff"} (
                {organizerInfo?.roles.join(", ") || "Organizer"}).
              </span>
            </div>
            <Link
              to="/admin"
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[10px] uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/30"
            >
              Open Admin Console →
            </Link>
          </div>
        )}

        {/* Header Hero Banner */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-hairline bg-card p-6 shadow-2xl md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-silver">
                <span>Unified Workspace</span>
                <span>•</span>
                <span>4 Tracks</span>
                <span>•</span>
                <span>Online + On-site</span>
                <span
                  className={`ml-2 rounded-full border px-2 py-0.5 text-[9px] ${
                    workspaceInfo.registrationOpen
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/40 bg-red-500/10 text-red-400"
                  }`}
                >
                  Registration {workspaceInfo.registrationOpen ? "Open" : "Closed"}
                </span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                {workspaceInfo.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {workspaceInfo.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isAdmin ? (
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-background/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:border-silver hover:text-foreground"
                  title="Organizers sign in with verified Vertex credentials"
                >
                  <KeyRound size={14} /> Organizer Sign In
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-card px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-emerald-300 hover:border-emerald-500"
                >
                  <ShieldCheck size={14} /> {organizerInfo?.name ?? "Staff"} (Admin Console)
                </Link>
              )}

              <Link
                to="/events/hackathon-workspace"
                className="inline-flex items-center gap-2 rounded-xl border border-silver bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-background transition hover:opacity-90"
              >
                Public Event Page <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-hairline pb-4">
          {[
            { id: "event-desk", label: "A. Event Desk" },
            { id: "registration", label: "B. Registration" },
            { id: "rules", label: "C. Rules" },
            { id: "problem-statements", label: "D. Problem Statements" },
            { id: "themes", label: "E. Themes" },
            { id: "faqs", label: "F. FAQs & Resources" },
            { id: "results", label: "G. Results" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as WorkspaceTab)}
              className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
                activeTab === tab.id
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-hairline bg-card/60 text-muted-foreground hover:border-silver hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB A: EVENT DESK */}
        {activeTab === "event-desk" && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Registration"
                value={workspaceInfo.registrationOpen ? "Open (Online)" : "Closed"}
                subtext={`Closes: ${workspaceInfo.registrationDeadline}`}
              />
              <MetricCard
                label="Participating Tracks"
                value="4 Tracks"
                subtext="Sarvam AI, Abscissa, Open, Partner"
              />
              <MetricCard
                label="Event Schedule"
                value={workspaceInfo.eventDateLabel}
                subtext="Phase 1 Online & Phase 2 On-Site"
              />
              <MetricCard
                label="Format"
                value="Hybrid Sprint"
                subtext="REVA University Campus + Discord"
              />
            </div>

            {/* Two-Phase Hackathon Structure */}
            <section className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                <Clock3 size={15} /> Two-Phase Hackathon Structure
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                Online Sprint &amp; On-Site Grand Finale
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Both phases belong to the same unified hackathon and share the same 4 tracks and evaluation pipeline.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {phases.map((phase) => (
                  <div
                    key={phase.id}
                    className="relative flex flex-col justify-between rounded-2xl border border-hairline bg-background p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                          {phase.type === "online" ? "Virtual Phase" : "Physical Phase"}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                            phase.status === "Active"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : phase.status === "Completed"
                                ? "border-slate-500/40 bg-slate-500/10 text-slate-400"
                                : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {phase.status}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-2xl font-semibold">{phase.name}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {phase.description}
                      </p>

                      <div className="mt-4 space-y-2 border-t border-hairline pt-3 font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarRange size={14} className="text-silver" />
                          <span>Dates: {phase.startDate} – {phase.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-silver" />
                          <span>Venue: {phase.venue}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                          Key Requirements
                        </span>
                        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                          {phase.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-silver" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {phase.checkInInstructions && (
                        <div className="mt-4 rounded-xl border border-hairline bg-card/60 p-3 text-xs text-muted-foreground">
                          <span className="font-mono text-[10px] uppercase text-silver">Check-in Instructions: </span>
                          {phase.checkInInstructions}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-hairline flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveTab("registration")}
                        className="rounded-lg border border-hairline bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-silver"
                      >
                        Register for Phase →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Four Participating Tracks Grid */}
            <section className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                    <Trophy size={15} /> Four Tracks Inside One Shared Workspace
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                    Choose Your Track
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex flex-col justify-between rounded-2xl border border-hairline bg-background p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-hairline bg-card px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-silver">
                          {track.organization}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          Status: {track.status}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl font-semibold">{track.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {track.description}
                      </p>

                      <div className="mt-5 space-y-3">
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                            Submission Requirements
                          </span>
                          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                            {track.submissionRequirements.slice(0, 2).map((req, i) => (
                              <li key={i} className="list-disc pl-4">{req}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                            Judging Criteria
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {track.judgingCriteria.map((crit, i) => (
                              <span
                                key={i}
                                className="rounded-md border border-hairline bg-card px-2 py-0.5 font-mono text-[9px] text-muted-foreground"
                              >
                                {crit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {track.resources.map((res, i) => (
                          <a
                            key={i}
                            href={res.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-silver hover:underline"
                          >
                            {res.label}
                          </a>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedTrackId(track.id);
                          setActiveTab("problem-statements");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-silver"
                      >
                        View Problem Statements <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Schedule & Announcements */}
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-hairline bg-card p-6">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                  <CalendarRange size={15} /> Deadlines &amp; Important Dates
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Registration Deadline", workspaceInfo.registrationDeadline],
                    ["Phase 1 Online Sprint", "01 Oct – 12 Oct 2026"],
                    ["Phase 1 Cutoff Submission", "12 Oct 2026, 11:59 PM"],
                    ["Shortlist Announcement", "14 Oct 2026"],
                    ["Phase 2 On-Site Grand Finale", workspaceInfo.eventDateLabel],
                    ["Final Judging & Awards", "18 Oct 2026, 04:00 PM"],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-hairline/60 pb-2.5 text-xs"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono text-foreground">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-hairline bg-card p-6">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                  <Sparkles size={15} /> Workspace Updates &amp; Announcements
                </div>
                <div className="mt-4 space-y-3">
                  {hackathonWorkspaceData.announcements
                    .filter((ann) => isAdmin || ann.published)
                    .map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-2xl border border-hairline bg-background p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-base font-semibold">{ann.title}</h4>
                          <span className="font-mono text-[10px] text-muted-foreground">{ann.date}</span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {ann.content}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB B: REGISTRATION */}
        {activeTab === "registration" && (
          <div className="space-y-8">
            {recentPass && (
              <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-emerald-400">
                    <CheckCircle2 size={16} /> Registration Confirmed
                  </div>
                  <button
                    onClick={() => setRecentPass(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
                  <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-emerald-500/30 bg-black/40 p-4">
                    <QrCode size={100} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-foreground">
                      {recentPass.registrationType === "team"
                        ? `Team: ${recentPass.teamName}`
                        : recentPass.participantName}
                    </h3>
                    <div className="mt-1 font-mono text-xs text-silver">
                      Pass Code: {recentPass.code} • Track: {recentPass.track}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      Your entry pass has been registered in the hackathon workspace. Keep your code handy for door check-in during Phase 2 on-site events.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(recentPass.code);
                          toast.success("Pass code copied to clipboard!");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5 font-mono text-[10px] uppercase text-foreground hover:border-silver"
                      >
                        <Copy size={12} /> Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                <Users size={15} /> Hackathon Registration Desk
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                Register for All Four Tracks
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Participate individually or as a team in the Vertex Global Hackathon 2026.
              </p>

              {/* Registration Type Toggle */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRegType("individual")}
                  className={`rounded-xl border px-4 py-2 font-mono text-xs uppercase tracking-wider ${
                    regType === "individual"
                      ? "border-foreground bg-foreground text-background"
                      : "border-hairline bg-background text-muted-foreground hover:border-silver"
                  }`}
                >
                  Individual Registration
                </button>
                <button
                  type="button"
                  onClick={() => setRegType("team")}
                  className={`rounded-xl border px-4 py-2 font-mono text-xs uppercase tracking-wider ${
                    regType === "team"
                      ? "border-foreground bg-foreground text-background"
                      : "border-hairline bg-background text-muted-foreground hover:border-silver"
                  }`}
                >
                  Team Registration (2–4 Builders)
                </button>
              </div>

              <form onSubmit={handleRegistrationSubmit} className="mt-6 grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                    Lead / Participant Full Name *
                  </span>
                  <input
                    name="participantName"
                    required
                    placeholder="e.g. Alex Johnson"
                    className="rounded-xl border border-hairline bg-background px-4 py-3 text-sm outline-none transition focus:border-silver"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                    Email Address *
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="alex@university.edu"
                    className="rounded-xl border border-hairline bg-background px-4 py-3 text-sm outline-none transition focus:border-silver"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                    Phone Number
                  </span>
                  <input
                    name="phone"
                    placeholder="+91 98765 43210"
                    className="rounded-xl border border-hairline bg-background px-4 py-3 text-sm outline-none transition focus:border-silver"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                    University / College / USN
                  </span>
                  <input
                    name="collegeOrUsn"
                    placeholder="REVA University / USN"
                    className="rounded-xl border border-hairline bg-background px-4 py-3 text-sm outline-none transition focus:border-silver"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                    Select Hackathon Track *
                  </span>
                  <select
                    name="track"
                    required
                    className="rounded-xl border border-hairline bg-background px-4 py-3 text-sm outline-none transition focus:border-silver"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.organization})
                      </option>
                    ))}
                  </select>
                </label>

                {regType === "team" && (
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                      Team Name *
                    </span>
                    <input
                      name="teamName"
                      required={regType === "team"}
                      placeholder="e.g. IndicVoice Labs"
                      className="rounded-xl border border-hairline bg-background px-4 py-3 text-sm outline-none transition focus:border-silver"
                    />
                  </label>
                )}

                {/* Additional Team Members */}
                {regType === "team" && (
                  <div className="md:col-span-2 rounded-2xl border border-hairline bg-background p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                        Teammates (Up to 3 additional members)
                      </span>
                      {teamMembers.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setTeamMembers([...teamMembers, { name: "", email: "" }])}
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-silver hover:underline"
                        >
                          <PlusCircle size={13} /> Add Teammate
                        </button>
                      )}
                    </div>

                    {teamMembers.length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        No additional teammates added yet. You can add them now or during Phase 1 team matching.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {teamMembers.map((m, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-3">
                            <input
                              placeholder="Teammate Name"
                              value={m.name}
                              onChange={(e) => {
                                const next = [...teamMembers];
                                next[idx].name = e.target.value;
                                setTeamMembers(next);
                              }}
                              className="flex-1 rounded-lg border border-hairline bg-card px-3 py-2 text-xs outline-none"
                            />
                            <input
                              placeholder="Teammate Email"
                              type="email"
                              value={m.email}
                              onChange={(e) => {
                                const next = [...teamMembers];
                                next[idx].email = e.target.value;
                                setTeamMembers(next);
                              }}
                              className="flex-1 rounded-lg border border-hairline bg-card px-3 py-2 text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                              className="text-muted-foreground hover:text-red-400"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 font-mono text-xs uppercase tracking-widest text-background transition hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Submitting Registration..." : "Submit Hackathon Registration →"}
                  </button>
                </div>
              </form>
            </div>

            {/* Admin view of registered participants */}
            {isAdmin && (
              <div className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
                      Admin Desk
                    </div>
                    <h3 className="mt-1 font-display text-xl font-semibold">
                      Registered Participants &amp; Teams ({registrations.length})
                    </h3>
                  </div>
                </div>

                {registrations.length === 0 ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    No registrations submitted yet in this browser session.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="border-b border-hairline text-muted-foreground">
                        <tr>
                          <th className="py-2">Code</th>
                          <th className="py-2">Type</th>
                          <th className="py-2">Name / Team</th>
                          <th className="py-2">Email</th>
                          <th className="py-2">Track</th>
                          <th className="py-2">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {registrations.map((r) => (
                          <tr key={r.id}>
                            <td className="py-2.5 font-semibold text-silver">{r.code}</td>
                            <td className="py-2.5 uppercase">{r.registrationType}</td>
                            <td className="py-2.5 text-foreground">
                              {r.registrationType === "team" ? r.teamName : r.participantName}
                            </td>
                            <td className="py-2.5 text-muted-foreground">{r.email}</td>
                            <td className="py-2.5 text-silver">{r.track}</td>
                            <td className="py-2.5 text-muted-foreground">
                              {new Date(r.registeredAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB C: RULES */}
        {activeTab === "rules" && (
          <div className="space-y-6 rounded-3xl border border-hairline bg-card p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                  <ShieldCheck size={15} /> Official Regulations &amp; Guidelines
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  Rules of Engagement
                </h2>
              </div>
              {isAdmin && (
                <span className="font-mono text-[10px] uppercase text-amber-400">
                  Inline Rule Editor Active
                </span>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-hairline bg-background p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold">{rule.title}</h3>
                    <span className="rounded-md border border-hairline bg-card px-2 py-0.5 font-mono text-[9px] uppercase text-silver">
                      {rule.category}
                    </span>
                  </div>

                  {isAdmin ? (
                    <div className="mt-3">
                      <textarea
                        value={rule.content}
                        onChange={(e) => {
                          const next = [...rules];
                          next[idx] = { ...next[idx], content: e.target.value };
                          setRules(next);
                        }}
                        className="w-full rounded-xl border border-hairline bg-card p-3 text-xs leading-relaxed text-foreground outline-none focus:border-silver"
                        rows={4}
                      />
                      <span className="mt-1 block font-mono text-[9px] text-muted-foreground">
                        Admin: edits update live for this session.
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {rule.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB D: PROBLEM STATEMENTS */}
        {activeTab === "problem-statements" && (
          <div className="space-y-6 rounded-3xl border border-hairline bg-card p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                  <FileText size={15} /> Track-Isolated Challenges
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  Problem Statements
                </h2>
              </div>
            </div>

            {/* Track Switcher */}
            <div className="flex flex-wrap gap-2 border-b border-hairline pb-4">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                    selectedTrack.id === track.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-hairline bg-background text-muted-foreground hover:border-silver hover:text-foreground"
                  }`}
                >
                  {track.name} ({track.organization})
                </button>
              ))}
            </div>

            {/* Statements List for the selected track */}
            <div className="space-y-6">
              {(problemStatements[selectedTrack.id] || []).length === 0 ? (
                <div className="rounded-2xl border border-hairline bg-background p-8 text-center text-sm text-muted-foreground">
                  No problem statements published yet for this track. Check back before kickoff!
                </div>
              ) : (
                (problemStatements[selectedTrack.id] || []).map((ps) => (
                  <div
                    key={ps.id}
                    className="rounded-2xl border border-hairline bg-background p-6 md:p-8"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-display text-2xl font-semibold">{ps.title}</h3>
                      <span className="rounded-full border border-hairline bg-card px-3 py-1 font-mono text-[10px] uppercase text-silver">
                        Track: {selectedTrack.name}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {ps.description}
                    </p>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <div className="rounded-xl border border-hairline bg-card/40 p-4">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-silver">
                          Key Objectives
                        </div>
                        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                          {ps.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-silver" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-hairline bg-card/40 p-4">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-silver">
                          Technical Requirements
                        </div>
                        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                          {ps.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-silver" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-hairline bg-card/40 p-4">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-silver">
                          Expected Deliverables
                        </div>
                        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                          {ps.deliverables.map((del, i) => (
                            <li key={i} className="list-disc pl-4">{del}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-hairline bg-card/40 p-4">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-silver">
                          Evaluation Criteria
                        </div>
                        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                          {ps.evaluationCriteria.map((crit, i) => (
                            <li key={i} className="list-disc pl-4">{crit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB E: THEMES */}
        {activeTab === "themes" && (
          <div className="space-y-6 rounded-3xl border border-hairline bg-card p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                  <Sparkles size={15} /> Innovation Tracks &amp; Focus Areas
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  Hackathon Themes
                </h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="flex flex-col justify-between rounded-2xl border border-hairline bg-background p-6"
                >
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                      {theme.track}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-semibold">{theme.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {theme.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-hairline pt-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                      Relevant Technologies
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {theme.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-lg border border-hairline bg-card px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB F: FAQS & RESOURCES */}
        {activeTab === "faqs" && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                <HelpCircle size={15} /> Hackathon Help Desk &amp; FAQs
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything you need to know about eligibility, tracks, deliverables, and on-site checkpoints.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {hackathonWorkspaceData.faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-hairline bg-background p-6"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-widest text-silver">
                      {faq.category}
                    </span>
                    <h3 className="mt-2 font-display text-lg font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Developer Resources & Toolkits */}
            <div className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                <FileText size={15} /> Official Developer Resources &amp; Links
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold sm:text-2xl">
                Track Toolkits &amp; Sandboxes
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <a
                  href="https://www.sarvam.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-hairline bg-background p-5 transition hover:border-silver"
                >
                  <span className="font-mono text-[9px] uppercase tracking-wider text-silver">SARVAM AI</span>
                  <h4 className="mt-1 font-display text-base font-semibold">Indic Language APIs</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Speech-to-text, translation, and Indic LLM models.</p>
                </a>

                <a
                  href="https://abscissa.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-hairline bg-background p-5 transition hover:border-silver"
                >
                  <span className="font-mono text-[9px] uppercase tracking-wider text-silver">ABSCISSA</span>
                  <h4 className="mt-1 font-display text-base font-semibold">Telemetry &amp; Data Portal</h4>
                  <p className="mt-1 text-xs text-muted-foreground">High-throughput streaming schemas and guidelines.</p>
                </a>

                <Link
                  to="/projects"
                  className="rounded-2xl border border-hairline bg-background p-5 transition hover:border-silver"
                >
                  <span className="font-mono text-[9px] uppercase tracking-wider text-silver">OPEN INNOVATION</span>
                  <h4 className="mt-1 font-display text-base font-semibold">Vertex Code Scaffolds</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Starter templates and previous project references.</p>
                </Link>

                <a
                  href="mailto:vertex@reva.edu.in"
                  className="rounded-2xl border border-hairline bg-background p-5 transition hover:border-silver"
                >
                  <span className="font-mono text-[9px] uppercase tracking-wider text-silver">ORGANIZERS</span>
                  <h4 className="mt-1 font-display text-base font-semibold">Support &amp; Desk Inquiries</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Reach Vertex organizing leads for queries.</p>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB G: RESULTS */}
        {activeTab === "results" && (
          <div className="space-y-6 rounded-3xl border border-hairline bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                  <Trophy size={15} /> Final Standings &amp; Honors
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  Hackathon Results
                </h2>
              </div>

              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {isAdmin ? (
                  <span className="text-amber-400">Admin Mode: Drafts visible &amp; publishable</span>
                ) : (
                  <span>Public View: Showing published results only</span>
                )}
              </div>
            </div>

            {visibleResults.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-background p-8 text-center text-sm text-muted-foreground">
                Results have not been officially published yet. Final scoring will take place at the conclusion of Phase 2.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleResults.map((res, idx) => (
                  <div
                    key={res.id}
                    className="flex flex-col justify-between rounded-2xl border border-hairline bg-background p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                          {res.track}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                            res.status === "published"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : res.status === "draft"
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                : "border-slate-500/40 bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl font-semibold">
                        {res.participantOrTeam}
                      </h3>
                      {res.projectTitle && (
                        <div className="mt-1 font-mono text-xs text-silver">
                          Project: {res.projectTitle}
                        </div>
                      )}

                      <div className="mt-3 rounded-lg border border-hairline bg-card/60 p-2.5">
                        <div className="font-mono text-[10px] uppercase text-silver">Award &amp; Position</div>
                        <div className="text-sm font-semibold text-foreground">{res.position}</div>
                        <div className="text-xs text-muted-foreground">{res.award}</div>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {res.summary}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="mt-6 border-t border-hairline pt-4 flex flex-wrap gap-2">
                        {res.status === "draft" ? (
                          <button
                            onClick={() => {
                              const next = [...results];
                              next[idx].status = "published";
                              setResults(next);
                              toast.success(`Published results for ${res.participantOrTeam}`);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 font-mono text-[10px] uppercase text-emerald-300 hover:bg-emerald-500/30"
                          >
                            <Eye size={12} /> Publish Result
                          </button>
                        ) : res.status === "published" ? (
                          <button
                            onClick={() => {
                              const next = [...results];
                              next[idx].status = "draft";
                              setResults(next);
                              toast.info(`Reverted ${res.participantOrTeam} to draft status`);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-card px-3 py-1 font-mono text-[10px] uppercase text-silver hover:border-silver"
                          >
                            <EyeOff size={12} /> Revert to Draft
                          </button>
                        ) : null}

                        <button
                          onClick={() => {
                            const next = [...results];
                            next[idx].status = res.status === "archived" ? "published" : "archived";
                            setResults(next);
                            toast.info(`Updated archive status for ${res.participantOrTeam}`);
                          }}
                          className="rounded-lg border border-hairline px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground"
                        >
                          {res.status === "archived" ? "Unarchive" : "Archive"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-silver">{label}</div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>
    </div>
  );
}
