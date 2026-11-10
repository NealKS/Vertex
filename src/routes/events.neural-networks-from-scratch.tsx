import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowRight, Check, Clock3, MailCheck, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Ticker } from "@/components/motion-kit";
import { NeuralNetworkVisualizer } from "@/components/NeuralNetworkVisualizer";
import ReactBitsBlurText from "@/components/ReactBitsBlurText";
import DotField from "@/components/ReactBitsDotField";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  NEURAL_NETWORK_ATTEND_REASONS,
  NEURAL_NETWORK_WORKSHOP,
  NEURAL_NETWORK_WORKSHOP_YEARS,
  type NeuralNetworkAttendReason,
} from "@/data/neural-network-workshop";
import { registerForNeuralNetworkWorkshop } from "@/lib/neural-network-workshop.functions";

export const Route = createFileRoute("/events/neural-networks-from-scratch")({
  head: () => ({
    meta: [
      { title: `${NEURAL_NETWORK_WORKSHOP.title} — Vertex` },
      {
        name: "description",
        content:
          "Register for Vertex Club's neural networks workshop at REVA University on 6 November 2026.",
      },
    ],
  }),
  component: NeuralNetworkWorkshopPage,
});

type FormValues = {
  name: string;
  srn: string;
  department: string;
  phone: string;
  email: string;
  year: string;
  attendReason: NeuralNetworkAttendReason[];
  expectation: string;
};

type FormErrors = Partial<Record<keyof FormValues | "form", string>>;

const initialValues: FormValues = {
  name: "",
  srn: "",
  department: "",
  phone: "",
  email: "",
  year: NEURAL_NETWORK_WORKSHOP_YEARS[0],
  attendReason: [],
  expectation: "",
};

type RegistrationConfirmation = {
  email: string;
  receiptEmailSent: boolean;
};

function NeuralNetworkWorkshopPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<RegistrationConfirmation | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const register = useServerFn(registerForNeuralNetworkWorkshop);

  useEffect(() => {
    if (!confirmation || !confirmationRef.current) return;
    const confirmationPanel = confirmationRef.current;
    const frame = window.requestAnimationFrame(() => {
      confirmationPanel.focus({ preventScroll: true });
      confirmationPanel.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [confirmation, reduceMotion]);

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    setConfirmation(null);
  };

  const toggleReason = (reason: NeuralNetworkAttendReason) => {
    const selected = values.attendReason.includes(reason)
      ? values.attendReason.filter((item) => item !== reason)
      : values.attendReason.length < 2
        ? [...values.attendReason, reason]
        : values.attendReason;
    update("attendReason", selected);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await register({
        data: {
          ...values,
          year: values.year as (typeof NEURAL_NETWORK_WORKSHOP_YEARS)[number],
        },
      });
      if (!result.ok || result.status !== "pending") {
        throw new Error("Your registration could not be confirmed. Please try again.");
      }
      setConfirmation({
        email: values.email.trim(),
        receiptEmailSent: result.receiptEmailSent,
      });
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Could not submit your registration.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="top"
      className="neural-workshop-page min-h-screen overflow-x-clip bg-background text-foreground"
    >
      <SiteHeader />
      <main>
        <section className="nn-hero relative overflow-hidden border-b border-hairline">
          <div aria-hidden="true" className="nn-dot-field pointer-events-none absolute inset-0">
            <DotField
              className="h-full w-full"
              gradientFrom="#365b48"
              gradientTo="#718371"
              dotRadius={1}
              dotSpacing={27}
              pattern="grid"
              baseOpacity={0.28}
              opacity={0.24}
              cursorRadius={170}
              bulgeStrength={0.2}
              glowRadius={0}
              waveAmplitude={0.015}
              speed={reduceMotion ? 0 : 0.28}
              sparkle={false}
              interactive={!reduceMotion}
              intro={!reduceMotion}
              lightMode
            />
          </div>
          <div aria-hidden="true" className="nn-hero-annotation">
            784 <span>→</span> 16 <span>→</span> 16 <span>→</span> 10
          </div>
          <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-12 sm:px-8 md:pb-14 md:pt-16">
            <div className="mb-10 flex items-center justify-between gap-4 border-b border-hairline pb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                Vertex Club <span className="px-2 text-[var(--nn-accent)]">/</span> Technical
                workshop
              </span>
              <span>
                {NEURAL_NETWORK_WORKSHOP.date}{" "}
                <span className="px-2 text-[var(--nn-accent)]">·</span> REVA University
              </span>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div className="relative z-10 flex min-h-[27rem] flex-col justify-between py-2">
                <div>
                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--nn-accent)]">
                    <span className="h-px w-8 bg-[var(--nn-accent)]" />
                    From pixels to prediction
                  </div>
                  <h1
                    aria-label={NEURAL_NETWORK_WORKSHOP.title}
                    className="mt-6 max-w-2xl font-display text-[clamp(3.25rem,7vw,6.7rem)] font-medium leading-[0.9] tracking-[-0.06em]"
                  >
                    <span className="block">
                      <ReactBitsBlurText
                        tag="span"
                        text="Neural networks"
                        animateBy="words"
                        effect="blur"
                        direction="top"
                        delay={100}
                        stepDuration={0.48}
                        distance={14}
                        blur={9}
                        trigger="load"
                        className="nn-title-line"
                      />
                    </span>
                    <span className="nn-title-italic mt-2 block font-normal italic">
                      <ReactBitsBlurText
                        tag="span"
                        text="from scratch."
                        animateBy="words"
                        effect="blur"
                        direction="top"
                        delay={180}
                        stepDuration={0.5}
                        distance={14}
                        blur={9}
                        trigger="load"
                        className="nn-title-line"
                      />
                    </span>
                  </h1>
                  <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                    Follow one handwritten digit from 784 pixel values through weighted sums and
                    firing neurons to its final prediction.
                  </p>
                </div>

                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <a href="#register" className="nn-cta">
                    Apply to attend <ArrowRight size={16} aria-hidden="true" />
                  </a>
                  <a href="#visualization" className="nn-text-link">
                    Try the handwriting lab <ArrowDown size={14} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <figure className="nn-video-frame m-0 min-w-0 border border-hairline bg-black">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/65 sm:px-5">
                  <span>
                    Neural networks <span className="px-2 text-[var(--nn-accent)]">/</span> Visual
                    study
                  </span>
                  <span>Workshop film</span>
                </div>
                <video
                  className="aspect-video w-full object-cover"
                  src="/videos/neural-network-visualization.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label="Animated neural network visualization"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-white/55 sm:px-5">
                  <span>Signal path · input to prediction</span>
                  <span>Muted preview</span>
                </figcaption>
              </figure>
            </div>

            <dl
              id="event-details"
              className="nn-event-details mt-12 grid gap-6 border-t border-hairline pt-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <EventDetail label="Date" value={NEURAL_NETWORK_WORKSHOP.date} />
              <EventDetail label="Time" value={NEURAL_NETWORK_WORKSHOP.time} icon="time" />
              <EventDetail label="Venue" value={NEURAL_NETWORK_WORKSHOP.venue} icon="venue" />
              <EventDetail label="Speaker" value={NEURAL_NETWORK_WORKSHOP.speaker} />
            </dl>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Organized by {NEURAL_NETWORK_WORKSHOP.organizedBy}
              </p>
              <a
                href="https://abscissa.dev"
                target="_blank"
                rel="noreferrer"
                className="nn-partner-link"
              >
                <span>Technical partner</span>
                <span className="font-display text-base font-semibold normal-case tracking-tight text-foreground">
                  Abscissa ↗
                </span>
              </a>
            </div>
          </div>
        </section>

        <section
          className="nn-equation-band border-b border-hairline py-1"
          aria-label="How the model processes an input"
        >
          <Ticker
            items={["28 × 28 pixels", "weights + bias", "activation", "softmax → prediction"]}
            className="border-0 py-4"
          />
        </section>

        <div id="visualization" className="scroll-mt-24 py-12 md:py-16">
          <NeuralNetworkVisualizer />
        </div>

        <section
          id="register"
          className="scroll-mt-24 border-t border-hairline bg-[color-mix(in_oklab,var(--foreground)_2%,var(--background))]"
        >
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--nn-accent)]">
                  <span className="inline-block h-px w-8 bg-[var(--nn-accent)]" />
                  Registration
                </div>
                <h2 className="mt-5 max-w-xl font-display text-4xl font-medium leading-[1.02] tracking-[-0.045em] md:text-6xl">
                  Reserve your place.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                  Tell us a little about what you want to learn. The Vertex team reviews each
                  application before sending an entry pass.
                </p>
                <div className="mt-8 border-t border-hairline pt-5">
                  <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                    <Clock3
                      className="mt-1 shrink-0 text-[var(--nn-accent)]"
                      size={16}
                      aria-hidden="true"
                    />
                    <span>
                      Registration is pending until approved. Your QR pass arrives by email after
                      approval.
                    </span>
                  </div>
                  <div className="mt-4 flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                    <MapPin
                      className="mt-1 shrink-0 text-[var(--nn-accent)]"
                      size={16}
                      aria-hidden="true"
                    />
                    <span>{NEURAL_NETWORK_WORKSHOP.venue}</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                {confirmation ? (
                  <motion.div
                    ref={confirmationRef}
                    tabIndex={-1}
                    role="status"
                    aria-labelledby="registration-confirmation-title"
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="nn-confirmation-panel outline-none"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--nn-accent)]">
                        <span className="nn-confirmation-icon">
                          <Check size={18} aria-hidden="true" />
                        </span>
                        Application received
                      </div>
                      <span className="nn-pending-badge">Pending approval</span>
                    </div>
                    <h3
                      id="registration-confirmation-title"
                      className="mt-8 font-display text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl"
                    >
                      You’re on the list.
                    </h3>
                    <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                      Your registration is waiting for review. If approved, your QR entry pass will
                      be sent to:
                    </p>
                    <div className="nn-confirmation-email mt-5 flex items-center gap-3">
                      <MailCheck
                        className="shrink-0 text-[var(--nn-accent)]"
                        size={18}
                        aria-hidden="true"
                      />
                      <span className="break-all font-medium text-foreground">
                        {confirmation.email}
                      </span>
                    </div>
                    <p className="mt-4 border-l border-[var(--nn-accent)] pl-4 text-sm leading-6 text-muted-foreground">
                      {confirmation.receiptEmailSent
                        ? "A registration receipt is on its way. Check your inbox, including spam or promotions."
                        : "Your registration is saved, but we couldn’t send the receipt email. Your application is still pending review; save a screenshot of this confirmation for your records."}
                    </p>
                    <div className="nn-confirmation-steps mt-8 grid gap-0 sm:grid-cols-3">
                      <ConfirmationStep
                        number="01"
                        title="Received"
                        detail="Registration saved"
                        complete
                      />
                      <ConfirmationStep
                        number="02"
                        title="In review"
                        detail="Vertex team review"
                        current
                      />
                      <ConfirmationStep
                        number="03"
                        title="Entry pass"
                        detail="QR emailed if approved"
                      />
                    </div>
                    <p className="mt-6 border-l border-[var(--nn-accent)] pl-4 text-sm leading-6 text-muted-foreground">
                      No QR pass has been issued yet. We’ll email it after approval.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-5">
                      <a href="#top" className="nn-text-link">
                        Back to event details <ArrowRight size={14} aria-hidden="true" />
                      </a>
                      <a href="/events" className="nn-text-link">
                        Browse events <ArrowRight size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <form
                    noValidate
                    className="nn-registration-form grid gap-5 border border-hairline bg-card/50 p-5 sm:p-7 md:grid-cols-2"
                    onSubmit={submit}
                  >
                    <TextField
                      label="Name"
                      id="name"
                      value={values.name}
                      onChange={(value) => update("name", value)}
                      error={errors.name}
                    />
                    <TextField
                      label="SRN"
                      id="srn"
                      value={values.srn}
                      onChange={(value) => update("srn", value)}
                      error={errors.srn}
                    />
                    <TextField
                      label="Department"
                      id="department"
                      value={values.department}
                      onChange={(value) => update("department", value)}
                      error={errors.department}
                    />
                    <TextField
                      label="Phone number"
                      id="phone"
                      type="tel"
                      value={values.phone}
                      onChange={(value) => update("phone", value)}
                      error={errors.phone}
                    />
                    <TextField
                      label="Email"
                      id="email"
                      type="email"
                      value={values.email}
                      onChange={(value) => update("email", value)}
                      error={errors.email}
                    />
                    <label className="flex flex-col gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Year
                      </span>
                      <select
                        id="year"
                        name="year"
                        required
                        value={values.year}
                        onChange={(event) => update("year", event.target.value)}
                        aria-invalid={Boolean(errors.year)}
                        aria-describedby={errors.year ? "year-error" : undefined}
                        className="field-input rounded-lg px-3 py-2.5 text-sm"
                      >
                        {NEURAL_NETWORK_WORKSHOP_YEARS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      {errors.year && <FieldError id="year-error" message={errors.year} />}
                    </label>

                    <fieldset
                      className="md:col-span-2"
                      aria-describedby={errors.attendReason ? "attend-reason-error" : undefined}
                    >
                      <legend className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        What makes you attend the workshop?{" "}
                        <span className="text-destructive" aria-hidden="true">
                          *
                        </span>
                      </legend>
                      <div className="mt-3 grid gap-2">
                        {NEURAL_NETWORK_ATTEND_REASONS.map((reason) => {
                          const checked = values.attendReason.includes(reason);
                          const disabled = !checked && values.attendReason.length >= 2;
                          return (
                            <label
                              key={reason}
                              className={`flex items-start gap-3 border border-hairline bg-background px-3 py-3 text-sm ${disabled ? "opacity-50" : "hover:border-silver"}`}
                            >
                              <input
                                name="attendReason"
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleReason(reason)}
                                className="mt-1 accent-[var(--silver)]"
                              />
                              <span>{reason}</span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.attendReason && (
                        <FieldError id="attend-reason-error" message={errors.attendReason} />
                      )}
                    </fieldset>

                    <label className="flex flex-col gap-2 md:col-span-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        What do you expect from the workshop?{" "}
                        <span className="text-destructive" aria-hidden="true">
                          *
                        </span>
                      </span>
                      <textarea
                        id="expectation"
                        name="expectation"
                        required
                        rows={5}
                        value={values.expectation}
                        onChange={(event) => update("expectation", event.target.value)}
                        aria-invalid={Boolean(errors.expectation)}
                        aria-describedby={errors.expectation ? "expectation-error" : undefined}
                        className="field-input resize-none rounded-lg px-3 py-2.5 text-sm"
                      />
                      {errors.expectation && (
                        <FieldError id="expectation-error" message={errors.expectation} />
                      )}
                    </label>

                    {errors.form && (
                      <div className="md:col-span-2">
                        <FieldError id="form-error" message={errors.form} />
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="nn-cta w-fit disabled:cursor-wait disabled:opacity-60 md:col-span-2"
                    >
                      {submitting ? "Sending application…" : "Submit registration"}
                      {!submitting && <ArrowRight size={16} aria-hidden="true" />}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EventDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: "time" | "venue";
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon === "time" && <Clock3 size={12} aria-hidden="true" />}
        {icon === "venue" && <MapPin size={12} aria-hidden="true" />}
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-relaxed text-foreground">{value}</dd>
    </div>
  );
}

function ConfirmationStep({
  number,
  title,
  detail,
  complete = false,
  current = false,
}: {
  number: string;
  title: string;
  detail: string;
  complete?: boolean;
  current?: boolean;
}) {
  return (
    <div
      className={`nn-confirmation-step ${current ? "is-current" : ""} ${complete ? "is-complete" : ""}`}
    >
      <span className="font-mono text-[10px] tracking-[0.14em]">{number}</span>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function TextField({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
}: {
  label: string;
  id: keyof FormValues;
  type?: "text" | "tel" | "email";
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="field-input rounded-lg px-3 py-2.5 text-sm"
      />
      {error && <FieldError id={errorId} message={error} />}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <span id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </span>
  );
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const required: (keyof Pick<FormValues, "name" | "srn" | "department" | "year">)[] = [
    "name",
    "srn",
    "department",
    "year",
  ];
  for (const field of required) {
    if (!values[field].trim()) errors[field] = "This field is required.";
  }
  if (!/^[6-9]\d{9}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.attendReason.length === 0) {
    errors.attendReason = "Select at least one reason.";
  } else if (values.attendReason.length > 2) {
    errors.attendReason = "Select no more than two reasons.";
  }
  if (!values.expectation.trim()) errors.expectation = "Tell us what you expect from the workshop.";
  return errors;
}
