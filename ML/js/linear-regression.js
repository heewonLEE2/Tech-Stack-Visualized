// ===== Linear Regression Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  drawLine,
  fmt,
  computeMSE,
  fitLinearRegression,
  drawContour,
  mulberry32,
} from './utils.js';

let state = {
  w: 1,
  b: 0,
  optW: 0,
  optB: 0,
  points: [],
  isCompare: false,
};

const margin = { top: 30, right: 20, bottom: 40, left: 50 };
const CW = 480,
  CH = 340;
const xRange = [-1, 6],
  yRange = [-3, 12];
const wRange = [-2, 4],
  bRange = [-4, 6];

let mainCtx, mainCanvas;
let contourCtx, contourCanvas;

function generateData() {
  const rng = mulberry32(42);
  const gauss = () => {
    let u = 0,
      v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const x = rng() * 5;
    const y = 1.5 * x + 1 + gauss() * 1.2;
    pts.push({ x, y });
  }
  return pts;
}

function renderScatter(ctx, w, h) {
  clearCanvas(ctx, w, h);
  drawAxes(ctx, w, h, margin, { xLabel: 'x', yLabel: 'y', xRange, yRange });

  // Regression line
  const x1 = xRange[0],
    x2 = xRange[1];
  const y1 = state.w * x1 + state.b;
  const y2 = state.w * x2 + state.b;
  drawLine(
    ctx,
    mapX(x1, xRange, margin, w),
    mapY(y1, yRange, margin, h),
    mapX(x2, xRange, margin, w),
    mapY(y2, yRange, margin, h),
    '#ffb74d',
    2.5,
  );

  // Residuals
  for (const p of state.points) {
    const pred = state.w * p.x + state.b;
    const px = mapX(p.x, xRange, margin, w);
    const pyActual = mapY(p.y, yRange, margin, h);
    const pyPred = mapY(pred, yRange, margin, h);
    drawLine(ctx, px, pyActual, px, pyPred, '#ef535080', 1);
  }

  // Data points
  for (const p of state.points) {
    drawPoint(
      ctx,
      mapX(p.x, xRange, margin, w),
      mapY(p.y, yRange, margin, h),
      4,
      '#4fc3f7',
      '#4fc3f7',
    );
  }

  // MSE label
  const mse = computeMSE(state.points, state.w, state.b);
  ctx.fillStyle = '#ef5350';
  ctx.font = '700 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`MSE = ${fmt(mse, 3)}`, margin.left + 8, margin.top + 18);

  // w, b label
  ctx.fillStyle = '#ffb74d';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText(
    `ŷ = ${fmt(state.w, 2)}x + ${fmt(state.b, 2)}`,
    margin.left + 8,
    margin.top + 36,
  );
}

function renderContour(ctx, w, h) {
  clearCanvas(ctx, w, h);

  // Draw contour
  const fn = (wv, bv) => computeMSE(state.points, wv, bv);
  const maxMSE = 40;
  drawContour(ctx, w, h, margin, wRange, bRange, fn, (val) => {
    const t = Math.min(val / maxMSE, 1);
    const r = Math.round(239 * t + 15 * (1 - t));
    const g = Math.round(83 * t + 52 * (1 - t));
    const b = Math.round(80 * t + 96 * (1 - t));
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  });

  drawAxes(ctx, w, h, margin, {
    xLabel: 'w (기울기)',
    yLabel: 'b (절편)',
    xRange: wRange,
    yRange: bRange,
    color: '#e0e0e0',
  });

  // Current position
  const cx = mapX(state.w, wRange, margin, w);
  const cy = mapY(state.b, bRange, margin, h);
  drawPoint(ctx, cx, cy, 7, '#ffb74d', '#ffffff');

  // Optimal position
  const ox = mapX(state.optW, wRange, margin, w);
  const oy = mapY(state.optB, bRange, margin, h);
  drawPoint(ctx, ox, oy, 5, '#81c784', '#ffffff');

  // Labels
  ctx.fillStyle = '#ffb74d';
  ctx.font = '11px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('● 현재', w - margin.right - 80, margin.top + 16);
  ctx.fillStyle = '#81c784';
  ctx.fillText('● 최적', w - margin.right - 80, margin.top + 32);

  // Title
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '700 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MSE 등고선 (Loss Landscape)', w / 2, 16);
}

function render() {
  renderScatter(mainCtx, CW, CH);
  if (contourCtx) renderContour(contourCtx, CW, CH);
  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('reg-code');
  if (codeEl) {
    codeEl.textContent = `from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)
# w = ${fmt(state.optW, 4)}, b = ${fmt(state.optB, 4)}
# 현재 수동: w = ${fmt(state.w, 2)}, b = ${fmt(state.b, 2)}
# MSE = ${fmt(computeMSE(state.points, state.w, state.b), 4)}`;
  }
}

