// ===== Section 4: 텐서 차원 변화 추적기 =====
import { outputSize } from './utils.js';

const PRESETS = {
  lenet: {
    name: 'LeNet-5',
    layers: [
      { type: 'input', name: 'Input', cin: 1 },
      { type: 'conv', name: 'Conv1', cout: 6, k: 5, s: 1, p: 0 },
      { type: 'relu', name: 'ReLU' },
      { type: 'pool', name: 'MaxPool', k: 2, s: 2 },
      { type: 'conv', name: 'Conv2', cout: 16, k: 5, s: 1, p: 0 },
      { type: 'relu', name: 'ReLU' },
      { type: 'pool', name: 'MaxPool', k: 2, s: 2 },
      { type: 'flatten', name: 'Flatten' },
      { type: 'fc', name: 'FC1', out: 120 },
      { type: 'fc', name: 'FC2', out: 84 },
      { type: 'output', name: 'Output', out: 10 },
    ],
  },
  simple: {
    name: 'Simple 3-layer',
    layers: [
      { type: 'input', name: 'Input', cin: 1 },
      { type: 'conv', name: 'Conv1', cout: 8, k: 3, s: 1, p: 1 },
      { type: 'relu', name: 'ReLU' },
      { type: 'pool', name: 'MaxPool', k: 2, s: 2 },
      { type: 'conv', name: 'Conv2', cout: 16, k: 3, s: 1, p: 0 },
      { type: 'relu', name: 'ReLU' },
      { type: 'pool', name: 'MaxPool', k: 2, s: 2 },
      { type: 'conv', name: 'Conv3', cout: 32, k: 3, s: 1, p: 0 },
      { type: 'relu', name: 'ReLU' },
      { type: 'flatten', name: 'Flatten' },
      { type: 'fc', name: 'FC', out: 64 },
      { type: 'output', name: 'Output', out: 10 },
    ],
  },
};

let currentPreset = 'lenet';

export function initDimensions() {
  const container = document.getElementById('dimensions-container');
  if (!container) return;

  const hSlider = document.getElementById('dim-h-slider');
  const wSlider = document.getElementById('dim-w-slider');
  const hVal = document.getElementById('dim-h-val');
  const wVal = document.getElementById('dim-w-val');

  function renderPipeline() {
    const H = parseInt(hSlider.value);
    const W = parseInt(wSlider.value);
    hVal.textContent = H;
    wVal.textContent = W;

    const preset = PRESETS[currentPreset];
    const shapes = computeShapes(preset.layers, H, W);

    container.innerHTML = `<h3 style="margin-bottom:12px">${preset.name} 파이프라인</h3>`;

    const pipeline = document.createElement('div');
    pipeline.className = 'dim-pipeline';

    shapes.forEach((item, idx) => {
      if (idx > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'dim-arrow';
        arrow.textContent = '→';
        pipeline.appendChild(arrow);
      }

      const block = document.createElement('div');
      block.className = 'dim-block';
      block.dataset.type = item.type;

      const name = document.createElement('div');
      name.className = 'dim-block-name';
      name.textContent = item.name;

      const shape = document.createElement('div');
      shape.className = 'dim-block-shape';
      shape.textContent = item.shape;

      if (item.detail) {
        const detail = document.createElement('div');
        detail.style.cssText =
          'font-size:0.8rem;color:var(--text-secondary);margin-top:4px;';
        detail.textContent = item.detail;
        block.appendChild(name);
        block.appendChild(shape);
        block.appendChild(detail);
      } else {
        block.appendChild(name);
        block.appendChild(shape);
      }

      if (item.error) {
        block.style.borderColor = 'var(--accent)';
        block.title = item.error;
      }

      pipeline.appendChild(block);
    });

    container.appendChild(pipeline);
  }

  hSlider.addEventListener('input', renderPipeline);
  wSlider.addEventListener('input', renderPipeline);

  // Preset buttons
  document.querySelectorAll('.dim-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPreset = btn.dataset.preset;
      document
        .querySelectorAll('.dim-preset-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderPipeline();
      if (window.__cnnProgress) window.__cnnProgress.save('section-dimensions');
    });
  });

  document
    .querySelector('.dim-preset-btn[data-preset="lenet"]')
    ?.classList.add('active');
  renderPipeline();
}

function computeShapes(layers, H, W) {
  let B = 1,
    C = 1,
    curH = H,
    curW = W;
  const result = [];

  for (const layer of layers) {
    switch (layer.type) {
      case 'input':
        C = layer.cin;
        result.push({
          type: 'input',
          name: layer.name,
          shape: `[${B}, ${C}, ${curH}, ${curW}]`,
        });
        break;

      case 'conv': {
        const oH = outputSize(curH, layer.k, layer.p, layer.s);
        const oW = outputSize(curW, layer.k, layer.p, layer.s);
        if (oH < 1 || oW < 1) {
          result.push({
            type: 'conv',
            name: layer.name,
            shape: 'INVALID',
            detail: `k=${layer.k}, s=${layer.s}, p=${layer.p}`,
            error: `출력 크기 < 1: (${curH}-${layer.k}+2*${layer.p})/${layer.s}+1`,
          });
          return result;
        }
        C = layer.cout;
        curH = oH;
        curW = oW;
        result.push({
          type: 'conv',
          name: layer.name,
          shape: `[${B}, ${C}, ${curH}, ${curW}]`,
          detail: `k=${layer.k}, s=${layer.s}, p=${layer.p}`,
        });
        break;
      }

      case 'relu':
        result.push({
          type: 'relu',
          name: layer.name,
          shape: `[${B}, ${C}, ${curH}, ${curW}]`,
          detail: 'shape 변화 없음',
        });
        break;

      case 'pool': {
        const oH = outputSize(curH, layer.k, 0, layer.s);
        const oW = outputSize(curW, layer.k, 0, layer.s);
        if (oH < 1 || oW < 1) {
          result.push({
            type: 'pool',
            name: layer.name,
            shape: 'INVALID',
            detail: `k=${layer.k}, s=${layer.s}`,
            error: `출력 크기 < 1`,
          });
          return result;
        }
        curH = oH;
        curW = oW;
        result.push({
          type: 'pool',
          name: layer.name,
          shape: `[${B}, ${C}, ${curH}, ${curW}]`,
          detail: `k=${layer.k}, s=${layer.s}`,
        });
        break;
      }

      case 'flatten': {
        const flatSize = C * curH * curW;
        result.push({
          type: 'flatten',
          name: layer.name,
          shape: `[${B}, ${flatSize}]`,
          detail: `${C}×${curH}×${curW} = ${flatSize}`,
        });
        C = flatSize;
        curH = 1;
        curW = 1;
        break;
      }

      case 'fc':
        result.push({
          type: 'fc',
          name: layer.name,
          shape: `[${B}, ${layer.out}]`,
          detail: `${C} → ${layer.out}`,
        });
        C = layer.out;
        break;

      case 'output':
        result.push({
          type: 'output',
          name: layer.name,
          shape: `[${B}, ${layer.out}]`,
          detail: `${layer.out} classes`,
        });
        break;
    }
  }

  return result;
}
