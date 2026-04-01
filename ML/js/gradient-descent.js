// ===== Gradient Descent Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  drawArrow,
  fmt,
  linspace,
  drawContour,
} from './utils.js';

const CW = 520,
  CH = 420;
const margin = { top: 40, right: 20, bottom: 40, left: 50 };
const wRange = [-3, 3],
  bRange = [-3, 3];

// Quadratic loss landscape: L(w,b) = (w-1)^2 + 2*(b-0.5)^2 + 0.5*w*b
function lossFn(w, b) {
  return (w - 1) ** 2 + 2 * (b - 0.5) ** 2 + 0.5 * w * b;
}

function gradFn(w, b) {
  return {
    dw: 2 * (w - 1) + 0.5 * b,
    db: 4 * (b - 0.5) + 0.5 * w,
  };
}

let state = {
  algo: 'sgd',
  lr: 0.01,
  speed: 1,
  path: [],
  w: -2.5,
  b: -2.5,
  vw: 0,
  vb: 0, // momentum
  mw: 0,
  mb: 0, // adam first moment
  sw: 0,
  sb: 0, // adam second moment
  step: 0,
  isPlaying: false,
  timer: null,
  isCompare: false,
};

let ctx, canvasEl;

function resetState() {
  state.w = -2.5;
  state.b = -2.5;
  state.vw = 0;
  state.vb = 0;
  state.mw = 0;
  state.mb = 0;
  state.sw = 0;
  state.sb = 0;
  state.step = 0;
  state.path = [{ w: state.w, b: state.b, loss: lossFn(state.w, state.b) }];
}

function doStep() {
  const g = gradFn(state.w, state.b);
  state.step++;

  switch (state.algo) {
    case 'sgd': {
      state.w -= state.lr * g.dw;
      state.b -= state.lr * g.db;
      break;
    }
    case 'momentum': {
      const beta = 0.9;
      state.vw = beta * state.vw + g.dw;
      state.vb = beta * state.vb + g.db;
      state.w -= state.lr * state.vw;
      state.b -= state.lr * state.vb;
      break;
    }
    case 'adam': {
      const b1 = 0.9,
        b2 = 0.999,
        eps = 1e-8;
      state.mw = b1 * state.mw + (1 - b1) * g.dw;
      state.mb = b1 * state.mb + (1 - b1) * g.db;
      state.sw = b2 * state.sw + (1 - b2) * g.dw * g.dw;
      state.sb = b2 * state.sb + (1 - b2) * g.db * g.db;
      const mwHat = state.mw / (1 - b1 ** state.step);
      const mbHat = state.mb / (1 - b1 ** state.step);
      const swHat = state.sw / (1 - b2 ** state.step);
      const sbHat = state.sb / (1 - b2 ** state.step);
      state.w -= (state.lr * mwHat) / (Math.sqrt(swHat) + eps);
      state.b -= (state.lr * mbHat) / (Math.sqrt(sbHat) + eps);
      break;
    }
  }

  state.path.push({ w: state.w, b: state.b, loss: lossFn(state.w, state.b) });
}

