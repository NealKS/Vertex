import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<"student" | "judge" | "mentor">("student");

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      toast.error("Google sign-in is not configured yet — use email and password.");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-24">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Member access
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in." : "Create account."}
        </h1>

        <button
          onClick={google}
          disabled={busy}
          className="mt-8 w-full border border-silver bg-foreground px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-background disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-hairline" /> or email{" "}
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const email = String(f.get("email") ?? "");
            const password = String(f.get("password") ?? "");
            const staffCode = String(f.get("staffCode") ?? "").trim();
            setBusy(true);
            try {
              if (mode === "signup") {
                const { data, error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: { emailRedirectTo: window.location.origin },
                });
                if (error) throw error;
                if (role !== "student") {
                  if (!staffCode) {
                    await supabase.auth.signOut();
                    throw new Error(
                      `A verification code from the SIH desk is required to register as ${role}. Ask the Vertex team for yours.`,
                    );
                  }
                  const { redeemStaffInvite } = await import("@/lib/staff.functions");
                  await redeemStaffInvite({ data: { code: staffCode, role } });
                }
                toast.success(
                  role === "student"
                    ? "Account created. Check your email if confirmation is required."
                    : `Account created and verified as ${role}.`,
                );
              } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
              }
              navigate({ to: "/" });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Authentication failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "signup" && (
            <div className="grid gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                I am registering as
              </span>
              <div className="flex overflow-hidden rounded-lg border border-hairline">
                {(
                  [
                    ["student", "Student"],
                    ["judge", "Judge"],
                    ["mentor", "Mentor"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`flex-1 px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                      role === value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {role !== "student" && (
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Verification code from the SIH desk
                  </span>
                  <input
                    name="staffCode"
                    placeholder="JU-XXXXXX"
                    className="border border-hairline bg-background px-3 py-2 font-mono text-sm uppercase tracking-widest focus:border-silver focus:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">
                    Judge and mentor access is verified — get your code from the Vertex team.
                  </span>
                </label>
              )}
            </div>
          )}
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              className="border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="border border-hairline px-5 py-3 font-mono text-[11px] uppercase tracking-widest hover:border-silver disabled:opacity-50"
          >
            {mode === "signin" ? "Sign in →" : "Create account →"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Sign up" : "Already a member? Sign in"}
        </button>
      </div>
      <SiteFooter />
    </div>
  );
}
