import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { MemberCard } from "@/components/MemberCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Reveal } from "@/components/Reveal";
import { Atmosphere } from "@/components/Atmosphere";
import { CountUp, ShinyText } from "@/components/motion-kit";
import { getDirectory } from "@/lib/club.functions";

export const Route = createFileRoute("/members")({
  loader: () => getDirectory(),
  head: () => ({
    meta: [
      { title: "Members — Vertex — The Tech Club" },
      { name: "description", content: "Meet the people building Vertex." },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const directory = Route.useLoaderData();
  const [activeTeamId, setActiveTeamId] = useState(directory.teams[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const showAll = activeTeamId === "__all";
  const activeTeam = showAll
    ? undefined
    : (directory.teams.find((team) => team.id === activeTeamId) ?? directory.teams[0]);
  const activeRoster = showAll
    ? [
        ...["Founder", "President", "Vice President"].flatMap((role) =>
          directory.all.filter((member) => member.role === role),
        ),
        ...directory.teams.flatMap((team) => [...team.heads, ...team.members]),
      ]
    : activeTeam
      ? [...activeTeam.heads, ...activeTeam.members]
      : [];

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return directory.all.filter(
      (member) =>
        member.name.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        (member.team ?? "").toLowerCase().includes(q) ||
        member.skills.some((skill) => skill.toLowerCase().includes(q)),
    );
  }, [query, directory.all]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <Reveal>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver">
                Vertex collective
              </p>
              <h1 className="text-silver-gradient mt-4 max-w-4xl font-display text-6xl tracking-[-0.065em] md:text-8xl">
                Meet Vertex.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
                <CountUp to={directory.all.length} /> people who run the club and make the work
                happen.
              </p>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <section>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] font-semibold text-muted-foreground">
              Faculty Coordinator
            </p>
            <div className="mt-4">
              <Reveal>
                <SpotlightCard>
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-mono text-lg font-bold">
                      KM
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-semibold text-silver">
                        REVA University · School of CSE
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                        Prof. Kiran M
                      </h2>
                      <p className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-foreground/80">
                        Head of Department, Artificial Intelligence &amp; Data Science
                      </p>
                      <p className="text-sm font-medium leading-6 text-muted-foreground">
                        School of Computer Science and Engineering
                      </p>
                      <p className="mt-3 max-w-2xl text-[13px] font-medium leading-6 text-foreground">
                        Faculty Coordinator for Vertex — the Tech Club at REVA University —
                        mentoring student leadership, guiding technical initiatives, workshops and
                        community events.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-bold tracking-widest text-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> 9035505082
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-widest text-muted-foreground">
                          Vertex Faculty Coordinator
                        </span>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            </div>
          </section>

          {directory.leadership.length > 0 && (
            <section className="mt-14">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] font-semibold text-muted-foreground">
                Student Leadership
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {directory.leadership.map((member, index) => (
                  <Reveal key={member.id} delay={index * 0.04}>
                    <SpotlightCard>
                      <MemberCard member={member} index={index + 1} isHead />
                    </SpotlightCard>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Teams
              </p>
              <label className="relative w-full max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, skill, team…"
                  className="field-input w-full rounded-lg py-2 pl-9 pr-3 text-sm"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTeamId("__all")}
                className={`shrink-0 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${showAll ? "border-silver bg-black/[0.04] text-foreground" : "border-hairline text-muted-foreground hover:border-silver"}`}
              >
                All · {directory.all.length}
              </button>
              {directory.teams.map((team) => {
                const count = team.heads.length + team.members.length;
                return (
                  <button
                    key={team.id}
                    onClick={() => setActiveTeamId(team.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${!showAll && activeTeam?.id === team.id ? "border-silver bg-black/[0.04] text-foreground" : "border-hairline text-muted-foreground hover:border-silver"}`}
                  >
                    {team.name} · {count}
                  </button>
                );
              })}
            </div>
            {searchMatches ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mt-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <ShinyText
                    text={`${searchMatches.length} match${searchMatches.length === 1 ? "" : "es"}`}
                  />
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {searchMatches.map((member, index) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      index={index + 1}
                      isHead={member.isHead}
                    />
                  ))}
                </div>
                {searchMatches.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nobody matches “{query}”.</p>
                )}
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {(activeTeam || showAll) && (
                  <motion.div
                    key={showAll ? "all" : activeTeam?.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="mt-4"
                  >
                    <SpotlightCard>
                      <section className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
                              {showAll ? "DIRECTORY" : activeTeam?.code}
                            </p>
                            <h2 className="mt-2 font-display text-3xl">
                              {showAll ? "All members" : activeTeam?.name}
                            </h2>
                            {(showAll || activeTeam?.blurb) && (
                              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                                {showAll ? "Everyone in the Vertex collective." : activeTeam?.blurb}
                              </p>
                            )}
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {activeRoster.length} members
                          </span>
                        </div>
                        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {activeRoster.map((member, index) => (
                            <MemberCard
                              key={member.id}
                              member={member}
                              index={index + 1}
                              isHead={member.isHead}
                            />
                          ))}
                          {activeRoster.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Team roster will be added soon.
                            </p>
                          )}
                        </div>
                      </section>
                    </SpotlightCard>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </section>

          <section className="mt-14 border-t border-hairline pt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Find someone
            </p>
            <div className="mt-4">
              <DirectoryExplorer directory={directory} />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
