// ===== Classification Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  fmt,
  sigmoid,
  CLASS_COLORS,
} from './utils.js';

const CW = 520,
  CH = 380;
const margin = { top: 30, right: 20, bottom: 40, left: 50 };

// 2-class linearly separable dataset
function generateData() {
  const points = [];
  const rng = () => (Math.sin(points.length * 9301 + 49297) % 37) / 37;
  for (let i = 0; i < 30; i++) {
    const x = -2 + (4 * ((i * 17 + 3) % 30)) / 30 + (rng() - 0.5) * 0.6;
    const y = i < 15 ? -0.8 + rng() * 1.5 : 0.8 + rng() * 1.5;
    const label = i < 15 ? 0 : 1;
    points.push({ x, y, label });
  }
  return points;
}

// Logistic regression: fit using gradient descent
function fitLogistic(points) {
  let w1 = 0,
    w2 = 0,
    b = 0;
  const lr = 0.5;
  for (let epoch = 0; epoch < 200; epoch++) {
    let dw1 = 0,
      dw2 = 0,
      db = 0;
    for (const p of points) {
      const z = w1 * p.x + w2 * p.y + b;
      const pred = sigmoid(z);
      const err = pred - p.label;
      dw1 += err * p.x;
      dw2 += err * p.y;
      db += err;
    }
    w1 -= (lr * dw1) / points.length;
    w2 -= (lr * dw2) / points.length;
    b -= (lr * db) / points.length;
  }
  return { w1, w2, b };
}

let state = {
  threshold: 0.5,
  points: [],
  model: { w1: 0, w2: 0, b: 0 },
};

let ctxBoundary, ctxSigmoid, ctxMatrix;
const xRange = [-3, 3],
  yRange = [-2, 4];

function computeMetrics() {
  const { w1, w2, b } = state.model;
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (const p of state.points) {
    const prob = sigmoid(w1 * p.x + w2 * p.y + b);
    const pred = prob >= state.threshold ? 1 : 0;
    if (pred === 1 && p.label === 1) tp++;
    else if (pred === 1 && p.label === 0) fp++;
    else if (pred === 0 && p.label === 0) tn++;
    else fn++;
  }
  const accuracy = (tp + tn) / (tp + fp + tn + fn) || 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
  return { tp, fp, tn, fn, accuracy, precision, recall, f1 };
}

