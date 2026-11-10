import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { Instagram, Linkedin, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollProgress } from "@/components/motion-kit";

function AdminLink({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <Link
      to="/admin"
      onClick={onNavigate}
      className={
        mobile
          ? "block w-full rounded-xl px-4 py-3 text-left hover:bg-secondary"
          : "transition-colors hover:text-foreground"
      }
    >
      Admin
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const hasSupabaseConfig = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
      supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    });
  }, [hasSupabaseConfig]);
  useEffect(() => scrollY.on("change", (value) => setScrolled(value > 18)), [scrollY]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = [
    { label: "Members", to: "/members" as const },
    { label: "Events", to: "/events" as const },
    { label: "Passes", to: "/passes" as const },
    { label: "Projects", to: "/projects" as const },
    { label: "Announcements", to: "/announcements" as const },
  ];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <ScrollProgress />
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5 ${scrolled ? "glass-strong shadow-[var(--shadow-glow)]" : "border border-transparent"}`}
      >
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <img
            src="/vertex-logo-transparent.png"
            alt="Vertex"
            className="h-8 w-auto dark:brightness-0 dark:invert"
            width={80}
            height={32}
            decoding="async"
          />
        </Link>
        <nav className="hidden items-center gap-5 font-mono text-[13px] uppercase tracking-[0.08em] text-muted-foreground lg:flex">
          {nav.map((item) => (
            <Link key={item.label} to={item.to} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <AdminLink />
          <Link to="/join" className="hover:text-foreground">
            Join
          </Link>
          {signedIn ? (
            <button
              onClick={async () => {
                const { supabase } = await import("@/integrations/supabase/client");
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="btn-ghost rounded-lg px-3 py-1.5 hover:text-foreground"
            >
              Sign out
            </button>
          ) : (
            <Link to="/auth" className="btn-ghost rounded-lg px-3 py-1.5 hover:text-foreground">
              Sign in
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
            className="glass-panel rounded-lg p-2 lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-strong absolute inset-x-3 top-[4.8rem] rounded-2xl p-4 sm:inset-x-5 lg:hidden"
          >
            <nav className="grid gap-1 font-display text-2xl">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
              <div
                className="rounded-xl px-4 py-3 hover:bg-secondary"
                onClick={() => setOpen(false)}
              >
                <AdminLink mobile onNavigate={() => setOpen(false)} />
              </div>
              <Link
                to="/join"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl bg-foreground px-4 py-3 text-background"
              >
                Join Vertex →
              </Link>
              {signedIn && (
                <button
                  onClick={async () => {
                    const { supabase } = await import("@/integrations/supabase/client");
                    await supabase.auth.signOut();
                    setOpen(false);
                    window.location.href = "/";
                  }}
                  className="mt-2 rounded-xl border border-hairline px-4 py-3 text-left"
                >
                  Sign out
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/vertex.reva/", Icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/vertexclub", Icon: Linkedin },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/vertex-logo-transparent.png"
            alt="Vertex"
            className="h-10 w-auto dark:brightness-0 dark:invert"
            width={120}
            height={40}
            decoding="async"
          />
          <div>
            <div className="font-display text-xl font-semibold">Vertex</div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              The Tech Club · Est. 2026
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="text-muted-foreground transition-colors hover:text-silver"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          © {new Date().getFullYear()} Vertex
        </div>
      </div>
    </footer>
  );
}
