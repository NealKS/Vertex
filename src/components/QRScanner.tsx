import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ScanLine } from "lucide-react";

type ScannerState = "idle" | "starting" | "scanning" | "error";

// Live camera QR scanner. Uses the native BarcodeDetector where available
// (Chrome/Android) and falls back to jsQR frame decoding elsewhere (iOS Safari).
export function QRScanner({
  onResult,
  cooldownMs = 2500,
  autoStart = false,
  paused = false,
}: {
  onResult: (text: string) => void;
  cooldownMs?: number;
  autoStart?: boolean;
  paused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const decodingRef = useRef(false);
  const pausedRef = useRef(paused);
  const autoStartedRef = useRef(false);
  const lastResult = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  useEffect(() => stop, [stop]);

  const handleDetection = useCallback(
    (text: string) => {
      const now = Date.now();
      if (text === lastResult.current.text && now - lastResult.current.at < cooldownMs) return;
      lastResult.current = { text, at: now };
      onResult(text);
    },
    [cooldownMs, onResult],
  );

  const start = useCallback(async () => {
    setState("starting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      type DetectedBarcode = { rawValue: string };
      type BarcodeDetectorLike = new (options: { formats: string[] }) => {
        detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
      };
      const detector =
        "BarcodeDetector" in window
          ? new (window as unknown as { BarcodeDetector: BarcodeDetectorLike }).BarcodeDetector({
              formats: ["qr_code"],
            })
          : null;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      // Load the Safari fallback once, rather than starting a dynamic import for
      // every camera frame. That was the main source of missed/laggy scans.
      const jsQr = detector ? null : (await import("jsqr")).default;

      const tick = async () => {
        if (!streamRef.current || !video.videoWidth || decodingRef.current || pausedRef.current) {
          rafRef.current = requestAnimationFrame(() => void tick());
          return;
        }
        decodingRef.current = true;
        try {
          if (detector) {
            const codes = await detector.detect(video);
            if (codes.length > 0) handleDetection(codes[0].rawValue);
          } else if (context && jsQr) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            const found = jsQr(image.data, image.width, image.height, {
              inversionAttempts: "dontInvert",
            });
            if (found?.data) handleDetection(found.data);
          }
        } catch {
          /* transient decode errors are normal */
        } finally {
          decodingRef.current = false;
        }
        rafRef.current = requestAnimationFrame(() => void tick());
      };
      rafRef.current = requestAnimationFrame(() => void tick());
      setState("scanning");
    } catch (err) {
      setState("error");
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in your browser settings."
          : "No camera available on this device.",
      );
    }
  }, [handleDetection]);

  // A staffed event desk should be ready as soon as it opens. The guard keeps
  // a declined camera permission from repeatedly prompting the staff member.
  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      void start();
    }
  }, [autoStart, start]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-xl border border-hairline bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${state === "scanning" ? "" : "opacity-30"}`}
        />
        {state === "scanning" && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-8 top-1/2 h-0.5 animate-[scanner-sweep_2s_ease-in-out_infinite] bg-emerald-300 shadow-[0_0_16px_rgb(110,231,183)]" />
            <div className="absolute inset-6 rounded-lg border-2 border-white/25" />
          </div>
        )}
        {state === "scanning" && paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 text-center text-white">
            <p className="font-mono text-xs uppercase tracking-[0.16em]">Scan paused · review result</p>
          </div>
        )}
        {state !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
            <ScanLine size={28} />
            <p className="max-w-[240px] text-center font-mono text-[10px] uppercase tracking-widest">
              {state === "starting" ? "Starting camera…" : error ? error : "Camera is off"}
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {state === "scanning" ? (
          <button
            type="button"
            onClick={stop}
            className="btn-ghost inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
          >
            <CameraOff size={13} /> Stop camera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void start()}
            disabled={state === "starting"}
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            <Camera size={13} /> {state === "starting" ? "Opening…" : "Start scanning"}
          </button>
        )}
      </div>
    </div>
  );
}
