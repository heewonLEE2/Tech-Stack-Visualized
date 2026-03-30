// ===== Section 2: 합성곱 연산 애니메이션 =====
import { convolve2D, padArray2D, outputSize, renderGrid, fmt, valueToColor, arrayMinMax } from './utils.js';

// Preset kernels
const PRESETS = {
  edge: {
    3: [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]],
    5: [[-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1],[-1,-1,24,-1,-1],[-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1]],
    1: [[1]]
  },
  blur: {
    3: [[1,1,1],[1,1,1],[1,1,1]].map(r => r.map(v => +(v/9).toFixed(2))),
    5: Array(5).fill(null).map(() => Array(5).fill(0.04)),
    1: [[1]]
  },
  sharpen: {
    3: [[0,-1,0],[-1,5,-1],[0,-1,0]],
    5: [[0,0,-1,0,0],[0,-1,-2,-1,0],[-1,-2,17,-2,-1],[0,-1,-2,-1,0],[0,0,-1,0,0]],
    1: [[1]]
  },
  identity: {
    3: [[0,0,0],[0,1,0],[0,0,0]],
    5: [[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,0,0,0]],
    1: [[1]]
  }
};

let state = {
  input: [
    [1, 0, 2, 1, 0, 1, 2],
    [0, 1, 3, 0, 1, 2, 0],
    [2, 0, 1, 2, 3, 0, 1],
    [1, 3, 0, 1, 0, 2, 1],
    [0, 2, 1, 3, 1, 0, 2],
    [1, 0, 2, 0, 2, 1, 0],
    [2, 1, 0, 1, 0, 3, 1]
  ],
  kernel: [[0,-1,0],[-1,5,-1],[0,-1,0]],
  kernelSize: 3,
  stride: 1,
  padding: 0,
  speed: 1,
  currentStep: -1,
  isPlaying: false,
  animTimer: null,
  result: null,
  activePreset: 'sharpen'
};

export function initConvolution() {
  const container = document.getElementById('convolution-container');
  if (!container) return;

  setupControls();
  recompute();
  render();
}

function setupControls() {
  // Kernel size
  const kernelSlider = document.getElementById('conv-kernel-slider');
  const kernelVal = document.getElementById('conv-kernel-val');
  kernelSlider.addEventListener('input', () => {
    state.kernelSize = parseInt(kernelSlider.value);
    kernelVal.textContent = `${state.kernelSize}x${state.kernelSize}`;
    updateKernelFromPreset();
    resetAnim();
    recompute();
    render();
  });

  // Stride
  const strideSlider = document.getElementById('conv-stride-slider');
  const strideVal = document.getElementById('conv-stride-val');
  strideSlider.addEventListener('input', () => {
    state.stride = parseInt(strideSlider.value);
    strideVal.textContent = state.stride;
    resetAnim();
    recompute();
    render();
  });

  // Padding
  const padSlider = document.getElementById('conv-padding-slider');
  const padVal = document.getElementById('conv-padding-val');
  padSlider.addEventListener('input', () => {
    state.padding = parseInt(padSlider.value);
    padVal.textContent = state.padding;
    resetAnim();
    recompute();
    render();
  });

  // Speed
  const speedSlider = document.getElementById('conv-speed-slider');
  const speedVal = document.getElementById('conv-speed-val');
  speedSlider.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedVal.textContent = `${state.speed}x`;
  });

  // Playback controls
  document.getElementById('conv-play').addEventListener('click', play);
  document.getElementById('conv-pause').addEventListener('click', pause);
  document.getElementById('conv-prev-step').addEventListener('click', prevStep);
  document.getElementById('conv-next-step').addEventListener('click', nextStep);
  document.getElementById('conv-reset').addEventListener('click', () => { resetAnim(); render(); });

  // Presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activePreset = btn.dataset.preset;
      updateKernelFromPreset();
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      resetAnim();
      recompute();
      render();
    });
  });

  // Set initial active preset
  document.querySelector(`.preset-btn[data-preset="${state.activePreset}"]`)?.classList.add('active');
}

function updateKernelFromPreset() {
  const preset = PRESETS[state.activePreset];
  if (preset && preset[state.kernelSize]) {
    state.kernel = preset[state.kernelSize].map(r => [...r]);
  } else {
    // generate identity
    const k = state.kernelSize;
    state.kernel = Array.from({ length: k }, (_, i) =>
      Array.from({ length: k }, (_, j) => (i === Math.floor(k/2) && j === Math.floor(k/2)) ? 1 : 0)
    );
  }
}

