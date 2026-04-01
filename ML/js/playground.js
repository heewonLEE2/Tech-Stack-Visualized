// ===== ML Playground Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  fmt,
  generateDataset,
  trainTestSplit,
  CLASS_COLORS,
  mulberry32,
  sigmoid,
  dist,
} from './utils.js';

const CW = 600,
  CH = 480;
const margin = { top: 30, right: 20, bottom: 40, left: 50 };

// ---- Models ----
// Logistic Regression
function trainLinear(train) {
  let w1 = 0,
    w2 = 0,
    b = 0;
  for (let ep = 0; ep < 300; ep++) {
    let dw1 = 0,
      dw2 = 0,
      db = 0;
    for (const p of train) {
      const z = w1 * p.x + w2 * p.y + b;
      const pred = sigmoid(z);
      const err = pred - p.label;
      dw1 += err * p.x;
      dw2 += err * p.y;
      db += err;
    }
    const lr = 0.3;
    w1 -= (lr * dw1) / train.length;
    w2 -= (lr * dw2) / train.length;
    b -= (lr * db) / train.length;
  }
  return { type: 'linear', w1, w2, b };
}

// Simple Decision Tree (reuse from decision-tree.js logic)
function buildTree(points, maxDepth) {
  function split(pts, depth) {
    const c0 = pts.filter((p) => p.label === 0).length;
    const c1 = pts.length - c0;
    if (depth >= maxDepth || pts.length <= 2 || c0 === 0 || c1 === 0) {
      return { leaf: true, label: c0 >= c1 ? 0 : 1 };
    }
    let bestGain = -1,
      bestF,
      bestT,
      bestL,
      bestR;
    const n = pts.length;
    const gini = (a, b) => {
      const t = a + b;
      return t === 0 ? 0 : 1 - (a / t) ** 2 - (b / t) ** 2;
    };
    const curGini = gini(c0, c1);
    for (const f of [0, 1]) {
      const vals = pts.map((p) => (f === 0 ? p.x : p.y)).sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i++) {
        const thr = (vals[i] + vals[i + 1]) / 2;
        const left = pts.filter((p) => (f === 0 ? p.x : p.y) <= thr);
        const right = pts.filter((p) => (f === 0 ? p.x : p.y) > thr);
        if (!left.length || !right.length) continue;
        const lc0 = left.filter((p) => p.label === 0).length;
        const rc0 = right.filter((p) => p.label === 0).length;
        const gain =
          curGini -
          (left.length / n) * gini(lc0, left.length - lc0) -
          (right.length / n) * gini(rc0, right.length - rc0);
        if (gain > bestGain) {
          bestGain = gain;
          bestF = f;
          bestT = thr;
          bestL = left;
          bestR = right;
        }
      }
    }
    if (bestGain <= 0) return { leaf: true, label: c0 >= c1 ? 0 : 1 };
    return {
      leaf: false,
      feature: bestF,
      threshold: bestT,
      left: split(bestL, depth + 1),
      right: split(bestR, depth + 1),
    };
  }
  return split(points, 0);
}
function predictTree(tree, x, y) {
  if (tree.leaf) return tree.label;
  return (tree.feature === 0 ? x : y) <= tree.threshold
    ? predictTree(tree.left, x, y)
    : predictTree(tree.right, x, y);
}
function trainTree(train, params) {
  return { type: 'tree', tree: buildTree(train, params.maxDepth || 5) };
}

// KNN
function trainKNN(train, params) {
  return { type: 'knn', train, k: params.k || 5 };
}
function predictKNN(model, x, y) {
  const dists = model.train.map((p) => ({
    d: dist(p.x, p.y, x, y),
    label: p.label,
  }));
  dists.sort((a, b) => a.d - b.d);
  let votes = [0, 0];
  for (let i = 0; i < model.k; i++) votes[dists[i].label]++;
  return votes[0] >= votes[1] ? 0 : 1;
}

// SVM (linear via gradient descent)
function trainSVM(train, params) {
  let w1 = 0,
    w2 = 0,
    b = 0;
  const C = params.C || 1;
  for (let ep = 0; ep < 500; ep++) {
    const lr = 0.01;
    for (const p of train) {
      const l = p.label === 1 ? 1 : -1;
      const score = w1 * p.x + w2 * p.y + b;
      if (l * score < 1) {
        w1 += lr * (l * p.x - (1 / C) * w1);
        w2 += lr * (l * p.y - (1 / C) * w2);
        b += lr * l;
      } else {
        w1 -= lr * (1 / C) * w1;
        w2 -= lr * (1 / C) * w2;
      }
    }
  }
  return { type: 'svm', w1, w2, b };
}

