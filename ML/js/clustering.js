// ===== K-Means Clustering Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  fmt,
  dist,
  mulberry32,
  CLUSTER_COLORS,
} from './utils.js';

const CW = 520,
  CH = 420;
const margin = { top: 30, right: 20, bottom: 40, left: 50 };
const xRange = [-4, 4],
  yRange = [-4, 4];

// Generate blob clusters
function generateBlobs(nPerCluster, truK, seed) {
  const rng = mulberry32(seed);
  const centers = [];
  for (let i = 0; i < truK; i++) {
    centers.push({ x: (rng() - 0.5) * 5, y: (rng() - 0.5) * 5 });
  }
  const pts = [];
  for (let i = 0; i < truK; i++) {
    for (let j = 0; j < nPerCluster; j++) {
      // Box-Muller
      const u1 = rng(),
        u2 = rng();
      const z1 =
        Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
      const z2 =
        Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.sin(2 * Math.PI * u2);
      pts.push({ x: centers[i].x + z1 * 0.6, y: centers[i].y + z2 * 0.6 });
    }
  }
  return pts;
}

// K-Means++ initialization
function initKMPP(pts, k, rng) {
  const centroids = [];
  centroids.push({ ...pts[Math.floor(rng() * pts.length)] });
  while (centroids.length < k) {
    const dists = pts.map((p) => {
      let minD = Infinity;
      for (const c of centroids)
        minD = Math.min(minD, dist(p.x, p.y, c.x, c.y));
      return minD * minD;
    });
    const total = dists.reduce((a, b) => a + b, 0);
    let r = rng() * total,
      cumul = 0;
    for (let i = 0; i < pts.length; i++) {
      cumul += dists[i];
      if (cumul >= r) {
        centroids.push({ ...pts[i] });
        break;
      }
    }
  }
  return centroids;
}

// Random initialization
function initRandom(pts, k, rng) {
  const idxs = new Set();
  while (idxs.size < k) idxs.add(Math.floor(rng() * pts.length));
  return [...idxs].map((i) => ({ ...pts[i] }));
}

let state = {
  k: 3,
  initMethod: 'random',
  speed: 1,
  points: [],
  centroids: [],
  assignments: [],
  step: 0,
  phase: 'assign', // 'assign' or 'update'
  isPlaying: false,
  timer: null,
  converged: false,
  history: [], // for elbow chart
};

let ctxMain, ctxElbow;

function assign() {
  const prev = [...state.assignments];
  state.assignments = state.points.map((p) => {
    let minD = Infinity,
      best = 0;
    state.centroids.forEach((c, i) => {
      const d = dist(p.x, p.y, c.x, c.y);
      if (d < minD) {
        minD = d;
        best = i;
      }
    });
    return best;
  });
  // Check convergence
  state.converged =
    prev.length > 0 && prev.every((v, i) => v === state.assignments[i]);
}

function updateCentroids() {
  for (let c = 0; c < state.k; c++) {
    let sx = 0,
      sy = 0,
      cnt = 0;
    state.points.forEach((p, i) => {
      if (state.assignments[i] === c) {
        sx += p.x;
        sy += p.y;
        cnt++;
      }
    });
    if (cnt > 0) {
      state.centroids[c] = { x: sx / cnt, y: sy / cnt };
    } else {
      // Reinitialize empty cluster to a random data point
      const ri = Math.floor(Math.random() * state.points.length);
      state.centroids[c] = { ...state.points[ri] };
    }
  }
}