export function initRegression() {
  const container = document.getElementById('regression-container');
  if (!container) return;
  container.innerHTML = '';

  state.points = generateData();
  const fit = fitLinearRegression(state.points);
  state.optW = fit.w;
  state.optB = fit.b;

  // Two canvas panels
  const row = document.createElement('div');
  row.className = 'canvas-row';

  const panel1 = document.createElement('div');
  panel1.className = 'canvas-panel';
  const title1 = document.createElement('div');
  title1.className = 'canvas-panel-title';
  title1.textContent = '산점도 + 회귀선 + 잔차';
  panel1.appendChild(title1);

  const panel2 = document.createElement('div');
  panel2.className = 'canvas-panel';
  const title2 = document.createElement('div');
  title2.className = 'canvas-panel-title';
  title2.textContent = 'MSE 등고선 (w-b 평면)';
  panel2.appendChild(title2);

  row.appendChild(panel1);
  row.appendChild(panel2);
  container.appendChild(row);

  const r1 = createCanvas(panel1, CW, CH);
  mainCanvas = r1.canvas;
  mainCtx = r1.ctx;

  const r2 = createCanvas(panel2, CW, CH);
  contourCanvas = r2.canvas;
  contourCtx = r2.ctx;

  // Controls
  const wSlider = document.getElementById('reg-w-slider');
  const bSlider = document.getElementById('reg-b-slider');
  const wVal = document.getElementById('reg-w-val');
  const bVal = document.getElementById('reg-b-val');
  const fitBtn = document.getElementById('reg-fit-btn');
  const resetBtn = document.getElementById('reg-reset-btn');
  const compareBtn = document.getElementById('reg-compare-btn');

  wSlider.addEventListener('input', () => {
    state.w = parseFloat(wSlider.value);
    wVal.textContent = fmt(state.w, 1);
    render();
  });

  bSlider.addEventListener('input', () => {
    state.b = parseFloat(bSlider.value);
    bVal.textContent = fmt(state.b, 1);
    render();
  });

  fitBtn.addEventListener('click', () => {
    // Animate towards optimal
    const startW = state.w,
      startB = state.b;
    const targetW = state.optW,
      targetB = state.optB;
    const steps = 30;
    let step = 0;
    function animate() {
      step++;
      const t = step / steps;
      const ease = t * (2 - t); // ease out
      state.w = startW + (targetW - startW) * ease;
      state.b = startB + (targetB - startB) * ease;
      wSlider.value = state.w;
      bSlider.value = state.b;
      wVal.textContent = fmt(state.w, 1);
      bVal.textContent = fmt(state.b, 1);
      render();
      if (step < steps) requestAnimationFrame(animate);
      else if (window.__mlProgress)
        window.__mlProgress.save('section-regression');
    }
    animate();
  });

  resetBtn.addEventListener('click', () => {
    state.w = 1;
    state.b = 0;
    wSlider.value = 1;
    bSlider.value = 0;
    wVal.textContent = '1.0';
    bVal.textContent = '0.0';
    render();
  });

  // Compare mode
  compareBtn.addEventListener('click', () => {
    state.isCompare = !state.isCompare;
    compareBtn.classList.toggle('active', state.isCompare);
    const cc = document.getElementById('reg-compare-container');
    if (state.isCompare) {
      cc.style.display = 'grid';
      cc.innerHTML = '';

      const panelA = document.createElement('div');
      panelA.className = 'compare-panel compare-panel-a';
      const titleA = document.createElement('div');
      titleA.className = 'compare-panel-title';
      titleA.textContent = `수동 (w=${fmt(state.w, 1)}, b=${fmt(state.b, 1)})`;
      panelA.appendChild(titleA);
      const { ctx: ctxA } = createCanvas(panelA, 440, 300);

      const panelB = document.createElement('div');
      panelB.className = 'compare-panel compare-panel-b';
      const titleB = document.createElement('div');
      titleB.className = 'compare-panel-title';
      titleB.textContent = `최적 (w=${fmt(state.optW, 2)}, b=${fmt(state.optB, 2)})`;
      panelB.appendChild(titleB);
      const { ctx: ctxB } = createCanvas(panelB, 440, 300);

      cc.appendChild(panelA);
      cc.appendChild(panelB);

      // Render A (current)
      const tmpW = state.w,
        tmpB = state.b;
      renderScatterCompare(ctxA, 440, 300, tmpW, tmpB);
      renderScatterCompare(ctxB, 440, 300, state.optW, state.optB);
    } else {
      cc.style.display = 'none';
    }
  });

  render();
}

function renderScatterCompare(ctx, w, h, wVal, bVal) {
  clearCanvas(ctx, w, h);
  const m = { top: 20, right: 15, bottom: 35, left: 45 };
  drawAxes(ctx, w, h, m, { xRange, yRange });

  const x1 = xRange[0],
    x2 = xRange[1];
  const y1Val = wVal * x1 + bVal;
  const y2Val = wVal * x2 + bVal;
  drawLine(
    ctx,
    mapX(x1, xRange, m, w),
    mapY(y1Val, yRange, m, h),
    mapX(x2, xRange, m, w),
    mapY(y2Val, yRange, m, h),
    '#ffb74d',
    2,
  );

  for (const p of state.points) {
    const pred = wVal * p.x + bVal;
    const px = mapX(p.x, xRange, m, w);
    drawLine(
      ctx,
      px,
      mapY(p.y, yRange, m, h),
      px,
      mapY(pred, yRange, m, h),
      '#ef535060',
      1,
    );
  }

  for (const p of state.points) {
    drawPoint(
      ctx,
      mapX(p.x, xRange, m, w),
      mapY(p.y, yRange, m, h),
      3,
      '#4fc3f7',
    );
  }

  const mse = computeMSE(state.points, wVal, bVal);
  ctx.fillStyle = '#ef5350';
  ctx.font = '700 12px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`MSE = ${fmt(mse, 3)}`, m.left + 4, m.top + 14);
}
