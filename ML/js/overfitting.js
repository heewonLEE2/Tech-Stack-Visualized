// ===== Overfitting & Regularization Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  fmt,
  linspace,
  computeMSE,
} from './utils.js';

const CW = 520,
  CH = 380;
const margin = { top: 30, right: 20, bottom: 40, left: 50 };
const xRange = [-3, 3],
  yRange = [-4, 6];

// Generate noisy sinusoidal data
function generateData(seed) {
  const pts = [];
  const n = 25;
  for (let i = 0; i < n; i++) {
    const x = xRange[0] + ((xRange[1] - xRange[0]) * i) / (n - 1);
    const noise = Math.sin(seed + i * 7.3) * 0.8;
    const y = Math.sin(x * 1.2) * 2 + 0.3 * x + noise;
    pts.push({ x, y });
  }
  return pts;
}

// Split data 70/30
function splitData(pts) {
  const train = [],
    test = [];
  pts.forEach((p, i) => (i % 3 === 0 ? test : train).push(p));
  return { train, test };
}

// Polynomial fitting with optional L1/L2 regularization (via normal equation + penalty)
function fitPolynomial(train, degree, reg, lambda) {
  const n = train.length;
  const d = degree + 1;

  // Build Vandermonde matrix
  const X = train.map((p) => {
    const row = [];
    for (let j = 0; j < d; j++) row.push(Math.pow(p.x, j));
    return row;
  });
  const y = train.map((p) => p.y);

  // X^T X
  const XtX = Array.from({ length: d }, () => Array(d).fill(0));
  const Xty = Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      Xty[j] += X[i][j] * y[i];
      for (let k = 0; k < d; k++) {
        XtX[j][k] += X[i][j] * X[i][k];
      }
    }
  }

  // Add regularization to diagonal (L2 / Ridge approx for L1 too)
  if (reg !== 'none' && lambda > 0) {
    for (let j = 1; j < d; j++) {
      XtX[j][j] += lambda;
    }
  }

  // Solve via Gaussian elimination
  const A = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < d; col++) {
    let maxRow = col;
    for (let row = col + 1; row < d; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    }
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    if (Math.abs(A[col][col]) < 1e-12) continue;
    for (let row = 0; row < d; row++) {
      if (row === col) continue;
      const factor = A[row][col] / A[col][col];
      for (let k = col; k <= d; k++) A[row][k] -= factor * A[col][k];
    }
  }
  const weights = A.map(
    (row, i) => row[d] / (Math.abs(row[i]) > 1e-12 ? row[i] : 1),
  );

  // L1 post-processing: soft threshold
  if (reg === 'l1' && lambda > 0) {
    for (let j = 1; j < weights.length; j++) {
      if (weights[j] > lambda) weights[j] -= lambda;
      else if (weights[j] < -lambda) weights[j] += lambda;
      else weights[j] = 0;
    }
  }

  return weights;
}

function evalPoly(weights, x) {
  let y = 0;
  for (let j = 0; j < weights.length; j++) y += weights[j] * Math.pow(x, j);
  return y;
}

function polyMSE(weights, pts) {
  let sum = 0;
  for (const p of pts) sum += (evalPoly(weights, p.x) - p.y) ** 2;
  return sum / pts.length;
}

let state = {
  degree: 3,
  reg: 'none',
  lambda: 0,
  allPts: [],
  train: [],
  test: [],
  weights: [],
};

let ctxFit, ctxCurve;

function recompute() {
  state.weights = fitPolynomial(
    state.train,
    state.degree,
    state.reg,
    state.lambda,
  );
}

