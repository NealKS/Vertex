import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useLiveData } from "@/hooks/use-live-data";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { getAnnouncements } from "@/lib/hackathon-admin.api";

export const Route = createFileRoute("/announcements")({
  loader: () => getAnnouncements(),
  head: () => ({
    meta: [
      { title: "Announcements — Vertex — The Tech Club" },
      {
        name: "description",
        content:
          "Club-wide and per-team announcements from Vertex heads: deadlines, meets, calls for help.",
      },
      { property: "og:title", content: "Announcements — Vertex — The Tech Club" },
      {
        property: "og:description",
        content: "The Vertex announcement feed, straight from the team heads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnnouncementsPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-mono text-sm text-muted-foreground">The feed couldn't load.</p>
    </div>
  ),
});

function AnnouncementsPage() {
  const initial = Route.useLoaderData();
  const fetchFeed = useServerFn(getAnnouncements);
  const { data, error, liveLabel } = useLiveData(
    initial,
    fetchFeed,
    "announcements,event_announcements",
  );
  const { items, teams } = data ?? { items: [], teams: [] };
  const [team, setTeam] = useState("all");
  const teamName = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const feed = items.filter((a) => team === "all" || (a.team_id ?? "club") === team);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />
            Feed · {liveLabel}
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Announcements.
          </h1>

          <div className="mt-10 flex flex-wrap gap-2">
            {[{ id: "all", name: "Everything" }, { id: "club", name: "Club-wide" }, ...teams].map(
              (t) => (
                <button
                  key={t.id}
                  onClick={() => setTeam(t.id)}
                  className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
                    team === t.id
                      ? "border-silver text-foreground"
                      : "border-hairline text-muted-foreground hover:border-silver"
                  }`}
                >
                  {t.name}
                </button>
              ),
            )}
          </div>

          {error && (
            <p role="alert" className="mt-6 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-10 flex flex-col gap-px border border-hairline bg-hairline">
            {feed.map((a) => (
              <article key={a.id} className="bg-background p-6">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="border border-hairline px-2 py-0.5 text-silver">
                    {a.team_id ? (teamName.get(a.team_id) ?? a.team_id) : "Club-wide"}
                  </span>
                  <span>{new Date(a.created_at).toDateString()}</span>
                  {a.pinned && <span className="text-silver">· Pinned</span>}
                </div>
                <h2 className="mt-3 font-display text-2xl font-semibold leading-tight">
                  {a.title}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {a.body}
                </p>
                {a.media_url && (
                  <div className="mt-5 overflow-hidden border border-hairline bg-secondary">
                    {a.media_type === "video" ? (
                      <video
                        src={a.media_url}
                        controls
                        preload="metadata"
                        className="max-h-[28rem] w-full object-contain"
                      />
                    ) : (
                      <img
                        src={a.media_url}
                        alt={a.title}
                        loading="lazy"
                        className="max-h-[28rem] w-full object-contain"
                      />
                    )}
                  </div>
                )}
              </article>
            ))}
            {feed.length === 0 && (
              <div className="bg-background p-8 font-mono text-xs text-muted-foreground">
                Nothing posted here yet.
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