function render() {
  clearCanvas(ctx, CW, CH);

  // Contour
  const maxLoss = 30;
  drawContour(ctx, CW, CH, margin, wRange, bRange, lossFn, (val) => {
    const t = Math.min(val / maxLoss, 1);
    return `rgba(${Math.round(80 + 160 * t)}, ${Math.round(50 + 30 * (1 - t))}, ${Math.round(120 - 40 * t)}, 0.55)`;
  });

  // Contour lines
  const levels = [0.5, 1, 2, 4, 8, 16];
  ctx.lineWidth = 0.8;
  for (const level of levels) {
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + level / 40})`;
    ctx.beginPath();
    let started = false;
    for (let a = 0; a <= 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      // Approximate iso-contour via parametric sampling
      for (let r = 0.05; r < 5; r += 0.05) {
        const tw = Math.cos(rad) * r;
        const tb = Math.sin(rad) * r;
        if (Math.abs(lossFn(tw, tb) - level) < 0.15) {
          const px = mapX(tw, wRange, margin, CW);
          const py = mapY(tb, bRange, margin, CH);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else ctx.lineTo(px, py);
          break;
        }
      }
    }
    ctx.stroke();
  }

  drawAxes(ctx, CW, CH, margin, {
    xLabel: 'w',
    yLabel: 'b',
    xRange: wRange,
    yRange: bRange,
    color: '#e0e0e0',
    gridLines: false,
  });

  // Path
  if (state.path.length > 1) {
    ctx.strokeStyle = '#81c784';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < state.path.length; i++) {
      const px = mapX(state.path[i].w, wRange, margin, CW);
      const py = mapY(state.path[i].b, bRange, margin, CH);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Path dots
    for (let i = 0; i < state.path.length; i++) {
      const px = mapX(state.path[i].w, wRange, margin, CW);
      const py = mapY(state.path[i].b, bRange, margin, CH);
      drawPoint(
        ctx,
        px,
        py,
        i === state.path.length - 1 ? 6 : 2.5,
        i === state.path.length - 1 ? '#ffb74d' : '#81c784',
      );
    }
  }

  // Current gradient arrow
  if (state.path.length > 0) {
    const g = gradFn(state.w, state.b);
    const scale = 0.15;
    const cx = mapX(state.w, wRange, margin, CW);
    const cy = mapY(state.b, bRange, margin, CH);
    const plotW = CW - margin.left - margin.right;
    const plotH = CH - margin.top - margin.bottom;
    const arrowDx = (-g.dw * scale * plotW) / (wRange[1] - wRange[0]);
    const arrowDy = (g.db * scale * plotH) / (bRange[1] - bRange[0]);
    drawArrow(ctx, cx, cy, cx + arrowDx, cy + arrowDy, '#ef5350', 2);
  }

  // Minimum marker
  drawPoint(
    ctx,
    mapX(1, wRange, margin, CW),
    mapY(0.5, bRange, margin, CH),
    5,
    '#ffffff50',
  );
  ctx.fillStyle = '#ffffff80';
  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    '최솟값',
    mapX(1, wRange, margin, CW) + 8,
    mapY(0.5, bRange, margin, CH) + 4,
  );

  // Info
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '700 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Step: ${state.step}`, margin.left + 4, margin.top - 8);
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = '#ffb74d';
  ctx.fillText(
    `w=${fmt(state.w, 3)} b=${fmt(state.b, 3)}`,
    margin.left + 100,
    margin.top - 8,
  );
  ctx.fillStyle = '#ef5350';
  ctx.fillText(
    `Loss=${fmt(lossFn(state.w, state.b), 4)}`,
    margin.left + 300,
    margin.top - 8,
  );

  // Title
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '700 14px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `경사 하강법 — ${state.algo.toUpperCase()} (η=${state.lr})`,
    CW / 2,
    16,
  );

  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('gd-code');
  if (!codeEl) return;
  const names = { sgd: 'SGD', momentum: 'SGD(momentum=0.9)', adam: 'Adam' };
  codeEl.textContent = `optimizer = torch.optim.${names[state.algo]}(model.parameters(), lr=${state.lr})

# Step ${state.step}: w=${fmt(state.w, 4)}, b=${fmt(state.b, 4)}
# Loss = ${fmt(lossFn(state.w, state.b), 6)}
for epoch in range(100):
    loss = criterion(model(X), y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()`;
}

function startPlay() {
  if (state.isPlaying) return;
  state.isPlaying = true;
  document.getElementById('gd-play').disabled = true;
  document.getElementById('gd-pause').disabled = false;

  function tick() {
    if (!state.isPlaying) return;
    doStep();
    render();
    if (state.step >= 200 || lossFn(state.w, state.b) < 0.01) {
      stopPlay();
      if (window.__mlProgress) window.__mlProgress.save('section-gradient');
      return;
    }
    state.timer = setTimeout(tick, 200 / state.speed);
  }
  tick();
}

function stopPlay() {
  state.isPlaying = false;
  if (state.timer) clearTimeout(state.timer);
  document.getElementById('gd-play').disabled = false;
  document.getElementById('gd-pause').disabled = true;
}

