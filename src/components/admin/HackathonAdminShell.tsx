import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export function HackathonAdminNav() {
  return (
    <nav
      aria-label="Hackathon administration"
      className="my-7 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-widest"
    >
      {(
        [
          ["/admin", "Console"],
          ["/admin/submissions", "Submissions"],
          ["/admin/teams", "Teams"],
          ["/admin/announcements", "Announcements"],
        ] as const
      ).map(([to, label]) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-foreground text-background" }}
          inactiveProps={{ className: "bg-card hover:bg-secondary" }}
          className="rounded-full border border-hairline px-4 py-2.5"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function HackathonAdminShell({
  title,
  children,
  liveLabel,
}: {
  title: string;
  children: ReactNode;
  liveLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex flex-wrap items-center gap-3">Vertex × Sarvam AI · Admin</span>
          {liveLabel && (
            <span role="status" className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${liveLabel.startsWith("Live") ? "bg-accent" : "bg-destructive"}`}
              />
              {liveLabel}
            </span>
          )}
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
          {title}
        </h1>
        <HackathonAdminNav />
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
export function AdminError({ error }: { error: unknown }) {
  return (
    <HackathonAdminShell title="Console unavailable.">
      <p role="alert" className="rounded-2xl border border-hairline bg-card p-6 text-sm">
        {error instanceof Error
          ? error.message
          : "Sign in with an authorized account to open this console."}
      </p>
      <Link to="/auth" className="btn-primary mt-5 rounded-full px-5 py-3">
        Sign in
      </Link>
    </HackathonAdminShell>
  );
}
