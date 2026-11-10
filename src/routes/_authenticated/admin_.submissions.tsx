import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import {
  getHackathonAdmin,
  reviewHackathonSubmission,
  retryHackathonEmail,
  exportApprovedSubmissions,
  exportRejectedSubmissions,
  exportReconsideredSubmissions,
  queueHackathonReconsideration,
} from "@/lib/hackathon-admin.api";
import { HackathonAdminShell, AdminError } from "@/components/admin/HackathonAdminShell";
import { StatusBadge, SubmissionDetails } from "@/components/admin/SubmissionDetails";
import { useLiveData } from "@/hooks/use-live-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Submission } from "@/lib/hackathon-admin";

export const Route = createFileRoute("/_authenticated/admin_/submissions")({
  loader: () => getHackathonAdmin(),
  head: () => ({
    meta: [{ title: "Hackathon Submissions — Vertex" }, { name: "robots", content: "noindex" }],
  }),
  component: SubmissionsPage,
  errorComponent: AdminError,
});
function SubmissionsPage() {
  const initial = Route.useLoaderData();
  const fetchRows = useServerFn(getHackathonAdmin);
  const review = useServerFn(reviewHackathonSubmission);
  const retry = useServerFn(retryHackathonEmail);
  const exportCsv = useServerFn(exportApprovedSubmissions);
  const exportRejected = useServerFn(exportRejectedSubmissions);
  const exportReversals = useServerFn(exportReconsideredSubmissions);
  const queueReview = useServerFn(queueHackathonReconsideration);
  const { data, error, refresh, liveLabel } = useLiveData(
    initial,
    fetchRows,
    "event_registrations",
    initial.eventId,
  );
  const [status, setStatus] = useState("all");
  const [track, setTrack] = useState("all");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<"submissions" | "reconsideration">("submissions");
  const [busy, setBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const notify = (result: { emailSent: boolean; emailMessage: string }) =>
    result.emailSent ? toast.success(result.emailMessage) : toast.warning(result.emailMessage);
  const decide = async (row: Submission, status: "approved" | "rejected") => {
    if (busy) return;
    setBusy(row.id);
    try {
      notify(await review({ data: { id: row.id, status, reconsider: row.reconsidering } }));
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Review failed.");
      await refresh();
    } finally {
      setBusy(null);
    }
  };
  const download = async (scope: "approved" | "rejected" | "reversals" = "approved") => {
    setExporting(true);
    try {
      const csv = await (scope === "reversals"
        ? exportReversals()
        : scope === "rejected"
          ? exportRejected()
          : exportCsv());
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `vertex-${scope === "reversals" ? "reconsidered" : scope}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };
  const rows = data?.rows ?? [];
  const detailsRow = rows.find((row) => row.id === detailsId);
  const switchSection = (next: "submissions" | "reconsideration") => {
    setSection(next);
    setStatus("all");
    setTrack("all");
    setSearch("");
  };
  const moveToReview = async (row: Submission, queued: boolean) => {
    if (busy) return;
    setBusy(row.id);
    try {
      await queueReview({ data: { id: row.id, queued } });
      await refresh();
      toast.success(
        queued
          ? "Team moved to reconsideration. Current decision is unchanged."
          : "Current decision kept. Team returned to submissions.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update team.");
    } finally {
      setBusy(null);
    }
  };
  const sectionRows = rows.filter(
    (row) => Boolean(row.reconsidering) === (section === "reconsideration"),
  );
  const searchedRows = sectionRows.filter(
    (row) =>
      (track === "all" || row.track === track) &&
      `${row.team} ${row.title}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filtered = searchedRows.filter((row) => status === "all" || row.status === status);
  return (
    <HackathonAdminShell title="Hackathon Submissions" liveLabel={liveLabel}>
      {error ? (
        <p role="alert" className="rounded-2xl border border-destructive/30 p-6">
          {error}
        </p>
      ) : (
        <>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Review ideas for the 13–14 November finale. Decisions and event details are emailed to
              each team leader.
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <button
                disabled={exporting}
                onClick={() => void download()}
                className="btn-primary rounded-full px-5 py-3 text-xs disabled:opacity-50"
              >
                <Download size={14} />
                {exporting ? "Exporting…" : "Export approved (CSV)"}
              </button>
              <button
                disabled={exporting}
                onClick={() => void download("rejected")}
                className="btn-ghost rounded-full px-5 py-3 text-xs disabled:opacity-50"
              >
                <Download size={14} />
                Export rejected (CSV)
              </button>
              <p className="max-w-xs text-xs text-muted-foreground">
                Reversed decisions are marked REVERSED DECISION, with the previous decision and
                reason.
              </p>
            </div>
          </div>
          <div className="mb-5 flex flex-wrap gap-3" role="group" aria-label="Review sections">
            <button
              aria-pressed={section === "submissions"}
              className={`rounded-full border border-hairline px-5 py-3 text-sm ${section === "submissions" ? "bg-foreground text-background" : "bg-card"}`}
              onClick={() => switchSection("submissions")}
            >
              Submissions ({rows.filter((row) => !row.reconsidering).length})
            </button>
            <button
              aria-pressed={section === "reconsideration"}
              className={`rounded-full border border-hairline px-5 py-3 text-sm ${section === "reconsideration" ? "bg-foreground text-background" : "bg-card"}`}
              onClick={() => switchSection("reconsideration")}
            >
              Reconsideration ({rows.filter((row) => row.reconsidering).length})
            </button>
          </div>
          {section === "reconsideration" && (
            <section className="mb-6 rounded-2xl border border-hairline bg-secondary/50 p-5">
              <h2 className="font-display text-2xl font-semibold">Reconsideration</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Each team keeps its current approved or rejected status until you confirm a new
                decision. Reversing a decision requires a reason and sends an updated decision
                email.
              </p>
              <button
                disabled={exporting}
                onClick={() => void download("reversals")}
                className="btn-ghost mt-4 rounded-full px-4 py-2 text-xs"
              >
                Export reversed decisions (CSV)
              </button>
            </section>
          )}
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {(section === "reconsideration"
              ? ["all", "approved", "rejected"]
              : ["all", "pending", "approved", "rejected"]
            ).map((item) => (
              <button
                key={item}
                aria-pressed={status === item}
                onClick={() => setStatus(item)}
                className={`rounded-full border border-hairline px-4 py-2 font-mono text-[11px] uppercase ${status === item ? "bg-foreground text-background" : "bg-card"}`}
              >
                {item}{" "}
                <span className="ml-2 opacity-70">
                  {item === "all"
                    ? searchedRows.length
                    : searchedRows.filter((r) => r.status === item).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mb-7 grid gap-3 sm:grid-cols-[1fr_260px]">
            <label className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-4">
              <Search size={16} />
              <input
                aria-label="Search team or project"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team or project…"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </label>
            <select
              aria-label="Track filter"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="min-w-0 max-w-full rounded-xl border border-hairline bg-card p-3 text-sm"
            >
              <option value="all">All tracks ({sectionRows.length})</option>
              {[...new Set(sectionRows.map((r) => r.track))].sort().map((item) => (
                <option key={item} value={item}>
                  {item} ({sectionRows.filter((row) => row.track === item).length})
                </option>
              ))}
            </select>
          </div>
          {!data?.canReview && (
            <p className="mb-5 text-sm text-muted-foreground">
              Read-only access. Review decisions are reserved for allowlisted admins.
            </p>
          )}
          <p className="mb-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {sectionRows.length} teams
          </p>
          <div className="space-y-4">
            {filtered.map((row) => (
              <article
                key={row.id}
                className="rounded-2xl border border-hairline bg-card p-5 sm:p-6"
              >
                <button
                  type="button"
                  onClick={() => setDetailsId(row.id)}
                  aria-label={`View full submission for ${row.team}`}
                  className="flex w-full items-start justify-between gap-4 rounded-lg text-left outline-offset-4 hover:bg-secondary/40 focus-visible:outline-2"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {row.track} · {row.team}
                    </p>
                    <h2 className="mt-2 break-words font-display text-2xl font-semibold">
                      {row.title}
                    </h2>
                  </div>
                  <StatusBadge status={row.status} />
                </button>
                <p className="mt-2 truncate text-sm text-muted-foreground" title={row.idea}>
                  {row.idea || "No idea summary provided."}
                </p>
                <p className="mt-3 break-words text-xs text-muted-foreground">
                  {row.leader} · {row.email}
                  <br />
                  Submitted{" "}
                  {new Date(row.submittedAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </p>
                <div className="my-4 flex flex-wrap items-center gap-2">
                  {data?.canReview && (row.status === "pending" || row.reconsidering) && (
                    <>
                      <button
                        disabled={
                          !!busy ||
                          row.members.length !== 4 ||
                          (row.reconsidering && row.status === "approved")
                        }
                        onClick={() => void decide(row, "approved")}
                        className="btn-primary rounded-full px-5 py-2 text-xs disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        disabled={!!busy || (row.reconsidering && row.status === "rejected")}
                        onClick={() => void decide(row, "rejected")}
                        className="btn-ghost rounded-full px-5 py-2 text-xs disabled:opacity-40"
                      >
                        Reject
                      </button>
                      {row.members.length !== 4 && (
                        <span className="text-xs text-destructive">Requires exactly 4 members</span>
                      )}
                    </>
                  )}
                  {data?.canReview && ["approved", "rejected"].includes(row.status) && (
                    <button
                      disabled={!!busy}
                      onClick={() => void moveToReview(row, !row.reconsidering)}
                      className="btn-ghost rounded-full px-5 py-2 text-xs disabled:opacity-40"
                    >
                      {row.reconsidering ? "Keep current decision" : "Reconsider"}
                    </button>
                  )}
                  {row.status !== "pending" && (
                    <span className="text-xs text-muted-foreground">
                      {row.emailSentAt ? "Leader email sent" : "Leader email not confirmed"}
                    </span>
                  )}
                  {data?.canReview &&
                    row.reviewedAt &&
                    row.status !== "pending" &&
                    !row.emailSentAt && (
                      <button
                        disabled={!!busy}
                        className="btn-ghost rounded-full px-4 py-2 text-xs disabled:opacity-40"
                        onClick={async () => {
                          setBusy(row.id);
                          try {
                            notify(await retry({ data: { id: row.id } }));
                            await refresh();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Retry failed.");
                          } finally {
                            setBusy(null);
                          }
                        }}
                      >
                        {busy === row.id ? "Processing…" : "Resend email"}
                      </button>
                    )}
                </div>
                {row.reversalReason && (
                  <p className="mb-3 whitespace-pre-wrap break-words rounded-xl border border-accent/25 bg-accent/10 p-3 text-sm">
                    <strong>REVERSED DECISION · from {row.previousStatus}:</strong>{" "}
                    {row.reversalReason}
                  </p>
                )}
                <button
                  onClick={() => setDetailsId(row.id)}
                  className="py-2 font-mono text-[10px] uppercase tracking-widest underline underline-offset-4"
                >
                  View full idea, attachments & members
                </button>
              </article>
            ))}
            {!filtered.length && (
              <p className="rounded-2xl border border-dashed border-hairline p-10 text-center text-sm text-muted-foreground">
                {rows.length
                  ? "No submissions match these filters."
                  : "No submissions yet. New ideas will appear here live."}
              </p>
            )}
          </div>
        </>
      )}
      <Dialog
        open={!!detailsRow && !!data}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="break-words pr-8 font-display text-2xl">
              {detailsRow?.team} · {detailsRow?.title}
            </DialogTitle>
            <DialogDescription>
              Full idea, submitted files and member personal details.
            </DialogDescription>
          </DialogHeader>
          {detailsRow && <SubmissionDetails row={detailsRow} />}
        </DialogContent>
      </Dialog>
    </HackathonAdminShell>
  );
}
