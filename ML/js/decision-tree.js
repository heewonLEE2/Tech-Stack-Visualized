// ===== Decision Tree Visualization =====
import {
  createCanvas,
  clearCanvas,
  drawAxes,
  mapX,
  mapY,
  drawPoint,
  fmt,
  generateDataset,
  CLASS_COLORS,
  CLUSTER_COLORS,
} from './utils.js';

const CW = 500,
  CH = 380;
const margin = { top: 30, right: 20, bottom: 40, left: 50 };
const xRange = [-2.5, 2.5],
  yRange = [-2.5, 2.5];

// Simple decision tree builder (axis-aligned splits, classification)
function giniImpurity(counts, total) {
  if (total === 0) return 0;
  let sum = 0;
  for (const c of counts) sum += (c / total) ** 2;
  return 1 - sum;
}

function entropy(counts, total) {
  if (total === 0) return 0;
  let sum = 0;
  for (const c of counts) {
    const p = c / total;
    if (p > 0) sum -= p * Math.log2(p);
  }
  return sum;
}

function buildTree(points, maxDepth, criterion = 'gini') {
  const impurityFn = criterion === 'gini' ? giniImpurity : entropy;

  function countLabels(pts) {
    const counts = [0, 0];
    for (const p of pts) counts[p.label]++;
    return counts;
  }

  function majorityLabel(pts) {
    const c = countLabels(pts);
    return c[0] >= c[1] ? 0 : 1;
  }

  function split(pts, depth, xMin, xMax, yMin, yMax) {
    const counts = countLabels(pts);
    const total = pts.length;
    const currentImpurity = impurityFn(counts, total);

    if (depth >= maxDepth || total <= 2 || currentImpurity === 0) {
      return {
        leaf: true,
        label: majorityLabel(pts),
        count: total,
        counts,
        impurity: currentImpurity,
        depth,
      };
    }

    let bestGain = -1,
      bestFeature = 0,
      bestThreshold = 0,
      bestLeft = [],
      bestRight = [];

    for (const feature of [0, 1]) {
      const vals = pts
        .map((p) => (feature === 0 ? p.x : p.y))
        .sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i++) {
        const thr = (vals[i] + vals[i + 1]) / 2;
        const left = pts.filter((p) => (feature === 0 ? p.x : p.y) <= thr);
        const right = pts.filter((p) => (feature === 0 ? p.x : p.y) > thr);
        if (left.length === 0 || right.length === 0) continue;

        const leftImp = impurityFn(countLabels(left), left.length);
        const rightImp = impurityFn(countLabels(right), right.length);
        const gain =
          currentImpurity -
          (left.length / total) * leftImp -
          (right.length / total) * rightImp;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = thr;
          bestLeft = left;
          bestRight = right;
        }
      }
    }

    if (bestGain <= 0) {
      return {
        leaf: true,
        label: majorityLabel(pts),
        count: total,
        counts,
        impurity: currentImpurity,
        depth,
      };
    }

    const [lxMin, lxMax, lyMin, lyMax] =
      bestFeature === 0
        ? [xMin, bestThreshold, yMin, yMax]
        : [xMin, xMax, yMin, bestThreshold];
    const [rxMin, rxMax, ryMin, ryMax] =
      bestFeature === 0
        ? [bestThreshold, xMax, yMin, yMax]
        : [xMin, xMax, bestThreshold, yMax];

    return {
      leaf: false,
      feature: bestFeature,
      threshold: bestThreshold,
      impurity: currentImpurity,
      gain: bestGain,
      count: total,
      counts,
      depth,
      bounds: { xMin, xMax, yMin, yMax },
      left: split(bestLeft, depth + 1, lxMin, lxMax, lyMin, lyMax),
      right: split(bestRight, depth + 1, rxMin, rxMax, ryMin, ryMax),
    };
  }

  return split(points, 0, xRange[0], xRange[1], yRange[0], yRange[1]);
}

function predictTree(tree, x, y) {
  if (tree.leaf) return tree.label;
  const val = tree.feature === 0 ? x : y;
  return val <= tree.threshold
    ? predictTree(tree.left, x, y)
    : predictTree(tree.right, x, y);
}

let state = {
  maxDepth: 3,
  criterion: 'gini',
  speed: 1,
  points: [],
  tree: null,
  growthLevel: 0, // for animation: how many depth levels visible
  isPlaying: false,
  timer: null,
};

let ctxBoundary, ctxTree;

function recompute() {
  state.tree = buildTree(state.points, state.maxDepth, state.criterion);
}