function computeInertia() {
  let inertia = 0;
  state.points.forEach((p, i) => {
    const c = state.centroids[state.assignments[i]];
    inertia += (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
  });
  return inertia;
}

function resetKMeans() {
  const rng = mulberry32(42 + state.k);
  state.centroids =
    state.initMethod === 'kmpp'
      ? initKMPP(state.points, state.k, rng)
      : initRandom(state.points, state.k, rng);
  state.assignments = state.points.map(() => 0);
  state.step = 0;
  state.phase = 'assign';
  state.converged = false;
  assign();
}

function renderMain() {
  clearCanvas(ctxMain, CW, CH);

  // Voronoi-like background: color each pixel by nearest centroid
  if (state.centroids.length > 0) {
    const w = CW - margin.left - margin.right;
    const h = CH - margin.top - margin.bottom;
    const res = 6;
    for (let px = 0; px < w; px += res) {
      for (let py = 0; py < h; py += res) {
        const dataX = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
        const dataY = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
        let minD = Infinity,
          best = 0;
        state.centroids.forEach((c, i) => {
          const d = dist(dataX, dataY, c.x, c.y);
          if (d < minD) {
            minD = d;
            best = i;
          }
        });
        const color = CLUSTER_COLORS[best % CLUSTER_COLORS.length];
        ctxMain.fillStyle = color + '18';
        ctxMain.fillRect(margin.left + px, margin.top + py, res, res);
      }
    }
  }

  drawAxes(ctxMain, CW, CH, margin, {
    xLabel: 'x₁',
    yLabel: 'x₂',
    xRange,
    yRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  // Points
  state.points.forEach((p, i) => {
    const clr = CLUSTER_COLORS[state.assignments[i] % CLUSTER_COLORS.length];
    drawPoint(
      ctxMain,
      mapX(p.x, xRange, margin, CW),
      mapY(p.y, yRange, margin, CH),
      4,
      clr,
    );
  });

  // Centroids
  state.centroids.forEach((c, i) => {
    const px = mapX(c.x, xRange, margin, CW);
    const py = mapY(c.y, yRange, margin, CH);
    ctxMain.strokeStyle = '#fff';
    ctxMain.lineWidth = 2.5;
    ctxMain.beginPath();
    // Draw ✕ marker
    const s = 8;
    ctxMain.moveTo(px - s, py - s);
    ctxMain.lineTo(px + s, py + s);
    ctxMain.moveTo(px + s, py - s);
    ctxMain.lineTo(px - s, py + s);
    ctxMain.stroke();
    ctxMain.fillStyle = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
    ctxMain.font = '700 11px monospace';
    ctxMain.textAlign = 'left';
    ctxMain.fillText(`C${i + 1}`, px + 10, py - 4);
  });

  // Info
  ctxMain.fillStyle = '#e0e0e0';
  ctxMain.font = '700 13px "Noto Sans KR", sans-serif';
  ctxMain.textAlign = 'center';
  const statusStr = state.converged
    ? '✓ 수렴!'
    : `Step ${state.step} (${state.phase === 'assign' ? '할당' : '업데이트'})`;
  ctxMain.fillText(`K-Means (k=${state.k}) — ${statusStr}`, CW / 2, 16);

  if (state.converged) {
    ctxMain.fillStyle = '#81c784';
    ctxMain.font = '12px monospace';
    ctxMain.fillText(`Inertia: ${fmt(computeInertia(), 2)}`, CW / 2, CH - 6);
  }
}

const EW = 380,
  EH = 240;
const eMargin = { top: 25, right: 15, bottom: 35, left: 50 };

function computeElbow() {
  const inertias = [];
  for (let k = 1; k <= 8; k++) {
    const rng = mulberry32(42 + k);
    const centroids = initRandom(state.points, k, rng);
    let assignments = state.points.map(() => 0);
    for (let iter = 0; iter < 20; iter++) {
      // Assign
      assignments = state.points.map((p) => {
        let minD = Infinity,
          best = 0;
        centroids.forEach((c, i) => {
          const d = dist(p.x, p.y, c.x, c.y);
          if (d < minD) {
            minD = d;
            best = i;
          }
        });
        return best;
      });
      // Update
      for (let c = 0; c < k; c++) {
        let sx = 0,
          sy = 0,
          cnt = 0;
        state.points.forEach((p, i) => {
          if (assignments[i] === c) {
            sx += p.x;
            sy += p.y;
            cnt++;
          }
        });
        if (cnt > 0) centroids[c] = { x: sx / cnt, y: sy / cnt };
      }
    }
    let inertia = 0;
    state.points.forEach((p, i) => {
      const c = centroids[assignments[i]];
      inertia += (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
    });
    inertias.push(inertia);
  }
  return inertias;
}

function renderElbow() {
  clearCanvas(ctxElbow, EW, EH);
  const inertias = computeElbow();
  const kRange = [1, 8];
  const iRange = [0, Math.max(...inertias) * 1.1];

  drawAxes(ctxElbow, EW, EH, eMargin, {
    xLabel: 'k',
    yLabel: 'Inertia',
    xRange: kRange,
    yRange: iRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  ctxElbow.strokeStyle = '#26a69a';
  ctxElbow.lineWidth = 2.5;
  ctxElbow.beginPath();
  for (let k = 1; k <= 8; k++) {
    const px = mapX(k, kRange, eMargin, EW);
    const py = mapY(inertias[k - 1], iRange, eMargin, EH);
    if (k === 1) ctxElbow.moveTo(px, py);
    else ctxElbow.lineTo(px, py);
    drawPoint(ctxElbow, px, py, 4, '#26a69a');
  }
  ctxElbow.stroke();

  // Highlight current k
  const px = mapX(state.k, kRange, eMargin, EW);
  ctxElbow.strokeStyle = '#ffb74d';
  ctxElbow.lineWidth = 1.5;
  ctxElbow.setLineDash([4, 3]);
  ctxElbow.beginPath();
  ctxElbow.moveTo(px, eMargin.top);
  ctxElbow.lineTo(px, EH - eMargin.bottom);
  ctxElbow.stroke();
  ctxElbow.setLineDash([]);

  ctxElbow.fillStyle = '#e0e0e0';
  ctxElbow.font = '700 12px "Noto Sans KR", sans-serif';
  ctxElbow.textAlign = 'center';
  ctxElbow.fillText('엘보우 방법 (Elbow Method)', EW / 2, 14);
}

function render() {
  renderMain();
  renderElbow();
  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('km-code');
  if (!codeEl) return;
  const init = state.initMethod === 'kmpp' ? "'k-means++'" : "'random'";
  codeEl.textContent = `from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=${state.k}, init=${init})
kmeans.fit(X)
labels = kmeans.labels_
centroids = kmeans.cluster_centers_
# Step: ${state.step}, Inertia: ${fmt(computeInertia(), 2)}`;
}

function startPlay() {
  if (state.isPlaying || state.converged) return;
  state.isPlaying = true;
  document.getElementById('km-play').disabled = true;
  document.getElementById('km-pause').disabled = false;

  function tick() {
    if (!state.isPlaying || state.converged) {
      stopPlay();
      if (state.converged && window.__mlProgress)
        window.__mlProgress.save('section-clustering');
      return;
    }
    doStep();
    render();
    state.timer = setTimeout(tick, 600 / state.speed);
  }
  tick();
}

function stopPlay() {
  state.isPlaying = false;
  if (state.timer) clearTimeout(state.timer);
  document.getElementById('km-play').disabled = false;
  document.getElementById('km-pause').disabled = true;
}

function doStep() {
  if (state.converged) return;
  if (state.phase === 'assign') {
    assign();
    state.phase = 'update';
  } else {
    updateCentroids();
    state.phase = 'assign';
    state.step++;
    // Check for convergence after a full E-M cycle
    assign();
    if (state.converged) return;
    state.phase = 'update';
  }
}

export function initClustering() {
  const container = document.getElementById('clustering-container');
  if (!container) return;
  container.innerHTML = '';

  state.points = generateBlobs(25, 3, 42);
  state.k = 3;
  state.initMethod = 'random';

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;';
  container.appendChild(wrap);

  const mainDiv = document.createElement('div');
  wrap.appendChild(mainDiv);
  const elbowDiv = document.createElement('div');
  wrap.appendChild(elbowDiv);

  const { ctx: c1 } = createCanvas(mainDiv, CW, CH);
  ctxMain = c1;
  const { ctx: c2 } = createCanvas(elbowDiv, EW, EH);
  ctxElbow = c2;

  resetKMeans();

  // K slider
  const kSlider = document.getElementById('km-k-slider');
  const kVal = document.getElementById('km-k-val');
  kSlider.addEventListener('input', () => {
    state.k = parseInt(kSlider.value);
    kVal.textContent = state.k;
    stopPlay();
    resetKMeans();
    render();
  });

  // Speed slider
  const speedSlider = document.getElementById('km-speed-slider');
  const speedVal = document.getElementById('km-speed-val');
  speedSlider.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedVal.textContent = state.speed + 'x';
  });

  // Init tabs
  document.querySelectorAll('#km-init-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#km-init-tabs .tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.initMethod = btn.dataset.init;
      stopPlay();
      resetKMeans();
      render();
    });
  });

  // Buttons
  document.getElementById('km-play').addEventListener('click', startPlay);
  document.getElementById('km-pause').addEventListener('click', stopPlay);
  document.getElementById('km-step').addEventListener('click', () => {
    doStep();
    render();
  });
  document.getElementById('km-reset').addEventListener('click', () => {
    stopPlay();
    resetKMeans();
    render();
  });

  render();
}
