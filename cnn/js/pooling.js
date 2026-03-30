// ===== Section 5: Max/Avg Pooling =====
import { outputSize, fmt, valueToColor, arrayMinMax } from './utils.js';

let state = {
  input: [
    [4, 2, 7, 1, 3, 5],
    [6, 3, 8, 0, 2, 4],
    [1, 5, 2, 9, 6, 3],
    [7, 0, 4, 3, 8, 1],
    [2, 8, 1, 6, 0, 5],
    [3, 4, 9, 2, 7, 6]
  ],
  poolType: 'max',
  poolSize: 2,
  stride: 2,
  speed: 1,
  currentStep: -1,
  isPlaying: false,
  animTimer: null,
  steps: [],
  output: []
};

export function initPooling() {
  const container = document.getElementById('pooling-container');
  if (!container) return;

  setupControls();
  recompute();
  render();
}

function setupControls() {
  // Pool tabs
  document.querySelectorAll('#pool-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pool-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.poolType = btn.dataset.pool;
      resetAnim();
      recompute();
      render();
    });
  });

  // Pool size
  const sizeSlider = document.getElementById('pool-size-slider');
  const sizeVal = document.getElementById('pool-size-val');
  sizeSlider.addEventListener('input', () => {
    state.poolSize = parseInt(sizeSlider.value);
    sizeVal.textContent = `${state.poolSize}x${state.poolSize}`;
    resetAnim();
    recompute();
    render();
  });

  // Stride
  const strideSlider = document.getElementById('pool-stride-slider');
  const strideVal = document.getElementById('pool-stride-val');
  strideSlider.addEventListener('input', () => {
    state.stride = parseInt(strideSlider.value);
    strideVal.textContent = state.stride;
    resetAnim();
    recompute();
    render();
  });

  // Speed
  const speedSlider = document.getElementById('pool-speed-slider');
  const speedVal = document.getElementById('pool-speed-val');
  speedSlider.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedVal.textContent = `${state.speed}x`;
  });

  // Play/Pause/Reset
  document.getElementById('pool-play').addEventListener('click', play);
  document.getElementById('pool-pause').addEventListener('click', pause);
  document.getElementById('pool-reset').addEventListener('click', () => { resetAnim(); render(); });
}

function recompute() {
  const H = state.input.length;
  const W = state.input[0].length;
  const K = state.poolSize;
  const S = state.stride;
  const outH = outputSize(H, K, 0, S);
  const outW = outputSize(W, K, 0, S);

  if (outH < 1 || outW < 1) {
    state.steps = [];
    state.output = [];
    return;
  }

  state.steps = [];
  state.output = [];

  for (let i = 0; i < outH; i++) {
    state.output.push([]);
    for (let j = 0; j < outW; j++) {
      const positions = [];
      const values = [];
      for (let ki = 0; ki < K; ki++) {
        for (let kj = 0; kj < K; kj++) {
          const ri = i * S + ki;
          const ci = j * S + kj;
          positions.push({ row: ri, col: ci });
          values.push(state.input[ri][ci]);
        }
      }

      let result, selectedIdx;
      if (state.poolType === 'max') {
        result = Math.max(...values);
        selectedIdx = values.indexOf(result);
      } else {
        result = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
        selectedIdx = -1;
      }

      state.output[i].push(result);
      state.steps.push({
        outRow: i, outCol: j,
        positions, values, result, selectedIdx
      });
    }
  }
}

