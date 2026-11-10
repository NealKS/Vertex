# Neural Network Lab

The workshop page's handwriting lab replaces the former preset-glyph model.
Visitors draw with a mouse, pen or touch, or choose one of ten held-out MNIST
examples. Predict runs a 784 → 16 → 16 → 10 MLP in the browser. No drawing or
prediction is sent to a server. It uses plain TypeScript; no new runtime package,
API key, database migration or paid service is required.

## Learning interactions

- Drawing is cropped, area-resampled into a 20-pixel box, and centred by mass in
  a 28 × 28 grid. The resulting pixels are displayed next to the canvas.
- Replay, Next layer and Show all expose the forward pass. Reduced-motion users
  see the complete result immediately. Keyboard users can use the ten examples,
  diagram buttons and inspector selects.
- Hidden neurons show actual ReLU activations. Display brightness is normalised
  per layer; the inspector reports raw sums/activations. Connections between
  hidden/output layers show actual weighted source contributions (green positive,
  dark negative), scaled per layer. The first input bundle compresses 784 edges.
- Inspect a neuron to see weights, bias, weighted sum, ReLU and the three largest
  signed contributions. Weight images do not assert that a neuron detects a
  human-readable feature such as a loop or edge.
- Before training switches to the same architecture's seeded initial parameters.
  It does not perform training or permanently learn from a visitor's correction.
- Output scores are uncalibrated relative digit scores, not a guarantee that an
  image contains a digit. Blank inputs are rejected; arbitrary scribbles may still
  get a high score. Handwriting is not restricted to preset classes or templates.

## Model provenance and evaluation

Independently trained for Vertex with scikit-learn 1.8.0, seed 42, ReLU hidden
layers, softmax output, Adam, 16 + 16 hidden neurons, 13,002 total parameters.
The MNIST training split supplies 54,000 fitting images and 6,000 validation
images for early stopping. The untouched 10,000-image test split scored **95.48%**.
This benchmark uses canonical MNIST pixels; it does not establish accuracy on
freehand browser drawings, whose stroke style and preprocessing differ.

The bundled examples are the first occurrence of each digit in the test split,
not hand-picked successes. In particular the example labelled 5 is classified as
6 by this model; the lab deliberately preserves the actual output.

The versioned JSON contains trained weights, initial weights, ten examples and
training metadata (~280 KB before compression). Fetch/validation failures show
an error with Retry; they do not affect registration. The runtime fetches only
`/models/digit-mlp-v1.json` from the same origin.

Dataset source: TensorFlow/Keras MNIST distribution,
https://storage.googleapis.com/tensorflow/tf-keras-datasets/mnist.npz
Dataset SHA-256: 731c5ac602752760c8e48fbffcf8c3b850d9dc2a2aedcf2cc48468fc17b673d1
MNIST: Yann LeCun, Corinna Cortes and Christopher J. C. Burges.
Learning inspiration: Grant Sanderson's 3Blue1Brown neural networks lesson,
https://www.3blue1brown.com/lessons/neural-networks (linked in the lab).
The implementation and model do not copy the reference site's code or assets.

## Reproduce

With Python, numpy and scikit-learn 1.8.0 installed, download the dataset above:

```sh
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python scripts/train-digit-model.py /path/to/mnist.npz
node scripts/test-digit-lab.mjs
npm run build
```

The inference check compares 100 held-out examples against Python reference
probabilities, including misclassifications. It also checks softmax sums,
activation sizes, model/input validation, blank canvas rejection, centring and
scale invariance. Reference fixtures live under scripts/ and do not ship in the
client bundle. Seven-decimal export matches Python scores within 0.000001.
