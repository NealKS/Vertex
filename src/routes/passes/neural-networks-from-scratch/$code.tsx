import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { NEURAL_NETWORK_WORKSHOP } from "@/data/neural-network-workshop";
import { getNeuralNetworkWorkshopPass } from "@/lib/neural-network-workshop.functions";

export const Route = createFileRoute("/passes/neural-networks-from-scratch/$code")({
  loader: ({ params }) => getNeuralNetworkWorkshopPass({ data: { code: params.code } }),
  head: () => ({ meta: [{ title: "Workshop entry pass — Vertex" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: WorkshopPass,
});

function WorkshopPass() {
  const pass = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-16 md:py-24">
        {!pass ? (
          <section className="border border-hairline bg-card/40 p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-silver">Vertex entry pass</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Pass unavailable.</h1>
            <p className="mt-3 text-sm text-muted-foreground">This pass is invalid, or it is not approved for entry.</p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-silver/40 bg-card shadow-[0_24px_80px_rgba(2,6,23,0.12)]">
            <div className="grid-backdrop border-b border-hairline p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-silver">Vertex Club · Entry pass</p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-none tracking-tight">{NEURAL_NETWORK_WORKSHOP.title}</h1>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="w-fit rounded-xl bg-white p-4">
                <QRCodeSVG value={pass.code} size={192} bgColor="#ffffff" fgColor="#000000" level="M" includeMargin />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">{pass.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">Show this QR at the Vertex desk for a quick check-in.</p>
                <dl className="mt-6 space-y-3 border-t border-hairline pt-5 text-sm">
                  <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">When</dt><dd className="mt-1">{NEURAL_NETWORK_WORKSHOP.date} · {NEURAL_NETWORK_WORKSHOP.time}</dd></div>
                  <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Where</dt><dd className="mt-1">{NEURAL_NETWORK_WORKSHOP.venue}</dd></div>
                </dl>
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
