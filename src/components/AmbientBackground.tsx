import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(InertiaPlugin);

type Dot = {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  moving: boolean;
};

export type DotGridProps = {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: CSSProperties;
};

function throttle<T extends unknown[]>(callback: (...args: T) => void, limit: number) {
  let lastCall = 0;
  return (...args: T) => {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      callback(...args);
    }
  };
}

function hexToRgb(hex: string) {
  const match = hex.match(/^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i);
  if (!match) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

export function DotGrid({
  dotSize = 16,
  gap = 32,
  baseColor = "#5227FF",
  activeColor = "#5227FF",
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = "",
  style,
}: DotGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({ x: -10000, y: -10000, lastTime: 0, lastX: 0, lastY: 0 });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas || typeof window.Path2D === "undefined") return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const base = hexToRgb(baseColor);
    const active = hexToRgb(activeColor);
    const path = new window.Path2D();
    path.arc(0, 0, dotSize / 2, 0, Math.PI * 2);

    const buildGrid = () => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cell = dotSize + gap;
      const columns = Math.max(1, Math.floor((width + gap) / cell));
      const rows = Math.max(1, Math.floor((height + gap) / cell));
      const gridWidth = cell * columns - gap;
      const gridHeight = cell * rows - gap;
      const startX = (width - gridWidth) / 2 + dotSize / 2;
      const startY = (height - gridHeight) / 2 + dotSize / 2;

      dotsRef.current = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          dotsRef.current.push({
            cx: startX + x * cell,
            cy: startY + y * cell,
            xOffset: 0,
            yOffset: 0,
            moving: false,
          });
        }
      }
    };

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const { x: pointerX, y: pointerY } = pointerRef.current;
      const proximitySquared = proximity * proximity;

      for (const dot of dotsRef.current) {
        const dx = dot.cx - pointerX;
        const dy = dot.cy - pointerY;
        const distanceSquared = dx * dx + dy * dy;
        let fill = baseColor;

        if (distanceSquared <= proximitySquared) {
          const strength = 1 - Math.sqrt(distanceSquared) / proximity;
          const red = Math.round(base.r + (active.r - base.r) * strength);
          const green = Math.round(base.g + (active.g - base.g) * strength);
          const blue = Math.round(base.b + (active.b - base.b) * strength);
          fill = "rgb(" + red + "," + green + "," + blue + ")";
        }

        context.save();
        context.translate(dot.cx + dot.xOffset, dot.cy + dot.yOffset);
        context.fillStyle = fill;
        context.fill(path);
        context.restore();
      }

      frame = requestAnimationFrame(draw);
    };

    const move = (event: MouseEvent) => {
      const now = performance.now();
      const pointer = pointerRef.current;
      const delta = pointer.lastTime ? now - pointer.lastTime : 16;
      const dx = event.clientX - pointer.lastX;
      const dy = event.clientY - pointer.lastY;
      let velocityX = (dx / delta) * 1000;
      let velocityY = (dy / delta) * 1000;
      let speed = Math.hypot(velocityX, velocityY);

      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        velocityX *= scale;
        velocityY *= scale;
        speed = maxSpeed;
      }

      pointer.lastTime = now;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;

      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;

      if (speed <= speedTrigger) return;

      for (const dot of dotsRef.current) {
        const distance = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);
        if (distance >= proximity || dot.moving) continue;

        dot.moving = true;
        gsap.killTweensOf(dot);
        gsap.to(dot, {
          inertia: {
            xOffset: dot.cx - pointer.x + velocityX * 0.005,
            yOffset: dot.cy - pointer.y + velocityY * 0.005,
            resistance,
          },
          onComplete: () => {
            gsap.to(dot, {
              xOffset: 0,
              yOffset: 0,
              duration: returnDuration,
              ease: "elastic.out(1,0.75)",
              onComplete: () => {
                dot.moving = false;
              },
            });
          },
        } as gsap.TweenVars);
      }
    };

    const click = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const distance = Math.hypot(dot.cx - clickX, dot.cy - clickY);
        if (distance >= shockRadius || dot.moving) continue;

        dot.moving = true;
        gsap.killTweensOf(dot);
        const falloff = Math.max(0, 1 - distance / shockRadius);
        gsap.to(dot, {
          inertia: {
            xOffset: (dot.cx - clickX) * shockStrength * falloff,
            yOffset: (dot.cy - clickY) * shockStrength * falloff,
            resistance,
          },
          onComplete: () => {
            gsap.to(dot, {
              xOffset: 0,
              yOffset: 0,
              duration: returnDuration,
              ease: "elastic.out(1,0.75)",
              onComplete: () => {
                dot.moving = false;
              },
            });
          },
        } as gsap.TweenVars);
      }
    };

    let frame = 0;
    buildGrid();
    draw();

    const resizeObserver = new ResizeObserver(buildGrid);
    resizeObserver.observe(wrapper);
    const throttledMove = throttle(move, 50);
    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("click", click);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("click", click);
      gsap.killTweensOf(dotsRef.current);
    };
  }, [
    activeColor,
    baseColor,
    dotSize,
    gap,
    maxSpeed,
    proximity,
    resistance,
    returnDuration,
    shockRadius,
    shockStrength,
    speedTrigger,
  ]);

  return (
    <section
      className={"dot-grid " + className}
      style={{ display: "flex", position: "relative", width: "100%", height: "100%", ...style }}
      aria-hidden="true"
    >
      <div ref={wrapperRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}

const vertexShader = [
  "attribute vec2 uv;",
  "attribute vec2 position;",
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  gl_Position = vec4(position, 0, 1);",
  "}",
].join("\n");

const fragmentShader = [
  "precision highp float;",
  "uniform float uTime;",
  "uniform vec3 uColor;",
  "uniform vec3 uResolution;",
  "uniform vec2 uMouse;",
  "uniform float uAmplitude;",
  "uniform float uSpeed;",
  "varying vec2 vUv;",
  "void main() {",
  "  float mr = min(uResolution.x, uResolution.y);",
  "  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;",
  "  uv += (uMouse - vec2(0.5)) * uAmplitude;",
  "  float d = -uTime * 0.5 * uSpeed;",
  "  float a = 0.0;",
  "  for (float i = 0.0; i < 8.0; ++i) {",
  "    a += cos(i - d - a * uv.x);",
  "    d += sin(uv.y * i + a);",
  "  }",
  "  d += uTime * 0.5 * uSpeed;",
  "  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);",
  "  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;",
  "  gl_FragColor = vec4(col, 1.0);",
  "}",
].join("\n");

export type IridescenceProps = Omit<HTMLAttributes<HTMLDivElement>, "color"> & {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
};

export function Iridescence({
  color = [1, 1, 1],
  speed = 1,
  amplitude = 0.1,
  mouseReact = true,
  ...rest
}: IridescenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer();
    } catch {
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uMouse: {
          value: new Float32Array([mousePosition.current.x, mousePosition.current.y]),
        },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
    });

    const resize = () => {
      const width = Math.max(1, container.offsetWidth);
      const height = Math.max(1, container.offsetHeight);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      );
    };

    window.addEventListener("resize", resize, false);
    resize();

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    let frame = 0;
    const update = (time: number) => {
      frame = requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    };
    frame = requestAnimationFrame(update);

    const mouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      mousePosition.current = { x, y };
      if (program) {
        program.uniforms.uMouse.value[0] = x;
        program.uniforms.uMouse.value[1] = y;
      }
    };

    if (mouseReact) container.addEventListener("mousemove", mouseMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      if (mouseReact) container.removeEventListener("mousemove", mouseMove);
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [amplitude, color, mouseReact, speed]);

  return (
    <div
      ref={containerRef}
      {...rest}
      style={{ width: "100%", height: "100%", overflow: "hidden", ...rest.style }}
    />
  );
}
