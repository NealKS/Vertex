import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/digit-network.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { validateDigitModel, runDigitNetwork, prepareDigit } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const artifact = JSON.parse(
  readFileSync(new URL("../public/models/digit-mlp-v1.json", import.meta.url)),
);
const model = validateDigitModel(artifact);
const references = JSON.parse(
  readFileSync(new URL("./fixtures/digit-reference.json", import.meta.url)),
);
let maximumError = 0;
for (const test of references.cases) {
  const result = runDigitNetwork(
    test.pixels.map((v) => v / 255),
    model.layers,
  );
  result.probabilities.forEach((v, i) => {
    maximumError = Math.max(maximumError, Math.abs(v - test.probabilities[i]));
  });
  assert.ok(Math.abs(result.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-10);
  assert.equal(result.prediction, test.probabilities.indexOf(Math.max(...test.probabilities)));
  assert.deepEqual(
    result.activations.map((layer) => layer.length),
    [784, 16, 16, 10],
  );
}
assert.ok(maximumError < 0.00001, `Export/inference mismatch: ${maximumError}`);
for (const sample of model.examples) {
  const result = runDigitNetwork(
    sample.pixels.map((v) => v / 255),
    model.layers,
  );
  const reference = references.cases.find((test) => test.label === sample.label);
  assert.equal(
    result.prediction,
    reference.probabilities.indexOf(Math.max(...reference.probabilities)),
    `Example ${sample.label} must match the actual model, including misclassifications`,
  );
}
assert.equal(prepareDigit(new Float32Array(280 * 280), 280, 280), null);
assert.throws(() => runDigitNetwork([NaN], model.layers));
assert.throws(() => prepareDigit([1], 0, 0));
assert.throws(() => validateDigitModel({ ...artifact, layers: [] }));
assert.throws(() => validateDigitModel({ ...artifact, activation: "sigmoid" }));

// Same rectangular stroke at different positions and scales must produce the
// same 28×28 input. This catches canvas-coordinate and centring regressions.
function stroke(left, top, width, height) {
  const pixels = new Float32Array(280 * 280);
  for (let y = top; y < top + height; y++)
    for (let x = left; x < left + width; x++) pixels[y * 280 + x] = 1;
  return prepareDigit(pixels, 280, 280);
}
const normal = stroke(70, 60, 20, 160);
assert.deepEqual(normal, stroke(140, 30, 20, 160));
assert.deepEqual(normal, stroke(100, 90, 10, 80));
assert.equal(normal.length, 784);
assert.ok(normal.every((v) => Number.isFinite(v) && v >= 0 && v <= 1));
assert.ok(model.metadata.testAccuracy > 0.94);
console.log(
  `PASS: ${references.cases.length} sklearn reference predictions, 10 digit examples, malformed input, empty canvas, centring and scale invariance. Maximum score difference ${maximumError.toExponential(2)}.`,
);