function render() {
  const container = document.getElementById('pooling-container');
  if (!container) return;
  container.innerHTML = '';

  if (state.steps.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">유효하지 않은 파라미터입니다.</p>';
    return;
  }

  // Info
  const H = state.input.length;
  const W = state.input[0].length;
  const outH = state.output.length;
  const outW = state.output[0].length;
  const info = document.createElement('div');
  info.className = 'conv-info';
  info.style.width = '100%';
  info.textContent = `${state.poolType === 'max' ? 'Max' : 'Average'} Pooling | 입력: ${H}x${W} | Pool: ${state.poolSize}x${state.poolSize} | Stride: ${state.stride} → 출력: ${outH}x${outW}`;
  container.appendChild(info);

  // Input panel
  const inputPanel = document.createElement('div');
  inputPanel.className = 'conv-panel';
  inputPanel.innerHTML = '<div class="conv-panel-title" style="color:var(--input-color)">입력</div>';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'conv-grid-wrapper';

  const inputGrid = document.createElement('div');
  inputGrid.className = 'conv-grid';
  inputGrid.id = 'pool-input-grid';
  inputGrid.style.gridTemplateColumns = `repeat(${W}, 52px)`;

  const { min: imin, max: imax } = arrayMinMax(state.input);
  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      const cell = document.createElement('div');
      cell.className = 'conv-cell';
      cell.id = `pi-${i}-${j}`;
      cell.textContent = fmt(state.input[i][j], 0);
      cell.style.background = valueToColor(state.input[i][j], imin, imax, 'blue');
      inputGrid.appendChild(cell);
    }
  }

  // Pool overlay
  const overlay = document.createElement('div');
  overlay.className = 'kernel-overlay';
  overlay.id = 'pool-overlay';
  overlay.style.width = (state.poolSize * 54) + 'px';
  overlay.style.height = (state.poolSize * 54) + 'px';
  overlay.style.borderColor = 'var(--pool-color)';
  overlay.style.background = 'rgba(206,147,216,0.15)';
  overlay.style.display = 'none';

  inputWrapper.appendChild(inputGrid);
  inputWrapper.appendChild(overlay);
  inputPanel.appendChild(inputWrapper);
  container.appendChild(inputPanel);

  // Detail panel
  const opPanel = document.createElement('div');
  opPanel.className = 'op-detail';
  opPanel.id = 'pool-op-detail';
  opPanel.innerHTML = `<h4 style="color:var(--pool-color)">${state.poolType === 'max' ? 'Max' : 'Average'} Pooling</h4>
    <p style="color:var(--text-secondary);font-size:0.8rem;">재생으로 과정을 확인하세요.</p>`;
  container.appendChild(opPanel);

  // Output panel
  const outputPanel = document.createElement('div');
  outputPanel.className = 'conv-panel';
  outputPanel.innerHTML = '<div class="conv-panel-title" style="color:var(--output-color)">출력</div>';

  const outputGrid = document.createElement('div');
  outputGrid.className = 'conv-grid';
  outputGrid.id = 'pool-output-grid';
  outputGrid.style.gridTemplateColumns = `repeat(${outW}, 52px)`;

  for (let i = 0; i < outH; i++) {
    for (let j = 0; j < outW; j++) {
      const cell = document.createElement('div');
      cell.className = 'conv-cell';
      cell.id = `po-${i}-${j}`;
      cell.textContent = '';
      cell.style.background = 'var(--bg-card)';
      outputGrid.appendChild(cell);
    }
  }
  outputPanel.appendChild(outputGrid);
  container.appendChild(outputPanel);

  if (state.currentStep >= 0) showStep(state.currentStep);
}

function showStep(stepIdx) {
  if (stepIdx < 0 || stepIdx >= state.steps.length) return;
  const step = state.steps[stepIdx];

  // Position overlay
  const overlay = document.getElementById('pool-overlay');
  if (overlay) {
    overlay.style.display = 'block';
    overlay.style.top = (step.positions[0].row * 54) + 'px';
    overlay.style.left = (step.positions[0].col * 54) + 'px';
  }

  // Clear highlights
  document.querySelectorAll('#pool-input-grid .conv-cell').forEach(c => {
    c.classList.remove('active');
    c.classList.remove('max-selected');
  });

  // Highlight positions
  step.positions.forEach((p, idx) => {
    const cell = document.getElementById(`pi-${p.row}-${p.col}`);
    if (cell) {
      cell.classList.add('active');
      if (state.poolType === 'max' && idx === step.selectedIdx) {
        cell.classList.add('max-selected');
      }
    }
  });

  // Update detail
  const opPanel = document.getElementById('pool-op-detail');
  if (opPanel) {
    const valStr = step.values.map(v => fmt(v, 0)).join(', ');
    const typeLabel = state.poolType === 'max' ? 'Max' : 'Average';
    opPanel.innerHTML = `
      <h4 style="color:var(--pool-color)">단계 ${stepIdx + 1}/${state.steps.length}</h4>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;">
        출력 위치: [${step.outRow}, ${step.outCol}]
      </div>
      <div style="font-size:0.9rem;color:var(--text-primary);margin-bottom:8px;">
        영역 값: [${valStr}]
      </div>
      <div style="font-size:0.9rem;color:var(--text-secondary);">
        ${typeLabel}(${valStr})
      </div>
      <div class="op-result" style="color:var(--pool-color)">= ${fmt(step.result)}</div>
    `;
  }

  // Fill output up to step
  const { min: omin, max: omax } = arrayMinMax(state.output);
  for (let s = 0; s <= stepIdx; s++) {
    const st = state.steps[s];
    const cell = document.getElementById(`po-${st.outRow}-${st.outCol}`);
    if (cell) {
      cell.textContent = fmt(st.result);
      cell.style.background = valueToColor(st.result, omin, omax, 'purple');
      if (s === stepIdx) {
        cell.classList.add('computed');
        setTimeout(() => cell.classList.remove('computed'), 300);
      }
    }
  }
}

function play() {
  if (state.steps.length === 0) return;
  state.isPlaying = true;
  document.getElementById('pool-play').disabled = true;
  document.getElementById('pool-pause').disabled = false;

  const interval = 600 / state.speed;
  function tick() {
    if (!state.isPlaying) return;
    state.currentStep++;
    if (state.currentStep >= state.steps.length) {
      pause();
      return;
    }
    showStep(state.currentStep);
    state.animTimer = setTimeout(tick, interval);
  }
  tick();
}

function pause() {
  state.isPlaying = false;
  if (state.animTimer) clearTimeout(state.animTimer);
  document.getElementById('pool-play').disabled = false;
  document.getElementById('pool-pause').disabled = true;
}

function resetAnim() {
  pause();
  state.currentStep = -1;
}