function recompute() {
  const outW = outputSize(state.input[0].length, state.kernelSize, state.padding, state.stride);
  const outH = outputSize(state.input.length, state.kernelSize, state.padding, state.stride);

  if (outW < 1 || outH < 1) {
    state.result = null;
    return;
  }

  state.result = convolve2D(state.input, state.kernel, state.stride, state.padding);
  updateInfo();
}

function updateInfo() {
  const info = document.getElementById('conv-info');
  if (!info) return;
  const W = state.input[0].length;
  const H = state.input.length;
  const K = state.kernelSize;
  const P = state.padding;
  const S = state.stride;
  const oW = outputSize(W, K, P, S);
  const oH = outputSize(H, K, P, S);
  const totalSteps = state.result ? state.result.steps.length : 0;

  info.innerHTML = `입력: ${H}x${W} | 커널: ${K}x${K} | Stride: ${S} | Padding: ${P} → 출력: ${oH}x${oW} (${totalSteps}단계)` +
    ` | O = (${W} - ${K} + 2*${P}) / ${S} + 1 = ${oW}`;
}

function render() {
  const container = document.getElementById('convolution-container');
  if (!container || !state.result) {
    if (container) container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">유효하지 않은 파라미터입니다. 커널 크기, 스트라이드, 패딩을 조정해 주세요.</p>';
    return;
  }

  container.innerHTML = '';

  // Input panel
  const inputPanel = document.createElement('div');
  inputPanel.className = 'conv-panel';
  inputPanel.innerHTML = '<div class="conv-panel-title" style="color:var(--input-color)">입력 (패딩 포함)</div>';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'conv-grid-wrapper';

  const inputGrid = document.createElement('div');
  inputGrid.className = 'conv-grid';
  inputGrid.id = 'conv-input-grid';

  const padded = state.result.padded;
  const P = state.padding;
  const { min: imin, max: imax } = arrayMinMax(padded);

  renderGrid(inputGrid, padded, {
    editable: true,
    idPrefix: 'ci',
    colorFn: (v, i, j) => {
      const isPad = i < P || j < P || i >= padded.length - P || j >= padded[0].length - P;
      if (isPad) return 'rgba(79, 195, 247, 0.08)';
      return valueToColor(v, imin, imax, 'blue');
    },
    onEdit: (i, j, newVal) => {
      if (i >= P && j >= P && i < padded.length - P && j < padded[0].length - P) {
        state.input[i - P][j - P] = newVal;
        resetAnim();
        recompute();
        render();
      }
    }
  });

  // Mark padding cells
  const paddedH = padded.length;
  const paddedW = padded[0].length;
  for (let i = 0; i < paddedH; i++) {
    for (let j = 0; j < paddedW; j++) {
      if (i < P || j < P || i >= paddedH - P || j >= paddedW - P) {
        const cell = inputGrid.querySelector(`[data-row="${i}"][data-col="${j}"]`);
        if (cell) cell.classList.add('padding-cell');
      }
    }
  }

  // Kernel overlay
  const overlay = document.createElement('div');
  overlay.className = 'kernel-overlay';
  overlay.id = 'kernel-overlay';
  overlay.style.width = (state.kernelSize * 54) + 'px';
  overlay.style.height = (state.kernelSize * 54) + 'px';
  overlay.style.display = 'none';

  inputWrapper.appendChild(inputGrid);
  inputWrapper.appendChild(overlay);
  inputPanel.appendChild(inputWrapper);

  // Kernel display below input
  const kernelTitle = document.createElement('div');
  kernelTitle.className = 'conv-panel-title';
  kernelTitle.style.color = 'var(--kernel-color)';
  kernelTitle.style.marginTop = '12px';
  kernelTitle.textContent = '커널';
  inputPanel.appendChild(kernelTitle);

  const kernelGrid = document.createElement('div');
  kernelGrid.className = 'conv-grid';
  kernelGrid.id = 'conv-kernel-grid';
  const { min: kmin, max: kmax } = arrayMinMax(state.kernel);
  renderGrid(kernelGrid, state.kernel, {
    editable: true,
    idPrefix: 'ck',
    colorFn: (v) => valueToColor(v, kmin, kmax, 'orange'),
    onEdit: (i, j, newVal) => {
      state.kernel[i][j] = newVal;
      resetAnim();
      recompute();
      render();
    }
  });
  inputPanel.appendChild(kernelGrid);

  container.appendChild(inputPanel);

  // Operation detail panel
  const opPanel = document.createElement('div');
  opPanel.className = 'op-detail';
  opPanel.id = 'op-detail';
  opPanel.innerHTML = '<h4>연산 상세</h4><p style="color:var(--text-secondary);font-size:0.8rem;">재생 또는 단계 이동으로<br>연산 과정을 확인하세요.</p>';
  container.appendChild(opPanel);

  // Output panel
  const outputPanel = document.createElement('div');
  outputPanel.className = 'conv-panel';
  outputPanel.innerHTML = '<div class="conv-panel-title" style="color:var(--output-color)">출력</div>';

  const outputGrid = document.createElement('div');
  outputGrid.className = 'conv-grid';
  outputGrid.id = 'conv-output-grid';

  const outRows = state.result.output.length;
  const outCols = state.result.output[0].length;
  const emptyOutput = Array.from({ length: outRows }, () => Array(outCols).fill(''));

  outputGrid.style.gridTemplateColumns = `repeat(${outCols}, 52px)`;
  for (let i = 0; i < outRows; i++) {
    for (let j = 0; j < outCols; j++) {
      const cell = document.createElement('div');
      cell.className = 'conv-cell';
      cell.id = `co-${i}-${j}`;
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.textContent = '';
      cell.style.background = 'var(--bg-card)';
      outputGrid.appendChild(cell);
    }
  }

  outputPanel.appendChild(outputGrid);
  container.appendChild(outputPanel);

  // If we have a current step, show it
  if (state.currentStep >= 0) {
    showStep(state.currentStep);
  }
}