function predict(model, x, y) {
  switch (model.type) {
    case 'linear':
      return sigmoid(model.w1 * x + model.w2 * y + model.b) >= 0.5 ? 1 : 0;
    case 'tree':
      return predictTree(model.tree, x, y);
    case 'knn':
      return predictKNN(model, x, y);
    case 'svm':
      return model.w1 * x + model.w2 * y + model.b >= 0 ? 1 : 0;
  }
  return 0;
}

let state = {
  dataset: 'circles',
  noise: 0.15,
  splitRatio: 0.2,
  modelType: 'linear',
  params: { maxDepth: 5, k: 5, C: 1 },
  train: [],
  test: [],
  model: null,
};

let ctx;

function generateAndSplit() {
  const all = generateDataset(state.dataset, 200, state.noise, 42);
  const { train, test } = trainTestSplit(all, state.splitRatio, 42);
  state.train = train;
  state.test = test;
}

function trainModel() {
  switch (state.modelType) {
    case 'linear':
      state.model = trainLinear(state.train);
      break;
    case 'tree':
      state.model = trainTree(state.train, state.params);
      break;
    case 'knn':
      state.model = trainKNN(state.train, state.params);
      break;
    case 'svm':
      state.model = trainSVM(state.train, state.params);
      break;
  }
}

function computeAccuracies() {
  let trainCorrect = 0,
    testCorrect = 0;
  for (const p of state.train)
    if (predict(state.model, p.x, p.y) === p.label) trainCorrect++;
  for (const p of state.test)
    if (predict(state.model, p.x, p.y) === p.label) testCorrect++;
  return {
    trainAcc: trainCorrect / state.train.length,
    testAcc: testCorrect / state.test.length,
  };
}

function getDataRange() {
  const all = [...state.train, ...state.test];
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of all) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const padX = (maxX - minX) * 0.15 || 1;
  const padY = (maxY - minY) * 0.15 || 1;
  return {
    xRange: [minX - padX, maxX + padX],
    yRange: [minY - padY, maxY + padY],
  };
}