function renderBoundary() {
  clearCanvas(ctxBoundary, CW, CH);

  // Decision region
  const w = CW - margin.left - margin.right;
  const h = CH - margin.top - margin.bottom;
  const res = 4;
  for (let px = 0; px < w; px += res) {
    for (let py = 0; py < h; py += res) {
      const dataX = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
      const dataY = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
      const prob = sigmoid(
        state.model.w1 * dataX + state.model.w2 * dataY + state.model.b,
      );
      const alpha = Math.abs(prob - 0.5) * 0.3;
      ctxBoundary.fillStyle =
        prob >= state.threshold
          ? `rgba(124, 77, 255, ${alpha})`
          : `rgba(255, 110, 64, ${alpha})`;
      ctxBoundary.fillRect(margin.left + px, margin.top + py, res, res);
    }
  }

  // Decision boundary line
  const { w1, w2, b } = state.model;
  if (Math.abs(w2) > 0.001) {
    ctxBoundary.strokeStyle = '#ffffff';
    ctxBoundary.lineWidth = 2;
    ctxBoundary.setLineDash([6, 4]);
    ctxBoundary.beginPath();
    const threshold_logit = -Math.log(1 / state.threshold - 1);
    const x1 = xRange[0];
    const x2 = xRange[1];
    const y1 = -(w1 * x1 + b - threshold_logit) / w2;
    const y2 = -(w1 * x2 + b - threshold_logit) / w2;
    ctxBoundary.moveTo(
      mapX(x1, xRange, margin, CW),
      mapY(y1, yRange, margin, CH),
    );
    ctxBoundary.lineTo(
      mapX(x2, xRange, margin, CW),
      mapY(y2, yRange, margin, CH),
    );
    ctxBoundary.stroke();
    ctxBoundary.setLineDash([]);
  }

  drawAxes(ctxBoundary, CW, CH, margin, {
    xLabel: 'x₁',
    yLabel: 'x₂',
    xRange,
    yRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  // Points
  for (const p of state.points) {
    const prob = sigmoid(w1 * p.x + w2 * p.y + b);
    const pred = prob >= state.threshold ? 1 : 0;
    const correct = pred === p.label;
    const px = mapX(p.x, xRange, margin, CW);
    const py = mapY(p.y, yRange, margin, CH);
    const color = CLASS_COLORS[p.label];

    // Cross mark for misclassified
    if (!correct) {
      ctxBoundary.strokeStyle = '#ef5350';
      ctxBoundary.lineWidth = 2;
      ctxBoundary.beginPath();
      ctxBoundary.arc(px, py, 10, 0, Math.PI * 2);
      ctxBoundary.stroke();
    }
    drawPoint(ctxBoundary, px, py, 5, color);
  }

  ctxBoundary.fillStyle = '#e0e0e0';
  ctxBoundary.font = '700 13px "Noto Sans KR", sans-serif';
  ctxBoundary.textAlign = 'center';
  ctxBoundary.fillText('결정 경계 (Decision Boundary)', CW / 2, 16);
}

const SW = 280,
  SH = 200;
const sigMargin = { top: 20, right: 15, bottom: 30, left: 35 };

function renderSigmoid() {
  clearCanvas(ctxSigmoid, SW, SH);
  const sxRange = [-6, 6],
    syRange = [0, 1.05];

  drawAxes(ctxSigmoid, SW, SH, sigMargin, {
    xLabel: 'z',
    yLabel: 'σ(z)',
    xRange: sxRange,
    yRange: syRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  // Sigmoid curve
  ctxSigmoid.strokeStyle = '#ffb74d';
  ctxSigmoid.lineWidth = 2.5;
  ctxSigmoid.beginPath();
  for (let i = 0; i <= 200; i++) {
    const z = sxRange[0] + (i / 200) * (sxRange[1] - sxRange[0]);
    const s = sigmoid(z);
    const px = mapX(z, sxRange, sigMargin, SW);
    const py = mapY(s, syRange, sigMargin, SH);
    if (i === 0) ctxSigmoid.moveTo(px, py);
    else ctxSigmoid.lineTo(px, py);
  }
  ctxSigmoid.stroke();

  // Threshold line
  ctxSigmoid.strokeStyle = '#ef5350';
  ctxSigmoid.lineWidth = 1;
  ctxSigmoid.setLineDash([4, 3]);
  const ty = mapY(state.threshold, syRange, sigMargin, SH);
  ctxSigmoid.beginPath();
  ctxSigmoid.moveTo(sigMargin.left, ty);
  ctxSigmoid.lineTo(SW - sigMargin.right, ty);
  ctxSigmoid.stroke();
  ctxSigmoid.setLineDash([]);

  ctxSigmoid.fillStyle = '#ef5350';
  ctxSigmoid.font = '11px "Noto Sans KR", sans-serif';
  ctxSigmoid.textAlign = 'right';
  ctxSigmoid.fillText(
    `threshold=${fmt(state.threshold, 2)}`,
    SW - sigMargin.right,
    ty - 4,
  );

  ctxSigmoid.fillStyle = '#e0e0e0';
  ctxSigmoid.font = '700 12px "Noto Sans KR", sans-serif';
  ctxSigmoid.textAlign = 'center';
  ctxSigmoid.fillText('Sigmoid 함수', SW / 2, 14);
}

const MW = 200,
  MH = 200;

function renderConfusionMatrix() {
  clearCanvas(ctxMatrix, MW, MH);
  const m = computeMetrics();
  const { tp, fp, tn, fn } = m;

  const ox = 50,
    oy = 30,
    cellW = 65,
    cellH = 55;

  ctxMatrix.fillStyle = '#e0e0e0';
  ctxMatrix.font = '700 11px "Noto Sans KR", sans-serif';
  ctxMatrix.textAlign = 'center';
  ctxMatrix.fillText('혼동 행렬', MW / 2, 14);

  // Labels
  ctxMatrix.font = '11px "Noto Sans KR", sans-serif';
  ctxMatrix.fillText('예측', ox + cellW, oy - 6);
  ctxMatrix.save();
  ctxMatrix.translate(ox - 14, oy + cellH);
  ctxMatrix.rotate(-Math.PI / 2);
  ctxMatrix.fillText('실제', 0, 0);
  ctxMatrix.restore();

  ctxMatrix.font = '10px "Noto Sans KR", sans-serif';
  ctxMatrix.fillStyle = '#bbb';
  ctxMatrix.fillText('0', ox + cellW / 2, oy + 10);
  ctxMatrix.fillText('1', ox + cellW + cellW / 2, oy + 10);
  ctxMatrix.fillText('0', ox - 6, oy + 14 + cellH / 2);
  ctxMatrix.fillText('1', ox - 6, oy + 14 + cellH + cellH / 2);

  // Cells: [TN, FP], [FN, TP]
  const cells = [
    [tn, fp],
    [fn, tp],
  ];
  const colors = [
    ['#388e3c', '#d32f2f'],
    ['#d32f2f', '#388e3c'],
  ];
  const labels = [
    ['TN', 'FP'],
    ['FN', 'TP'],
  ];

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const cx = ox + c * cellW;
      const cy = oy + 14 + r * cellH;
      ctxMatrix.fillStyle = colors[r][c] + '60';
      ctxMatrix.fillRect(cx, cy, cellW, cellH);
      ctxMatrix.strokeStyle = '#555';
      ctxMatrix.strokeRect(cx, cy, cellW, cellH);

      ctxMatrix.fillStyle = '#e0e0e0';
      ctxMatrix.font = '700 18px monospace';
      ctxMatrix.textAlign = 'center';
      ctxMatrix.fillText(cells[r][c], cx + cellW / 2, cy + cellH / 2 + 2);

      ctxMatrix.font = '9px "Noto Sans KR", sans-serif';
      ctxMatrix.fillStyle = '#aaa';
      ctxMatrix.fillText(labels[r][c], cx + cellW / 2, cy + cellH - 6);
    }
  }

  // Metrics below
  ctxMatrix.font = '11px "Courier New", monospace';
  ctxMatrix.fillStyle = '#81c784';
  ctxMatrix.textAlign = 'left';
  const my = oy + 14 + cellH * 2 + 16;
  ctxMatrix.fillText(
    `Acc:${fmt(m.accuracy, 2)} P:${fmt(m.precision, 2)}`,
    ox - 10,
    my,
  );
  ctxMatrix.fillText(
    `R:${fmt(m.recall, 2)} F1:${fmt(m.f1, 2)}`,
    ox - 10,
    my + 16,
  );
}

function render() {
  renderBoundary();
  renderSigmoid();
  renderConfusionMatrix();
  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('cls-code');
  if (!codeEl) return;
  const m = computeMetrics();
  codeEl.textContent = `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix

model = LogisticRegression()
model.fit(X_train, y_train)

# threshold = ${fmt(state.threshold, 2)}
y_prob = model.predict_proba(X_test)[:, 1]
y_pred = (y_prob >= ${fmt(state.threshold, 2)}).astype(int)

cm = confusion_matrix(y_test, y_pred)
# [[TN=${m.tn}, FP=${m.fp}],
#  [FN=${m.fn}, TP=${m.tp}]]
# Accuracy=${fmt(m.accuracy, 3)}, F1=${fmt(m.f1, 3)}`;
}

export function initClassification() {
  const container = document.getElementById('classification-container');
  if (!container) return;
  container.innerHTML = '';

  // Layout: boundary (left) + sidebar (sigmoid + confusion matrix)
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;';
  container.appendChild(wrap);

  const boundaryDiv = document.createElement('div');
  wrap.appendChild(boundaryDiv);

  const sideDiv = document.createElement('div');
  sideDiv.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
  wrap.appendChild(sideDiv);

  const sigmoidDiv = document.createElement('div');
  sideDiv.appendChild(sigmoidDiv);
  const matrixDiv = document.createElement('div');
  sideDiv.appendChild(matrixDiv);

  const { ctx: c1 } = createCanvas(boundaryDiv, CW, CH);
  ctxBoundary = c1;
  const { ctx: c2 } = createCanvas(sigmoidDiv, SW, SH);
  ctxSigmoid = c2;
  const { ctx: c3 } = createCanvas(matrixDiv, MW, MH);
  ctxMatrix = c3;

  state.points = generateData();
  state.model = fitLogistic(state.points);
  state.threshold = 0.5;

  // Threshold slider
  const slider = document.getElementById('cls-threshold-slider');
  const val = document.getElementById('cls-threshold-val');
  slider.addEventListener('input', () => {
    state.threshold = parseFloat(slider.value);
    val.textContent = fmt(state.threshold, 2);
    render();
  });

  render();
  if (window.__mlProgress) window.__mlProgress.save('section-classification');
}
