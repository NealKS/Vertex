import { ArrowRight, Eraser, Play, StepForward } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  prepareDigit,
  runDigitNetwork,
  validateDigitModel,
  type DigitModel,
  type DigitPass,
} from "@/lib/digit-network";
import "./digit-lab.css";

const SIZE = 280;
const EMPTY = Array<number>(784).fill(0);
const STEPS = [
  "Your 784 pixels",
  "Hidden layer 1 · ReLU",
  "Hidden layer 2 · ReLU",
  "10 digit scores",
];
const MODEL_URL = "/models/digit-mlp-v1.json";

export function NeuralNetworkVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<number | null>(null);
  const lastPoint = useRef({ x: 0, y: 0 });
  const [model, setModel] = useState<DigitModel | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [input, setInput] = useState<number[]>(EMPTY);
  const [hasPrediction, setHasPrediction] = useState(false);
  const [mode, setMode] = useState<"trained" | "untrained">("trained");
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Draw one digit, or load a handwriting example below.");
  const [selected, setSelected] = useState({ layer: 0, neuron: 0 });
  const reducedMotion = useReducedMotion();
  const hasInk = input.some((value) => value > 0);
  const layers = model ? (mode === "trained" ? model.layers : model.untrainedLayers) : null;
  const pass = useMemo(
    () => (hasPrediction && layers ? runDigitNetwork(input, layers) : null),
    [hasPrediction, input, layers],
  );
  const comparison = useMemo(
    () =>
      hasPrediction && model
        ? {
            trained: runDigitNetwork(input, model.layers),
            untrained: runDigitNetwork(input, model.untrainedLayers),
          }
        : null,
    [hasPrediction, input, model],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(MODEL_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the model.");
        return response.json();
      })
      .then((value) => {
        setModel(validateDigitModel(value));
        setLoadError(false);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
      });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.fillStyle = "#111812";
      context.fillRect(0, 0, SIZE, SIZE);
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (reducedMotion) {
      setStage(3);
      setPlaying(false);
      return;
    }
    const timer = window.setInterval(() => setStage((value) => Math.min(3, value + 1)), 650);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion]);
  useEffect(() => {
    if (stage === 3) setPlaying(false);
  }, [stage]);

  function clear() {
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.fillStyle = "#111812";
      context.fillRect(0, 0, SIZE, SIZE);
    }
    setInput(EMPTY);
    setHasPrediction(false);
    setPlaying(false);
    setStage(0);
    setMessage("Canvas cleared. Draw another digit.");
  }

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * SIZE) / bounds.width,
      y: ((event.clientY - bounds.top) * SIZE) / bounds.height,
    };
  }
  function drawTo(next: { x: number; y: number }, start = false) {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.strokeStyle = "#ffffff";
    context.fillStyle = "#ffffff";
    context.lineWidth = 18;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (start) {
      context.beginPath();
      context.arc(next.x, next.y, 9, 0, Math.PI * 2);
      context.fill();
    } else {
      context.beginPath();
      context.moveTo(lastPoint.current.x, lastPoint.current.y);
      context.lineTo(next.x, next.y);
      context.stroke();
    }
    lastPoint.current = next;
  }
  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    if (drawing.current !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    drawing.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPlaying(false);
    setHasPrediction(false);
    setStage(0);
    drawTo(point(event), true);
  }
  function finishDrawing(event: PointerEvent<HTMLCanvasElement>) {
    if (drawing.current !== event.pointerId) return;
    drawing.current = null;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const rgba = context.getImageData(0, 0, SIZE, SIZE).data;
    // The paper is a very dark green; discard its luminance before finding ink.
    const raw = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < raw.length; i++) raw[i] = Math.max(0, (rgba[i * 4] - 17) / 238);
    const prepared = prepareDigit(raw, SIZE, SIZE);
    setInput(prepared ?? EMPTY);
    setMessage(
      prepared
        ? "Drawing ready. Press Predict digit to run the network."
        : "Add a larger digit before predicting.",
    );
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function loadExample(digit: number) {
    if (!model) return;
    const pixels = model.examples[digit].pixels;
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.fillStyle = "#111812";
      context.fillRect(0, 0, SIZE, SIZE);
      pixels.forEach((pixel, i) => {
        if (pixel) {
          context.fillStyle = `rgb(${pixel} ${pixel} ${pixel})`;
          context.fillRect((i % 28) * 10, Math.floor(i / 28) * 10, 10, 10);
        }
      });
    }
    setInput(pixels.map((value) => value / 255));
    setHasPrediction(false);
    setStage(0);
    setPlaying(false);
    setMessage(`Loaded a held-out MNIST example of ${digit}. Press Predict digit.`);
  }
  function predict() {
    if (!model || !hasInk) return;
    setHasPrediction(true);
    setStage(reducedMotion ? 3 : 0);
    setPlaying(!reducedMotion);
    setMessage(
      "Prediction computed on your device. Follow the actual activations through each layer.",
    );
  }

  return (
    <section className="digit-lab mx-auto max-w-6xl px-6 pb-16" aria-labelledby="digit-lab-title">
      <div className="digit-lab-heading">
        <div>
          <p className="digit-eyebrow">Vertex / Neural network lab</p>
          <h2 id="digit-lab-title">
            Your handwriting.
            <br />
            <em>The network’s best guess.</em>
          </h2>
        </div>
        <p>
          Draw a digit. Follow the numbers.
          <br />
          Find out where the model gets it wrong.
        </p>
      </div>
      <div className="digit-lab-toolbar">
        <span className="digit-model-status">
          <span className={model ? "digit-status-dot" : ""} />
          {model
            ? "Model ready · runs on your device"
            : loadError
              ? "Model unavailable"
              : "Loading handwriting model…"}
        </span>
        <div className="digit-segment" role="group" aria-label="Model training state">
          {(["trained", "untrained"] as const).map((option) => (
            <button
              key={option}
              type="button"
              disabled={!model}
              aria-pressed={mode === option}
              onClick={() => {
                setMode(option);
                setPlaying(false);
                setStage(hasPrediction ? 3 : 0);
              }}
            >
              {option === "trained" ? "Trained" : "Before training"}
            </button>
          ))}
        </div>
      </div>
      {loadError && (
        <div className="digit-error" role="alert">
          The model couldn’t be downloaded. Check your connection and{" "}
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              setRetry((value) => value + 1);
            }}
          >
            try again
          </button>
          . Your registration still works.
        </div>
      )}
      <div className="digit-lab-grid">
        <div className="digit-drawing-panel">
          <div className="digit-panel-label">
            <span>01 / Draw</span>
            <span>One digit · 0–9</span>
          </div>
          <div className="digit-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              aria-label="Draw a handwritten digit here using a mouse, pen or finger. Keyboard users can choose an example below."
              aria-describedby="digit-drawing-help"
              onPointerDown={startDrawing}
              onPointerMove={(event) => {
                if (drawing.current === event.pointerId) drawTo(point(event));
              }}
              onPointerUp={finishDrawing}
              onPointerCancel={finishDrawing}
              onLostPointerCapture={finishDrawing}
            />
            {!hasInk && (
              <span className="digit-canvas-hint" aria-hidden="true">
                Draw here
              </span>
            )}
            <span className="digit-canvas-corner" aria-hidden="true">
              28 × 28 input
            </span>
          </div>
          <div className="digit-drawing-actions">
            <button
              type="button"
              className="digit-primary"
              onClick={predict}
              disabled={!model || !hasInk}
            >
              Predict digit <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="digit-icon-button"
              onClick={clear}
              aria-label="Clear drawing"
            >
              <Eraser size={17} aria-hidden="true" />
            </button>
          </div>
          <p id="digit-drawing-help" className="digit-help">
            Use most of the square. Draw a single digit with a finger or mouse.
          </p>
          <p className="digit-example-label">Or try real handwriting</p>
          <div className="digit-examples" role="group" aria-label="MNIST handwriting examples">
            {Array.from({ length: 10 }, (_, i) => (
              <button
                type="button"
                key={i}
                disabled={!model}
                aria-label={`Load example digit ${i}`}
                onClick={() => loadExample(i)}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="digit-preprocess">
            <PixelImage pixels={input} label="Preprocessed 28 by 28 pixel input" />
            <div>
              <span className="digit-eyebrow">What it sees</span>
              <p>
                Cropped, resized and centred.
                <br />
                784 brightness values, from 0 to 1.
              </p>
            </div>
          </div>
        </div>
        <div className="digit-network-panel">
          <div className="digit-panel-label">
            <span>02 / Follow the forward pass</span>
            <span>784 → 16 → 16 → 10</span>
          </div>
          <div className="digit-step-controls">
            <button
              type="button"
              className="digit-text-button"
              disabled={!pass}
              onClick={() => {
                setStage(reducedMotion ? 3 : 0);
                setPlaying(!reducedMotion);
              }}
            >
              <Play size={14} aria-hidden="true" /> Replay
            </button>
            <button
              type="button"
              className="digit-text-button"
              disabled={!pass || stage === 3}
              onClick={() => {
                setPlaying(false);
                setStage((value) => Math.min(3, value + 1));
              }}
            >
              <StepForward size={15} aria-hidden="true" /> Next layer
            </button>
            <button
              type="button"
              className="digit-text-button"
              disabled={!pass}
              onClick={() => {
                setPlaying(false);
                setStage(3);
              }}
            >
              Show all
            </button>
          </div>
          <NetworkDiagram
            pass={pass}
            layers={layers}
            input={input}
            stage={stage}
            selected={selected}
            onSelect={(layer, neuron) => setSelected({ layer, neuron })}
          />
          <div className="digit-stage-label" aria-live="polite">
            {pass ? `${stage + 1}/4 · ${STEPS[stage]}` : "Draw or choose an example to begin."}
          </div>
          <div className="digit-result" aria-live="polite" aria-atomic="true">
            <span className="digit-result-number">
              {pass && stage === 3 ? pass.prediction : "—"}
            </span>
            <div>
              <p className="digit-eyebrow">
                {mode === "trained" ? "Trained model prediction" : "Untrained model prediction"}
              </p>
              <p>
                {pass && stage === 3
                  ? `${(Math.max(...pass.probabilities) * 100).toFixed(1)}% model score${Math.max(...pass.probabilities) < 0.65 ? " · ambiguous input" : ""}`
                  : "The result appears after the output layer."}
              </p>
            </div>
          </div>
          <div className="digit-output-bars" aria-label="Scores for digits zero through nine">
            {Array.from({ length: 10 }, (_, digit) => {
              const score = pass && stage === 3 ? pass.probabilities[digit] : 0;
              return (
                <div
                  key={digit}
                  className={
                    pass?.prediction === digit && stage === 3
                      ? "digit-output is-winner"
                      : "digit-output"
                  }
                >
                  <span>{digit}</span>
                  <div className="digit-bar">
                    <span style={{ height: `${score * 100}%` }} />
                  </div>
                  <span className="digit-score">
                    {pass && stage === 3 ? `${Math.round(score * 100)}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="digit-help">
            These scores compare digits 0–9; they do not prove a drawing is a digit. Scribbles can
            still receive a high score.
          </p>
        </div>
      </div>
      <p className="digit-announcement" role="status">
        {message}
      </p>
      {model && (
        <div className="digit-explore-grid">
          <NeuronInspector
            pass={pass}
            layers={layers!}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="digit-comparison">
            <p className="digit-eyebrow">Same drawing. Different weights.</p>
            <h3>What does training change?</h3>
            <p>
              The architecture stays the same. Training adjusts 13,002 weights and biases using
              labelled handwriting.
            </p>
            <div className="digit-comparison-results">
              {(["untrained", "trained"] as const).map((state) => (
                <div key={state}>
                  <span>{state === "trained" ? "After training" : "Before training"}</span>
                  <strong>{comparison ? comparison[state].prediction : "—"}</strong>
                  <span>
                    {comparison
                      ? `${(Math.max(...comparison[state].probabilities) * 100).toFixed(1)}% score`
                      : "Predict to compare"}
                  </span>
                </div>
              ))}
            </div>
            <p className="digit-help">
              Before training uses the model’s seeded initial weights. This comparison does not
              retrain or save your drawing.
            </p>
          </div>
        </div>
      )}
      <div className="digit-lab-footer">
        <span>784 inputs · 16 + 16 hidden neurons · 10 outputs</span>
        <span>
          {model
            ? `${(model.metadata.testAccuracy * 100).toFixed(1)}% on ${model.metadata.testExamples.toLocaleString("en-IN")} held-out MNIST images`
            : "Small model. Real computation."}
        </span>
      </div>
      <p className="digit-credit">
        Built for Vertex. Inspired by{" "}
        <a
          href="https://www.3blue1brown.com/lessons/neural-networks"
          target="_blank"
          rel="noreferrer"
        >
          Grant Sanderson’s neural networks lesson ↗
        </a>
        . Our model is trained on MNIST; browser handwriting can be harder than the test set.
        Drawings stay on your device.
      </p>
    </section>
  );
}

function PixelImage({
  pixels,
  label,
  signed = false,
}: {
  pixels: number[];
  label: string;
  signed?: boolean;
}) {
  const maximum = signed ? Math.max(0.001, ...pixels.map(Math.abs)) : 1;
  return (
    <div className="digit-pixels" role="img" aria-label={label}>
      {pixels.map((v, i) => (
        <span
          key={i}
          style={{
            backgroundColor: signed && v < 0 ? "var(--foreground)" : "var(--accent)",
            opacity: 0.04 + 0.96 * Math.min(1, Math.abs(v) / maximum),
          }}
        />
      ))}
    </div>
  );
}

function NetworkDiagram({
  pass,
  layers,
  input,
  stage,
  selected,
  onSelect,
}: {
  pass: DigitPass | null;
  layers: DigitModel["layers"] | null;
  input: number[];
  stage: number;
  selected: { layer: number; neuron: number };
  onSelect: (layer: number, neuron: number) => void;
}) {
  const points = [
    Array.from({ length: 16 }, (_, i) => ({ x: 154, y: 32 + i * 16 })),
    Array.from({ length: 16 }, (_, i) => ({ x: 310, y: 32 + i * 16 })),
    Array.from({ length: 10 }, (_, i) => ({ x: 466, y: 80 + i * 16 })),
  ];
  const values = pass
    ? pass.activations.slice(1)
    : [Array(16).fill(0), Array(16).fill(0), Array(10).fill(0)];
  const brightness = values.map((layer) => layer.map((v) => v / Math.max(1, ...layer)));
  const contributions = [0, 1].map((layer) =>
    points[layer].flatMap((_, i) =>
      points[layer + 1].map((_, j) => (layers?.[layer + 1].weights[j][i] ?? 0) * values[layer][i]),
    ),
  );
  const maxContribution = contributions.map((group) => Math.max(0.001, ...group.map(Math.abs)));
  return (
    <svg
      className="digit-network-svg"
      viewBox="0 0 520 318"
      role="group"
      aria-label="Interactive neural network. Select a hidden neuron to inspect its calculation."
    >
      <rect
        x="10"
        y="100"
        width="64"
        height="64"
        fill="var(--background)"
        stroke="var(--hairline)"
      />
      {input.map(
        (v, i) =>
          v > 0.02 && (
            <rect
              key={i}
              x={10 + ((i % 28) * 64) / 28}
              y={100 + (Math.floor(i / 28) * 64) / 28}
              width={2.4}
              height={2.4}
              fill="var(--accent)"
              opacity={v}
            />
          ),
      )}
      {points[0].map((target, i) => (
        <line
          key={`in-${i}`}
          x1="74"
          y1="132"
          x2={target.x}
          y2={target.y}
          stroke="var(--accent)"
          strokeOpacity={pass && stage >= 1 ? 0.15 + brightness[0][i] * 0.4 : 0.08}
        />
      ))}
      {[0, 1].flatMap((layer) =>
        points[layer].flatMap((source, i) =>
          points[layer + 1].map((target, j) => (
            <line
              key={`${layer}-${i}-${j}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={
                (layers?.[layer + 1].weights[j][i] ?? 0) < 0 ? "var(--foreground)" : "var(--accent)"
              }
              strokeWidth="0.65"
              strokeOpacity={
                pass && stage > layer + 1
                  ? 0.04 +
                    (Math.abs(contributions[layer][i * points[layer + 1].length + j]) /
                      maxContribution[layer]) *
                      0.55
                  : 0.035
              }
            />
          )),
        ),
      )}
      {points.map((layer, l) =>
        layer.map((p, n) => {
          const active = !!pass && stage >= l + 1;
          const inspected = l < 2 && selected.layer === l && selected.neuron === n;
          return (
            <g
              key={`${l}-${n}`}
              role={l < 2 ? "button" : undefined}
              tabIndex={l < 2 ? 0 : undefined}
              aria-label={l < 2 ? `Inspect hidden layer ${l + 1}, neuron ${n + 1}` : undefined}
              aria-pressed={l < 2 ? inspected : undefined}
              onClick={() => {
                if (l < 2) onSelect(l, n);
              }}
              onKeyDown={(event) => {
                if (l < 2 && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onSelect(l, n);
                }
              }}
              className={l < 2 ? "digit-neuron" : ""}
            >
              <title>
                {l < 2 ? `Hidden layer ${l + 1}, neuron ${n + 1}` : `Digit ${n}`}:{" "}
                {active ? values[l][n].toFixed(4) : "waiting"}
              </title>
              <circle cx={p.x} cy={p.y} r="8" fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={inspected ? 5.6 : 4.5}
                fill={active ? "var(--accent)" : "var(--background)"}
                fillOpacity={active ? 0.15 + brightness[l][n] * 0.85 : 1}
                stroke="var(--accent)"
                strokeWidth={inspected ? 2 : 1}
                strokeOpacity={active || inspected ? 1 : 0.25}
              />
              {l === 2 && (
                <text x={p.x + 14} y={p.y + 3} fontSize="10" fill="var(--foreground)">
                  {n}
                </text>
              )}
            </g>
          );
        }),
      )}
      {[
        { x: 42, text: "784 PIXELS" },
        { x: 154, text: "HIDDEN 1" },
        { x: 310, text: "HIDDEN 2" },
        { x: 466, text: "OUTPUT" },
      ].map((label) => (
        <text
          key={label.text}
          x={label.x}
          y="304"
          textAnchor="middle"
          fontSize="9"
          letterSpacing="1"
          fill="var(--muted-foreground)"
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}

function NeuronInspector({
  pass,
  layers,
  selected,
  onSelect,
}: {
  pass: DigitPass | null;
  layers: DigitModel["layers"];
  selected: { layer: number; neuron: number };
  onSelect: (value: { layer: number; neuron: number }) => void;
}) {
  const { layer, neuron } = selected;
  const weights = layers[layer].weights[neuron],
    bias = layers[layer].biases[neuron];
  const z = pass?.sums[layer][neuron],
    activation = pass?.activations[layer + 1][neuron];
  const previous = pass?.activations[layer];
  const contributions = weights
    .map((w, i) => ({ i, w, value: w * (previous?.[i] ?? 0) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);
  return (
    <div className="digit-inspector">
      <p className="digit-eyebrow">Open the black box</p>
      <h3>Inside one neuron.</h3>
      <div className="digit-inspector-selects">
        <label>
          Layer
          <select
            value={layer}
            onChange={(event) => onSelect({ layer: Number(event.target.value), neuron })}
          >
            <option value={0}>Hidden layer 1</option>
            <option value={1}>Hidden layer 2</option>
          </select>
        </label>
        <label>
          Neuron
          <select
            value={neuron}
            onChange={(event) => onSelect({ layer, neuron: Number(event.target.value) })}
          >
            {Array.from({ length: 16 }, (_, i) => (
              <option key={i} value={i}>
                Neuron {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="digit-neuron-details">
        {layer === 0 ? (
          <PixelImage
            pixels={weights}
            signed
            label="Selected neuron's learned weights: green positive, ink negative"
          />
        ) : (
          <div className="digit-weight-list" aria-label="Weights from the previous 16 neurons">
            {weights.map((w, i) => (
              <span
                key={i}
                title={`Connection ${i + 1}: ${w.toFixed(4)}`}
                style={{
                  opacity:
                    0.18 + Math.min(1, Math.abs(w) / Math.max(...weights.map(Math.abs))) * 0.82,
                  backgroundColor: w < 0 ? "var(--foreground)" : "var(--accent)",
                }}
              />
            ))}
          </div>
        )}
        <dl>
          <div>
            <dt>Weighted sum Σ(w × a)</dt>
            <dd>{z === undefined ? "—" : (z - bias).toFixed(3)}</dd>
          </div>
          <div>
            <dt>Bias b</dt>
            <dd>{bias.toFixed(3)}</dd>
          </div>
          <div>
            <dt>ReLU: max(0, sum + b)</dt>
            <dd>{activation === undefined ? "—" : activation.toFixed(3)}</dd>
          </div>
        </dl>
      </div>
      <p className="digit-help">
        {layer === 0
          ? "Each square is a learned input weight. Green is positive; dark ink is negative."
          : "Each bar is a connection from one of the previous 16 neurons."}{" "}
        Brightness shows weight magnitude; it does not label a neuron as a particular shape.
      </p>
      {pass && (
        <p className="digit-contributions">
          Largest contributions:{" "}
          {contributions
            .map(
              (c) =>
                `${layer === 0 ? "pixel" : "neuron"} ${c.i + 1}: ${c.value >= 0 ? "+" : ""}${c.value.toFixed(2)}`,
            )
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
