import { HackathonAdminNav } from "@/components/admin/HackathonAdminShell";
import { NEURAL_NETWORK_WORKSHOP as workshopEvent } from "@/data/neural-network-workshop";
import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PhotoUpload } from "@/components/PhotoUpload";
import { MediaUpload, type UploadedMediaType } from "@/components/MediaUpload";
import {
  mergeSocialLinks,
  readSocialLinks,
  SOCIAL_LINK_FIELDS,
  type SocialLinks,
} from "@/data/social-links";
import { QRScanner } from "@/components/QRScanner";
import {
  adminOverview,
  awardBadge,
  checkInByCode,
  deleteAnnouncement,
  deleteMember,
  saveAnnouncement,
  saveEvent,
  saveMember,
  saveProject,
  listEventStaffAccess,
  saveEventStaffAccess,
  revokeEventStaffAccess,
  setEventRegistrationStatus,
  setApplicationStatus,
} from "@/lib/admin.functions";
import { checkInHackathonTeam, reissueHackathonTeamKey } from "@/lib/hackathon.functions";
import {
  reopenHackathonSubmission,
  toggleHackathonShowcase,
  assignHackathonMentor,
  saveHackathonWorkspace,
  getJudging,
  saveJudgingScore,
} from "@/lib/hackathon.functions";
import { listStaffRoles, setUserRole } from "@/lib/admin-users.functions";
import {
  issueStaffInvite,
  listMentorshipRequests,
  listStaffInvites,
  revokeStaffInvite,
} from "@/lib/staff.functions";
import {
  checkInNeuralNetworkWorkshop,
  listNeuralNetworkWorkshopRegistrations,
  listNeuralNetworkWorkshopStaff,
  revokeNeuralNetworkWorkshopStaff,
  resendNeuralNetworkWorkshopPass,
  saveNeuralNetworkWorkshopStaff,
  setNeuralNetworkWorkshopStatus,
  type NeuralNetworkWorkshopRegistration,
  type WorkshopStaff,
} from "@/lib/neural-network-workshop.functions";
import {
  hackathonAdmin,
  saveHackathonProblemStatement,
  setHackathonTeamStatus,
} from "@/lib/hackathon.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: () => {
    return adminOverview();
  },
  head: () => ({
    meta: [
      { title: "Admin console â Vertex" },
      {
        name: "description",
        content: "Manage the Vertex roster, events, projects, and door check-in.",
      },
      { property: "og:title", content: "Admin console â Vertex" },
      { property: "og:description", content: "Vertex staff tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <p className="max-w-sm text-center font-mono text-sm text-muted-foreground">
        {import.meta.env.DEV && error instanceof Error
          ? error.message
          : "This console is for team heads and admins only."}
      </p>
    </div>
  ),
});

const TABS = [
  "Operations",
  "Check-in",
  "Neural Networks Workshop",
  "SIH",
  "Judging",
  "Applications",
  "Teams",
  "Members",
  "People",
  "Events",
  "Build With Sarvam",
  "Projects",
  "Announcements",
] as const;
type Tab = (typeof TABS)[number];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

function AdminPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const isAdmin = data.viewer.isAdmin;
  const isEventDesk = data.eventDesk;
  const isWorkshopManager =
    isEventDesk && data.deskScope === "workshop" && data.eventDeskPermission === "manager";
  const [tab, setTab] = useState<Tab>(isWorkshopManager ? "Neural Networks Workshop" : "Check-in");
  const isJudgeOnly = data.viewer.isJudge && !data.viewer.isAdmin && !data.viewer.isHead;
  const workshopApproved = data.workshopRegistrations.filter(
    (row) => row.status === "approved",
  ).length;
  const workshopCheckedIn = data.workshopRegistrations.filter((row) => row.checked_in_at).length;

  useEffect(() => {
    const timer = window.setInterval(() => void router.invalidate(), 15_000);
    return () => window.clearInterval(timer);
  }, [router]);

  if (isJudgeOnly) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />
            Judge console
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Score the teams.
          </h1>
          <div className="mt-10">
            <Judging />
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="inline-block h-px w-8 bg-silver" />
          {isEventDesk ? "Event desk" : isAdmin ? "Admin" : "Team head"} console
          {data.viewer.isJudge ? " Â· judge" : ""}
          {data.viewer.isMentor ? " Â· mentor" : ""}
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
          Control room.
        </h1>
        {!isEventDesk && <HackathonAdminNav />}

        {!isEventDesk && (
          <div className="mt-6 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Applications" value={String(data.applications.length)} />
            <Stat label="Members" value={String(data.members.length)} />
            <Stat label="Registrations" value={String(data.registrations.length)} />
            <Stat
              label="Checked in"
              value={String(data.registrations.filter((r) => r.checked_in_at).length)}
            />
            <Stat label="Workshop approved" value={String(workshopApproved)} />
            <Stat label="Workshop checked in" value={String(workshopCheckedIn)} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.filter((t) =>
            isEventDesk
              ? t === "Check-in" || (isWorkshopManager && t === "Neural Networks Workshop")
              : isAdmin ||
                t === "Check-in" ||
                t === "SIH" ||
                t === "Judging" ||
                t === "Applications" ||
                t === "Announcements",
          ).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
                tab === t
                  ? "border-silver text-foreground"
                  : "border-hairline text-muted-foreground hover:border-silver"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "Operations" && isAdmin && (
            <EventCommandCentre
              events={data.events}
              registrations={data.registrations}
              onOpenEvents={() => setTab("Events")}
              onOpenCheckIn={() => setTab("Check-in")}
              onOpenWorkshop={() => setTab("Neural Networks Workshop")}
              workshop={{ approved: workshopApproved, checkedIn: workshopCheckedIn }}
            />
          )}
          {tab === "Check-in" && (
            <CheckIn
              registrations={data.registrations}
              events={data.events}
              workshopOnly={data.eventDesk && data.deskScope === "workshop"}
            />
          )}
          {tab === "Neural Networks Workshop" && (
            <NeuralNetworksWorkshopRegistrations canManageDeskAccess={isAdmin} />
          )}
          {tab === "SIH" && <SihOperations isAdmin={isAdmin} />}
          {tab === "Judging" && <Judging />}
          {tab === "Teams" && isAdmin && <Teams members={data.members} teams={data.teams} />}
          {tab === "People" && isAdmin && <People />}
          {tab === "Applications" && <Applications rows={data.applications} />}
          {tab === "Members" && <Members members={data.members} teams={data.teams} />}
          {tab === "Events" && <Events events={data.events} registrations={data.registrations} />}
          {tab === "Build With Sarvam" && isAdmin && (
            <BuildWithSarvamWorkspace
              event={data.events.find((event) => event.slug === "build-with-sarvam")}
              registrations={data.registrations.filter((registration) =>
                data.events.some(
                  (event) =>
                    event.id === registration.event_id && event.slug === "build-with-sarvam",
                ),
              )}
            />
          )}
          {tab === "Projects" && <Projects projects={data.projects} members={data.members} />}
          {tab === "Announcements" && (
            <Announcements
              rows={data.announcements}
              teams={data.teams}
              isAdmin={isAdmin}
              headTeams={data.viewer.headTeams}
            />
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function EventCommandCentre({
  events,
  registrations,
  workshop,
  onOpenEvents,
  onOpenCheckIn,
  onOpenWorkshop,
}: {
  events: EventRow[];
  registrations: {
    id: string;
    event_id: string;
    name: string;
    email: string;
    status: "pending" | "approved" | "rejected" | "waitlisted";
    checked_in_at: string | null;
  }[];
  workshop: { approved: number; checkedIn: number };
  onOpenEvents: () => void;
  onOpenCheckIn: () => void;
  onOpenWorkshop: () => void;
}) {
  const operationalEvents = events.filter((event) => event.operations);
  const [selectedId, setSelectedId] = useState(operationalEvents[0]?.id ?? "");
  const selected =
    operationalEvents.find((event) => event.id === selectedId) ?? operationalEvents[0];
  const rows = selected
    ? registrations.filter((registration) => registration.event_id === selected.id)
    : [];
  const approved = rows.filter((row) => row.status === "approved").length;
  const pending = rows.filter((row) => row.status === "pending").length;
  const waitlisted = rows.filter((row) => row.status === "waitlisted").length;
  const checkedIn = rows.filter((row) => Boolean(row.checked_in_at)).length;
  const operations = selected?.operations;

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden border border-hairline bg-card/40">
        <div className="grid-backdrop border-b border-hairline p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver">
            Event command
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Run the event from one place.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Readiness, registration status, and door operations stay event-scoped. Access is
                managed only by club admins from the event settings.
              </p>
            </div>
            <button className={ghost} onClick={onOpenEvents}>
              Configure event →
            </button>
          </div>
        </div>
        <div className="p-5 md:p-7">
          {operationalEvents.length === 0 ? (
            <EmptyCommandState onOpenEvents={onOpenEvents} />
          ) : (
            <>
              <label className="grid max-w-xl gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Event
                </span>
                <select
                  value={selected?.id ?? ""}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className={field}
                >
                  {operationalEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-6 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-5">
                <CommandMetric label="Registered" value={rows.length} />
                <CommandMetric
                  label="Pending"
                  value={pending}
                  tone={pending > 0 ? "attention" : undefined}
                />
                <CommandMetric label="Approved" value={approved} />
                <CommandMetric label="Waitlist" value={waitlisted} />
                <CommandMetric
                  label="Checked in"
                  value={checkedIn}
                  tone={checkedIn > 0 ? "good" : undefined}
                />
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
                <div className="border border-hairline bg-background p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-xl">Operational readiness</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selected?.event_date
                          ? new Date(selected.event_date).toDateString()
                          : "Date TBA"}{" "}
                        · {selected?.location}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                      {selected?.capacity ? `${rows.length}/${selected.capacity}` : "No capacity"}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
                    <Readiness
                      label="Registration"
                      value={operations?.registration_open ? "Open" : "Closed"}
                      good={Boolean(operations?.registration_open)}
                    />
                    <Readiness
                      label="Approval"
                      value={operations?.requires_approval ? "Required" : "Automatic"}
                      good={Boolean(operations?.requires_approval)}
                    />
                    <Readiness
                      label="QR passes"
                      value={operations?.passes_enabled ? "Enabled" : "Off"}
                      good={Boolean(operations?.passes_enabled)}
                    />
                    <Readiness
                      label="Door check-in"
                      value={operations?.checkin_enabled ? "Ready" : "Off"}
                      good={Boolean(operations?.checkin_enabled)}
                    />
                  </div>
                </div>
                <div className="border border-hairline bg-background p-5">
                  <div className="font-display text-xl">Next action</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {pending > 0
                      ? `${pending} registration${pending === 1 ? " needs" : "s need"} review before a pass can be issued.`
                      : operations?.registration_open
                        ? "Registration is live. Keep the desk details and capacity current."
                        : "Registration is closed. The door team can continue checking approved attendees in."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button className={btn} onClick={onOpenEvents}>
                      Review registrations
                    </button>
                    <button className={ghost} onClick={onOpenCheckIn}>
                      Open check-in
                    </button>
                    <button
                      className={ghost}
                      disabled={!selected}
                      onClick={() => selected && exportEventRegistrationsCsv(selected, rows)}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="border border-hairline bg-card/40 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
              Live workshop
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              Neural Networks from Scratch
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {workshopEvent.venue} · {workshopEvent.date} · {workshopEvent.time}
            </p>
          </div>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>
              <b className="text-foreground">{workshop.approved}</b> approved
            </span>
            <span>
              <b className="text-foreground">{workshop.checkedIn}</b> checked in
            </span>
          </div>
        </div>
        <button className={`${ghost} mt-5`} onClick={onOpenWorkshop}>
          Open workshop desk →
        </button>
      </section>
    </div>
  );
}

function EmptyCommandState({ onOpenEvents }: { onOpenEvents: () => void }) {
  return (
    <div className="border border-dashed border-hairline p-6 text-sm text-muted-foreground">
      Create an event first. Its registration, QR, capacity, and check-in rules will then appear
      here as one operational view.
      <button className={`${ghost} ml-4`} onClick={onOpenEvents}>
        Create event →
      </button>
    </div>
  );
}

function CommandMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "attention" | "good";
}) {
  return (
    <div className="bg-background p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-3 font-display text-3xl ${tone === "attention" ? "text-amber-200" : tone === "good" ? "text-emerald-300" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Readiness({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="bg-card/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 font-display text-lg ${good ? "text-emerald-300" : "text-muted-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

function exportEventRegistrationsCsv(
  event: EventRow,
  rows: {
    id: string;
    name: string;
    email: string;
    status: string;
    checked_in_at: string | null;
  }[],
) {
  const escape = (value: string | null | undefined) => `"${(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    ["event", "registration_id", "name", "email", "status", "checked_in_at"],
    ...rows.map((row) => [
      event.title,
      row.id,
      row.name,
      row.email,
      row.status,
      row.checked_in_at ?? "",
    ]),
  ]
    .map((row) => row.map(escape).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vertex-${event.slug}-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportSarvamRegistrationsCsv(
  event: EventRow,
  rows: {
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
    form_data: unknown;
  }[],
) {
  const escape = (value: string | null | undefined) => `"${(value ?? "").replace(/"/g, '""')}"`;
  const memberFields = ["name", "email", "phone", "usn", "college", "branch", "year"] as const;
  const headers = [
    "event",
    "registration_id",
    "team_name",
    "team_lead_name",
    "team_lead_email",
    "status",
    "registered_at",
    "project_title",
    "track",
    "problem",
    "solution",
    "innovation",
    "ai_use",
    "beneficiaries",
    ...Array.from({ length: 4 }, (_, index) =>
      memberFields.map((field) => `member_${index + 1}_${field}`),
    ).flat(),
  ];
  const csv = [
    headers,
    ...rows.map((row) => {
      const details = readSarvamRegistrationDetails(row.form_data);
      const memberValues = Array.from({ length: 4 }, (_, index) => {
        const member = details.members[index];
        return memberFields.map((field) => member?.[field] ?? "");
      }).flat();
      return [
        event.title,
        row.id,
        details.teamName || `Team led by ${row.name}`,
        row.name,
        row.email,
        row.status,
        row.created_at,
        details.projectTitle,
        details.track,
        details.problem,
        details.solution,
        details.innovation,
        details.aiUse,
        details.beneficiaries,
        ...memberValues,
      ];
    }),
  ]
    .map((row) => row.map((value) => escape(String(value))).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vertex-${event.slug}-teams-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function NeuralNetworksWorkshopRegistrations({
  canManageDeskAccess,
}: {
  canManageDeskAccess: boolean;
}) {
  const load = useServerFn(listNeuralNetworkWorkshopRegistrations);
  const loadStaff = useServerFn(listNeuralNetworkWorkshopStaff);
  const saveStaff = useServerFn(saveNeuralNetworkWorkshopStaff);
  const revokeStaff = useServerFn(revokeNeuralNetworkWorkshopStaff);
  const setStatus = useServerFn(setNeuralNetworkWorkshopStatus);
  const resendPass = useServerFn(resendNeuralNetworkWorkshopPass);
  const [rows, setRows] = useState<NeuralNetworkWorkshopRegistration[] | null>(null);
  const [staff, setStaff] = useState<WorkshopStaff[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "pending",
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const refreshRegistrations = useCallback(async () => {
    setRows(await load());
  }, [load]);

  useEffect(() => {
    Promise.all([
      refreshRegistrations(),
      canManageDeskAccess ? loadStaff() : Promise.resolve([] as WorkshopStaff[]),
    ])
      .then(([, eventStaff]) => setStaff(eventStaff))
      .catch(() => toast.error("Could not load workshop registrations."));
    const timer = window.setInterval(() => void refreshRegistrations(), 10_000);
    return () => window.clearInterval(timer);
  }, [canManageDeskAccess, loadStaff, refreshRegistrations]);

  if (!rows) {
    return (
      <p className="font-mono text-xs text-muted-foreground">Loading workshop registrationsâ¦</p>
    );
  }

  const needle = query.trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      (statusFilter === "all" || row.status === statusFilter) &&
      `${row.name} ${row.srn} ${row.department} ${row.email}`.toLowerCase().includes(needle),
  );
  const approved = rows.filter((row) => row.status === "approved").length;
  const checkedIn = rows.filter((row) => Boolean(row.checked_in_at)).length;
  const pending = rows.filter((row) => row.status === "pending").length;
  const review = async (
    row: NeuralNetworkWorkshopRegistration,
    status: "approved" | "rejected",
  ) => {
    setBusyId(row.id);
    try {
      const result = await setStatus({ data: { id: row.id, status } });
      await refreshRegistrations();
      if (status === "approved") {
        toast.success(
          result.emailSent
            ? "Approved â QR pass sent."
            : "Approved â QR created, but email could not be sent. Use Resend after email setup is checked.",
        );
      } else {
        toast.success("Registration rejected.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update registration.");
    } finally {
      setBusyId(null);
    }
  };
  const resend = async (row: NeuralNetworkWorkshopRegistration) => {
    setBusyId(row.id);
    try {
      await resendPass({ data: { id: row.id } });
      await refreshRegistrations();
      toast.success("QR pass resent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend the QR pass.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="grid gap-5 border border-hairline bg-card/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-display text-xl">Neural Networks Workshop</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length === rows.length ? rows.length : `${filtered.length} of ${rows.length}`}{" "}
            registration{rows.length === 1 ? "" : "s"} Â· newest first
          </p>
        </div>
        <button
          className={ghost}
          onClick={() => exportWorkshopRegistrationsCsv(filtered)}
          disabled={filtered.length === 0}
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <WorkshopStat label="Registered" value={rows.length} />
        <WorkshopStat label="Approved" value={approved} tone="approved" />
        <WorkshopStat label="Checked in" value={checkedIn} tone="checkedIn" />
        <WorkshopStat label="Pending" value={pending} tone="pending" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", `Pending ${pending}`],
            ["approved", `Approved ${approved}`],
            ["rejected", `Rejected ${rows.filter((row) => row.status === "rejected").length}`],
            ["all", `All ${rows.length}`],
          ] as const
        ).map(([status, label]) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              statusFilter === status
                ? "border-foreground bg-foreground text-background"
                : "border-hairline bg-background text-muted-foreground hover:border-silver"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, SRN, email or departmentâ¦"
        aria-label="Search workshop registrations"
        className={`${field} w-full`}
      />

      {canManageDeskAccess && (
        <div className="border border-hairline bg-background p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-silver">
                Event desk access
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Check-in access is limited to this workshopâs mobile desk. It never adds a club
                admin role.
              </p>
            </div>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const fields = new FormData(form);
                void saveStaff({
                  data: {
                    email: String(fields.get("email") ?? ""),
                    permission: String(fields.get("permission") ?? "checkin") as
                      "manager" | "checkin" | "viewer",
                    active: true,
                  },
                })
                  .then(() => loadStaff())
                  .then(setStaff)
                  .then(() => form.reset())
                  .catch((error) =>
                    toast.error(error instanceof Error ? error.message : "Could not grant access."),
                  );
              }}
            >
              <label className="flex flex-col gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="clubmate@gmail.com"
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Access
                <select name="permission" defaultValue="checkin" className={field}>
                  <option value="checkin">Check-in only</option>
                  <option value="manager">Workshop manager</option>
                </select>
              </label>
              <button className={btn}>Grant</button>
            </form>
          </div>
          {staff.length > 0 && (
            <div className="mt-4 grid gap-2">
              {staff
                .filter((member) => member.active)
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-card/40 px-3 py-2"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {member.email} Â·{" "}
                      {member.permission === "checkin" ? "check-in only" : member.permission}
                    </span>
                    <button
                      type="button"
                      className="border border-rose-500/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-rose-300 hover:bg-rose-950"
                      onClick={() =>
                        void revokeStaff({ data: { id: member.id } })
                          .then(() => loadStaff())
                          .then(setStaff)
                          .then(() => toast.success("Event-desk access revoked."))
                          .catch((error) =>
                            toast.error(
                              error instanceof Error ? error.message : "Could not revoke access.",
                            ),
                          )
                      }
                    >
                      Revoke
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto border border-hairline">
        <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
          <thead className="bg-background font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              {[
                "Created",
                "Name",
                "SRN",
                "Department",
                "Phone",
                "Email",
                "Year",
                "Attend reason",
                "Expectation",
                "Status",
                "Pass email",
                "Activity",
                "Actions",
                "ID",
              ].map((heading) => (
                <th key={heading} className="border-b border-hairline px-3 py-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="align-top odd:bg-background even:bg-card/30">
                <td className="whitespace-nowrap border-b border-hairline px-3 py-3 font-mono text-[10px] text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="border-b border-hairline px-3 py-3 font-medium">{row.name}</td>
                <td className="border-b border-hairline px-3 py-3 font-mono">{row.srn}</td>
                <td className="border-b border-hairline px-3 py-3">{row.department}</td>
                <td className="border-b border-hairline px-3 py-3">{row.phone}</td>
                <td className="border-b border-hairline px-3 py-3">{row.email}</td>
                <td className="border-b border-hairline px-3 py-3">{row.year}</td>
                <td className="max-w-xs whitespace-pre-wrap border-b border-hairline px-3 py-3">
                  {row.attend_reason}
                </td>
                <td className="max-w-sm whitespace-pre-wrap border-b border-hairline px-3 py-3">
                  {row.expectation}
                </td>
                <td className="border-b border-hairline px-3 py-3">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${row.status === "approved" ? "text-emerald-300" : row.status === "rejected" ? "text-rose-300" : "text-amber-200"}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="whitespace-nowrap border-b border-hairline px-3 py-3 font-mono text-[10px] text-muted-foreground">
                  {row.pass_sent_at ? new Date(row.pass_sent_at).toLocaleString() : "Not sent"}
                </td>
                <td className="border-b border-hairline px-3 py-3">
                  {row.activity.length === 0 ? (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      No actions yet
                    </span>
                  ) : (
                    <details className="min-w-40">
                      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-silver">
                        {formatWorkshopActivity(row.activity[0])}
                      </summary>
                      <div className="mt-2 grid gap-1 border-l border-hairline pl-2 font-mono text-[10px] text-muted-foreground">
                        {row.activity.map((activity) => (
                          <span key={`${activity.action}-${activity.created_at}`}>
                            {formatWorkshopActivity(activity)}
                          </span>
                        ))}
                      </div>
                    </details>
                  )}
                </td>
                <td className="border-b border-hairline px-3 py-3">
                  <div className="flex min-w-52 flex-wrap gap-2">
                    {row.status !== "approved" && (
                      <button
                        className={btn}
                        disabled={busyId === row.id}
                        onClick={() => void review(row, "approved")}
                      >
                        Approve &amp; send QR
                      </button>
                    )}
                    {row.status !== "rejected" && (
                      <button
                        className={ghost}
                        disabled={busyId === row.id}
                        onClick={() => void review(row, "rejected")}
                      >
                        Reject
                      </button>
                    )}
                    {row.status === "approved" && (
                      <button
                        className={ghost}
                        disabled={busyId === row.id}
                        onClick={() => void resend(row)}
                      >
                        Resend QR
                      </button>
                    )}
                  </div>
                </td>
                <td className="border-b border-hairline px-3 py-3 font-mono text-[10px] text-muted-foreground">
                  {row.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="bg-background p-6 font-mono text-xs text-muted-foreground">
            No registrations match this search.
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-5">
      <div className="font-display text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function WorkshopStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "approved" | "checkedIn" | "pending";
}) {
  const colors = {
    default: "border-hairline bg-background",
    approved: "border-emerald-700/40 bg-emerald-950/25",
    checkedIn: "border-emerald-600 bg-emerald-600 text-white",
    pending: "border-amber-500/50 bg-amber-100 text-slate-900",
  };
  return (
    <div className={`border p-4 ${colors[tone]}`}>
      <div className="font-display text-3xl font-semibold leading-none">{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] opacity-75">
        {label}
      </div>
    </div>
  );
}

function formatWorkshopActivity(activity: NeuralNetworkWorkshopRegistration["activity"][number]) {
  const label =
    activity.action === "approved"
      ? "Approved"
      : activity.action === "rejected"
        ? "Rejected"
        : activity.action === "pass_sent"
          ? "Pass sent"
          : "Pass resent";
  return `${label} Â· ${new Date(activity.created_at).toLocaleString()}`;
}

const field =
  "border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none";
const btn =
  "border border-silver bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-background disabled:opacity-50";
const ghost =
  "border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:border-silver";

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {text}
      </span>
      {children}
    </label>
  );
}

/* ---------------- SIH operations ---------------- */

function SihOperations({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const load = useServerFn(hackathonAdmin);
  const saveStatement = useServerFn(saveHackathonProblemStatement);
  const setStatus = useServerFn(setHackathonTeamStatus);
  const saveWorkspace = useServerFn(saveHackathonWorkspace);
  const reissueKey = useServerFn(reissueHackathonTeamKey);
  const reopenSub = useServerFn(reopenHackathonSubmission);
  const toggleShowcase = useServerFn(toggleHackathonShowcase);
  const assignMentor = useServerFn(assignHackathonMentor);
  const [data, setData] = useState<Awaited<ReturnType<typeof hackathonAdmin>> | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setData(await load());
    } catch {
      toast.error("Could not load SIH operations.");
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const [psQuery, setPsQuery] = useState("");
  const [psTheme, setPsTheme] = useState("");
  const [psCategory, setPsCategory] = useState("");
  const [psLimit, setPsLimit] = useState(30);

  if (!data) {
    return <p className="font-mono text-xs text-muted-foreground">Loading SIH operationsâ¦</p>;
  }

  const checkedIn = new Set(data.checkins.map((entry) => entry.team_id));
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
        <Stat label="Teams" value={String(data.teams.length)} />
        <Stat label="Students" value={String(data.members.length)} />
        <Stat
          label="Final submissions"
          value={String(data.submissions.filter((entry) => entry.status === "final").length)}
        />
        <Stat label="Checked in" value={String(checkedIn.size)} />
      </div>

      {data.workspace && (
        <section className="border border-hairline bg-card/40 p-6">
          <div className="font-display text-xl">Workspace controls</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Gates for the whole hackathon. Close registration when slots fill; open submissions for
            the build window.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={data.workspace.registration_open ? btn : ghost}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveWorkspace({
                    data: {
                      registrationOpen: !data.workspace!.registration_open,
                      submissionsOpen: data.workspace!.submissions_open,
                      rules: data.workspace!.rules ?? "",
                    },
                  });
                  toast.success(
                    `Registration ${data.workspace!.registration_open ? "closed" : "opened"}.`,
                  );
                  await refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Registration: {data.workspace.registration_open ? "OPEN" : "CLOSED"}
            </button>
            <button
              className={data.workspace.submissions_open ? btn : ghost}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveWorkspace({
                    data: {
                      registrationOpen: data.workspace!.registration_open,
                      submissionsOpen: !data.workspace!.submissions_open,
                      rules: data.workspace!.rules ?? "",
                    },
                  });
                  toast.success(
                    `Submissions ${data.workspace!.submissions_open ? "closed" : "opened"}.`,
                  );
                  await refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Submissions: {data.workspace.submissions_open ? "OPEN" : "CLOSED"}
            </button>
          </div>
        </section>
      )}

      <section className="border border-hairline bg-card/40 p-6">
        <div className="font-display text-xl">Teams</div>
        <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
          {data.teams.map((team) => {
            const roster = data.members.filter((member) => member.team_id === team.id);
            const submission = data.submissions.find((entry) => entry.team_id === team.id);
            const lead = roster.find((member) => member.is_lead);
            return (
              <div key={team.id} className="bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-lg">{team.name}</div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {roster.length}/6 students Â·{" "}
                      {checkedIn.has(team.id) ? "checked in" : "not checked in"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {roster
                        .map((member) => `${member.name}${member.is_lead ? " (lead)" : ""}`)
                        .join(", ")}
                    </p>
                    {lead && (
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        lead: {lead.email}
                        {lead.phone ? ` Â· ${lead.phone}` : ""}
                      </p>
                    )}
                    {team.mentor_name && (
                      <p className="mt-1 font-mono text-[10px] text-silver">
                        mentor: {team.mentor_name}
                        {team.mentor_email ? ` Â· ${team.mentor_email}` : ""}
                      </p>
                    )}
                    {submission?.solution_title && (
                      <div className="mt-2 border border-hairline p-3 text-xs">
                        <p className="text-silver">
                          {submission.solution_title} Â· {submission.status}
                          {submission.finalized_at ? " Â· final" : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest">
                          {submission.deck_path && (
                            <a
                              href={`/api/public/media/${submission.deck_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-silver hover:text-foreground"
                            >
                              Open deck PDF
                            </a>
                          )}
                          {submission.repository_url && (
                            <a
                              href={submission.repository_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-silver hover:text-foreground"
                            >
                              Repository
                            </a>
                          )}
                          {submission.demo_url && (
                            <a
                              href={submission.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-silver hover:text-foreground"
                            >
                              Demo
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <select
                    value={team.status}
                    onChange={async (event) => {
                      try {
                        await setStatus({
                          data: { id: team.id, status: event.target.value as "registered" },
                        });
                        toast.success("Team status updated.");
                        await refresh();
                        await router.invalidate();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not update team status.",
                        );
                      }
                    }}
                    className={field}
                  >
                    {[
                      "registered",
                      "in_review",
                      "shortlisted",
                      "selected",
                      "waitlisted",
                      "rejected",
                      "withdrawn",
                    ].map((status) => (
                      <option key={status} value={status} className="bg-background">
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className={ghost}
                    onClick={() => exportTeamsCsv(data.teams, data.members, data.submissions)}
                  >
                    Export CSV
                  </button>
                  <button
                    className={ghost}
                    onClick={async () => {
                      const name = window.prompt(
                        `Mentor name for ${team.name}`,
                        team.mentor_name ?? "",
                      );
                      if (name === null) return;
                      const email =
                        window.prompt("Mentor email (optional)", team.mentor_email ?? "") ?? "";
                      try {
                        await assignMentor({
                          data: { teamId: team.id, mentorName: name, mentorEmail: email },
                        });
                        toast.success("Mentor saved.");
                        await refresh();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not save mentor.",
                        );
                      }
                    }}
                  >
                    {team.mentor_name ? "Edit mentor" : "Assign mentor"}
                  </button>
                  <button
                    className={ghost}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Reissue the private team key for ${team.name}? The old key stops working.`,
                        )
                      )
                        return;
                      try {
                        const result = await reissueKey({ data: { teamId: team.id } });
                        await navigator.clipboard.writeText(result.token);
                        toast.success("New team key copied to clipboard â hand it to the lead.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not reissue key.",
                        );
                      }
                    }}
                  >
                    Reissue team key
                  </button>
                  {submission?.finalized_at && (
                    <>
                      {isAdmin && (
                        <button
                          className={ghost}
                          onClick={async () => {
                            if (!window.confirm(`Reopen the finalized submission of ${team.name}?`))
                              return;
                            try {
                              await reopenSub({ data: { teamId: team.id } });
                              toast.success("Submission reopened.");
                              await refresh();
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : "Could not reopen.",
                              );
                            }
                          }}
                        >
                          Reopen submission
                        </button>
                      )}
                      <button
                        className={ghost}
                        onClick={async () => {
                          try {
                            await toggleShowcase({
                              data: { teamId: team.id, published: !submission.published },
                            });
                            toast.success(
                              submission.published
                                ? "Removed from showcase."
                                : "Published to showcase.",
                            );
                            await refresh();
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Could not update showcase.",
                            );
                          }
                        }}
                      >
                        {submission.published ? "Unpublish showcase" : "Publish to showcase"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {data.teams.length === 0 && (
            <div className="bg-background p-4 text-sm text-muted-foreground">
              No SIH teams registered yet.
            </div>
          )}
        </div>
      </section>

      {isAdmin && (
        <StatementsAdmin
          statements={data.statements}
          saveStatement={saveStatement}
          refresh={refresh}
          busy={busy}
          setBusy={setBusy}
          filters={{
            query: psQuery,
            setQuery: setPsQuery,
            theme: psTheme,
            setTheme: setPsTheme,
            category: psCategory,
            setCategory: setPsCategory,
            limit: psLimit,
            setLimit: setPsLimit,
          }}
        />
      )}
    </div>
  );
}

function StatementsAdmin({
  statements,
  saveStatement,
  refresh,
  busy,
  setBusy,
  filters,
}: {
  statements: {
    id: string;
    statement_code: string;
    title: string;
    organization: string | null;
    category: string | null;
    theme: string | null;
    description: string | null;
    source_url: string | null;
    source_version: string | null;
    published: boolean;
    sort_order: number;
  }[];
  saveStatement: ReturnType<typeof useServerFn<typeof saveHackathonProblemStatement>>;
  refresh: () => Promise<void>;
  busy: boolean;
  setBusy: (value: boolean) => void;
  filters: {
    query: string;
    setQuery: (value: string) => void;
    theme: string;
    setTheme: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    limit: number;
    setLimit: (value: number) => void;
  };
}) {
  const themes = [
    ...new Set(statements.map((s) => s.theme).filter((t): t is string => Boolean(t))),
  ].sort();
  const filtered = statements.filter((statement) => {
    if (filters.category && statement.category !== filters.category) return false;
    if (filters.theme && statement.theme !== filters.theme) return false;
    if (filters.query) {
      const haystack =
        `${statement.statement_code} ${statement.title} ${statement.organization ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.query.toLowerCase())) return false;
    }
    return true;
  });
  const visible = filtered.slice(0, filters.limit);

  return (
    <section className="grid gap-5 border border-hairline bg-card/40 p-6">
      <div>
        <div className="font-display text-xl">Official problem statements</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {statements.length} seeded from sih.gov.in. Toggle publishing below; add missing ones with
          the form.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filters.query}
          onChange={(event) => filters.setQuery(event.target.value)}
          placeholder="Search code, title, ministryâ¦"
          className={`${field} min-w-[200px] flex-1`}
        />
        <select
          value={filters.theme}
          onChange={(event) => filters.setTheme(event.target.value)}
          className={field}
        >
          <option value="" className="bg-background">
            All themes
          </option>
          {themes.map((theme) => (
            <option key={theme} value={theme} className="bg-background">
              {theme}
            </option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(event) => filters.setCategory(event.target.value)}
          className={field}
        >
          <option value="" className="bg-background">
            Software + Hardware
          </option>
          <option value="Software" className="bg-background">
            Software
          </option>
          <option value="Hardware" className="bg-background">
            Hardware
          </option>
        </select>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {filtered.length} / {statements.length}
        </span>
      </div>

      <div className="flex max-h-[420px] flex-col gap-px overflow-y-auto border border-hairline bg-hairline">
        {visible.map((statement) => (
          <div
            key={statement.id}
            className="flex flex-wrap items-center justify-between gap-3 bg-background p-3 text-sm"
          >
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-silver">{statement.statement_code}</span>
              <span className="ml-2">{statement.title}</span>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {statement.category === "Hardware" ? "HW" : "SW"}
                {statement.theme ? ` Â· ${statement.theme}` : ""}
              </span>
            </div>
            <button
              className={ghost}
              onClick={async () => {
                try {
                  await saveStatement({
                    data: {
                      id: statement.id,
                      statementCode: statement.statement_code,
                      title: statement.title,
                      organization: statement.organization,
                      category: statement.category,
                      theme: statement.theme,
                      description: statement.description,
                      sourceUrl: statement.source_url,
                      sourceVersion: statement.source_version,
                      published: !statement.published,
                      sortOrder: statement.sort_order,
                    },
                  });
                  toast.success(statement.published ? "Unpublished." : "Published to teams.");
                  await refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update.");
                }
              }}
            >
              {statement.published ? "Unpublish" : "Publish"}
            </button>
          </div>
        ))}
      </div>
      {filtered.length > visible.length && (
        <button className={`${ghost} w-fit`} onClick={() => filters.setLimit(filters.limit + 60)}>
          Show more ({filtered.length - visible.length} remaining)
        </button>
      )}

      <div>
        <div className="font-display text-lg">Add a statement manually</div>
      </div>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          setBusy(true);
          try {
            await saveStatement({
              data: {
                statementCode: String(values.get("code") ?? ""),
                title: String(values.get("title") ?? ""),
                organization: String(values.get("organization") ?? "") || null,
                category: String(values.get("category") ?? "") || null,
                theme: String(values.get("theme") ?? "") || null,
                description: String(values.get("description") ?? "") || null,
                sourceUrl: String(values.get("sourceUrl") ?? "") || null,
                sourceVersion: String(values.get("sourceVersion") ?? "") || null,
                published: values.get("published") === "on",
                sortOrder: Number(values.get("sortOrder") ?? 0),
              },
            });
            toast.success("Problem statement saved.");
            form.reset();
            await refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save statement.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input name="code" required placeholder="Problem statement code" className={field} />
        <input name="title" required placeholder="Official title" className={field} />
        <input name="organization" placeholder="Organisation" className={field} />
        <input name="theme" placeholder="Official theme" className={field} />
        <input name="category" placeholder="Category" className={field} />
        <input name="sourceUrl" type="url" placeholder="Official source URL" className={field} />
        <input name="sourceVersion" placeholder="Source version / release" className={field} />
        <input name="sortOrder" type="number" min="0" defaultValue="0" className={field} />
        <textarea
          name="description"
          placeholder="Official description"
          rows={4}
          className={`${field} resize-none md:col-span-2`}
        />
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <input type="checkbox" name="published" /> Publish to teams
        </label>
        <button className={`${btn} w-fit`} disabled={busy}>
          {busy ? "Savingâ¦" : "Save statement"}
        </button>
      </form>
    </section>
  );
}

/* ---------------- check-in ---------------- */

type DoorResult = {
  tone: "ok" | "already" | "bad";
  title: string;
  name?: string;
  meta?: string;
  detail: string;
};

function DoorOutcome({ result, onScanNext }: { result: DoorResult; onScanNext: () => void }) {
  const isSuccess = result.tone === "ok";
  const isAlready = result.tone === "already";
  const Icon = isSuccess ? CheckCircle2 : isAlready ? AlertTriangle : XCircle;
  const colors = isSuccess
    ? "border-emerald-500 bg-emerald-600 text-white"
    : isAlready
      ? "border-amber-400 bg-slate-950 text-white"
      : "border-rose-500 bg-rose-700 text-white";

  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 shadow-[0_20px_60px_rgba(15,23,42,0.35)] ${colors}`}
      aria-live="assertive"
    >
      <div className="p-7 text-center sm:p-10">
        <Icon
          className="mx-auto animate-[pulse_1.2s_ease-in-out_2]"
          size={72}
          strokeWidth={2.3}
          aria-hidden
        />
        <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.17em] opacity-80">
          Vertex entry desk
        </p>
        <h2 className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">
          {result.title}
        </h2>
        {result.name && (
          <div className="mt-8 border-y border-white/25 py-5">
            <p className="font-display text-3xl font-semibold leading-tight">{result.name}</p>
            {result.meta && (
              <p className="mt-2 font-mono text-sm font-semibold tracking-[0.12em]">
                {result.meta}
              </p>
            )}
          </div>
        )}
        <p className="mt-6 text-base leading-relaxed opacity-90">{result.detail}</p>
      </div>
      <button
        type="button"
        onClick={onScanNext}
        className="flex w-full items-center justify-center gap-2 border-t border-white/25 bg-black/20 px-5 py-5 font-mono text-sm font-bold uppercase tracking-[0.12em] transition-colors hover:bg-black/35"
      >
        <RotateCcw size={18} /> Scan next attendee
      </button>
    </section>
  );
}

function CheckIn({
  registrations,
  events,
  workshopOnly = false,
}: {
  registrations: {
    id: string;
    event_id: string;
    name: string;
    email: string;
    checked_in_at: string | null;
  }[];
  events: { id: string; title: string }[];
  workshopOnly?: boolean;
}) {
  const scan = useServerFn(checkInByCode);
  const scanSih = useServerFn(checkInHackathonTeam);
  const scanWorkshop = useServerFn(checkInNeuralNetworkWorkshop);
  const [result, setResult] = useState<DoorResult | null>(null);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  const rows = registrations.filter((r) => r.event_id === eventId);
  const done = rows.filter((r) => r.checked_in_at).length;

  const processCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || result) return;
    try {
      if (workshopOnly && !code.toUpperCase().includes("VTX-NN:")) {
        setResult({
          tone: "bad",
          title: "Workshop pass required",
          detail: "This desk is only for approved Neural Networks Workshop passes.",
        });
        return;
      }
      if (code.toUpperCase().includes("VTX-NN:")) {
        const res = await scanWorkshop({ data: { code } });
        if (res.status === "ok") {
          setResult({
            tone: "ok",
            title: "Checked in",
            name: res.name,
            meta: res.srn,
            detail: "Neural Networks Workshop Â· attendance recorded",
          });
        } else if (res.status === "already") {
          setResult({
            tone: "already",
            title: "Already checked in",
            name: res.name,
            meta: res.srn,
            detail: "This pass has already been used.",
          });
        } else {
          setResult({
            tone: "bad",
            title: "Pass not accepted",
            detail: "Unknown, pending, or unapproved workshop pass.",
          });
        }
      } else if (code.toUpperCase().includes("VTX-SIH:")) {
        const res = await scanSih({ data: { code } });
        if (res.status === "ok") {
          setResult({
            tone: "ok",
            title: "Checked in",
            name: res.team,
            detail: res.members.map((m) => m.name).join(", "),
          });
        } else if (res.status === "already") {
          setResult({
            tone: "already",
            title: "Already checked in",
            name: res.team,
            detail: res.members.map((m) => m.name).join(", "),
          });
        } else {
          setResult({ tone: "bad", title: "Pass not accepted", detail: "Unknown SIH team pass." });
        }
      } else {
        const res = await scan({ data: { code } });
        if (res.status === "ok") {
          setResult({ tone: "ok", title: "Checked in", name: res.name, detail: res.event });
        } else if (res.status === "already") {
          setResult({
            tone: "already",
            title: "Already checked in",
            name: res.name,
            detail: "This pass has already been used.",
          });
        } else {
          setResult({
            tone: "bad",
            title: "Pass not accepted",
            detail: "Unknown or invalid pass.",
          });
        }
      }
    } catch {
      setResult({
        tone: "bad",
        title: "Check-in failed",
        detail: "Confirm your event-desk permission and try again.",
      });
    }
    // Keep the result on screen until the volunteer explicitly starts the next scan.
    // Invalidating the route here remounts this component and used to erase the
    // attendee name immediately after a successful scan.
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        <QRScanner onResult={(text) => void processCode(text)} paused={Boolean(result)} />
        <div className="space-y-4">
          <form
            className="flex flex-wrap items-end gap-3 border border-hairline bg-card/40 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const code = String(new FormData(form).get("code") ?? "");
              void processCode(code).then(() => form.reset());
            }}
          >
            <Label text="Pass code or scanned URL">
              <input
                name="code"
                required
                className={`${field} w-80`}
                placeholder="Type or pasteâ¦"
              />
            </Label>
            <button className={btn}>Check in</button>
          </form>
          {result && <DoorOutcome result={result} onScanNext={() => setResult(null)} />}
          <p className="max-w-md font-mono text-[10px] uppercase leading-5 tracking-widest text-muted-foreground">
            Scan a Vertex workshop or SIH pass, or paste its backup code. The same scan is ignored
            for a few seconds; duplicates show as a warning instead of an error.
          </p>
        </div>
      </div>

      {!workshopOnly && (
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Label text="Event">
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className={field}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id} className="bg-background">
                    {e.title}
                  </option>
                ))}
              </select>
            </Label>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {done} / {rows.length} attended
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 bg-background p-3">
                <div>
                  <div className="font-display text-sm">{r.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{r.email}</div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                  {r.checked_in_at ? "In" : "â"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {workshopOnly && (
        <div className="border border-hairline bg-card/40 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-silver">
            Neural Networks Workshop desk
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Scan an approved workshop QR pass. A clear result stays on screen until you choose “Scan
            next attendee”, so the volunteer can verify the attendee name and SRN.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- applications ---------------- */

function Applications({
  rows,
}: {
  rows: {
    id: string;
    name: string;
    email: string;
    team_first: string | null;
    team_second: string | null;
    why: string | null;
    status: string;
    notes: string | null;
  }[];
}) {
  const router = useRouter();
  const update = useServerFn(setApplicationStatus);

  return (
    <div className="flex flex-col gap-px border border-hairline bg-hairline">
      {rows.map((a) => (
        <div key={a.id} className="bg-background p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg">{a.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.email} Â· {a.team_first ?? "â"} / {a.team_second ?? "â"} Â· {a.status}
              </div>
            </div>
            <div className="flex gap-2">
              {(["shortlisted", "accepted", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  className={ghost}
                  onClick={async () => {
                    try {
                      await update({ data: { id: a.id, status: s, notes: a.notes } });
                      toast.success(`Marked ${s}.`);
                      await router.invalidate();
                    } catch {
                      toast.error("Could not update.");
                    }
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {a.why && <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{a.why}</p>}
        </div>
      ))}
      {rows.length === 0 && (
        <div className="bg-background p-6 font-mono text-xs text-muted-foreground">
          No applications yet.
        </div>
      )}
    </div>
  );
}

/* ---------------- members ---------------- */

type MemberRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  team_id: string | null;
  is_head: boolean;
  is_leadership: boolean;
  photo_url: string | null;
  bio: string | null;
  skills: string[] | null;
  links: unknown;
  sort_order: number;
};

function Teams({
  members,
  teams,
}: {
  members: MemberRow[];
  teams: { id: string; name: string }[];
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("__all");
  const filteredMembers =
    selectedTeamId === "__all"
      ? members
      : members.filter((member) => member.team_id === selectedTeamId);

  return (
    <div className="grid gap-6">
      <div>
        <div className="font-display text-xl">Team rosters</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a team to add or edit the members shown on the public Members page.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <TeamFilter
          label="All teams"
          count={members.length}
          active={selectedTeamId === "__all"}
          onClick={() => setSelectedTeamId("__all")}
        />
        {teams.map((team) => (
          <TeamFilter
            key={team.id}
            label={team.name}
            count={members.filter((member) => member.team_id === team.id).length}
            active={selectedTeamId === team.id}
            onClick={() => setSelectedTeamId(team.id)}
          />
        ))}
      </div>
      <Members
        key={selectedTeamId}
        members={filteredMembers}
        teams={teams}
        defaultTeamId={selectedTeamId === "__all" ? teams[0]?.id : selectedTeamId}
      />
    </div>
  );
}

function TeamFilter({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
        active
          ? "border-silver text-foreground"
          : "border-hairline text-muted-foreground hover:border-silver"
      }`}
    >
      {label} Â· {count}
    </button>
  );
}

function Members({
  members,
  teams,
  defaultTeamId,
}: {
  members: MemberRow[];
  teams: { id: string; name: string }[];
  defaultTeamId?: string;
}) {
  const router = useRouter();
  const save = useServerFn(saveMember);
  const remove = useServerFn(deleteMember);
  const award = useServerFn(awardBadge);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => readSocialLinks(null));
  const [busy, setBusy] = useState(false);

  const open = (m: MemberRow | null) => {
    setEditing(
      m ??
        ({
          id: "",
          slug: "",
          name: "",
          role: "Member",
          team_id: defaultTeamId ?? teams[0]?.id ?? null,
          is_head: false,
          is_leadership: false,
          photo_url: null,
          bio: null,
          skills: [],
          links: {},
          sort_order: 0,
        } as MemberRow),
    );
    setPhoto(m?.photo_url ?? null);
    setSocialLinks(readSocialLinks(m?.links));
  };

  return (
    <div className="grid gap-8">
      <button className={btn} onClick={() => open(null)}>
        + Add member
      </button>

      {editing && (
        <form
          className="grid gap-4 border border-hairline bg-card/40 p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name") ?? "");
            setBusy(true);
            try {
              await save({
                data: {
                  ...(editing.id ? { id: editing.id } : {}),
                  name,
                  slug: String(f.get("slug") ?? "") || slugify(name),
                  role: String(f.get("role") ?? "Member"),
                  teamId: String(f.get("team") ?? "") || null,
                  isHead: f.get("isHead") === "on",
                  isLeadership: f.get("isLeadership") === "on",
                  photoUrl: photo,
                  bio: String(f.get("bio") ?? "") || null,
                  skills: String(f.get("skills") ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  links: mergeSocialLinks(editing.links, socialLinks),
                  sortOrder: Number(f.get("sortOrder") ?? 0),
                },
              });
              toast.success("Member saved.");
              setEditing(null);
              await router.invalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="md:col-span-2">
            <PhotoUpload value={photo} onChange={setPhoto} label="Member photo" />
          </div>
          <Label text="Name">
            <input name="name" required defaultValue={editing.name} className={field} />
          </Label>
          <Label text="Profile link name (slug)">
            <input
              name="slug"
              defaultValue={editing.slug}
              placeholder="auto from name"
              className={field}
            />
          </Label>
          <Label text="Role">
            <input name="role" required defaultValue={editing.role} className={field} />
          </Label>
          <Label text="Team">
            <select name="team" defaultValue={editing.team_id ?? ""} className={field}>
              <option value="" className="bg-background">
                Leadership / none
              </option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">
                  {t.name}
                </option>
              ))}
            </select>
          </Label>
          <Label text="Skills (comma separated)">
            <input
              name="skills"
              defaultValue={(editing.skills ?? []).join(", ")}
              className={field}
            />
          </Label>
          <Label text="Sort order">
            <input
              name="sortOrder"
              type="number"
              defaultValue={editing.sort_order}
              className={field}
            />
          </Label>
          <Label text="Bio">
            <textarea
              name="bio"
              rows={3}
              defaultValue={editing.bio ?? ""}
              className={`${field} md:col-span-2 resize-none`}
            />
          </Label>
          <div className="grid gap-4 border-t border-hairline pt-5 md:col-span-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Social links
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Add GitHub, LinkedIn, Instagram, or X for this memberâs public profile.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {SOCIAL_LINK_FIELDS.map(({ key, label, placeholder }) => (
                <label key={key} className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                  <input
                    type="url"
                    value={socialLinks[key]}
                    placeholder={placeholder}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                    className={field}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isHead" defaultChecked={editing.is_head} /> Team head
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isLeadership" defaultChecked={editing.is_leadership} />{" "}
              Leadership
            </label>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className={btn} disabled={busy}>
              {busy ? "Savingâ¦" : "Save member"}
            </button>
            <button type="button" className={ghost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {members.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-4 bg-background p-4">
            <div className="min-w-0 flex-1">
              <div className="font-display text-base">{m.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.role} Â· {teams.find((t) => t.id === m.team_id)?.name ?? "Leadership"} Â· /
                {m.slug}
              </div>
            </div>
            <button className={ghost} onClick={() => open(m)}>
              Edit
            </button>
            <button
              className={ghost}
              onClick={async () => {
                const badgeId = window.prompt(
                  "Badge id (founder, team-head, hackathon-win, shipper, regular, mentor)",
                );
                if (!badgeId) return;
                try {
                  await award({ data: { memberId: m.id, badgeId, note: null } });
                  toast.success("Badge awarded.");
                } catch {
                  toast.error("Could not award badge.");
                }
              }}
            >
              Badge
            </button>
            <button
              className={ghost}
              onClick={async () => {
                if (!window.confirm(`Remove ${m.name}?`)) return;
                try {
                  await remove({ data: { id: m.id } });
                  toast.success("Member removed.");
                  await router.invalidate();
                } catch {
                  toast.error("Could not remove.");
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- events ---------------- */

type EventRow = {
  id: string;
  slug: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  location: string;
  tag: string;
  description: string | null;
  cover_url: string | null;
  capacity: number | null;
  published: boolean;
  operations: {
    registration_mode: "individual" | "team" | "disabled";
    registration_open: boolean;
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    requires_approval: boolean;
    waitlist_enabled: boolean;
    passes_enabled: boolean;
    checkin_enabled: boolean;
    email_enabled: boolean;
    team_min_size: number;
    team_max_size: number;
    submissions_enabled: boolean;
    judging_enabled: boolean;
  } | null;
};

const defaultEventOperations = {
  registration_mode: "individual" as const,
  registration_open: true,
  registration_opens_at: null,
  registration_closes_at: null,
  requires_approval: false,
  waitlist_enabled: false,
  passes_enabled: true,
  checkin_enabled: true,
  email_enabled: false,
  team_min_size: 1,
  team_max_size: 1,
  submissions_enabled: false,
  judging_enabled: false,
};

const toLocalDateTime = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

function Events({
  events,
  registrations,
}: {
  events: EventRow[];
  registrations: {
    id: string;
    event_id: string;
    name: string;
    email: string;
    status: "pending" | "approved" | "rejected" | "waitlisted";
    checked_in_at: string | null;
    created_at: string;
    form_data: unknown;
  }[];
}) {
  const router = useRouter();
  const save = useServerFn(saveEvent);
  const reviewRegistration = useServerFn(setEventRegistrationStatus);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sarvamEvent = events.find((event) => event.slug === "build-with-sarvam");
  const sarvamRegistrations = sarvamEvent
    ? registrations.filter((registration) => registration.event_id === sarvamEvent.id)
    : [];
  const genericRegistrations = registrations.filter(
    (registration) =>
      !events.some(
        (event) => event.id === registration.event_id && event.slug === "build-with-sarvam",
      ),
  );

  const open = (e: EventRow | null) => {
    setEditing(
      e ??
        ({
          id: "",
          slug: "",
          title: "",
          event_date: new Date().toISOString().slice(0, 10),
          start_time: "",
          location: "TBA",
          tag: "Event",
          description: "",
          cover_url: null,
          capacity: null,
          published: true,
          operations: defaultEventOperations,
        } as EventRow),
    );
    setCover(e?.cover_url ?? null);
  };

  return (
    <div className="grid gap-8">
      <button className={btn} onClick={() => open(null)}>
        + Add event
      </button>

      {editing && (
        <form
          className="grid gap-4 border border-hairline bg-card/40 p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const title = String(f.get("title") ?? "");
            const toIso = (name: string) => {
              const value = String(f.get(name) ?? "");
              return value ? new Date(value).toISOString() : null;
            };
            setBusy(true);
            try {
              await save({
                data: {
                  ...(editing.id ? { id: editing.id } : {}),
                  title,
                  slug: String(f.get("slug") ?? "") || slugify(title),
                  eventDate: String(f.get("date") ?? ""),
                  startTime: String(f.get("time") ?? "") || null,
                  location: String(f.get("location") ?? "TBA"),
                  tag: String(f.get("tag") ?? "Event"),
                  description: String(f.get("description") ?? "") || null,
                  coverUrl: cover,
                  capacity: f.get("capacity") ? Number(f.get("capacity")) : null,
                  published: f.get("published") === "on",
                  operations: {
                    registrationMode: String(f.get("registrationMode") ?? "individual") as
                      "individual" | "team" | "disabled",
                    registrationOpen: f.get("registrationOpen") === "on",
                    registrationOpensAt: toIso("registrationOpensAt"),
                    registrationClosesAt: toIso("registrationClosesAt"),
                    requiresApproval: f.get("requiresApproval") === "on",
                    waitlistEnabled: f.get("waitlistEnabled") === "on",
                    passesEnabled: f.get("passesEnabled") === "on",
                    checkinEnabled: f.get("checkinEnabled") === "on",
                    emailEnabled: f.get("emailEnabled") === "on",
                    teamMinSize: Number(f.get("teamMinSize") ?? 1),
                    teamMaxSize: Number(f.get("teamMaxSize") ?? 1),
                    submissionsEnabled: f.get("submissionsEnabled") === "on",
                    judgingEnabled: f.get("judgingEnabled") === "on",
                  },
                },
              });
              toast.success("Event saved.");
              setEditing(null);
              await router.invalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="md:col-span-2">
            <PhotoUpload value={cover} onChange={setCover} folder="events" label="Cover image" />
          </div>
          <Label text="Title">
            <input name="title" required defaultValue={editing.title} className={field} />
          </Label>
          <Label text="Link name (slug)">
            <input
              name="slug"
              defaultValue={editing.slug}
              placeholder="auto from title"
              className={field}
            />
          </Label>
          <Label text="Date">
            <input
              name="date"
              type="date"
              required
              defaultValue={editing.event_date ?? ""}
              className={field}
            />
          </Label>
          <Label text="Start time">
            <input name="time" defaultValue={editing.start_time ?? ""} className={field} />
          </Label>
          <Label text="Location">
            <input name="location" required defaultValue={editing.location} className={field} />
          </Label>
          <Label text="Tag">
            <input name="tag" required defaultValue={editing.tag} className={field} />
          </Label>
          <Label text="Capacity">
            <input
              name="capacity"
              type="number"
              defaultValue={editing.capacity ?? ""}
              className={field}
            />
          </Label>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input type="checkbox" name="published" defaultChecked={editing.published} /> Published
          </label>
          <Label text="Description">
            <textarea
              name="description"
              rows={3}
              defaultValue={editing.description ?? ""}
              className={`${field} resize-none md:col-span-2`}
            />
          </Label>
          <EventOperationsFields operations={editing.operations ?? defaultEventOperations} />
          {editing.id && <EventStaffAccessPanel eventId={editing.id} />}
          <div className="flex gap-2 md:col-span-2">
            <button className={btn} disabled={busy}>
              {busy ? "Savingâ¦" : "Save event"}
            </button>
            <button type="button" className={ghost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-4 bg-background p-4">
            <div>
              <div className="font-display text-base">{e.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {e.event_date ? new Date(e.event_date).toDateString() : "Date TBA"} Â· {e.location}{" "}
                Â· {e.published ? "live" : "draft"}
              </div>
            </div>
            <button className={ghost} onClick={() => open(e)}>
              Edit
            </button>
          </div>
        ))}
      </div>

      <div className="border border-hairline bg-card/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="font-display text-xl">Registration review</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Approve, waitlist or reject generic event registrations. Approved attendees can use
              their existing QR code at the door.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
            {genericRegistrations.filter((r) => r.status === "pending").length} pending
          </span>
        </div>
        <div className="mt-5 grid gap-2">
          {genericRegistrations.map((registration) => {
            const event = events.find((item) => item.id === registration.event_id);
            return (
              <div
                key={registration.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-background p-3"
              >
                <div>
                  <div className="font-medium">{registration.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {event?.title ?? "Event"} · {registration.email} · {registration.status}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {registration.status !== "approved" && (
                    <button
                      className={btn}
                      onClick={() =>
                        void reviewRegistration({
                          data: { id: registration.id, status: "approved" },
                        })
                          .then(() => router.invalidate())
                          .catch(() => toast.error("Could not approve this registration."))
                      }
                    >
                      Approve
                    </button>
                  )}
                  {registration.status !== "waitlisted" && (
                    <button
                      className={ghost}
                      onClick={() =>
                        void reviewRegistration({
                          data: { id: registration.id, status: "waitlisted" },
                        })
                          .then(() => router.invalidate())
                          .catch(() => toast.error("Could not waitlist this registration."))
                      }
                    >
                      Waitlist
                    </button>
                  )}
                  {registration.status !== "rejected" && (
                    <button
                      className={ghost}
                      onClick={() =>
                        void reviewRegistration({
                          data: { id: registration.id, status: "rejected" },
                        })
                          .then(() => router.invalidate())
                          .catch(() => toast.error("Could not reject this registration."))
                      }
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {genericRegistrations.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground">
              No generic event registrations yet.
            </p>
          )}
        </div>
      </div>

      {sarvamEvent && (
        <SarvamRegistrationSection
          event={sarvamEvent}
          registrations={sarvamRegistrations}
          onStatusChange={async (id, status) => {
            try {
              const result = await reviewRegistration({ data: { id, status } });
              if (status === "approved" && !result.emailSent) {
                toast.error(
                  "Registration approved, but the team-lead email could not be sent. Check the email provider settings.",
                );
              } else {
                toast.success(`Registration ${status}.`);
              }
              await router.invalidate();
            } catch {
              toast.error("Could not update this Sarvam registration.");
            }
          }}
        />
      )}
    </div>
  );
}

type SarvamMember = {
  name: string;
  email: string;
  phone?: string;
  usn?: string;
  college?: string;
  branch?: string;
  year?: string;
  is_lead?: boolean;
};

type SarvamRegistrationDetails = {
  teamName: string;
  members: SarvamMember[];
  projectTitle: string;
  track: string;
  problem: string;
  solution: string;
  innovation: string;
  aiUse: string;
  beneficiaries: string;
};

function readSarvamRegistrationDetails(value: unknown): SarvamRegistrationDetails {
  if (!value || typeof value !== "object") {
    return {
      teamName: "",
      members: [],
      projectTitle: "",
      track: "",
      problem: "",
      solution: "",
      innovation: "",
      aiUse: "",
      beneficiaries: "",
    };
  }
  const data = value as Record<string, unknown>;
  const members = Array.isArray(data.members)
    ? data.members.flatMap((member) => {
        if (!member || typeof member !== "object") return [];
        const row = member as Record<string, unknown>;
        if (typeof row.name !== "string" || typeof row.email !== "string") return [];
        return [
          {
            name: row.name,
            email: row.email,
            phone: typeof row.phone === "string" ? row.phone : undefined,
            usn: typeof row.usn === "string" ? row.usn : undefined,
            college: typeof row.college === "string" ? row.college : undefined,
            branch: typeof row.branch === "string" ? row.branch : undefined,
            year: typeof row.year === "string" ? row.year : undefined,
            is_lead: row.is_lead === true,
          },
        ];
      })
    : [];

  return {
    teamName: typeof data.team_name === "string" ? data.team_name : "",
    members,
    projectTitle: typeof data.project_title === "string" ? data.project_title : "",
    track: typeof data.track === "string" ? data.track : "",
    problem: typeof data.problem === "string" ? data.problem : "",
    solution: typeof data.solution === "string" ? data.solution : "",
    innovation: typeof data.innovation === "string" ? data.innovation : "",
    aiUse: typeof data.ai_use === "string" ? data.ai_use : "",
    beneficiaries: typeof data.beneficiaries === "string" ? data.beneficiaries : "",
  };
}

function BuildWithSarvamWorkspace({
  event,
  registrations,
}: {
  event?: EventRow;
  registrations: {
    id: string;
    name: string;
    email: string;
    status: "pending" | "approved" | "rejected" | "waitlisted";
    created_at: string;
    form_data: unknown;
  }[];
}) {
  const router = useRouter();
  const reviewRegistration = useServerFn(setEventRegistrationStatus);
  const participants = registrations.reduce((total, registration) => {
    return total + readSarvamRegistrationDetails(registration.form_data).members.length;
  }, 0);
  const pending = registrations.filter((registration) => registration.status === "pending").length;
  const approved = registrations.filter(
    (registration) => registration.status === "approved",
  ).length;

  if (!event) {
    return (
      <section className="border border-dashed border-hairline p-6 text-sm text-muted-foreground">
        The BUILD WITH SARVAM event workspace is not available yet.
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden border border-silver/40 bg-card/40">
        <div className="grid-backdrop border-b border-hairline p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver">
                Event workspace
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                BUILD WITH SARVAM
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Persistent team registration records for the Sarvam AI hackathon. Review the team
                lead and every submitted member from this workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btn}
                onClick={() => exportSarvamRegistrationsCsv(event, registrations)}
              >
                Download CSV
              </button>
              <a
                className={ghost}
                href="/events/build-with-sarvam"
                target="_blank"
                rel="noreferrer"
              >
                Open public page →
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>{event.location}</span>
            <span>13–14 November</span>
            <span>Team size exactly 4</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-b border-hairline bg-hairline sm:grid-cols-4">
          <CommandMetric label="Teams" value={registrations.length} />
          <CommandMetric label="Participants" value={participants} />
          <CommandMetric
            label="Pending review"
            value={pending}
            tone={pending > 0 ? "attention" : undefined}
          />
          <CommandMetric label="Approved" value={approved} />
        </div>
      </section>

      <SarvamRegistrationSection
        event={event}
        registrations={registrations}
        onStatusChange={async (id, status) => {
          try {
            const result = await reviewRegistration({ data: { id, status } });
            if (status === "approved" && !result.emailSent) {
              toast.error(
                "Registration approved, but the team-lead email could not be sent. Check the email provider settings.",
              );
            } else {
              toast.success(`Registration ${status}.`);
            }
            await router.invalidate();
          } catch {
            toast.error("Could not update this Sarvam registration.");
          }
        }}
      />
    </div>
  );
}

function SarvamRegistrationSection({
  event,
  registrations,
  onStatusChange,
}: {
  event: EventRow;
  registrations: {
    id: string;
    name: string;
    email: string;
    status: "pending" | "approved" | "rejected" | "waitlisted";
    created_at: string;
    form_data: unknown;
  }[];
  onStatusChange: (id: string, status: "approved" | "waitlisted" | "rejected") => Promise<void>;
}) {
  const participants = registrations.reduce((total, registration) => {
    return total + readSarvamRegistrationDetails(registration.form_data).members.length;
  }, 0);
  const pending = registrations.filter((registration) => registration.status === "pending").length;

  return (
    <section className="border border-silver/40 bg-card/40 p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
            Hackathon registrations
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold">BUILD WITH SARVAM</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Team rosters submitted through the Sarvam workspace · {event.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>
            <b className="text-foreground">{registrations.length}</b> teams
          </span>
          <span>
            <b className="text-foreground">{participants}</b> participants
          </span>
          <span>
            <b className="text-foreground">{pending}</b> pending
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {registrations.map((registration) => {
          const details = readSarvamRegistrationDetails(registration.form_data);
          const teamName = details.teamName || `Team led by ${registration.name}`;
          return (
            <article
              key={registration.id}
              className="border border-hairline bg-background p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-semibold">{teamName}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Lead: {registration.name} · {registration.email} · Registered{" "}
                    {new Date(registration.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-silver">
                  {registration.status}
                </span>
              </div>

              {details.members.length > 0 ? (
                <div className="mt-5 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
                  {details.members.map((member) => (
                    <div key={`${registration.id}-${member.email}`} className="bg-card/50 p-4">
                      <div className="flex items-center gap-2 font-medium">
                        {member.name}
                        {member.is_lead && (
                          <span className="font-mono text-[9px] uppercase tracking-widest text-silver">
                            Lead
                          </span>
                        )}
                      </div>
                      <div className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
                        {member.email}
                      </div>
                      <div className="mt-3 grid gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {member.phone && <span>Phone · {member.phone}</span>}
                        {member.usn && <span>USN · {member.usn}</span>}
                        {member.college && <span>College · {member.college}</span>}
                        {(member.branch || member.year) && (
                          <span>{[member.branch, member.year].filter(Boolean).join(" · ")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No member roster data available.
                </p>
              )}

              {details.projectTitle && (
                <div className="mt-5 grid gap-4 border border-hairline bg-background p-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-silver">
                      Idea submission
                    </div>
                    <h4 className="mt-2 font-display text-2xl">{details.projectTitle}</h4>
                    {details.track && (
                      <p className="mt-1 text-xs text-muted-foreground">Track · {details.track}</p>
                    )}
                  </div>
                  {[
                    ["Problem", details.problem],
                    ["Proposed solution", details.solution],
                    ["Innovation", details.innovation],
                    ["AI usage", details.aiUse],
                    ["Beneficiaries & impact", details.beneficiaries],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-hairline bg-card/50 p-3">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {label}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {registration.status !== "approved" && (
                  <button
                    className={btn}
                    onClick={() => void onStatusChange(registration.id, "approved")}
                  >
                    Approve
                  </button>
                )}
                {registration.status !== "waitlisted" && (
                  <button
                    className={ghost}
                    onClick={() => void onStatusChange(registration.id, "waitlisted")}
                  >
                    Waitlist
                  </button>
                )}
                {registration.status !== "rejected" && (
                  <button
                    className={ghost}
                    onClick={() => void onStatusChange(registration.id, "rejected")}
                  >
                    Reject
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {registrations.length === 0 && (
          <p className="font-mono text-xs text-muted-foreground">
            No BUILD WITH SARVAM registrations yet.
          </p>
        )}
      </div>
    </section>
  );
}

function EventOperationsFields({
  operations,
}: {
  operations: NonNullable<EventRow["operations"]>;
}) {
  return (
    <fieldset className="grid gap-4 border border-hairline bg-background/60 p-4 md:col-span-2">
      <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-silver">
        Registration &amp; event operations
      </legend>
      <p className="text-sm text-muted-foreground">
        Configure the workflow once here. The public registration, pass, check-in and future team
        tools use these rules instead of a one-off event build.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Label text="Registration type">
          <select
            name="registrationMode"
            defaultValue={operations.registration_mode}
            className={field}
          >
            <option value="individual">Individual</option>
            <option value="team">Team</option>
            <option value="disabled">No registration</option>
          </select>
        </Label>
        <Label text="Registration opens">
          <input
            name="registrationOpensAt"
            type="datetime-local"
            defaultValue={toLocalDateTime(operations.registration_opens_at)}
            className={field}
          />
        </Label>
        <Label text="Registration closes">
          <input
            name="registrationClosesAt"
            type="datetime-local"
            defaultValue={toLocalDateTime(operations.registration_closes_at)}
            className={field}
          />
        </Label>
      </div>
      <div className="grid gap-x-6 gap-y-3 md:grid-cols-3">
        {[
          ["registrationOpen", "Registration is open", operations.registration_open],
          ["requiresApproval", "Require approval before pass", operations.requires_approval],
          ["waitlistEnabled", "Allow waitlist", operations.waitlist_enabled],
          ["passesEnabled", "Issue QR passes", operations.passes_enabled],
          ["checkinEnabled", "Enable door check-in", operations.checkin_enabled],
          ["emailEnabled", "Send event email", operations.email_enabled],
          ["submissionsEnabled", "Collect submissions", operations.submissions_enabled],
          ["judgingEnabled", "Enable judging", operations.judging_enabled],
        ].map(([name, label, checked]) => (
          <label
            key={String(name)}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} />
            {String(label)}
          </label>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Label text="Minimum team size">
          <input
            name="teamMinSize"
            type="number"
            min="1"
            max="100"
            defaultValue={operations.team_min_size}
            className={field}
          />
        </Label>
        <Label text="Maximum team size">
          <input
            name="teamMaxSize"
            type="number"
            min="1"
            max="100"
            defaultValue={operations.team_max_size}
            className={field}
          />
        </Label>
      </div>
    </fieldset>
  );
}

function EventStaffAccessPanel({ eventId }: { eventId: string }) {
  const list = useServerFn(listEventStaffAccess);
  const save = useServerFn(saveEventStaffAccess);
  const revoke = useServerFn(revokeEventStaffAccess);
  const [staff, setStaff] = useState<
    { id: string; email: string; permission: "manager" | "checkin" | "viewer"; active: boolean }[]
  >([]);

  const refresh = useCallback(() => list({ data: { eventId } }).then(setStaff), [eventId, list]);
  useEffect(() => {
    void refresh().catch(() => toast.error("Could not load event access."));
  }, [refresh]);

  return (
    <section className="grid gap-4 border border-hairline bg-background/60 p-4 md:col-span-2">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-silver">
          Event monitoring access
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant an email access to this event only. It does not create a Vertex admin account.
          Check-in staff can scan passes; managers can run the event desk; viewers are reserved for
          read-only monitoring.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const fields = new FormData(form);
          void save({
            data: {
              eventId,
              email: String(fields.get("eventStaffEmail") ?? ""),
              permission: String(fields.get("eventStaffPermission") ?? "checkin") as
                "manager" | "checkin" | "viewer",
            },
          })
            .then(() => refresh())
            .then(() => form.reset())
            .then(() => toast.success("Event access granted."))
            .catch((error) =>
              toast.error(error instanceof Error ? error.message : "Could not grant access."),
            );
        }}
      >
        <Label text="Volunteer email">
          <input
            name="eventStaffEmail"
            type="email"
            required
            placeholder="member@gmail.com"
            className={field}
          />
        </Label>
        <Label text="Access">
          <select name="eventStaffPermission" defaultValue="checkin" className={field}>
            <option value="checkin">Check-in only</option>
            <option value="manager">Event manager</option>
            <option value="viewer">Viewer</option>
          </select>
        </Label>
        <button className={btn}>Grant access</button>
      </form>
      {staff
        .filter((person) => person.active)
        .map((person) => (
          <div
            key={person.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-card/40 px-3 py-2"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {person.email} ·{" "}
              {person.permission === "checkin" ? "check-in only" : person.permission}
            </span>
            <button
              type="button"
              className="border border-rose-500/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-rose-300 hover:bg-rose-950"
              onClick={() =>
                void revoke({ data: { id: person.id } })
                  .then(refresh)
                  .then(() => toast.success("Event access revoked."))
                  .catch(() => toast.error("Could not revoke access."))
              }
            >
              Revoke
            </button>
          </div>
        ))}
    </section>
  );
}

/* ---------------- projects ---------------- */

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tech: string[];
  cover_url: string | null;
  link: string | null;
  year: number | null;
  published: boolean;
};

function Projects({ projects, members }: { projects: ProjectRow[]; members: MemberRow[] }) {
  const router = useRouter();
  const save = useServerFn(saveProject);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [people, setPeople] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const open = (p: ProjectRow | null) => {
    setEditing(
      p ??
        ({
          id: "",
          slug: "",
          title: "",
          description: "",
          tech: [],
          cover_url: null,
          link: "",
          year: new Date().getFullYear(),
          published: true,
        } as ProjectRow),
    );
    setCover(p?.cover_url ?? null);
    setPeople([]);
  };

  return (
    <div className="grid gap-8">
      <button className={btn} onClick={() => open(null)}>
        + Add project
      </button>

      {editing && (
        <form
          className="grid gap-4 border border-hairline bg-card/40 p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const title = String(f.get("title") ?? "");
            setBusy(true);
            try {
              await save({
                data: {
                  ...(editing.id ? { id: editing.id } : {}),
                  title,
                  slug: String(f.get("slug") ?? "") || slugify(title),
                  description: String(f.get("description") ?? "") || null,
                  tech: String(f.get("tech") ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  coverUrl: cover,
                  link: String(f.get("link") ?? "") || null,
                  year: f.get("year") ? Number(f.get("year")) : null,
                  published: f.get("published") === "on",
                  contributorIds: people,
                },
              });
              toast.success("Project saved.");
              setEditing(null);
              await router.invalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="md:col-span-2">
            <PhotoUpload value={cover} onChange={setCover} folder="projects" label="Cover image" />
          </div>
          <Label text="Title">
            <input name="title" required defaultValue={editing.title} className={field} />
          </Label>
          <Label text="Link name (slug)">
            <input
              name="slug"
              defaultValue={editing.slug}
              placeholder="auto from title"
              className={field}
            />
          </Label>
          <Label text="Tech (comma separated)">
            <input name="tech" defaultValue={editing.tech.join(", ")} className={field} />
          </Label>
          <Label text="External link">
            <input name="link" defaultValue={editing.link ?? ""} className={field} />
          </Label>
          <Label text="Year">
            <input name="year" type="number" defaultValue={editing.year ?? ""} className={field} />
          </Label>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input type="checkbox" name="published" defaultChecked={editing.published} /> Published
          </label>
          <Label text="Description">
            <textarea
              name="description"
              rows={3}
              defaultValue={editing.description ?? ""}
              className={`${field} resize-none md:col-span-2`}
            />
          </Label>
          <div className="md:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Contributors
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() =>
                    setPeople(
                      people.includes(m.id) ? people.filter((p) => p !== m.id) : [...people, m.id],
                    )
                  }
                  className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${
                    people.includes(m.id)
                      ? "border-silver text-foreground"
                      : "border-hairline text-muted-foreground"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className={btn} disabled={busy}>
              {busy ? "Savingâ¦" : "Save project"}
            </button>
            <button type="button" className={ghost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 bg-background p-4">
            <div>
              <div className="font-display text-base">{p.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.year ?? "â"} Â· {p.published ? "live" : "draft"}
              </div>
            </div>
            <button className={ghost} onClick={() => open(p)}>
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- announcements ---------------- */

function Announcements({
  rows,
  teams,
  isAdmin,
  headTeams,
}: {
  rows: {
    id: string;
    title: string;
    body: string;
    team_id: string | null;
    pinned: boolean;
    published: boolean;
    media_url: string | null;
    media_type: string | null;
    created_at: string;
  }[];
  teams: { id: string; name: string }[];
  isAdmin: boolean;
  headTeams: string[];
}) {
  const router = useRouter();
  const save = useServerFn(saveAnnouncement);
  const remove = useServerFn(deleteAnnouncement);
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<{ url: string | null; type: UploadedMediaType | null }>({
    url: null,
    type: null,
  });
  const allowed = isAdmin ? teams : teams.filter((t) => headTeams.includes(t.id));

  return (
    <div className="grid gap-8">
      <form
        className="grid gap-4 border border-hairline bg-card/40 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const form = e.currentTarget;
          setBusy(true);
          try {
            await save({
              data: {
                title: String(f.get("title") ?? ""),
                body: String(f.get("body") ?? ""),
                teamId: String(f.get("team") ?? "") || null,
                pinned: f.get("pinned") === "on",
                published: true,
                mediaUrl: media.url,
                mediaType: media.type,
              },
            });
            toast.success("Announcement posted.");
            form.reset();
            setMedia({ url: null, type: null });
            await router.invalidate();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not post.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Label text="Title">
          <input name="title" required className={field} />
        </Label>
        <Label text="Message">
          <textarea name="body" rows={4} required className={`${field} resize-none`} />
        </Label>
        {isAdmin && (
          <MediaUpload
            value={media.url}
            mediaType={media.type}
            onChange={(url, type) => setMedia({ url, type })}
          />
        )}
        <div className="flex flex-wrap items-center gap-4">
          <Label text="Audience">
            <select
              name="team"
              className={field}
              defaultValue={isAdmin ? "" : (allowed[0]?.id ?? "")}
            >
              {isAdmin && (
                <option value="" className="bg-background">
                  Club-wide
                </option>
              )}
              {allowed.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">
                  {t.name}
                </option>
              ))}
            </select>
          </Label>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input type="checkbox" name="pinned" /> Pin to top
          </label>
          <button className={btn} disabled={busy}>
            {busy ? "Postingâ¦" : "Post announcement"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {rows.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-4 bg-background p-4">
            <div className="min-w-0">
              <div className="font-display text-base">{a.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.team_id
                  ? (teams.find((t) => t.id === a.team_id)?.name ?? a.team_id)
                  : "Club-wide"}{" "}
                Â· {new Date(a.created_at).toDateString()}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
              {a.media_url && (
                <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-silver">
                  {a.media_type === "video" ? "Video attached" : "Image attached"}
                </div>
              )}
            </div>
            <button
              className={ghost}
              onClick={async () => {
                try {
                  await remove({ data: { id: a.id } });
                  toast.success("Deleted.");
                  await router.invalidate();
                } catch {
                  toast.error("Could not delete.");
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- judging ---------------- */

function Judging() {
  const load = useServerFn(getJudging);
  const saveScore = useServerFn(saveJudgingScore);
  const [data, setData] = useState<Awaited<ReturnType<typeof getJudging>> | null>(null);
  const [teamId, setTeamId] = useState("");
  const [draft, setDraft] = useState<Record<string, { score: string; feedback: string }>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load judging data."));
  }, [load]);

  if (!data) return <p className="font-mono text-xs text-muted-foreground">Loading judgingâ¦</p>;
  if (data.teams.length === 0)
    return <p className="font-mono text-xs text-muted-foreground">No teams to judge yet.</p>;

  const team = data.teams.find((t) => t.id === teamId) ?? data.teams[0]!;
  const myScores = new Map(
    data.scores.filter((s) => s.team_id === team.id).map((s) => [s.criterion_id, s]),
  );

  return (
    <div className="grid gap-8">
      <section className="border border-hairline bg-card/40 p-6">
        <div className="font-display text-xl">Leaderboard</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Weighted average across all judges. Criteria weights:{" "}
          {data.criteria.map((c) => `${c.name.split(" ")[0]} Ã${c.weight}`).join(", ")}
        </p>
        <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
          {data.leaderboard.map((row, index) => (
            <button
              key={row.teamId}
              onClick={() => setTeamId(row.teamId)}
              className={`flex items-center justify-between gap-4 bg-background p-3 text-left hover:bg-black/[0.03] ${
                row.teamId === team.id ? "outline outline-1 outline-silver" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right font-mono text-[10px] text-muted-foreground">
                  {row.scoreTotal === null ? "â" : `#${index + 1}`}
                </span>
                <span className="font-display text-sm">{row.name}</span>
              </span>
              <span className="font-mono text-xs text-silver">
                {row.scoreTotal === null
                  ? "not scored"
                  : `${row.scoreTotal}/10 Â· ${row.judgeCount} judge${row.judgeCount === 1 ? "" : "s"}`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="border border-hairline bg-card/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-display text-xl">Score team</div>
          <select value={team.id} onChange={(e) => setTeamId(e.target.value)} className={field}>
            {data.teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-background">
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid gap-4">
          {data.criteria.map((criterion) => {
            const existing = myScores.get(criterion.id);
            const entry = draft[criterion.id] ?? {
              score: existing ? String(existing.score) : "",
              feedback: existing?.feedback ?? "",
            };
            return (
              <div key={criterion.id} className="border border-hairline p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm">{criterion.name}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      0â{criterion.max_score} points Â· weight Ã{criterion.weight}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={criterion.max_score}
                    step="0.5"
                    value={entry.score}
                    onChange={(e) =>
                      setDraft({ ...draft, [criterion.id]: { ...entry, score: e.target.value } })
                    }
                    className={`${field} w-24`}
                    placeholder="0"
                  />
                </div>
                <textarea
                  rows={2}
                  value={entry.feedback}
                  onChange={(e) =>
                    setDraft({ ...draft, [criterion.id]: { ...entry, feedback: e.target.value } })
                  }
                  placeholder="Feedback for the team (optional)"
                  className={`${field} mt-3 w-full resize-none`}
                />
                <button
                  className={`${btn} mt-3`}
                  disabled={busy || entry.score === ""}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await saveScore({
                        data: {
                          teamId: team.id,
                          criterionId: criterion.id,
                          score: Number(entry.score),
                          feedback: entry.feedback,
                        },
                      });
                      toast.success(`Saved ${criterion.name}.`);
                      setData(await load());
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not save score.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Save score
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---------------- people: codes, roles, mentorship ---------------- */

function People() {
  const [section, setSection] = useState<"codes" | "roles" | "mentorship">("codes");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["codes", "Access codes"],
            ["roles", "Staff roles"],
            ["mentorship", "Mentorship"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
              section === id
                ? "border-silver text-foreground"
                : "border-hairline text-muted-foreground hover:border-silver"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {section === "codes" && <AccessCodes />}
      {section === "roles" && <StaffRoles />}
      {section === "mentorship" && <MentorshipAdmin />}
    </div>
  );
}

function AccessCodes() {
  const load = useServerFn(listStaffInvites);
  const issue = useServerFn(issueStaffInvite);
  const revoke = useServerFn(revokeStaffInvite);
  const [data, setData] = useState<Awaited<ReturnType<typeof listStaffInvites>> | null>(null);
  const [role, setRole] = useState<"judge" | "mentor">("judge");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [lastCode, setLastCode] = useState("");

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load codes."));
  }, [load]);

  return (
    <div className="grid gap-6">
      <div className="border border-hairline bg-card/40 p-6">
        <div className="font-display text-xl">Issue a verification code</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Hand a code to a judge or mentor you trust. They enter it once at sign-up â no code, no
          staff access.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Label text="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "judge")}
              className={field}
            >
              <option value="judge" className="bg-background">
                Judge
              </option>
              <option value="mentor" className="bg-background">
                Mentor
              </option>
            </select>
          </Label>
          <Label text="Label (optional)">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Prof from NMIT"
              className={`${field} w-56`}
            />
          </Label>
          <Label text="Uses">
            <input
              type="number"
              min={1}
              max={50}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className={`${field} w-20`}
            />
          </Label>
          <button
            className={btn}
            onClick={async () => {
              try {
                const result = await issue({ data: { role, label, maxUses } });
                setLastCode(result.code);
                await navigator.clipboard.writeText(result.code).catch(() => {});
                toast.success("Code created and copied.");
                setData(await load());
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not create code.");
              }
            }}
          >
            Create code
          </button>
          {lastCode && (
            <span className="font-mono text-sm tracking-widest text-silver">{lastCode}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {(data?.invites ?? []).map((invite) => (
          <div
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-3 bg-background p-3"
          >
            <div>
              <span className="font-mono text-sm tracking-widest">{invite.code}</span>
              <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-silver">
                {invite.role}
                {invite.label ? ` Â· ${invite.label}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground">
                {invite.used_count}/{invite.max_uses} used
              </span>
              {invite.revoked ? (
                <span className="font-mono text-[10px] uppercase tracking-widest text-red-300">
                  revoked
                </span>
              ) : (
                <button
                  className={ghost}
                  onClick={async () => {
                    try {
                      await revoke({ data: { id: invite.id } });
                      toast.success("Code revoked.");
                      setData(await load());
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not revoke.");
                    }
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
        {data?.invites.length === 0 && (
          <div className="bg-background p-4 text-sm text-muted-foreground">
            No codes issued yet.
          </div>
        )}
      </div>
    </div>
  );
}

function MentorshipAdmin() {
  const load = useServerFn(listMentorshipRequests);
  const [data, setData] = useState<Awaited<ReturnType<typeof listMentorshipRequests>> | null>(null);

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load mentorship."));
  }, [load]);

  if (!data) return <p className="font-mono text-xs text-muted-foreground">Loadingâ¦</p>;

  return (
    <div className="flex flex-col gap-px border border-hairline bg-hairline">
      {data.requests.map((request) => (
        <div
          key={request.id}
          className="flex flex-wrap items-center justify-between gap-3 bg-background p-3"
        >
          <div>
            <div className="text-sm">
              {request.mentee} â {request.mentor}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">{request.topic}</div>
          </div>
          <span
            className={`font-mono text-[10px] uppercase tracking-widest ${
              request.status === "accepted"
                ? "text-emerald-300"
                : request.status === "pending"
                  ? "text-amber-300"
                  : "text-muted-foreground"
            }`}
          >
            {request.status}
          </span>
        </div>
      ))}
      {data.requests.length === 0 && (
        <div className="bg-background p-4 text-sm text-muted-foreground">
          No mentorship requests yet.
        </div>
      )}
    </div>
  );
}

function StaffRoles() {
  const load = useServerFn(listStaffRoles);
  const save = useServerFn(setUserRole);
  const [data, setData] = useState<Awaited<ReturnType<typeof listStaffRoles>> | null>(null);

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load roles."));
  }, [load]);

  if (!data) return <p className="font-mono text-xs text-muted-foreground">Loading rolesâ¦</p>;

  const roleOf = (userId: string) => data.roles.find((r) => r.userId === userId)?.role ?? "none";

  return (
    <div className="border border-hairline bg-card/40 p-6">
      <div className="font-display text-xl">Staff roles</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Admins control everything. Heads can run check-in, judge, and triage teams. Only members who
        signed in at least once appear here.
      </p>
      <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
        {data.members.map((member) => (
          <div
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 bg-background p-3"
          >
            <div>
              <div className="font-display text-sm">{member.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground">
                /{member.slug}
                {member.isHead ? " Â· roster head" : ""}
              </div>
            </div>
            <select
              value={roleOf(member.userId)}
              onChange={async (event) => {
                try {
                  await save({
                    data: { userId: member.userId, role: event.target.value as "admin" },
                  });
                  toast.success("Role updated.");
                  setData(await load());
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update role.");
                }
              }}
              className={field}
            >
              {["none", "member", "head", "admin"].map((role) => (
                <option key={role} value={role} className="bg-background">
                  {role}
                </option>
              ))}
            </select>
          </div>
        ))}
        {data.members.length === 0 && (
          <div className="bg-background p-4 text-sm text-muted-foreground">
            No signed-in members yet.
          </div>
        )}
      </div>
    </div>
  );
}

function exportTeamsCsv(
  teams: {
    id: string;
    name: string;
    status: string;
    lead_name: string;
    lead_email: string;
    lead_phone: string | null;
    mentor_name: string | null;
    mentor_email: string | null;
  }[],
  members: {
    team_id: string;
    name: string;
    email: string;
    phone: string | null;
    usn: string | null;
    branch: string | null;
    year: string | null;
    gender: string | null;
    is_lead: boolean;
  }[],
  submissions: {
    team_id: string;
    solution_title: string | null;
    status: string;
    problem_statement_title?: string | null;
    theme?: string | null;
  }[],
) {
  const rows = [
    [
      "team",
      "status",
      "member",
      "is_lead",
      "email",
      "phone",
      "srn",
      "branch",
      "year",
      "gender",
      "mentor",
      "submission",
      "submission_status",
    ],
  ];
  for (const team of teams) {
    const submission = submissions.find((s) => s.team_id === team.id);
    const mentor = [team.mentor_name, team.mentor_email].filter(Boolean).join(" ");
    const roster = members.filter((m) => m.team_id === team.id);
    if (roster.length === 0) {
      rows.push([
        team.name,
        team.status,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        mentor,
        submission?.solution_title ?? "",
        submission?.status ?? "",
      ]);
    }
    for (const m of roster) {
      rows.push([
        team.name,
        team.status,
        m.name,
        m.is_lead ? "yes" : "no",
        m.email,
        m.phone ?? "",
        m.usn ?? "",
        m.branch ?? "",
        m.year ?? "",
        m.gender ?? "",
        mentor,
        submission?.solution_title ?? "",
        submission?.status ?? "",
      ]);
    }
  }
  const csv = rows
    .map((row) => row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vertex-sih-teams-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportWorkshopRegistrationsCsv(rows: NeuralNetworkWorkshopRegistration[]) {
  const values = [
    [
      "id",
      "created_at",
      "name",
      "srn",
      "department",
      "phone",
      "email",
      "year",
      "attend_reason",
      "expectation",
      "status",
      "checked_in_at",
      "pass_sent_at",
    ],
    ...rows.map((row) => [
      row.id,
      row.created_at,
      row.name,
      row.srn,
      row.department,
      row.phone,
      row.email,
      row.year,
      row.attend_reason,
      row.expectation,
      row.status,
      row.checked_in_at ?? "",
      row.pass_sent_at ?? "",
    ]),
  ];
  const csv = values
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vertex-neural-networks-workshop-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