function renderFit() {
  clearCanvas(ctxFit, CW, CH);
  drawAxes(ctxFit, CW, CH, margin, {
    xLabel: 'x',
    yLabel: 'y',
    xRange,
    yRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  // Polynomial curve
  ctxFit.strokeStyle = '#ffb74d';
  ctxFit.lineWidth = 2.5;
  ctxFit.beginPath();
  const steps = 300;
  for (let i = 0; i <= steps; i++) {
    const x = xRange[0] + ((xRange[1] - xRange[0]) * i) / steps;
    let y = evalPoly(state.weights, x);
    y = Math.max(yRange[0] - 1, Math.min(yRange[1] + 1, y));
    const px = mapX(x, xRange, margin, CW);
    const py = mapY(y, yRange, margin, CH);
    if (i === 0) ctxFit.moveTo(px, py);
    else ctxFit.lineTo(px, py);
  }
  ctxFit.stroke();

  // Train points
  for (const p of state.train) {
    drawPoint(
      ctxFit,
      mapX(p.x, xRange, margin, CW),
      mapY(p.y, yRange, margin, CH),
      5,
      '#4fc3f7',
    );
  }
  // Test points
  for (const p of state.test) {
    drawPoint(
      ctxFit,
      mapX(p.x, xRange, margin, CW),
      mapY(p.y, yRange, margin, CH),
      5,
      '#ef5350',
    );
    ctxFit.strokeStyle = '#ef5350';
    ctxFit.lineWidth = 1;
    ctxFit.beginPath();
    ctxFit.arc(
      mapX(p.x, xRange, margin, CW),
      mapY(p.y, yRange, margin, CH),
      7,
      0,
      Math.PI * 2,
    );
    ctxFit.stroke();
  }

  // MSE info
  const trainMSE = polyMSE(state.weights, state.train);
  const testMSE = polyMSE(state.weights, state.test);
  ctxFit.font = '12px "Courier New", monospace';
  ctxFit.textAlign = 'left';
  ctxFit.fillStyle = '#4fc3f7';
  ctxFit.fillText(
    `Train MSE: ${fmt(trainMSE, 4)}`,
    margin.left + 4,
    margin.top + 16,
  );
  ctxFit.fillStyle = '#ef5350';
  ctxFit.fillText(
    `Test MSE:  ${fmt(testMSE, 4)}`,
    margin.left + 4,
    margin.top + 32,
  );

  // Legend
  const lx = CW - margin.right - 110,
    ly = margin.top + 12;
  drawPoint(ctxFit, lx, ly, 4, '#4fc3f7');
  ctxFit.fillStyle = '#e0e0e0';
  ctxFit.font = '11px "Noto Sans KR", sans-serif';
  ctxFit.fillText('학습 데이터', lx + 10, ly + 4);
  drawPoint(ctxFit, lx, ly + 18, 4, '#ef5350');
  ctxFit.fillText('테스트 데이터', lx + 10, ly + 22);

  // Title
  ctxFit.fillStyle = '#e0e0e0';
  ctxFit.font = '700 13px "Noto Sans KR", sans-serif';
  ctxFit.textAlign = 'center';
  const regStr =
    state.reg === 'none'
      ? ''
      : ` + ${state.reg.toUpperCase()} (λ=${fmt(state.lambda, 2)})`;
  ctxFit.fillText(`다항 회귀 (degree=${state.degree})${regStr}`, CW / 2, 16);
}

const LCW = 360,
  LCH = 260;
const lcMargin = { top: 30, right: 15, bottom: 35, left: 50 };

function renderLearningCurve() {
  clearCanvas(ctxCurve, LCW, LCH);

  // Compute train/test MSE for degrees 1..15
  const trainMSEs = [],
    testMSEs = [];
  for (let d = 1; d <= 15; d++) {
    const w = fitPolynomial(state.train, d, state.reg, state.lambda);
    trainMSEs.push(polyMSE(w, state.train));
    testMSEs.push(polyMSE(w, state.test));
  }

  const maxMSE = Math.min(
    Math.max(...testMSEs.filter((v) => isFinite(v) && v < 100), 5),
    20,
  );
  const dRange = [1, 15],
    mseRange = [0, maxMSE];

  drawAxes(ctxCurve, LCW, LCH, lcMargin, {
    xLabel: 'Degree',
    yLabel: 'MSE',
    xRange: dRange,
    yRange: mseRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  // Train MSE line
  ctxCurve.strokeStyle = '#4fc3f7';
  ctxCurve.lineWidth = 2;
  ctxCurve.beginPath();
  for (let d = 1; d <= 15; d++) {
    const px = mapX(d, dRange, lcMargin, LCW);
    const val = Math.min(trainMSEs[d - 1], maxMSE);
    const py = mapY(val, mseRange, lcMargin, LCH);
    if (d === 1) ctxCurve.moveTo(px, py);
    else ctxCurve.lineTo(px, py);
  }
  ctxCurve.stroke();

  // Test MSE line
  ctxCurve.strokeStyle = '#ef5350';
  ctxCurve.lineWidth = 2;
  ctxCurve.beginPath();
  for (let d = 1; d <= 15; d++) {
    const px = mapX(d, dRange, lcMargin, LCW);
    const val = Math.min(testMSEs[d - 1], maxMSE);
    const py = mapY(val, mseRange, lcMargin, LCH);
    if (d === 1) ctxCurve.moveTo(px, py);
    else ctxCurve.lineTo(px, py);
  }
  ctxCurve.stroke();

  // Highlight current degree
  const curDeg = state.degree;
  const px = mapX(curDeg, dRange, lcMargin, LCW);
  ctxCurve.strokeStyle = '#ffb74d';
  ctxCurve.lineWidth = 1.5;
  ctxCurve.setLineDash([3, 3]);
  ctxCurve.beginPath();
  ctxCurve.moveTo(px, lcMargin.top);
  ctxCurve.lineTo(px, LCH - lcMargin.bottom);
  ctxCurve.stroke();
  ctxCurve.setLineDash([]);

  // Under/overfit labels
  ctxCurve.font = '11px "Noto Sans KR", sans-serif';
  ctxCurve.textAlign = 'center';
  ctxCurve.fillStyle = '#81c784';
  ctxCurve.fillText('← 과소적합', mapX(3, dRange, lcMargin, LCW), LCH - 6);
  ctxCurve.fillStyle = '#ef5350';
  ctxCurve.fillText('과적합 →', mapX(12, dRange, lcMargin, LCW), LCH - 6);

  // Legend
  ctxCurve.font = '11px "Noto Sans KR", sans-serif';
  ctxCurve.textAlign = 'left';
  ctxCurve.fillStyle = '#4fc3f7';
  ctxCurve.fillText('── Train MSE', lcMargin.left + 10, 18);
  ctxCurve.fillStyle = '#ef5350';
  ctxCurve.fillText('── Test MSE', lcMargin.left + 120, 18);

  ctxCurve.fillStyle = '#e0e0e0';
  ctxCurve.font = '700 12px "Noto Sans KR", sans-serif';
  ctxCurve.textAlign = 'center';
  ctxCurve.fillText('학습 곡선 (Degree별 MSE)', LCW / 2, 14);
}

function render() {
  renderFit();
  renderLearningCurve();
  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('of-code');
  if (!codeEl) return;
  const modelStr =
    state.reg === 'l2'
      ? `Ridge(alpha=${fmt(state.lambda, 2)})`
      : state.reg === 'l1'
        ? `Lasso(alpha=${fmt(state.lambda, 2)})`
        : `LinearRegression()`;
  const importStr =
    state.reg === 'l2'
      ? 'from sklearn.linear_model import Ridge'
      : state.reg === 'l1'
        ? 'from sklearn.linear_model import Lasso'
        : 'from sklearn.linear_model import LinearRegression';
  const trainMSE = polyMSE(state.weights, state.train);
  const testMSE = polyMSE(state.weights, state.test);
  codeEl.textContent = `from sklearn.preprocessing import PolynomialFeatures
${importStr}

poly = PolynomialFeatures(degree=${state.degree})
X_poly = poly.fit_transform(X)

model = ${modelStr}
model.fit(X_poly, y)

# Train MSE: ${fmt(trainMSE, 4)}
# Test MSE:  ${fmt(testMSE, 4)}`;
}

export function initOverfitting() {
  const container = document.getElementById('overfitting-container');
  if (!container) return;
  container.innerHTML = '';

  state.allPts = generateData(42);
  const { train, test } = splitData(state.allPts);
  state.train = train;
  state.test = test;
  state.degree = 3;
  state.reg = 'none';
  state.lambda = 0;

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;';
  container.appendChild(wrap);

  const fitDiv = document.createElement('div');
  wrap.appendChild(fitDiv);
  const curveDiv = document.createElement('div');
  wrap.appendChild(curveDiv);

  const { ctx: c1 } = createCanvas(fitDiv, CW, CH);
  ctxFit = c1;
  const { ctx: c2 } = createCanvas(curveDiv, LCW, LCH);
  ctxCurve = c2;

  // Degree slider
  const degSlider = document.getElementById('of-degree-slider');
  const degVal = document.getElementById('of-degree-val');
  degSlider.addEventListener('input', () => {
    state.degree = parseInt(degSlider.value);
    degVal.textContent = state.degree;
    recompute();
    render();
    if (state.degree >= 10 && window.__mlProgress)
      window.__mlProgress.save('section-overfitting');
  });

  // Lambda slider
  const lamSlider = document.getElementById('of-lambda-slider');
  const lamVal = document.getElementById('of-lambda-val');
  lamSlider.addEventListener('input', () => {
    state.lambda = parseFloat(lamSlider.value);
    lamVal.textContent = fmt(state.lambda, 2);
    recompute();
    render();
  });

  // Reg tabs
  document.querySelectorAll('#of-reg-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#of-reg-tabs .tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.reg = btn.dataset.reg;
      recompute();
      render();
    });
  });

  recompute();
  render();
}
