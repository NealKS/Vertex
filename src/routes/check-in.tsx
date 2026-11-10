import { NEURAL_NETWORK_WORKSHOP as event } from "@/data/neural-network-workshop";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, RotateCcw, ScanLine, XCircle } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  checkInNeuralNetworkWorkshop,
  getNeuralNetworkWorkshopDeskAccess,
} from "@/lib/neural-network-workshop.functions";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [{ title: "Event check-in — Vertex" }, { name: "robots", content: "noindex" }],
  }),
  component: CheckInPage,
});

type CheckInResult = {
  tone: "ok" | "already" | "invalid";
  name?: string;
  srn?: string;
  at?: string;
} | null;

function CheckInPage() {
  const checkIn = useServerFn(checkInNeuralNetworkWorkshop);
  const loadDeskAccess = useServerFn(getNeuralNetworkWorkshopDeskAccess);
  const [result, setResult] = useState<CheckInResult>(null);
  const [busy, setBusy] = useState(false);
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    void loadDeskAccess()
      .then(() => setAccess("allowed"))
      .catch(() => setAccess("denied"));
  }, [loadDeskAccess]);

  const process = async (code: string) => {
    if (!code.trim() || busy || result) return;
    setBusy(true);
    try {
      const response = await checkIn({ data: { code } });
      if (response.status === "ok") {
        setResult({ tone: "ok", name: response.name, srn: response.srn, at: response.at });
      } else if (response.status === "already") {
        setResult({ tone: "already", name: response.name, srn: response.srn, at: response.at });
      } else {
        setResult({ tone: "invalid" });
      }
    } catch {
      setResult({ tone: "invalid" });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => setResult(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-silver">
          Vertex event operations
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Door check-in.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Neural Networks from Scratch · {event.date} · {event.venue}. Use your assigned club email
          to access this desk.
        </p>

        {access === "checking" ? (
          <section className="mt-8 rounded-2xl border border-hairline bg-card/40 p-8 text-center">
            <ScanLine className="mx-auto animate-pulse text-emerald-400" size={36} />
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Checking desk access…
            </p>
          </section>
        ) : access === "denied" ? (
          <section className="mt-8 rounded-2xl border-2 border-rose-700 bg-rose-950 p-8 text-center text-white">
            <AlertTriangle className="mx-auto text-rose-300" size={48} />
            <h2 className="mt-5 font-display text-3xl font-semibold">No event-desk access</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-rose-100">
              Sign in with the exact club email that the event manager added for this workshop. This
              page does not grant access by itself.
            </p>
          </section>
        ) : result ? (
          <CheckInResultCard result={result} onScanNext={reset} />
        ) : (
          <section className="mt-8 rounded-2xl border border-hairline bg-card/40 p-4 sm:p-6">
            <QRScanner
              onResult={(code) => void process(code)}
              cooldownMs={3500}
              autoStart
              paused={busy}
            />
            <form
              className="mt-6 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                void process(String(new FormData(form).get("code") ?? "")).then(() => form.reset());
              }}
            >
              <input
                name="code"
                required
                placeholder="Paste backup pass code"
                className="field-input min-w-0 flex-1 rounded-lg px-3 py-3 text-sm"
              />
              <button
                disabled={busy}
                className="btn-primary rounded-lg px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] disabled:opacity-50"
              >
                {busy ? "Checking…" : "Check in"}
              </button>
            </form>
          </section>
        )}

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Need access?{" "}
          <Link to="/auth" className="underline underline-offset-4">
            Sign in
          </Link>
          , then ask the event manager to add your email.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function CheckInResultCard({
  result,
  onScanNext,
}: {
  result: Exclude<CheckInResult, null>;
  onScanNext: () => void;
}) {
  const isSuccess = result.tone === "ok";
  const isAlready = result.tone === "already";
  const appearance = isSuccess
    ? "border-emerald-700 bg-emerald-600 text-white"
    : isAlready
      ? "border-amber-600 bg-amber-400 text-slate-950"
      : "border-rose-800 bg-rose-700 text-white";
  const Icon = isSuccess ? CheckCircle2 : isAlready ? AlertTriangle : XCircle;
  const heading = isSuccess ? "Checked in" : isAlready ? "Already checked in" : "Pass not accepted";
  const detail = isSuccess
    ? "Attendance recorded successfully."
    : isAlready
      ? "This pass was scanned earlier. Do not record it again."
      : "This QR is invalid, pending approval, or belongs to another event.";

  return (
    <section
      className={`mt-8 overflow-hidden rounded-2xl border-2 shadow-[0_20px_60px_rgba(15,23,42,0.22)] ${appearance}`}
      aria-live="assertive"
    >
      <div className="p-7 text-center sm:p-10">
        <Icon className="mx-auto" size={68} strokeWidth={2.2} aria-hidden />
        <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.16em] opacity-80">
          Vertex entry desk
        </p>
        <h2 className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">
          {heading}
        </h2>
        {result.name && (
          <div className="mt-8 border-y border-current/25 py-5">
            <p className="font-display text-3xl font-semibold leading-tight">{result.name}</p>
            <p className="mt-2 font-mono text-sm font-semibold tracking-[0.12em]">{result.srn}</p>
          </div>
        )}
        <p className="mt-6 text-base leading-relaxed opacity-90">{detail}</p>
        {result.at && (
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.1em] opacity-75">
            {isAlready ? "Recorded" : "Checked in"}{" "}
            {new Date(result.at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onScanNext}
        className="flex w-full items-center justify-center gap-2 border-t border-current/25 bg-black/10 px-5 py-5 font-mono text-sm font-bold uppercase tracking-[0.12em] transition-colors hover:bg-black/20"
      >
        <RotateCcw size={18} /> Scan next attendee
      </button>
    </section>
  );
}