export function initGradientDescent() {
  const container = document.getElementById('gradient-container');
  if (!container) return;
  container.innerHTML = '';

  resetState();

  const { ctx: c } = createCanvas(container, CW, CH);
  ctx = c;

  // Tab: algorithm selection
  document.querySelectorAll('#gd-algo-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#gd-algo-tabs .tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.algo = btn.dataset.algo;
      resetState();
      render();
    });
  });

  // LR slider (log scale)
  const lrSlider = document.getElementById('gd-lr-slider');
  const lrVal = document.getElementById('gd-lr-val');
  lrSlider.addEventListener('input', () => {
    state.lr = Math.pow(10, parseFloat(lrSlider.value));
    lrVal.textContent = state.lr.toFixed(3);
    resetState();
    render();
  });

  // Speed slider
  const speedSlider = document.getElementById('gd-speed-slider');
  const speedVal = document.getElementById('gd-speed-val');
  speedSlider.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedVal.textContent = state.speed + 'x';
  });

  // Buttons
  document.getElementById('gd-play').addEventListener('click', startPlay);
  document.getElementById('gd-pause').addEventListener('click', stopPlay);
  document.getElementById('gd-step').addEventListener('click', () => {
    doStep();
    render();
  });
  document.getElementById('gd-reset').addEventListener('click', () => {
    stopPlay();
    resetState();
    render();
  });

  // Compare mode
  const compareBtn = document.getElementById('gd-compare-btn');
  compareBtn.addEventListener('click', () => {
    state.isCompare = !state.isCompare;
    compareBtn.classList.toggle('active', state.isCompare);
    const cc = document.getElementById('gd-compare-container');
    if (state.isCompare) {
      cc.style.display = 'grid';
      cc.innerHTML = '';
      renderCompare(cc, 0.01, 0.5);
    } else {
      cc.style.display = 'none';
    }
  });

  render();
}

function renderCompare(cc, lr1, lr2) {
  [lr1, lr2].forEach((lr, idx) => {
    const panel = document.createElement('div');
    panel.className = `compare-panel compare-panel-${idx === 0 ? 'a' : 'b'}`;
    const title = document.createElement('div');
    title.className = 'compare-panel-title';
    title.textContent = `η = ${lr}`;
    panel.appendChild(title);
    cc.appendChild(panel);

    const { ctx: pCtx, width: pW, height: pH } = createCanvas(panel, 420, 320);
    const m = { top: 30, right: 15, bottom: 35, left: 45 };

    // Run GD
    let w = -2.5,
      b = -2.5;
    const path = [{ w, b }];
    for (let i = 0; i < 60; i++) {
      const g = gradFn(w, b);
      w -= lr * g.dw;
      b -= lr * g.db;
      path.push({ w, b });
      if (Math.abs(w) > 10 || Math.abs(b) > 10) break; // diverged
    }

    clearCanvas(pCtx, pW, pH);
    drawContour(pCtx, pW, pH, m, wRange, bRange, lossFn, (val) => {
      const t = Math.min(val / 30, 1);
      return `rgba(${Math.round(80 + 160 * t)}, ${Math.round(50 + 30 * (1 - t))}, ${Math.round(120 - 40 * t)}, 0.5)`;
    });
    drawAxes(pCtx, pW, pH, m, {
      xRange: wRange,
      yRange: bRange,
      color: '#e0e0e0',
      gridLines: false,
    });

    pCtx.strokeStyle = idx === 0 ? '#4fc3f7' : '#ef5350';
    pCtx.lineWidth = 2;
    pCtx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const px = mapX(
        Math.max(wRange[0], Math.min(wRange[1], path[i].w)),
        wRange,
        m,
        pW,
      );
      const py = mapY(
        Math.max(bRange[0], Math.min(bRange[1], path[i].b)),
        bRange,
        m,
        pH,
      );
      if (i === 0) pCtx.moveTo(px, py);
      else pCtx.lineTo(px, py);
    }
    pCtx.stroke();

    for (const p of path) {
      const px = mapX(
        Math.max(wRange[0], Math.min(wRange[1], p.w)),
        wRange,
        m,
        pW,
      );
      const py = mapY(
        Math.max(bRange[0], Math.min(bRange[1], p.b)),
        bRange,
        m,
        pH,
      );
      drawPoint(pCtx, px, py, 2, idx === 0 ? '#4fc3f7' : '#ef5350');
    }

    const last = path[path.length - 1];
    const diverged = Math.abs(last.w) > 5 || Math.abs(last.b) > 5;
    pCtx.fillStyle = diverged ? '#ef5350' : '#81c784';
    pCtx.font = '700 12px "Noto Sans KR", sans-serif';
    pCtx.textAlign = 'left';
    pCtx.fillText(
      diverged ? '⚠ 발산!' : `✓ 수렴 (Loss=${fmt(lossFn(last.w, last.b), 3)})`,
      m.left + 4,
      m.top - 4,
    );
  });
}
