import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  FileText,
  HelpCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { hackathonWorkspaceData } from "@/data/hackathon-workspace";

export const Route = createFileRoute("/events/hackathon-workspace")({
  component: EventDetailsPage,
  head: () => ({
    meta: [
      { title: "Vertex Global Hackathon 2026 — Vertex Events" },
      {
        name: "description",
        content:
          "Public documentation and details for Vertex Global Hackathon 2026: 4 tracks, online and on-site phases, rules, problem statements, and published results.",
      },
    ],
  }),
});

function EventDetailsPage() {
  const [activeTrackId, setActiveTrackId] = useState(hackathonWorkspaceData.tracks[0].id);

  // Strictly filter for published results only on public page
  const publishedResults = hackathonWorkspaceData.results.filter(
    (res) => res.status === "published",
  );

  const selectedTrack =
    hackathonWorkspaceData.tracks.find((t) => t.id === activeTrackId) ??
    hackathonWorkspaceData.tracks[0];

  const currentStatements =
    hackathonWorkspaceData.problemStatements[
      selectedTrack.id as keyof typeof hackathonWorkspaceData.problemStatements
    ] ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-14">
        {/* Hero Card */}
        <div className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-2xl">
          <div className="bg-[#0b1120] p-6 text-white sm:p-10">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-300">
              <span>Public Event Documentation</span>
              <span>•</span>
              <span>4 Tracks</span>
              <span>•</span>
              <span>Hybrid Format</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              {hackathonWorkspaceData.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {hackathonWorkspaceData.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/hackathon-workspace"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-[#0b1120] transition hover:bg-slate-200"
              >
                Open Workspace <ArrowRight size={14} />
              </Link>
              <a
                href="#registration-info"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-white/10"
              >
                Registration Details
              </a>
            </div>
          </div>

          <div className="grid gap-4 border-t border-hairline bg-card/60 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <MiniMetric
              label="Registration Status"
              value={hackathonWorkspaceData.registrationStatus}
              icon={<Users size={15} />}
            />
            <MiniMetric
              label="Registration Deadline"
              value={hackathonWorkspaceData.registrationDeadline}
              icon={<CalendarRange size={15} />}
            />
            <MiniMetric
              label="Format"
              value="Online + On-Site"
              icon={<MapPin size={15} />}
            />
            <MiniMetric
              label="Tracks"
              value="4 Shared Tracks"
              icon={<Trophy size={15} />}
            />
          </div>
        </div>

        {/* Objectives & Collaborating Organizations */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
              <FileText size={15} /> Event Overview &amp; Objectives
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              Why We Are Building
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {hackathonWorkspaceData.eventObjective}
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                  Collaborating Organizations
                </span>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  {hackathonWorkspaceData.organizations.map((org) => (
                    <li key={org} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-silver" />
                      <span>{org}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                  Sprint Dates
                </span>
                <p className="mt-3 font-display text-xl font-semibold text-foreground">
                  {hackathonWorkspaceData.eventDateLabel}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Includes virtual prototyping sprint and campus grand finale.
                </p>
              </div>
            </div>
          </section>

          <aside id="registration-info" className="rounded-3xl border border-hairline bg-card p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
              <ShieldCheck size={15} /> Registration Information
            </div>
            <h3 className="mt-2 font-display text-xl font-semibold sm:text-2xl">
              How to Participate
            </h3>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <p>
                Registration is open to both individual participants and teams (2–4 builders) across all four tracks.
              </p>
              <p>
                All four tracks share the same timeline, evaluation rubrics, and workspace dashboard.
              </p>
              <p>
                Deadlines close strictly on <strong className="text-foreground">{hackathonWorkspaceData.registrationDeadline}</strong>.
              </p>
            </div>

            <div className="mt-6 border-t border-hairline pt-4">
              <Link
                to="/hackathon-workspace"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-silver hover:underline"
              >
                Go to Workspace Registration <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>

        {/* Four Participating Tracks */}
        <section className="mt-8 rounded-3xl border border-hairline bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            <Trophy size={15} /> Four Tracks
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Track Specializations
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {hackathonWorkspaceData.tracks.map((track) => (
              <div
                key={track.id}
                className="flex flex-col justify-between rounded-2xl border border-hairline bg-background p-5"
              >
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-silver">
                    {track.organization}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{track.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {track.description}
                  </p>
                </div>
                <div className="mt-4 border-t border-hairline pt-3 font-mono text-[9px] uppercase text-muted-foreground">
                  Status: {track.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Track-Specific Problem Statements */}
        <section className="mt-8 rounded-3xl border border-hairline bg-card p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                <FileText size={15} /> Problem Statements
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                Challenge Statements by Track
              </h2>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-b border-hairline pb-4">
            {hackathonWorkspaceData.tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setActiveTrackId(track.id)}
                className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                  selectedTrack.id === track.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-hairline bg-background text-muted-foreground hover:border-silver hover:text-foreground"
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            {currentStatements.map((ps) => (
              <div
                key={ps.id}
                className="rounded-2xl border border-hairline bg-background p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-semibold">{ps.title}</h3>
                  <span className="rounded-full border border-hairline bg-card px-2.5 py-0.5 font-mono text-[9px] uppercase text-silver">
                    {selectedTrack.name}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {ps.description}
                </p>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                      Objectives
                    </span>
                    <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      {ps.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-silver" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-silver">
                      Deliverables &amp; Evaluation
                    </span>
                    <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      {ps.deliverables.map((del, i) => (
                        <li key={i} className="list-disc pl-4">{del}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Themes */}
        <section className="mt-8 rounded-3xl border border-hairline bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            <Sparkles size={15} /> Themes
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Innovation Themes
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {hackathonWorkspaceData.themes.map((theme) => (
              <div
                key={theme.id}
                className="rounded-2xl border border-hairline bg-background p-6"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                  {theme.track}
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold">{theme.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {theme.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {theme.technologies.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-hairline bg-card px-2 py-0.5 font-mono text-[9px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Schedule & Phases */}
        <section className="mt-8 rounded-3xl border border-hairline bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            <CalendarRange size={15} /> Schedule and Phases
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Phase Timeline
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {hackathonWorkspaceData.phases.map((phase) => (
              <div
                key={phase.id}
                className="rounded-2xl border border-hairline bg-background p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">{phase.name}</h3>
                  <span className="rounded-full border border-hairline bg-card px-2.5 py-0.5 font-mono text-[9px] uppercase text-silver">
                    {phase.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {phase.description}
                </p>
                <div className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
                  <div>Dates: {phase.startDate} – {phase.endDate}</div>
                  <div>Venue: {phase.venue}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section className="mt-8 rounded-3xl border border-hairline bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            <ShieldCheck size={15} /> Guidelines
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Hackathon Rules
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {hackathonWorkspaceData.rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-hairline bg-background p-6"
              >
                <h3 className="font-display text-xl font-semibold">{rule.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {rule.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-8 rounded-3xl border border-hairline bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            <HelpCircle size={15} /> Frequently Asked Questions
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Everything You Need to Know
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {hackathonWorkspaceData.faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-2xl border border-hairline bg-background p-6"
              >
                <span className="font-mono text-[9px] uppercase tracking-wider text-silver">
                  {faq.category}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold">{faq.question}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Published Results (strictly published only) */}
        <section className="mt-8 rounded-3xl border border-hairline bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            <Trophy size={15} /> Results &amp; Honors
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Published Results
          </h2>

          {publishedResults.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Official results will be announced at the conclusion of Phase 2.
            </p>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {publishedResults.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-hairline bg-background p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-silver">{res.track}</span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase text-emerald-400">
                      {res.status}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-semibold">{res.participantOrTeam}</h3>
                  <div className="mt-1 text-sm text-foreground font-medium">{res.position} — {res.award}</div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{res.summary}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="flex items-center gap-2 text-slate-300">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="mt-2 text-base font-medium text-foreground">{value}</div>
    </div>
  );
}
