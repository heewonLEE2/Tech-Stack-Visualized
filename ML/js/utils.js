// ===== ML Shared Utilities =====

/**
 * Seeded PRNG (mulberry32)
 */
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a canvas with proper DPI scaling
 */
export function createCanvas(container, width, height) {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.className = 'ml-canvas';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  container.appendChild(canvas);
  return { canvas, ctx, width, height };
}

/**
 * Clear canvas
 */
export function clearCanvas(ctx, w, h, bgColor = '#16213e') {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draw axes with labels
 * margin: { top, right, bottom, left }
 */
export function drawAxes(ctx, w, h, margin, options = {}) {
  const {
    xLabel = '',
    yLabel = '',
    xRange = [0, 1],
    yRange = [0, 1],
    gridLines = true,
    tickCount = 5,
    color = '#a0a0b0',
  } = options;

  const plotW = w - margin.left - margin.right;
  const plotH = h - margin.top - margin.bottom;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.fillStyle = color;
  ctx.font = '11px "Noto Sans KR", sans-serif';

  // X axis
  ctx.beginPath();
  ctx.moveTo(margin.left, h - margin.bottom);
  ctx.lineTo(w - margin.right, h - margin.bottom);
  ctx.stroke();

  // Y axis
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, h - margin.bottom);
  ctx.stroke();

  // Grid & ticks
  if (gridLines) {
    ctx.strokeStyle = 'rgba(160, 160, 176, 0.15)';
    ctx.lineWidth = 0.5;
  }

  for (let i = 0; i <= tickCount; i++) {
    const t = i / tickCount;

    // X ticks
    const xPx = margin.left + t * plotW;
    const xVal = xRange[0] + t * (xRange[1] - xRange[0]);
    if (gridLines && i > 0 && i < tickCount) {
      ctx.beginPath();
      ctx.moveTo(xPx, margin.top);
      ctx.lineTo(xPx, h - margin.bottom);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(fmt(xVal), xPx, h - margin.bottom + 16);

    // Y ticks
    const yPx = h - margin.bottom - t * plotH;
    const yVal = yRange[0] + t * (yRange[1] - yRange[0]);
    if (gridLines && i > 0 && i < tickCount) {
      ctx.beginPath();
      ctx.moveTo(margin.left, yPx);
      ctx.lineTo(w - margin.right, yPx);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'right';
    ctx.fillText(fmt(yVal), margin.left - 8, yPx + 4);
  }

  // Labels
  ctx.fillStyle = color;
  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  if (xLabel) {
    ctx.fillText(xLabel, margin.left + plotW / 2, h - 4);
  }
  if (yLabel) {
    ctx.save();
    ctx.translate(12, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
}

/**
 * Map data value to pixel coordinate
 */
export function mapX(val, xRange, margin, w) {
  const plotW = w - margin.left - margin.right;
  return margin.left + ((val - xRange[0]) / (xRange[1] - xRange[0])) * plotW;
}

export function mapY(val, yRange, margin, h) {
  const plotH = h - margin.top - margin.bottom;
  return (
    h - margin.bottom - ((val - yRange[0]) / (yRange[1] - yRange[0])) * plotH
  );
}

/**
 * Draw a data point (circle)
 */
export function drawPoint(ctx, x, y, radius, color, strokeColor = null) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/**
 * Draw a line between two points
 */
export function drawLine(ctx, x1, y1, x2, y2, color, lineWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/**
 * Draw an arrow
 */
export function drawArrow(ctx, x1, y1, x2, y2, color, lineWidth = 2) {
  const headLen = 8;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draw rounded rectangle
 */
export function roundRect(ctx, x, y, w, h, r, fill, stroke = null) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/**
 * Draw a contour/heatmap on canvas for a 2D function
 * fn(x, y) => value
 */
export function drawContour(ctx, w, h, margin, xRange, yRange, fn, colorMap) {
  const plotW = w - margin.left - margin.right;
  const plotH = h - margin.top - margin.bottom;
  const step = 3; // pixel step for performance

  for (let px = 0; px < plotW; px += step) {
    for (let py = 0; py < plotH; py += step) {
      const x = xRange[0] + (px / plotW) * (xRange[1] - xRange[0]);
      const y = yRange[0] + (1 - py / plotH) * (yRange[1] - yRange[0]);
      const val = fn(x, y);
      ctx.fillStyle = colorMap(val);
      ctx.fillRect(margin.left + px, margin.top + py, step, step);
    }
  }
}

/**
 * Number formatting
 */
export function fmt(v, decimals = 1) {
  if (v === 0) return '0';
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(decimals);
}

/**
 * Linear space (like numpy.linspace)
 */
export function linspace(start, end, n) {
  const arr = [];
  const step = (end - start) / (n - 1);
  for (let i = 0; i < n; i++) {
    arr.push(start + i * step);
  }
  return arr;
}

/**
 * Compute linear regression (least squares) — {w, b}
 */
export function fitLinearRegression(points) {
  const n = points.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  const w = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - w * sumX) / n;
  return { w, b };
}

/**
 * Compute MSE for given w, b on points
 */
export function computeMSE(points, w, b) {
  let sum = 0;
  for (const p of points) {
    const err = p.y - (w * p.x + b);
    sum += err * err;
  }
  return sum / points.length;
}

/**
 * Sigmoid function
 */
export function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Euclidean distance
 */
export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/**
 * Generate 2D dataset with two classes
 * type: 'circles' | 'moons' | 'blobs' | 'xor'
 */
export function generateDataset(type, n = 200, noise = 0.15, seed = 42) {
  const rng = mulberry32(seed);
  const gauss = () => {
    let u = 0,
      v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const points = [];
  const half = Math.floor(n / 2);

  switch (type) {
    case 'circles': {
      for (let i = 0; i < half; i++) {
        const angle = rng() * Math.PI * 2;
        const r = 0.3 + gauss() * noise * 0.3;
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          label: 0,
        });
      }
      for (let i = 0; i < n - half; i++) {
        const angle = rng() * Math.PI * 2;
        const r = 0.8 + gauss() * noise * 0.3;
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          label: 1,
        });
      }
      break;
    }
    case 'moons': {
      for (let i = 0; i < half; i++) {
        const angle = (i / half) * Math.PI;
        points.push({
          x: Math.cos(angle) + gauss() * noise,
          y: Math.sin(angle) + gauss() * noise,
          label: 0,
        });
      }
      for (let i = 0; i < n - half; i++) {
        const angle = (i / (n - half)) * Math.PI;
        points.push({
          x: 1 - Math.cos(angle) + gauss() * noise,
          y: 0.5 - Math.sin(angle) + gauss() * noise,
          label: 1,
        });
      }
      break;
    }
    case 'blobs': {
      const centers = [
        [-0.5, -0.5],
        [0.5, 0.5],
      ];
      for (let i = 0; i < half; i++) {
        points.push({
          x: centers[0][0] + gauss() * 0.3,
          y: centers[0][1] + gauss() * 0.3,
          label: 0,
        });
      }
      for (let i = 0; i < n - half; i++) {
        points.push({
          x: centers[1][0] + gauss() * 0.3,
          y: centers[1][1] + gauss() * 0.3,
          label: 1,
        });
      }
      break;
    }
    case 'xor': {
      for (let i = 0; i < n; i++) {
        const x = rng() * 2 - 1;
        const y = rng() * 2 - 1;
        const label = x > 0 === y > 0 ? 0 : 1;
        points.push({
          x: x + gauss() * noise * 0.2,
          y: y + gauss() * noise * 0.2,
          label,
        });
      }
      break;
    }
  }
  return points;
}

/**
 * Train/test split
 */
export function trainTestSplit(data, testRatio = 0.2, seed = 123) {
  const rng = mulberry32(seed);
  const shuffled = [...data].sort(() => rng() - 0.5);
  const splitIdx = Math.floor(shuffled.length * (1 - testRatio));
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx),
  };
}

/**
 * Cluster colors
 */
export const CLUSTER_COLORS = [
  '#4fc3f7',
  '#ff6e40',
  '#81c784',
  '#ce93d8',
  '#ffb74d',
  '#7c4dff',
  '#ef5350',
  '#26a69a',
];

/**
 * Class colors for binary classification
 */
export const CLASS_COLORS = ['#7c4dff', '#ff6e40'];
