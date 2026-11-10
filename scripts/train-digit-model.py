"""Rebuild the browser's 784 → 16 → 16 → 10 handwriting model.

Requirements: numpy, scikit-learn. Run with OPENBLAS_NUM_THREADS=1.
Usage: python scripts/train-digit-model.py /path/to/mnist.npz
Dataset: https://storage.googleapis.com/tensorflow/tf-keras-datasets/mnist.npz
Only trained weights, 10 examples and reference outputs ship to the browser.
"""
import hashlib
import json
from pathlib import Path
import sys

import numpy as np
import sklearn
from sklearn.neural_network import MLPClassifier

root = Path(__file__).resolve().parents[1]
dataset_path = Path(sys.argv[1])
data = np.load(dataset_path, allow_pickle=False)
x = data['x_train'].reshape(-1, 784).astype(np.float32) / 255
y = data['y_train']
test = data['x_test'].reshape(-1, 784).astype(np.float32) / 255
labels = data['y_test']
model = MLPClassifier(hidden_layer_sizes=(16, 16), activation='relu',
                      batch_size=256, max_iter=50, random_state=42,
                      learning_rate_init=0.001, alpha=0.01,
                      early_stopping=True, validation_fraction=0.1,
                      n_iter_no_change=8, verbose=True)
model.fit(x, y)

def layers(weights, biases):
    return [{'weights': np.round(w.T.astype(float), 7).tolist(),
             'biases': np.round(b.astype(float), 7).tolist()}
            for w, b in zip(weights, biases)]

# Reproduce sklearn's seeded Glorot initialization for a meaningful comparison.
rng = np.random.RandomState(42)
untrained_w, untrained_b = [], []
for fan_in, fan_out in zip([784, 16, 16], [16, 16, 10]):
    bound = np.sqrt(6 / (fan_in + fan_out))
    untrained_w.append(rng.uniform(-bound, bound, (fan_in, fan_out)))
    untrained_b.append(rng.uniform(-bound, bound, fan_out))

# All examples are from the held-out test split, first occurrence of each label.
examples = [{'label': digit, 'pixels': data['x_test'][np.where(labels == digit)[0][0]].ravel().tolist()}
            for digit in range(10)]
accuracy = float(model.score(test, labels))
artifact = {'version': 1, 'architecture': [784, 16, 16, 10],
            'activation': 'relu', 'layers': layers(model.coefs_, model.intercepts_),
            'untrainedLayers': layers(untrained_w, untrained_b), 'examples': examples,
            'metadata': {'dataset': 'MNIST', 'trainingExamples': 54000,
                         'validationExamples': 6000, 'testExamples': 10000,
                         'testAccuracy': accuracy, 'epochs': model.n_iter_,
                         'seed': 42, 'sklearnVersion': sklearn.__version__,
                         'datasetSha256': hashlib.sha256(dataset_path.read_bytes()).hexdigest()}}
dest = root / 'public/models/digit-mlp-v1.json'
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(artifact, separators=(',', ':')) + '\n')

# These hold-out reference cases catch orientation/activation/export mistakes in JS.
indices = list(range(100))
reference = {'cases': [{'pixels': data['x_test'][i].ravel().tolist(),
                        'label': int(labels[i]),
                        'probabilities': model.predict_proba(test[i:i+1])[0].astype(float).tolist()}
                       for i in indices]}
fixtures = root / 'scripts/fixtures/digit-reference.json'
fixtures.parent.mkdir(parents=True, exist_ok=True)
fixtures.write_text(json.dumps(reference, separators=(',', ':')) + '\n')
print(json.dumps(artifact['metadata'], indent=2))
print(f'Browser model: {dest.stat().st_size:,} bytes')
