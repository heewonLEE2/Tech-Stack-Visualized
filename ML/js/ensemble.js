// ===== Ensemble Methods Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  fmt,
  generateDataset,
  CLASS_COLORS,
  mulberry32,
} from './utils.js';

const CW = 520,
  CH = 400;
const margin = { top: 30, right: 20, bottom: 40, left: 50 };
const xRange = [-2.5, 2.5],
  yRange = [-2.5, 2.5];

// ---- Simple stump / shallow tree ----
function buildStump(points, weights, depth = 1) {
  function bestSplit(pts, w, depth) {
    if (depth <= 0 || pts.length <= 2) {
      let s0 = 0,
        s1 = 0;
      pts.forEach((p, i) => {
        if (p.label === 0) s0 += w[i];
        else s1 += w[i];
      });
      return { leaf: true, label: s0 >= s1 ? 0 : 1 };
    }
    let bestGain = -1,
      bestF = 0,
      bestT = 0,
      bestL = [],
      bestR = [],
      bestLW = [],
      bestRW = [];
    const total = w.reduce((a, b) => a + b, 0);
    for (const f of [0, 1]) {
      const vals = pts
        .map((p, i) => ({ v: f === 0 ? p.x : p.y, i }))
        .sort((a, b) => a.v - b.v);
      for (let k = 0; k < vals.length - 1; k++) {
        const thr = (vals[k].v + vals[k + 1].v) / 2;
        const lIdx = [],
          rIdx = [];
        pts.forEach((p, i) =>
          ((f === 0 ? p.x : p.y) <= thr ? lIdx : rIdx).push(i),
        );
        if (lIdx.length === 0 || rIdx.length === 0) continue;
        const lW = lIdx.reduce((s, i) => s + w[i], 0);
        const rW = rIdx.reduce((s, i) => s + w[i], 0);
        // weighted gini
        const gini = (idxs, wt) => {
          let c0 = 0,
            c1 = 0;
          idxs.forEach((i) => {
            if (pts[i].label === 0) c0 += w[i];
            else c1 += w[i];
          });
          if (wt === 0) return 0;
          return 1 - (c0 / wt) ** 2 - (c1 / wt) ** 2;
        };
        const gain =
          1 - (lW / total) * gini(lIdx, lW) - (rW / total) * gini(rIdx, rW);
        if (gain > bestGain) {
          bestGain = gain;
          bestF = f;
          bestT = thr;
          bestL = lIdx.map((i) => pts[i]);
          bestR = rIdx.map((i) => pts[i]);
          bestLW = lIdx.map((i) => w[i]);
          bestRW = rIdx.map((i) => w[i]);
        }
      }
    }
    if (bestGain <= 0) {
      let s0 = 0,
        s1 = 0;
      pts.forEach((p, i) => {
        if (p.label === 0) s0 += w[i];
        else s1 += w[i];
      });
      return { leaf: true, label: s0 >= s1 ? 0 : 1 };
    }
    return {
      leaf: false,
      feature: bestF,
      threshold: bestT,
      left: bestSplit(bestL, bestLW, depth - 1),
      right: bestSplit(bestR, bestRW, depth - 1),
    };
  }
  const w = weights || points.map(() => 1 / points.length);
  return bestSplit(points, w, depth);
}

function predictStump(tree, x, y) {
  if (tree.leaf) return tree.label;
  const val = tree.feature === 0 ? x : y;
  return val <= tree.threshold
    ? predictStump(tree.left, x, y)
    : predictStump(tree.right, x, y);
}

// ---- Bagging ----
function buildBagging(points, nModels, seed) {
  const rng = mulberry32(seed);
  const models = [];
  for (let m = 0; m < nModels; m++) {
    const sample = [];
    for (let i = 0; i < points.length; i++) {
      sample.push(points[Math.floor(rng() * points.length)]);
    }
    models.push(buildStump(sample, null, 3));
  }
  return models;
}

function predictBagging(models, x, y, upTo) {
  let votes = [0, 0];
  const n = upTo || models.length;
  for (let i = 0; i < n; i++) {
    votes[predictStump(models[i], x, y)]++;
  }
  return votes[0] >= votes[1] ? 0 : 1;
}