function renderBoundary() {
  clearCanvas(ctxBoundary, CW, CH);

  // Decision regions
  if (state.tree) {
    const w = CW - margin.left - margin.right;
    const h = CH - margin.top - margin.bottom;
    const res = 4;
    for (let px = 0; px < w; px += res) {
      for (let py = 0; py < h; py += res) {
        const dataX = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
        const dataY = yRange[1] - (py / h) * (yRange[1] - yRange[0]);
        const label = predictTree(state.tree, dataX, dataY);
        ctxBoundary.fillStyle =
          label === 0 ? 'rgba(124,77,255,0.15)' : 'rgba(255,110,64,0.15)';
        ctxBoundary.fillRect(margin.left + px, margin.top + py, res, res);
      }
    }

    // Draw split lines
    function drawSplits(node, depth) {
      if (!node || node.leaf || depth > state.growthLevel) return;
      const { feature, threshold, bounds } = node;

      ctxBoundary.strokeStyle = `rgba(255,255,255,${0.6 - depth * 0.08})`;
      ctxBoundary.lineWidth = Math.max(1, 2.5 - depth * 0.4);
      ctxBoundary.beginPath();
      if (feature === 0) {
        const px = mapX(threshold, xRange, margin, CW);
        ctxBoundary.moveTo(px, mapY(bounds.yMax, yRange, margin, CH));
        ctxBoundary.lineTo(px, mapY(bounds.yMin, yRange, margin, CH));
      } else {
        const py = mapY(threshold, yRange, margin, CH);
        ctxBoundary.moveTo(mapX(bounds.xMin, xRange, margin, CW), py);
        ctxBoundary.lineTo(mapX(bounds.xMax, xRange, margin, CW), py);
      }
      ctxBoundary.stroke();

      drawSplits(node.left, depth + 1);
      drawSplits(node.right, depth + 1);
    }
    drawSplits(state.tree, 0);
  }

  drawAxes(ctxBoundary, CW, CH, margin, {
    xLabel: 'x₁',
    yLabel: 'x₂',
    xRange,
    yRange,
    color: '#e0e0e0',
    gridLines: true,
  });

  for (const p of state.points) {
    drawPoint(
      ctxBoundary,
      mapX(p.x, xRange, margin, CW),
      mapY(p.y, yRange, margin, CH),
      4,
      CLASS_COLORS[p.label],
    );
  }

  // Accuracy
  let correct = 0;
  for (const p of state.points) {
    if (predictTree(state.tree, p.x, p.y) === p.label) correct++;
  }
  const acc = correct / state.points.length;
  ctxBoundary.fillStyle = '#e0e0e0';
  ctxBoundary.font = '700 13px "Noto Sans KR", sans-serif';
  ctxBoundary.textAlign = 'center';
  ctxBoundary.fillText(
    `결정 경계 (depth=${state.maxDepth}, Acc=${fmt(acc, 3)})`,
    CW / 2,
    16,
  );
}

const TW = 420,
  TH = 300;

function renderTreeStructure() {
  clearCanvas(ctxTree, TW, TH);

  if (!state.tree) return;

  // Count tree nodes for layout
  function getTreeSize(node, depth) {
    if (!node || node.leaf || depth >= state.growthLevel) return 1;
    return (
      getTreeSize(node.left, depth + 1) + getTreeSize(node.right, depth + 1)
    );
  }

  const nodeR = 20;

  function drawNode(node, cx, cy, spread, depth) {
    if (!node || depth > state.growthLevel) return;

    // Clamp position to canvas bounds
    cx = Math.max(nodeR + 2, Math.min(TW - nodeR - 2, cx));
    cy = Math.max(nodeR + 2, Math.min(TH - nodeR - 20, cy));

    const featureNames = ['x₁', 'x₂'];
    const isLeaf = node.leaf || depth >= state.growthLevel;

    // Draw edges to children
    if (!isLeaf) {
      const childY = cy + 55;
      const leftX = cx - spread;
      const rightX = cx + spread;

      ctxTree.strokeStyle = '#666';
      ctxTree.lineWidth = 1.5;
      ctxTree.beginPath();
      ctxTree.moveTo(cx, cy + nodeR);
      ctxTree.lineTo(leftX, childY - nodeR);
      ctxTree.stroke();
      ctxTree.beginPath();
      ctxTree.moveTo(cx, cy + nodeR);
      ctxTree.lineTo(rightX, childY - nodeR);
      ctxTree.stroke();

      // Edge labels
      ctxTree.font = '9px "Noto Sans KR", sans-serif';
      ctxTree.fillStyle = '#aaa';
      ctxTree.textAlign = 'center';
      ctxTree.fillText('≤', (cx + leftX) / 2 - 8, (cy + childY) / 2);
      ctxTree.fillText('>', (cx + rightX) / 2 + 8, (cy + childY) / 2);

      drawNode(node.left, leftX, childY, spread * 0.5, depth + 1);
      drawNode(node.right, rightX, childY, spread * 0.5, depth + 1);
    }

    // Node circle
    const impStr = state.criterion === 'gini' ? 'G' : 'H';
    if (isLeaf || node.leaf) {
      const color = CLASS_COLORS[node.leaf ? node.label : 0];
      ctxTree.fillStyle = color + '40';
      ctxTree.strokeStyle = color;
    } else {
      ctxTree.fillStyle = '#1e293b';
      ctxTree.strokeStyle = '#ffb74d';
    }
    ctxTree.lineWidth = 2;
    ctxTree.beginPath();
    ctxTree.arc(cx, cy, nodeR, 0, Math.PI * 2);
    ctxTree.fill();
    ctxTree.stroke();

    // Node text
    ctxTree.fillStyle = '#e0e0e0';
    ctxTree.font = '10px "Courier New", monospace';
    ctxTree.textAlign = 'center';
    if (isLeaf || node.leaf) {
      ctxTree.fillText(`C${node.leaf ? node.label : '?'}`, cx, cy - 3);
      ctxTree.font = '8px monospace';
      ctxTree.fillStyle = '#aaa';
      ctxTree.fillText(`n=${node.count}`, cx, cy + 10);
    } else {
      ctxTree.fillText(
        `${featureNames[node.feature]}≤${fmt(node.threshold, 1)}`,
        cx,
        cy - 3,
      );
      ctxTree.font = '8px monospace';
      ctxTree.fillStyle = '#aaa';
      ctxTree.fillText(`${impStr}=${fmt(node.impurity, 2)}`, cx, cy + 10);
    }
  }

  const startSpread = Math.min(TW * 0.35, 150);
  drawNode(state.tree, TW / 2, 35, startSpread, 0);

  ctxTree.fillStyle = '#e0e0e0';
  ctxTree.font = '700 12px "Noto Sans KR", sans-serif';
  ctxTree.textAlign = 'center';
  ctxTree.fillText('트리 구조', TW / 2, TH - 6);
}

