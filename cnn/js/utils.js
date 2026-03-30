// ===== CNN Shared Utilities =====

/**
 * 출력 크기 계산: O = floor((W - K + 2P) / S) + 1
 */
export function outputSize(W, K, P, S) {
  return Math.floor((W - K + 2 * P) / S) + 1;
}

/**
 * 2D 제로 패딩
 */
export function padArray2D(arr, padding) {
  if (padding === 0) return arr.map(r => [...r]);
  const H = arr.length;
  const W = arr[0].length;
  const newH = H + 2 * padding;
  const newW = W + 2 * padding;
  const padded = Array.from({ length: newH }, () => new Array(newW).fill(0));
  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      padded[i + padding][j + padding] = arr[i][j];
    }
  }
  return padded;
}

/**
 * 2D 합성곱 — 각 단계를 기록하여 반환
 * returns { output: 2D array, steps: [{ row, col, positions, products, sum }] }
 */
export function convolve2D(input, kernel, stride = 1, padding = 0) {
  const padded = padArray2D(input, padding);
  const H = padded.length;
  const W = padded[0].length;
  const K = kernel.length;
  const outH = outputSize(H, K, 0, stride);
  const outW = outputSize(W, K, 0, stride);

  const output = [];
  const steps = [];

  for (let i = 0; i < outH; i++) {
    output.push([]);
    for (let j = 0; j < outW; j++) {
      const positions = [];
      const products = [];
      let sum = 0;
      for (let ki = 0; ki < K; ki++) {
        for (let kj = 0; kj < K; kj++) {
          const ri = i * stride + ki;
          const ci = j * stride + kj;
          const val = padded[ri][ci];
          const weight = kernel[ki][kj];
          const prod = val * weight;
          positions.push({ row: ri, col: ci, val, weight });
          products.push(prod);
          sum += prod;
        }
      }
      sum = Math.round(sum * 100) / 100;
      output[i].push(sum);
      steps.push({ outRow: i, outCol: j, positions, products, sum });
    }
  }

  return { output, steps, padded };
}

/**
 * CSS Grid 기반 셀 렌더링
 * options: { cellClass, cols, editable, cellSize, onEdit, colorFn }
 */
export function renderGrid(parent, data, options = {}) {
  const {
    cellClass = 'conv-cell',
    editable = false,
    cellSize,
    onEdit,
    colorFn,
    idPrefix = ''
  } = options;

  const rows = data.length;
  const cols = data[0].length;

  parent.innerHTML = '';
  parent.style.gridTemplateColumns = `repeat(${cols}, ${cellSize || 52}px)`;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement('div');
      cell.className = cellClass;
      cell.dataset.row = i;
      cell.dataset.col = j;
      if (idPrefix) cell.id = `${idPrefix}-${i}-${j}`;

      const val = data[i][j];
      cell.textContent = fmt(val);

      if (colorFn) {
        const color = colorFn(val, i, j);
        if (color) cell.style.background = color;
      }

      if (editable) {
        cell.classList.add('editable');
        cell.contentEditable = true;
        cell.addEventListener('blur', () => {
          const newVal = parseFloat(cell.textContent);
          if (!isNaN(newVal)) {
            data[i][j] = newVal;
            cell.textContent = fmt(newVal);
            if (onEdit) onEdit(i, j, newVal);
          } else {
            cell.textContent = fmt(data[i][j]);
          }
        });
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            cell.blur();
          }
        });
      }

      parent.appendChild(cell);
    }
  }
}

/**
 * 숫자 포맷
 */
export function fmt(v, decimals = 1) {
  if (v === 0) return '0';
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(decimals);
}

/**
 * 값 → 히트맵 색상
 * scheme: 'blue' | 'orange' | 'green' | 'purple' | 'diverging'
 */
export function valueToColor(v, min, max, scheme = 'blue') {
  const t = max === min ? 0.5 : (v - min) / (max - min);

  const schemes = {
    blue: [15, 52, 96],      // --bg-card base
    orange: [255, 183, 77],
    green: [129, 199, 132],
    purple: [206, 147, 216],
    teal: [38, 166, 154],
    red: [239, 83, 80]
  };

  if (scheme === 'diverging') {
    // negative=red, zero=dark, positive=green
    if (v < 0) {
      const nt = Math.min(1, Math.abs(v) / Math.max(Math.abs(min), 1));
      return `rgba(239, 83, 80, ${0.1 + nt * 0.6})`;
    } else if (v > 0) {
      const pt = Math.min(1, v / Math.max(max, 1));
      return `rgba(129, 199, 132, ${0.1 + pt * 0.6})`;
    }
    return 'rgba(255,255,255,0.05)';
  }

  const rgb = schemes[scheme] || schemes.blue;
  const alpha = 0.15 + t * 0.65;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * 2D 배열의 min/max
 */
export function arrayMinMax(arr) {
  let min = Infinity, max = -Infinity;
  for (const row of arr) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { min, max };
}