// ---- Boosting (AdaBoost) ----
function buildBoosting(points, nModels) {
  const n = points.length;
  let weights = points.map(() => 1 / n);
  const stumps = [];
  const alphas = [];

  for (let m = 0; m < nModels; m++) {
    const stump = buildStump(points, weights, 1);
    let err = 0;
    for (let i = 0; i < n; i++) {
      if (predictStump(stump, points[i].x, points[i].y) !== points[i].label) {
        err += weights[i];
      }
    }
    err = Math.max(err, 1e-10);
    const alpha = 0.5 * Math.log((1 - err) / err);
    alphas.push(alpha);
    stumps.push(stump);

    // Update weights
    let totalW = 0;
    for (let i = 0; i < n; i++) {
      const pred = predictStump(stump, points[i].x, points[i].y);
      weights[i] *= Math.exp(pred !== points[i].label ? alpha : -alpha);
      totalW += weights[i];
    }
    weights = weights.map((w) => w / totalW);
  }
  return { stumps, alphas };
}

function predictBoosting({ stumps, alphas }, x, y, upTo) {
  let score = 0;
  const n = upTo || stumps.length;
  for (let i = 0; i < n; i++) {
    const pred = predictStump(stumps[i], x, y);
    score += alphas[i] * (pred === 1 ? 1 : -1);
  }
  return score >= 0 ? 1 : 0;
}

let state = {
  method: 'bagging',
  nModels: 5,
  speed: 1,
  points: [],
  baggingModels: [],
  boostingModel: null,
  currentStep: 0,
  isPlaying: false,
  timer: null,
  isCompare: false,
};

let ctx;

function recompute() {
  state.baggingModels = buildBagging(state.points, state.nModels, 42);
  state.boostingModel = buildBoosting(state.points, state.nModels);
  state.currentStep = state.nModels;
}