function render() {
  clearCanvas(ctx, CW, CH);

  const { xRange, yRange } = getDataRange();

  // Decision region
  if (state.model) {
    const w = CW - margin.left - margin.right;
    const h = CH - margin.top - margin.bottom;
    const res = 4;
    for (let px = 0; px < w; px += res) {
      for (let py = 0; py < h; py += res) {
        const dataX = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
        const dataY = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
        const label = predict(state.model, dataX, dataY);
        ctx.fillStyle =
          label === 0 ? 'rgba(124,77,255,0.12)' : 'rgba(255,110,64,0.12)';
        ctx.fillRect(margin.left + px, margin.top + py, res, res);
      }
    }
  }

  drawAxes(ctx, CW, CH, margin, {
    xLabel: 'x₁',
    yLabel: 'x₂',
    xRange,
    yRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  // Train points (filled)
  for (const p of state.train) {
    drawPoint(
      ctx,
      mapX(p.x, xRange, margin, CW),
      mapY(p.y, yRange, margin, CH),
      4,
      CLASS_COLORS[p.label],
    );
  }
  // Test points (ring + smaller fill)
  for (const p of state.test) {
    const px = mapX(p.x, xRange, margin, CW);
    const py = mapY(p.y, yRange, margin, CH);
    ctx.strokeStyle = CLASS_COLORS[p.label];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.stroke();
    drawPoint(ctx, px, py, 2.5, CLASS_COLORS[p.label]);
  }

  // Info
  const { trainAcc, testAcc } = computeAccuracies();
  const modelNames = {
    linear: 'Logistic Regression',
    tree: 'Decision Tree',
    knn: 'KNN',
    svm: 'SVM',
  };
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '700 14px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${modelNames[state.modelType]} — ${state.dataset}`, CW / 2, 16);

  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#4fc3f7';
  ctx.fillText(
    `Train Acc: ${fmt(trainAcc, 3)}`,
    margin.left + 4,
    margin.top + 16,
  );
  ctx.fillStyle = '#ef5350';
  ctx.fillText(
    `Test Acc:  ${fmt(testAcc, 3)}`,
    margin.left + 4,
    margin.top + 32,
  );

  // Legend
  ctx.font = '10px "Noto Sans KR"';
  ctx.fillStyle = '#aaa';
  ctx.fillText('● Train  ○ Test', CW - margin.right - 100, margin.top + 16);

  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('pg-code');
  if (!codeEl) return;
  const { trainAcc, testAcc } = computeAccuracies();
  const dataMap = {
    circles: `make_circles(n_samples=200, noise=${state.noise})`,
    moons: `make_moons(n_samples=200, noise=${state.noise})`,
    blobs: `make_blobs(n_samples=200, cluster_std=${state.noise + 0.5})`,
    xor: `# XOR custom dataset (noise=${state.noise})`,
  };
  const modelMap = {
    linear: `LogisticRegression()`,
    tree: `DecisionTreeClassifier(max_depth=${state.params.maxDepth})`,
    knn: `KNeighborsClassifier(n_neighbors=${state.params.k})`,
    svm: `SVC(C=${state.params.C}, kernel='linear')`,
  };
  codeEl.textContent = `from sklearn.datasets import ${state.dataset === 'circles' ? 'make_circles' : state.dataset === 'moons' ? 'make_moons' : 'make_blobs'}
from sklearn.model_selection import train_test_split

X, y = ${dataMap[state.dataset]}
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=${state.splitRatio}
)

model = ${modelMap[state.modelType]}
model.fit(X_train, y_train)
# Train: ${fmt(trainAcc, 3)} | Test: ${fmt(testAcc, 3)}`;
}

function updateHyperparamUI() {
  const row = document.getElementById('pg-hyperparam-row');
  row.innerHTML = '';

  if (state.modelType === 'tree') {
    const label = document.createElement('label');
    label.textContent = 'max_depth: ';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 1;
    slider.max = 15;
    slider.value = state.params.maxDepth;
    slider.className = 'slider';
    const span = document.createElement('span');
    span.textContent = state.params.maxDepth;
    slider.addEventListener('input', () => {
      state.params.maxDepth = parseInt(slider.value);
      span.textContent = state.params.maxDepth;
      trainModel();
      render();
    });
    label.appendChild(slider);
    label.appendChild(span);
    row.appendChild(label);
  } else if (state.modelType === 'knn') {
    const label = document.createElement('label');
    label.textContent = 'k: ';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 1;
    slider.max = 21;
    slider.step = 2;
    slider.value = state.params.k;
    slider.className = 'slider';
    const span = document.createElement('span');
    span.textContent = state.params.k;
    slider.addEventListener('input', () => {
      state.params.k = parseInt(slider.value);
      span.textContent = state.params.k;
      trainModel();
      render();
    });
    label.appendChild(slider);
    label.appendChild(span);
    row.appendChild(label);
  } else if (state.modelType === 'svm') {
    const label = document.createElement('label');
    label.textContent = 'C: ';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = -2;
    slider.max = 3;
    slider.step = 0.5;
    slider.value = Math.log10(state.params.C);
    slider.className = 'slider';
    const span = document.createElement('span');
    span.textContent = fmt(state.params.C, 2);
    slider.addEventListener('input', () => {
      state.params.C = Math.pow(10, parseFloat(slider.value));
      span.textContent = fmt(state.params.C, 2);
      trainModel();
      render();
    });
    label.appendChild(slider);
    label.appendChild(span);
    row.appendChild(label);
  }
}

export function initPlayground() {
  const container = document.getElementById('playground-container');
  if (!container) return;
  container.innerHTML = '';

  generateAndSplit();
  trainModel();

  const { ctx: c } = createCanvas(container, CW, CH);
  ctx = c;

  // Dataset select
  document.getElementById('pg-dataset').addEventListener('change', (e) => {
    state.dataset = e.target.value;
    generateAndSplit();
    trainModel();
    render();
  });

  // Noise slider
  const noiseSlider = document.getElementById('pg-noise-slider');
  const noiseVal = document.getElementById('pg-noise-val');
  noiseSlider.addEventListener('input', () => {
    state.noise = parseFloat(noiseSlider.value);
    noiseVal.textContent = fmt(state.noise, 2);
    generateAndSplit();
    trainModel();
    render();
  });

  // Split slider
  const splitSlider = document.getElementById('pg-split-slider');
  const splitVal = document.getElementById('pg-split-val');
  splitSlider.addEventListener('input', () => {
    state.splitRatio = parseFloat(splitSlider.value);
    splitVal.textContent = fmt(state.splitRatio, 2);
    generateAndSplit();
    trainModel();
    render();
  });

  // Model tabs
  document.querySelectorAll('#pg-model-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#pg-model-tabs .tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.modelType = btn.dataset.model;
      updateHyperparamUI();
      trainModel();
      render();
      if (window.__mlProgress) window.__mlProgress.save('section-playground');
    });
  });

  updateHyperparamUI();
  render();
}
