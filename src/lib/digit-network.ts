export type DigitLayer = { weights: number[][]; biases: number[] };
export type DigitModel = {
  version: number;
  architecture: number[];
  activation: string;
  layers: DigitLayer[];
  untrainedLayers: DigitLayer[];
  examples: { label: number; pixels: number[] }[];
  metadata: { testAccuracy: number; testExamples: number; trainingExamples: number };
};
export type DigitPass = {
  activations: number[][];
  sums: number[][];
  probabilities: number[];
  prediction: number;
};

export function validateDigitModel(value: unknown): DigitModel {
  const model = value as DigitModel;
  const sizes = [784, 16, 16, 10];
  if (
    !model ||
    model.version !== 1 ||
    model.activation !== "relu" ||
    JSON.stringify(model.architecture) !== JSON.stringify(sizes)
  ) {
    throw new Error("Unsupported digit model.");
  }
  for (const layers of [model.layers, model.untrainedLayers]) {
    if (!Array.isArray(layers) || layers.length !== 3) throw new Error("Incomplete digit model.");
    layers.forEach((layer, index) => {
      if (
        layer.weights?.length !== sizes[index + 1] ||
        layer.biases?.length !== sizes[index + 1] ||
        !layer.biases.every(Number.isFinite) ||
        layer.weights.some((row) => row.length !== sizes[index] || !row.every(Number.isFinite))
      ) {
        throw new Error("Invalid digit model weights.");
      }
    });
  }
  if (
    model.examples?.length !== 10 ||
    model.examples.some(
      (sample, index) =>
        sample.label !== index ||
        sample.pixels?.length !== 784 ||
        sample.pixels.some((v) => !Number.isFinite(v) || v < 0 || v > 255),
    ) ||
    !Number.isFinite(model.metadata?.testAccuracy) ||
    model.metadata.testAccuracy < 0 ||
    model.metadata.testAccuracy > 1
  ) {
    throw new Error("Invalid digit model examples.");
  }
  return model;
}

export function runDigitNetwork(input: number[], layers: DigitLayer[]): DigitPass {
  if (
    input.length !== 784 ||
    input.some((value) => !Number.isFinite(value) || value < 0 || value > 1)
  ) {
    throw new Error("Expected 784 pixel values between zero and one.");
  }
  const activations = [input];
  const sums: number[][] = [];
  layers.forEach((layer, index) => {
    const previous = activations[index];
    const z = layer.weights.map((weights, target) =>
      weights.reduce(
        (sum, weight, source) => sum + weight * previous[source],
        layer.biases[target],
      ),
    );
    sums.push(z);
    if (index < layers.length - 1) activations.push(z.map((value) => Math.max(0, value)));
    else {
      const maximum = Math.max(...z);
      const exponents = z.map((value) => Math.exp(value - maximum));
      const total = exponents.reduce((sum, value) => sum + value, 0);
      activations.push(exponents.map((value) => value / total));
    }
  });
  const probabilities = activations[3];
  return {
    activations,
    sums,
    probabilities,
    prediction: probabilities.indexOf(Math.max(...probabilities)),
  };
}

/** Crop ink, area-resample into a 20px box, then centre its mass in 28×28. */
export function prepareDigit(
  raw: ArrayLike<number>,
  width: number,
  height: number,
): number[] | null {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    raw.length !== width * height
  ) {
    throw new Error("Invalid drawing dimensions.");
  }
  let left = width,
    top = height,
    right = -1,
    bottom = -1,
    ink = 0;
  for (let i = 0; i < raw.length; i++) {
    if (!Number.isFinite(raw[i]) || raw[i] < 0 || raw[i] > 1)
      throw new Error("Invalid drawing pixel.");
    if (raw[i] > 0.08) {
      const x = i % width,
        y = Math.floor(i / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      ink++;
    }
  }
  if (ink < 6 || right <= left || bottom <= top) return null;
  const cropW = right - left + 1,
    cropH = bottom - top + 1;
  const scale = 20 / Math.max(cropW, cropH);
  const outW = Math.max(1, Math.round(cropW * scale)),
    outH = Math.max(1, Math.round(cropH * scale));
  const small = Array<number>(784).fill(0);
  const offsetX = Math.floor((28 - outW) / 2),
    offsetY = Math.floor((28 - outH) / 2);
  // Weighted pixel coverage preserves thin strokes when shrinking a touch canvas.
  for (let y = 0; y < outH; y++)
    for (let x = 0; x < outW; x++) {
      const x0 = left + (x * cropW) / outW,
        x1 = left + ((x + 1) * cropW) / outW;
      const y0 = top + (y * cropH) / outH,
        y1 = top + ((y + 1) * cropH) / outH;
      let sum = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++)
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
          if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
          const area =
            Math.max(0, Math.min(x1, sx + 1) - Math.max(x0, sx)) *
            Math.max(0, Math.min(y1, sy + 1) - Math.max(y0, sy));
          sum += raw[sy * width + sx] * area;
        }
      small[(y + offsetY) * 28 + x + offsetX] = Math.min(1, sum / ((x1 - x0) * (y1 - y0)));
    }
  let mass = 0,
    cx = 0,
    cy = 0;
  small.forEach((v, i) => {
    mass += v;
    cx += (i % 28) * v;
    cy += Math.floor(i / 28) * v;
  });
  if (mass < 0.25) return null;
  const dx = Math.round(13.5 - cx / mass),
    dy = Math.round(13.5 - cy / mass);
  const result = Array<number>(784).fill(0);
  small.forEach((v, i) => {
    const x = (i % 28) + dx,
      y = Math.floor(i / 28) + dy;
    if (x >= 0 && x < 28 && y >= 0 && y < 28) result[y * 28 + x] = v;
  });
  return result;
}