function render() {
  clearCanvas(ctx, CW, CH);
  const models = state.currentStep;

  // Decision region
  const w = CW - margin.left - margin.right;
  const h = CH - margin.top - margin.bottom;
  const res = 5;
  for (let px = 0; px < w; px += res) {
    for (let py = 0; py < h; py += res) {
      const dataX = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
      const dataY = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
      const label =
        state.method === 'bagging'
          ? predictBagging(state.baggingModels, dataX, dataY, models)
          : predictBoosting(state.boostingModel, dataX, dataY, models);
      ctx.fillStyle =
        label === 0 ? 'rgba(124,77,255,0.15)' : 'rgba(255,110,64,0.15)';
      ctx.fillRect(margin.left + px, margin.top + py, res, res);
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

  // Points
  for (const p of state.points) {
    drawPoint(
      ctx,
      mapX(p.x, xRange, margin, CW),
      mapY(p.y, yRange, margin, CH),
      4,
      CLASS_COLORS[p.label],
    );
  }

  // Accuracy
  let correct = 0;
  for (const p of state.points) {
    const pred =
      state.method === 'bagging'
        ? predictBagging(state.baggingModels, p.x, p.y, models)
        : predictBoosting(state.boostingModel, p.x, p.y, models);
    if (pred === p.label) correct++;
  }
  const acc = correct / state.points.length;

  ctx.fillStyle = '#e0e0e0';
  ctx.font = '700 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  const methodName =
    state.method === 'bagging'
      ? 'Bagging (Random Forest)'
      : 'Boosting (AdaBoost)';
  ctx.fillText(
    `${methodName} — 모델 ${models}/${state.nModels}개, Acc=${fmt(acc, 3)}`,
    CW / 2,
    16,
  );

  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('ens-code');
  if (!codeEl) return;
  if (state.method === 'bagging') {
    codeEl.textContent = `from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(
    n_estimators=${state.nModels}, max_depth=3
)
rf.fit(X_train, y_train)
accuracy = rf.score(X_test, y_test)
# 현재 모델 수: ${state.currentStep}/${state.nModels}`;
  } else {
    codeEl.textContent = `from sklearn.ensemble import AdaBoostClassifier

ada = AdaBoostClassifier(
    n_estimators=${state.nModels}, learning_rate=1.0
)
ada.fit(X_train, y_train)
accuracy = ada.score(X_test, y_test)
# 현재 모델 수: ${state.currentStep}/${state.nModels}`;
  }
}

function startPlay() {
  if (state.isPlaying) return;
  state.isPlaying = true;
  state.currentStep = 0;
  document.getElementById('ens-play').disabled = true;
  document.getElementById('ens-pause').disabled = false;

  function tick() {
    if (!state.isPlaying) return;
    state.currentStep++;
    render();
    if (state.currentStep >= state.nModels) {
      stopPlay();
      if (window.__mlProgress) window.__mlProgress.save('section-ensemble');
      return;
    }
    state.timer = setTimeout(tick, 800 / state.speed);
  }
  tick();
}

function stopPlay() {
  state.isPlaying = false;
  if (state.timer) clearTimeout(state.timer);
  document.getElementById('ens-play').disabled = false;
  document.getElementById('ens-pause').disabled = true;
}

function renderCompare(cc) {
  cc.innerHTML = '';

  ['single', 'ensemble'].forEach((mode, idx) => {
    const panel = document.createElement('div');
    panel.className = `compare-panel compare-panel-${idx === 0 ? 'a' : 'b'}`;
    const title = document.createElement('div');
    title.className = 'compare-panel-title';
    title.textContent =
      mode === 'single' ? '단일 트리 (depth=3)' : `앙상블 (${state.nModels}개)`;
    panel.appendChild(title);
    cc.appendChild(panel);

    const { ctx: pCtx, width: pW, height: pH } = createCanvas(panel, 420, 340);
    const m = { top: 25, right: 15, bottom: 35, left: 45 };
    clearCanvas(pCtx, pW, pH);

    const w = pW - m.left - m.right;
    const h = pH - m.top - m.bottom;
    const res = 5;

    const singleTree = buildStump(state.points, null, 3);

    for (let px = 0; px < w; px += res) {
      for (let py = 0; py < h; py += res) {
        const dataX = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
        const dataY = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
        const label =
          mode === 'single'
            ? predictStump(singleTree, dataX, dataY)
            : predictBagging(state.baggingModels, dataX, dataY);
        pCtx.fillStyle =
          label === 0 ? 'rgba(124,77,255,0.15)' : 'rgba(255,110,64,0.15)';
        pCtx.fillRect(m.left + px, m.top + py, res, res);
      }
    }

    drawAxes(pCtx, pW, pH, m, {
      xRange,
      yRange,
      color: '#e0e0e0',
      gridLines: false,
    });

    for (const p of state.points) {
      drawPoint(
        pCtx,
        mapX(p.x, xRange, m, pW),
        mapY(p.y, yRange, m, pH),
        3.5,
        CLASS_COLORS[p.label],
      );
    }

    let correct = 0;
    for (const p of state.points) {
      const pred =
        mode === 'single'
          ? predictStump(singleTree, p.x, p.y)
          : predictBagging(state.baggingModels, p.x, p.y);
      if (pred === p.label) correct++;
    }
    pCtx.fillStyle = idx === 0 ? '#4fc3f7' : '#81c784';
    pCtx.font = '700 12px "Noto Sans KR", sans-serif';
    pCtx.textAlign = 'left';
    pCtx.fillText(
      `Accuracy: ${fmt(correct / state.points.length, 3)}`,
      m.left + 4,
      m.top - 4,
    );
  });
}

export function initEnsemble() {
  const container = document.getElementById('ensemble-container');
  if (!container) return;
  container.innerHTML = '';

  state.points = generateDataset('moons', 100, 0.25, 42);
  state.nModels = 5;
  state.method = 'bagging';
  state.currentStep = 5;

  const { ctx: c } = createCanvas(container, CW, CH);
  ctx = c;

  recompute();

  // Method tabs
  document.querySelectorAll('#ens-method-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#ens-method-tabs .tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.method = btn.dataset.method;
      stopPlay();
      state.currentStep = state.nModels;
      render();
    });
  });

  // N slider
  const nSlider = document.getElementById('ens-n-slider');
  const nVal = document.getElementById('ens-n-val');
  nSlider.addEventListener('input', () => {
    state.nModels = parseInt(nSlider.value);
    nVal.textContent = state.nModels;
    recompute();
    render();
  });

  // Speed slider
  const speedSlider = document.getElementById('ens-speed-slider');
  const speedVal = document.getElementById('ens-speed-val');
  speedSlider.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedVal.textContent = state.speed + 'x';
  });

  // Buttons
  document.getElementById('ens-play').addEventListener('click', startPlay);
  document.getElementById('ens-pause').addEventListener('click', stopPlay);
  document.getElementById('ens-step').addEventListener('click', () => {
    if (state.currentStep < state.nModels) {
      state.currentStep++;
      render();
    }
  });
  document.getElementById('ens-reset').addEventListener('click', () => {
    stopPlay();
    state.currentStep = state.nModels;
    recompute();
    render();
  });

  // Compare mode
  const compareBtn = document.getElementById('ens-compare-btn');
  compareBtn.addEventListener('click', () => {
    state.isCompare = !state.isCompare;
    compareBtn.classList.toggle('active', state.isCompare);
    const cc = document.getElementById('ens-compare-container');
    if (state.isCompare) {
      cc.style.display = 'grid';
      renderCompare(cc);
    } else {
      cc.style.display = 'none';
    }
  });

  render();
}
