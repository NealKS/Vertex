import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { NEURAL_NETWORK_WORKSHOP as event } from "@/data/neural-network-workshop";

export function NeuralNetworkWorkshopCard() {
  return (
    <Link
      to="/events/neural-networks-from-scratch"
      aria-label={`Open ${event.title}`}
      className="surface-card group block overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1 hover:border-silver/70"
    >
      <div className="grid gap-0 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="grid-backdrop relative flex min-h-56 flex-col justify-between border-b border-hairline p-6 lg:border-b-0 lg:border-r">
          <div className="relative">
            <span className="chip rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
              {event.type}
            </span>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {event.date}
            </p>
          </div>
          <div className="relative font-display text-5xl font-semibold leading-none tracking-[-0.06em] text-silver sm:text-6xl">
            NN
          </div>
        </div>
        <div className="flex flex-col justify-between p-6 md:p-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {event.time} · {event.venue}
            </div>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {event.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
            <dl className="mt-5 grid gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="text-silver">Speaker</dt>
                <dd className="mt-1 text-foreground">{event.speaker}</dd>
              </div>
              <div>
                <dt className="text-silver">Organized by</dt>
                <dd className="mt-1 text-foreground">{event.organizedBy}</dd>
              </div>
            </dl>
          </div>
          <span className="btn-primary mt-8 w-fit rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest">
            View workshop <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
