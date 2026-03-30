// ===== Section 6: 활성화 함수 =====
import { fmt, valueToColor } from './utils.js';

const FUNCTIONS = {
  relu: { fn: x => Math.max(0, x), label: 'ReLU(x) = max(0, x)', color: '#26A69A' },
  sigmoid: { fn: x => 1 / (1 + Math.exp(-x)), label: 'Sigmoid(x) = 1/(1+e^-x)', color: '#FFB74D' },
  tanh: { fn: x => Math.tanh(x), label: 'Tanh(x)', color: '#CE93D8' }
};

let currentFn = 'relu';

const gridInput = [
  [-2.5, -1.2, 0.3, 1.8, 2.4],
  [1.0, -0.5, -1.8, 0.7, -0.3],
  [-3.0, 2.1, 0.0, -0.8, 1.5],
  [0.5, -1.0, 2.8, -2.2, 0.1],
  [-0.7, 1.3, -0.1, 3.0, -1.5]
];

export function initActivation() {
  setupTabs();
  drawGraph();
  drawGrids();
}

function setupTabs() {
  document.querySelectorAll('#act-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#act-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFn = btn.dataset.act;
      drawGraph();
      drawGrids();
    });
  });
}

function drawGraph() {
  const canvas = document.getElementById('act-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const fn = FUNCTIONS[currentFn];

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#0f3460';
  ctx.fillRect(0, 0, W, H);

  const xMin = -5, xMax = 5;
  const yMin = currentFn === 'relu' ? -1 : -1.5;
  const yMax = currentFn === 'relu' ? 5 : 1.5;

  function toCanvasX(x) { return ((x - xMin) / (xMax - xMin)) * W; }
  function toCanvasY(y) { return H - ((y - yMin) / (yMax - yMin)) * H; }

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(x), 0);
    ctx.lineTo(toCanvasX(x), H);
    ctx.stroke();
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(y));
    ctx.lineTo(W, toCanvasY(y));
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  // X axis
  ctx.beginPath();
  ctx.moveTo(0, toCanvasY(0));
  ctx.lineTo(W, toCanvasY(0));
  ctx.stroke();
  // Y axis
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), 0);
  ctx.lineTo(toCanvasX(0), H);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Courier New';
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    ctx.fillText(x, toCanvasX(x) + 2, toCanvasY(0) + 12);
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    if (y !== 0) ctx.fillText(y, toCanvasX(0) + 4, toCanvasY(y) - 2);
  }

  // Function curve
  ctx.strokeStyle = fn.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let first = true;
  for (let px = 0; px < W; px++) {
    const x = xMin + (px / W) * (xMax - xMin);
    const y = fn.fn(x);
    const cy = toCanvasY(y);
    if (first) { ctx.moveTo(px, cy); first = false; }
    else ctx.lineTo(px, cy);
  }
  ctx.stroke();

  // Label
  ctx.fillStyle = fn.color;
  ctx.font = 'bold 13px Noto Sans KR, sans-serif';
  ctx.fillText(fn.label, 12, 22);

  // Interactive mouse tracking
  const probe = document.getElementById('act-probe');

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const x = xMin + (mx / W) * (xMax - xMin);
    const y = fn.fn(x);

    // Redraw with dot
    drawGraphNoRecurse();
    const cctx = canvas.getContext('2d');
    cctx.fillStyle = fn.color;
    cctx.beginPath();
    cctx.arc(toCanvasX(x), toCanvasY(y), 5, 0, Math.PI * 2);
    cctx.fill();

    // Crosshair
    cctx.strokeStyle = 'rgba(255,255,255,0.2)';
    cctx.lineWidth = 1;
    cctx.setLineDash([4, 4]);
    cctx.beginPath();
    cctx.moveTo(toCanvasX(x), 0);
    cctx.lineTo(toCanvasX(x), H);
    cctx.moveTo(0, toCanvasY(y));
    cctx.lineTo(W, toCanvasY(y));
    cctx.stroke();
    cctx.setLineDash([]);

    if (probe) {
      probe.textContent = `x = ${fmt(x, 2)} → ${currentFn}(x) = ${fmt(y, 4)}`;
    }
  }

  // Remove old listener by replacing canvas interaction
  canvas.onmousemove = handleMove;
  canvas.onmouseleave = () => {
    drawGraphNoRecurse();
    if (probe) probe.textContent = '마우스를 그래프 위로 이동하세요';
  };
}