function showStep(stepIdx) {
  if (!state.result || stepIdx < 0 || stepIdx >= state.result.steps.length) return;

  const step = state.result.steps[stepIdx];
  const K = state.kernelSize;
  const padded = state.result.padded;

  // Position overlay
  const overlay = document.getElementById('kernel-overlay');
  if (overlay) {
    overlay.style.display = 'block';
    const firstPos = step.positions[0];
    overlay.style.top = (firstPos.row * 54) + 'px';
    overlay.style.left = (firstPos.col * 54) + 'px';
  }

  // Clear active highlights
  document.querySelectorAll('#conv-input-grid .conv-cell.active').forEach(c => c.classList.remove('active'));

  // Highlight active input cells
  step.positions.forEach(p => {
    const cell = document.querySelector(`#ci-${p.row}-${p.col}`);
    if (cell) cell.classList.add('active');
  });

  // Update operation detail
  const opPanel = document.getElementById('op-detail');
  if (opPanel) {
    let termsHTML = '';
    step.positions.forEach((p, idx) => {
      const sign = idx > 0 ? ' + ' : '';
      termsHTML += `<span class="op-term">${sign}${fmt(p.val)}×${fmt(p.weight)}</span>`;
    });
    opPanel.innerHTML = `
      <h4>단계 ${stepIdx + 1}/${state.result.steps.length}</h4>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;">
        출력 위치: [${step.outRow}, ${step.outCol}]
      </div>
      <div class="op-terms">${termsHTML}</div>
      <div class="op-result">= ${fmt(step.sum)}</div>
    `;
  }

  // Fill output cells up to current step
  const { min: omin, max: omax } = arrayMinMax(state.result.output);
  for (let s = 0; s <= stepIdx; s++) {
    const st = state.result.steps[s];
    const cell = document.getElementById(`co-${st.outRow}-${st.outCol}`);
    if (cell) {
      cell.textContent = fmt(st.sum);
      cell.style.background = valueToColor(st.sum, omin, omax, 'green');
      if (s === stepIdx) {
        cell.classList.add('computed');
        // Remove animation class after it completes
        setTimeout(() => cell.classList.remove('computed'), 300);
      }
    }
  }
}

function play() {
  if (!state.result) return;
  state.isPlaying = true;
  document.getElementById('conv-play').disabled = true;
  document.getElementById('conv-pause').disabled = false;

  const totalSteps = state.result.steps.length;
  const interval = 600 / state.speed;

  function tick() {
    if (!state.isPlaying) return;
    state.currentStep++;
    if (state.currentStep >= totalSteps) {
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
  document.getElementById('conv-play').disabled = false;
  document.getElementById('conv-pause').disabled = true;
}

function nextStep() {
  if (!state.result) return;
  pause();
  if (state.currentStep < state.result.steps.length - 1) {
    state.currentStep++;
    showStep(state.currentStep);
  }
}

function prevStep() {
  if (!state.result) return;
  pause();
  if (state.currentStep > 0) {
    state.currentStep--;
    // Re-render to clear forward steps, then show up to current
    render();
    showStep(state.currentStep);
  }
}

function resetAnim() {
  pause();
  state.currentStep = -1;
  const overlay = document.getElementById('kernel-overlay');
  if (overlay) overlay.style.display = 'none';
}
