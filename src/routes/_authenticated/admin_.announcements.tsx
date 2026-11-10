import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getHackathonAnnouncements,
  saveHackathonAnnouncement,
  deleteHackathonAnnouncement,
} from "@/lib/hackathon-admin.api";
import { HackathonAdminShell, AdminError } from "@/components/admin/HackathonAdminShell";
import { useLiveData } from "@/hooks/use-live-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Announcement } from "@/lib/hackathon-admin";

export const Route = createFileRoute("/_authenticated/admin_/announcements")({
  loader: () => getHackathonAnnouncements(),
  component: AnnouncementsAdmin,
  errorComponent: AdminError,
  head: () => ({
    meta: [{ title: "Hackathon Announcements — Vertex" }, { name: "robots", content: "noindex" }],
  }),
});
const empty = () => ({
  id: undefined as string | undefined,
  title: "",
  body: "",
  date: new Date().toISOString().slice(0, 10),
  pinned: false,
});
function AnnouncementsAdmin() {
  const initial = Route.useLoaderData();
  const fetchItems = useServerFn(getHackathonAnnouncements);
  const save = useServerFn(saveHackathonAnnouncement);
  const remove = useServerFn(deleteHackathonAnnouncement);
  const { data, error, refresh, liveLabel } = useLiveData(
    initial,
    fetchItems,
    "event_announcements",
    initial.eventId,
  );
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [busy, setBusy] = useState(false);
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const store = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await save({
        data: {
          ...draft,
          date:
            originalDate?.slice(0, 10) === draft.date
              ? originalDate
              : new Date(`${draft.date}T00:00:00.000Z`).toISOString(),
        },
      });
      toast.success("Announcement published.");
      setEditing(false);
      setDraft(empty());
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };
  const pin = async (item: Announcement) => {
    setBusy(true);
    try {
      await save({
        data: {
          id: item.id,
          title: item.title,
          body: item.body,
          date: item.created_at,
          pinned: !item.pinned,
        },
      });
      toast.success(item.pinned ? "Announcement unpinned." : "Announcement pinned.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not pin.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <HackathonAdminShell title="Hackathon Announcements" liveLabel={liveLabel}>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Public updates for the hackathon. Pinned announcements appear first.
            </p>
            {data?.canEdit ? (
              <button
                className="btn-primary rounded-full px-5 py-3 text-xs"
                onClick={() => {
                  setDraft(empty());
                  setOriginalDate(null);
                  setEditing(true);
                }}
              >
                New announcement
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Read-only · allowlisted admins can publish updates.
              </p>
            )}
          </div>
          <div className="space-y-4">
            {data?.items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-hairline bg-card p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                  {item.pinned ? " · Pinned" : ""}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold">{item.title}</h2>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                {data.canEdit && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      className="btn-ghost rounded-full px-4 py-2 text-xs"
                      onClick={() => {
                        setDraft({
                          id: item.id,
                          title: item.title,
                          body: item.body,
                          date: item.created_at.slice(0, 10),
                          pinned: item.pinned,
                        });
                        setOriginalDate(item.created_at);
                        setEditing(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      disabled={busy}
                      className="btn-ghost rounded-full px-4 py-2 text-xs"
                      onClick={() => void pin(item)}
                    >
                      {item.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      disabled={busy}
                      className="btn-ghost rounded-full px-4 py-2 text-xs text-destructive"
                      onClick={() => setDeleting(item)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
            {data?.items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-hairline p-10 text-center text-sm text-muted-foreground">
                No hackathon updates yet. Publish the first announcement.
              </p>
            )}
          </div>
        </>
      )}
      <Dialog
        open={editing && !!data?.canEdit}
        onOpenChange={(open) => {
          if (!busy) setEditing(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {draft.id ? "Edit announcement" : "New announcement"}
            </DialogTitle>
            <DialogDescription>
              This update is visible to everyone on the announcements page.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void store();
            }}
            className="space-y-4"
          >
            <label className="block text-sm">
              Title
              <input
                required
                minLength={2}
                maxLength={160}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-hairline bg-background p-3"
              />
            </label>
            <label className="block text-sm">
              Body
              <textarea
                required
                minLength={2}
                maxLength={5000}
                rows={7}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                className="mt-1 w-full rounded-xl border border-hairline bg-background p-3"
              />
            </label>
            <label className="block text-sm">
              Date
              <input
                required
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-hairline bg-background p-3"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
              />
              Pin to the top
            </label>
            <DialogFooter>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(false)}
                className="btn-ghost rounded-full px-5 py-2"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="btn-primary rounded-full px-5 py-2 disabled:opacity-50"
              >
                {busy ? "Publishing…" : "Publish announcement"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting && !!data?.canEdit}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete announcement?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be removed from the public feed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              disabled={busy}
              onClick={() => setDeleting(null)}
              className="btn-ghost rounded-full px-5 py-2"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className="btn-primary rounded-full px-5 py-2 disabled:opacity-50"
              onClick={async () => {
                if (!deleting || busy) return;
                setBusy(true);
                try {
                  await remove({ data: { id: deleting.id } });
                  toast.success("Announcement deleted.");
                  setDeleting(null);
                  await refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not delete.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete announcement"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HackathonAdminShell>
  );
}