// Non-recursive version for mouse leave
function drawGraphNoRecurse() {
  const canvas = document.getElementById('act-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const fn = FUNCTIONS[currentFn];

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#0f3460';
  ctx.fillRect(0, 0, W, H);

  const xMin = -5, xMax = 5;
  const yMin = currentFn === 'relu' ? -1 : -1.5;
  const yMax = currentFn === 'relu' ? 5 : 1.5;

  function toCanvasX(x) { return ((x - xMin) / (xMax - xMin)) * W; }
  function toCanvasY(y) { return H - ((y - yMin) / (yMax - yMin)) * H; }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    ctx.beginPath(); ctx.moveTo(toCanvasX(x), 0); ctx.lineTo(toCanvasX(x), H); ctx.stroke();
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    ctx.beginPath(); ctx.moveTo(0, toCanvasY(y)); ctx.lineTo(W, toCanvasY(y)); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(W, toCanvasY(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), H); ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Courier New';
  for (let x = Math.ceil(xMin); x <= xMax; x++) ctx.fillText(x, toCanvasX(x) + 2, toCanvasY(0) + 12);
  for (let y = Math.ceil(yMin); y <= yMax; y++) if (y !== 0) ctx.fillText(y, toCanvasX(0) + 4, toCanvasY(y) - 2);

  ctx.strokeStyle = fn.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let first = true;
  for (let px = 0; px < W; px++) {
    const x = xMin + (px / W) * (xMax - xMin);
    const y = fn.fn(x);
    const cy = toCanvasY(y);
    if (first) { ctx.moveTo(px, cy); first = false; } else ctx.lineTo(px, cy);
  }
  ctx.stroke();

  ctx.fillStyle = fn.color;
  ctx.font = 'bold 13px Noto Sans KR, sans-serif';
  ctx.fillText(fn.label, 12, 22);
}

function drawGrids() {
  const gridsContainer = document.getElementById('act-grids');
  if (!gridsContainer) return;
  gridsContainer.innerHTML = '';

  const fn = FUNCTIONS[currentFn];
  const pair = document.createElement('div');
  pair.className = 'act-grid-pair';

  // Before grid
  const beforeBlock = document.createElement('div');
  beforeBlock.innerHTML = '<div class="act-grid-label">Before (입력)</div>';
  const beforeGrid = document.createElement('div');
  beforeGrid.className = 'act-grid';
  beforeGrid.style.gridTemplateColumns = 'repeat(5, 60px)';

  // After grid
  const afterBlock = document.createElement('div');
  afterBlock.innerHTML = `<div class="act-grid-label">After (${currentFn.toUpperCase()})</div>`;
  const afterGrid = document.createElement('div');
  afterGrid.className = 'act-grid';
  afterGrid.style.gridTemplateColumns = 'repeat(5, 60px)';

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const val = gridInput[i][j];
      const out = Math.round(fn.fn(val) * 1000) / 1000;

      // Before cell
      const bc = document.createElement('div');
      bc.className = 'act-cell';
      bc.textContent = fmt(val);
      bc.style.background = valueToColor(val, -3, 3, 'diverging');
      beforeGrid.appendChild(bc);

      // After cell
      const ac = document.createElement('div');
      ac.className = 'act-cell';
      ac.textContent = fmt(out, 2);

      if (currentFn === 'relu') {
        if (val <= 0) {
          ac.style.background = 'rgba(239, 83, 80, 0.25)';
          ac.style.color = '#EF5350';
        } else {
          ac.style.background = `rgba(38, 166, 154, ${0.1 + (out / 3) * 0.5})`;
          ac.style.color = '#26A69A';
        }
      } else if (currentFn === 'sigmoid') {
        ac.style.background = valueToColor(out, 0, 1, 'orange');
      } else {
        ac.style.background = valueToColor(out, -1, 1, 'purple');
      }
      afterGrid.appendChild(ac);
    }
  }

  beforeBlock.appendChild(beforeGrid);
  afterBlock.appendChild(afterGrid);

  // Arrow between
  const arrow = document.createElement('div');
  arrow.style.cssText = 'font-size:1.5rem;color:var(--text-secondary);align-self:center;margin-top:20px;';
  arrow.textContent = '→';

  pair.appendChild(beforeBlock);
  pair.appendChild(arrow);
  pair.appendChild(afterBlock);
  gridsContainer.appendChild(pair);
}
