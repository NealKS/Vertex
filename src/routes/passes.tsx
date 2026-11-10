import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { requestNeuralNetworkWorkshopPass } from "@/lib/neural-network-workshop.functions";

export const Route = createFileRoute("/passes")({
  head: () => ({
    meta: [
      { title: "My passes — Vertex" },
      { name: "description", content: "Recover a Vertex event pass securely." },
    ],
  }),
  component: PassCentre,
});

function PassCentre() {
  const requestPass = useServerFn(requestNeuralNetworkWorkshopPass);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <section>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <span className="inline-block h-px w-8 bg-silver" />
              Vertex passes
            </div>
            <h1 className="mt-6 max-w-xl font-display text-5xl font-semibold tracking-tight md:text-7xl">
              Your pass, when you need it.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
              Lost the approval email? Enter the same email you registered with. If an approved
              Vertex pass exists, we will send it again.
            </p>
            <div className="mt-10 grid gap-px border border-hairline bg-hairline sm:grid-cols-3">
              <Info
                icon={<Mail size={17} />}
                title="No sign-in"
                body="Use the email from registration."
              />
              <Info
                icon={<ShieldCheck size={17} />}
                title="Private"
                body="We never reveal registration status here."
              />
              <Info
                icon={<CheckCircle2 size={17} />}
                title="Ready at the door"
                body="The QR has no personal information."
              />
            </div>
          </section>

          <section className="border border-hairline bg-card/40 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.08)] md:p-8">
            {state === "sent" ? (
              <div className="min-h-64 flex flex-col justify-center">
                <CheckCircle2 className="text-silver" size={34} strokeWidth={1.5} />
                <h2 className="mt-5 font-display text-3xl font-semibold">Check your inbox.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  If an approved pass is associated with this address, a fresh copy is on its way.
                  Please also check Spam and Promotions.
                </p>
                <button
                  className="mt-7 w-fit font-mono text-[10px] uppercase tracking-widest text-silver hover:text-foreground"
                  onClick={() => setState("idle")}
                >
                  Use another email
                </button>
              </div>
            ) : (
              <form
                className="grid gap-5"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setState("sending");
                  try {
                    await requestPass({ data: { email } });
                    setState("sent");
                  } catch {
                    setState("error");
                  }
                }}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
                    Pass recovery
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold">Send my pass again</h2>
                </div>
                <label className="grid gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Registration email
                  </span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="border border-hairline bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-silver"
                  />
                </label>
                {state === "error" && (
                  <p className="text-sm text-rose-300">
                    We could not submit that request. Please try again shortly.
                  </p>
                )}
                <button
                  disabled={state === "sending"}
                  className="bg-foreground px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-background transition-opacity disabled:opacity-50"
                >
                  {state === "sending" ? "Sending…" : "Email my pass"}
                </button>
              </form>
            )}
            <p className="mt-6 border-t border-hairline pt-5 text-xs leading-5 text-muted-foreground">
              Still waiting for approval? Your pass is issued only after the Vertex team approves
              your registration.{" "}
              <Link
                to="/events/neural-networks-from-scratch"
                className="text-silver hover:text-foreground"
              >
                Workshop details →
              </Link>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Info({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="bg-background p-5">
      <div className="text-silver">{icon}</div>
      <div className="mt-5 font-display text-base">{title}</div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
