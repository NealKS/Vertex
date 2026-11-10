import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getHackathonAdmin } from "@/lib/hackathon-admin.api";
import { HackathonAdminShell, AdminError } from "@/components/admin/HackathonAdminShell";
import { SubmissionDetails, StatusBadge } from "@/components/admin/SubmissionDetails";
import { useLiveData } from "@/hooks/use-live-data";
export const Route = createFileRoute("/_authenticated/admin_/teams")({
  loader: () => getHackathonAdmin(),
  component: TeamsPage,
  errorComponent: AdminError,
  head: () => ({
    meta: [{ title: "Hackathon Teams — Vertex" }, { name: "robots", content: "noindex" }],
  }),
});
function TeamsPage() {
  const initial = Route.useLoaderData();
  const fetchRows = useServerFn(getHackathonAdmin);
  const { data, error, liveLabel } = useLiveData(
    initial,
    fetchRows,
    "event_registrations",
    initial.eventId,
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [size, setSize] = useState("all");
  const rows = (data?.rows ?? []).filter(
    (row) =>
      `${row.team} ${row.leader} ${row.college}`.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || row.status === status) &&
      (size === "all" ||
        (size === "complete" ? row.members.length === 4 : row.members.length !== 4)),
  );
  return (
    <HackathonAdminShell title="Hackathon Teams" liveLabel={liveLabel}>
      <p className="mb-6 text-sm text-muted-foreground">
        Every team must have exactly 4 members. Expand a team to see its members and submission.
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              aria-label="Search teams, leader or college"
              placeholder="Search team, leader or college…"
              className="rounded-xl border border-hairline bg-card p-3 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Submission status"
              className="rounded-xl border border-hairline bg-card p-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["all", "pending", "approved", "rejected"].map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </select>
            <select
              aria-label="Team size"
              className="rounded-xl border border-hairline bg-card p-3 text-sm"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="all">All teams</option>
              <option value="complete">Exactly 4 members</option>
              <option value="incomplete">Needs attention</option>
            </select>
          </div>
          <div className="space-y-4">
            {rows.map((row) => (
              <details
                key={row.id}
                className="rounded-2xl border border-hairline bg-card p-5 sm:p-6"
              >
                <summary className="cursor-pointer">
                  <div className="inline-flex w-[95%] flex-wrap items-center justify-between gap-4 align-top">
                    <div>
                      <h2 className="font-display text-2xl font-semibold">{row.team}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {row.leader} · {row.members.length}/4 members
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.college || "College not provided"}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                </summary>
                <div className="mt-5">
                  <h3 className="mb-3 font-display text-xl">{row.title}</h3>
                  <SubmissionDetails row={row} />
                </div>
              </details>
            ))}
            {!rows.length && (
              <p className="rounded-2xl border border-dashed border-hairline p-10 text-center text-sm text-muted-foreground">
                No teams match these filters.
              </p>
            )}
          </div>
        </>
      )}
    </HackathonAdminShell>
  );
}