function render() {
  renderBoundary();
  renderTreeStructure();
  updateCode();
}

function updateCode() {
  const codeEl = document.getElementById('tree-code');
  if (!codeEl) return;
  let correct = 0;
  for (const p of state.points) {
    if (predictTree(state.tree, p.x, p.y) === p.label) correct++;
  }
  codeEl.textContent = `from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(
    max_depth=${state.maxDepth}, criterion='${state.criterion}'
)
tree.fit(X_train, y_train)
accuracy = tree.score(X_test, y_test)
# accuracy = ${fmt(correct / state.points.length, 4)}`;
}

function startGrow() {
  if (state.isPlaying) return;
  state.isPlaying = true;
  state.growthLevel = 0;
  document.getElementById('tree-play').disabled = true;

  function tick() {
    if (!state.isPlaying) return;
    state.growthLevel++;
    render();
    if (state.growthLevel >= state.maxDepth) {
      state.isPlaying = false;
      document.getElementById('tree-play').disabled = false;
      if (window.__mlProgress) window.__mlProgress.save('section-tree');
      return;
    }
    state.timer = setTimeout(tick, 600 / state.speed);
  }
  tick();
}

export function initDecisionTree() {
  const container = document.getElementById('tree-container');
  if (!container) return;
  container.innerHTML = '';

  // Generate moons dataset
  state.points = generateDataset('moons', 80, 0.2, 42);
  state.maxDepth = 3;
  state.criterion = 'gini';
  state.growthLevel = 10; // show all initially

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;';
  container.appendChild(wrap);

  const boundaryDiv = document.createElement('div');
  wrap.appendChild(boundaryDiv);
  const treeDiv = document.createElement('div');
  wrap.appendChild(treeDiv);

  const { ctx: c1 } = createCanvas(boundaryDiv, CW, CH);
  ctxBoundary = c1;
  const { ctx: c2 } = createCanvas(treeDiv, TW, TH);
  ctxTree = c2;

  recompute();

  // Depth slider
  const depthSlider = document.getElementById('tree-depth-slider');
  const depthVal = document.getElementById('tree-depth-val');
  depthSlider.addEventListener('input', () => {
    state.maxDepth = parseInt(depthSlider.value);
    depthVal.textContent = state.maxDepth;
    state.growthLevel = state.maxDepth;
    recompute();
    render();
  });

  // Speed slider
  const speedSlider = document.getElementById('tree-speed-slider');
  const speedVal = document.getElementById('tree-speed-val');
  speedSlider.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedVal.textContent = state.speed + 'x';
  });

  // Criterion tabs
  document.querySelectorAll('#tree-criterion-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#tree-criterion-tabs .tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.criterion = btn.dataset.criterion;
      state.growthLevel = state.maxDepth;
      recompute();
      render();
    });
  });

  // Buttons
  document.getElementById('tree-play').addEventListener('click', startGrow);
  document.getElementById('tree-reset').addEventListener('click', () => {
    state.isPlaying = false;
    if (state.timer) clearTimeout(state.timer);
    state.growthLevel = state.maxDepth;
    document.getElementById('tree-play').disabled = false;
    recompute();
    render();
  });

  render();
}
