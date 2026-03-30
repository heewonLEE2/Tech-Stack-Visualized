// ===== Shared Matrix Utilities =====

// Softmax over array
export function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// Matrix multiply: A[m×n] × B[n×p] → C[m×p]
export function matmul(A, B) {
  const m = A.length, n = A[0].length, p = B[0].length;
  const C = Array.from({ length: m }, () => new Array(p).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < n; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

// Transpose matrix
export function transpose(M) {
  const rows = M.length, cols = M[0].length;
  return Array.from({ length: cols }, (_, j) =>
    Array.from({ length: rows }, (_, i) => M[i][j])
  );
}

// Scale matrix by scalar
export function scaleMatrix(M, s) {
  return M.map(row => row.map(v => v * s));
}

// Apply softmax row-wise
export function softmaxRows(M) {
  return M.map(row => softmax(row));
}

// Format number for display
export function fmt(v, decimals = 2) {
  return Number(v).toFixed(decimals);
}

// Color interpolation for heatmap
export function valueToColor(v, min, max, scheme = 'blue') {
  const t = max === min ? 0.5 : (v - min) / (max - min);
  if (scheme === 'blue') {
    const r = Math.round(10 + t * 60);
    const g = Math.round(20 + t * 140);
    const b = Math.round(80 + t * 175);
    return `rgb(${r},${g},${b})`;
  }
  if (scheme === 'warm') {
    const r = Math.round(40 + t * 215);
    const g = Math.round(20 + t * 120);
    const b = Math.round(60 - t * 30);
    return `rgb(${r},${g},${b})`;
  }
  // diverging: blue-white-red
  if (t < 0.5) {
    const s = t * 2;
    return `rgb(${Math.round(50 + s * 205)},${Math.round(50 + s * 205)},${Math.round(200 + s * 55)})`;
  } else {
    const s = (t - 0.5) * 2;
    return `rgb(${Math.round(255)},${Math.round(255 - s * 205)},${Math.round(255 - s * 205)})`;
  }
}

// Get all values from 2D matrix (for min/max)
export function flatValues(M) {
  return M.flat();
}

// Render a matrix as HTML grid
export function renderMatrix(container, data, label, colorVar, options = {}) {
  const { editable = false, cellSize = 48, onEdit = null, decimals = 2 } = options;
  const rows = data.length, cols = data[0].length;
  const flat = flatValues(data);
  const min = Math.min(...flat), max = Math.max(...flat);

  const wrapper = document.createElement('div');
  wrapper.className = 'matrix';

  const lbl = document.createElement('div');
  lbl.className = 'matrix-label';
  lbl.style.color = colorVar;
  lbl.textContent = label;
  wrapper.appendChild(lbl);

  const grid = document.createElement('div');
  grid.className = 'matrix-grid';
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell' + (editable ? ' editable' : '');
      cell.style.background = valueToColor(data[i][j], min, max);
      cell.style.color = '#fff';
      cell.style.width = cellSize + 'px';
      cell.textContent = fmt(data[i][j], decimals);
      cell.dataset.row = i;
      cell.dataset.col = j;

      if (editable) {
        cell.contentEditable = true;
        cell.addEventListener('blur', () => {
          const val = parseFloat(cell.textContent);
          if (!isNaN(val)) {
            data[i][j] = val;
            if (onEdit) onEdit(data);
          }
          cell.textContent = fmt(data[i][j], decimals);
        });
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); cell.blur(); }
        });
      }

      grid.appendChild(cell);
    }
  }

  wrapper.appendChild(grid);
  container.appendChild(wrapper);
  return wrapper;
}

// Render heatmap on canvas
export function renderHeatmap(canvas, data, options = {}) {
  const { scheme = 'blue', cellW = 20, cellH = 15, labels = null } = options;
  const ctx = canvas.getContext('2d');
  const rows = data.length, cols = data[0].length;
  const flat = flatValues(data);
  const min = Math.min(...flat), max = Math.max(...flat);

  const offsetX = labels ? 30 : 0;
  const offsetY = labels ? 20 : 0;
  canvas.width = cols * cellW + offsetX + 10;
  canvas.height = rows * cellH + offsetY + 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = valueToColor(data[i][j], min, max, scheme);
      ctx.fillRect(offsetX + j * cellW, offsetY + i * cellH, cellW - 1, cellH - 1);
    }
  }

  // Axis labels
  if (labels) {
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i < rows; i += Math.ceil(rows / 8)) {
      ctx.fillText(i, offsetX - 4, offsetY + i * cellH + cellH / 2 + 3);
    }
    ctx.textAlign = 'center';
    for (let j = 0; j < cols; j += Math.ceil(cols / 8)) {
      ctx.fillText(j, offsetX + j * cellW + cellW / 2, offsetY - 4);
    }
  }
}

// Render operator symbol between matrices
export function renderOp(container, symbol) {
  const op = document.createElement('div');
  op.style.cssText = 'display:inline-flex;align-items:center;font-size:1.5rem;color:#888;margin:0 6px;align-self:center;';
  op.textContent = symbol;
  container.appendChild(op);
  return op;
}

// Create an arrow element (→)
export function renderArrow(container) {
  return renderOp(container, '→');
}
