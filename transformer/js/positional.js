// ===== Positional Encoding Visualization =====
import { renderHeatmap, renderMatrix, fmt } from './matrix.js';

const D_MODEL = 16;
const MAX_POS = 16;

// PE formula: PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
//             PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
function peValue(pos, dim) {
  const i = Math.floor(dim / 2);
  const angle = pos / Math.pow(10000, (2 * i) / D_MODEL);
  return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
}

function computePEMatrix() {
  return Array.from({ length: MAX_POS }, (_, pos) =>
    Array.from({ length: D_MODEL }, (_, dim) => peValue(pos, dim))
  );
}

export function initPositional() {
  const posSlider = document.getElementById('pos-slider');
  const dimSlider = document.getElementById('dim-slider');
  const posVal = document.getElementById('pos-val');
  const dimVal = document.getElementById('dim-val');

  const peMatrix = computePEMatrix();

  // ===== Waveform Chart =====
  function drawWaveform() {
    const canvas = document.getElementById('pe-wave-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const currentDim = parseInt(dimSlider.value);

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= h; y += h / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText('+1', 4, 14);
    ctx.fillText(' 0', 4, h / 2 - 2);
    ctx.fillText('-1', 4, h - 4);
    ctx.fillText('pos →', w - 40, h - 4);

    // Draw sin curve (dim=2i)
    const dim2i = currentDim * 2;
    if (dim2i < D_MODEL) {
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const pos = (x / w) * MAX_POS;
        const val = peValue(pos, dim2i);
        const y = h / 2 - val * (h / 2 - 20);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#4FC3F7';
      ctx.fillText(`sin (dim=${dim2i})`, w - 110, 16);
    }

    // Draw cos curve (dim=2i+1)
    const dim2i1 = currentDim * 2 + 1;
    if (dim2i1 < D_MODEL) {
      ctx.strokeStyle = '#FFB74D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const pos = (x / w) * MAX_POS;
        const val = peValue(pos, dim2i1);
        const y = h / 2 - val * (h / 2 - 20);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#FFB74D';
      ctx.fillText(`cos (dim=${dim2i1})`, w - 110, 32);
    }

    // Mark current position
    const currentPos = parseInt(posSlider.value);
    const px = (currentPos / MAX_POS) * w;
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    ctx.setLineDash([]);

    // Value indicators
    if (dim2i < D_MODEL) {
      const sv = peValue(currentPos, dim2i);
      const sy = h / 2 - sv * (h / 2 - 20);
      ctx.fillStyle = '#4FC3F7';
      ctx.beginPath(); ctx.arc(px, sy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(fmt(sv), px + 8, sy - 4);
    }
    if (dim2i1 < D_MODEL) {
      const cv = peValue(currentPos, dim2i1);
      const cy = h / 2 - cv * (h / 2 - 20);
      ctx.fillStyle = '#FFB74D';
      ctx.beginPath(); ctx.arc(px, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(fmt(cv), px + 8, cy + 14);
    }
  }

  // ===== PE Heatmap =====
  function drawHeatmap() {
    const canvas = document.getElementById('pe-heatmap-canvas');
    renderHeatmap(canvas, peMatrix, { scheme: 'diverging', cellW: 22, cellH: 16, labels: true });

    // Highlight current pos/dim
    const ctx = canvas.getContext('2d');
    const currentPos = parseInt(posSlider.value);
    const currentDim = parseInt(dimSlider.value) * 2;
    const offsetX = 30, offsetY = 20, cellW = 22, cellH = 16;

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    // Row highlight
    ctx.strokeRect(offsetX, offsetY + currentPos * cellH, D_MODEL * cellW - 1, cellH - 1);
    // Col highlight — sin dimension (2i)
    if (currentDim < D_MODEL) {
      ctx.strokeStyle = '#4FC3F7';
      ctx.strokeRect(offsetX + currentDim * cellW, offsetY, cellW - 1, MAX_POS * cellH - 1);
    }
    // Col highlight — cos dimension (2i+1)
    if (currentDim + 1 < D_MODEL) {
      ctx.strokeStyle = '#FFB74D';
      ctx.strokeRect(offsetX + (currentDim + 1) * cellW, offsetY, cellW - 1, MAX_POS * cellH - 1);
    }
  }

  // ===== Embedding + PE Addition =====
  function drawAddition() {
    const viz = document.getElementById('pe-addition-viz');
    viz.innerHTML = '';
    const currentPos = parseInt(posSlider.value);

    // Fake embedding vector (d=8 for display)
    const dShow = 8;
    const embedding = Array.from({ length: dShow }, () => +(Math.random() * 2 - 1).toFixed(2));
    const pe = Array.from({ length: dShow }, (_, d) => +peValue(currentPos, d).toFixed(2));
    const result = embedding.map((e, i) => +(e + pe[i]).toFixed(2));

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;';

    renderMatrix(row, [embedding], `Embedding (pos=${currentPos})`, '#5C6BC0', { cellSize: 52 });
    const plus = document.createElement('div');
    plus.style.cssText = 'display:flex;align-items:center;font-size:1.5rem;color:#888;margin:0 6px;';
    plus.textContent = '+';
    row.appendChild(plus);
    renderMatrix(row, [pe], 'PE', '#7986CB', { cellSize: 52 });
    const eq = document.createElement('div');
    eq.style.cssText = 'display:flex;align-items:center;font-size:1.5rem;color:#888;margin:0 6px;';
    eq.textContent = '=';
    row.appendChild(eq);
    renderMatrix(row, [result], '합산 결과', '#E040FB', { cellSize: 52 });

    viz.appendChild(row);
  }

  function updateAll() {
    posVal.textContent = posSlider.value;
    dimVal.textContent = dimSlider.value;
    drawWaveform();
    drawHeatmap();
    drawAddition();
  }

  posSlider.addEventListener('input', updateAll);
  dimSlider.addEventListener('input', updateAll);
  updateAll();
}
