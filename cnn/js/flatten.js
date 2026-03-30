// ===== Section 7: Flatten & FC — 전체 데이터 흐름 시각화 =====
import { fmt, valueToColor, arrayMinMax } from './utils.js';

const CLASSES = ['비행기','자동차','새','고양이','사슴','개','개구리','말','배','트럭'];
const ICONS  = ['✈','🚗','🐦','🐱','🦌','🐶','🐸','🐴','🚢','🚛'];
const CH_COLORS = ['#4FC3F7','#FFB74D','#81C784','#CE93D8'];
const CH_RGBA  = ['79,195,247','255,183,77','129,199,132','206,147,216'];

// ── 클래스별 피처맵 (4ch × 3×3) ── 서로 다른 특징 패턴
const FEATURE_MAPS = {
  비행기: [[[5,1,5],[0,4,0],[1,0,1]], [[0,3,0],[3,5,3],[0,3,0]], [[4,4,4],[1,0,1],[0,0,0]], [[0,0,0],[2,2,2],[4,4,4]]],
  자동차: [[[3,0,3],[3,5,3],[3,0,3]], [[0,4,0],[4,4,4],[0,4,0]], [[2,2,2],[0,5,0],[2,2,2]], [[1,1,1],[3,3,3],[5,5,5]]],
  새:     [[[0,5,0],[3,3,3],[5,0,5]], [[4,0,4],[0,5,0],[4,0,4]], [[1,3,1],[3,1,3],[1,3,1]], [[5,2,5],[0,0,0],[2,5,2]]],
  고양이: [[[2,5,2],[4,1,4],[0,3,0]], [[3,0,3],[0,5,0],[3,0,3]], [[5,3,5],[1,4,1],[5,3,5]], [[0,1,0],[4,0,4],[0,1,0]]],
  사슴:   [[[1,0,1],[0,5,0],[3,3,3]], [[5,5,5],[0,1,0],[0,1,0]], [[0,4,0],[4,0,4],[0,4,0]], [[3,2,3],[2,3,2],[3,2,3]]],
  개:     [[[3,4,3],[5,0,5],[1,2,1]], [[0,3,0],[3,5,3],[0,3,0]], [[4,1,4],[1,5,1],[4,1,4]], [[2,0,2],[0,4,0],[2,0,2]]],
  개구리: [[[0,0,0],[5,5,5],[3,0,3]], [[4,4,4],[0,0,0],[4,4,4]], [[2,5,2],[5,2,5],[2,5,2]], [[1,0,1],[0,3,0],[1,0,1]]],
  말:     [[[4,0,4],[0,5,0],[0,5,0]], [[1,5,1],[5,0,5],[1,5,1]], [[0,2,0],[2,0,2],[5,5,5]], [[3,3,3],[0,4,0],[0,0,0]]],
  배:     [[[5,5,5],[0,0,0],[3,3,3]], [[0,0,0],[5,5,5],[0,0,0]], [[3,1,3],[1,5,1],[3,1,3]], [[4,4,4],[2,0,2],[0,0,0]]],
  트럭:   [[[4,0,4],[4,5,4],[4,0,4]], [[0,5,0],[5,5,5],[0,0,0]], [[1,1,1],[1,5,1],[1,1,1]], [[5,3,5],[3,0,3],[0,3,0]]],
};

// ── FC 가중치 생성 (탬플릿 매칭 방식) ──
// 각 클래스의 피처맵을 정규화한 것이 해당 클래스의 가중치 행.
// 이렇게 하면 같은 클래스 이미지가 들어오면 내적이 최대 → 올바른 예측
let FC_WEIGHTS = null; // [10][36]
let FC_BIAS = null;    // [10]

function initWeights() {
  if (FC_WEIGHTS) return;
  FC_WEIGHTS = [];
  FC_BIAS = [];
  CLASSES.forEach((cls) => {
    const flat = FEATURE_MAPS[cls].flat(2);
    const norm = Math.sqrt(flat.reduce((s, v) => s + v * v, 0)) || 1;
    FC_WEIGHTS.push(flat.map(v => round4(v / norm)));
    FC_BIAS.push(0.1);
  });
}

function round4(v) { return Math.round(v * 10000) / 10000; }
function round2(v) { return Math.round(v * 100) / 100; }

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max)); // numerical stability
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// ── 전체 순전파 계산 ──
function forward(cls) {
  initWeights();
  const maps = FEATURE_MAPS[cls];
  const flat = maps.flat(2);

  // logits[i] = dot(W[i], flat) + bias[i]
  const dotDetails = []; // 각 클래스별 내적 상세
  const logits = FC_WEIGHTS.map((w, i) => {
    const terms = w.map((wj, j) => ({ w: wj, x: flat[j], prod: round2(wj * flat[j]) }));
    const sum = round2(terms.reduce((s, t) => s + t.prod, 0) + FC_BIAS[i]);
    dotDetails.push({ terms, sum });
    return sum;
  });

  const probs = softmax(logits);
  const predIdx = probs.indexOf(Math.max(...probs));

  return { maps, flat, logits, probs, predIdx, dotDetails };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let currentCls = '고양이';

export function initFlatten() {
  const container = document.getElementById('flatten-container');
  if (!container) return;
  initWeights();
  renderAll();
}

function renderAll() {
  const container = document.getElementById('flatten-container');
  container.innerHTML = '';

  const data = forward(currentCls);

  // ── 클래스 선택 ──
  const desc = el('p', { className: 'scenario-desc' },
    '입력 이미지(클래스)를 선택하면 피처맵 → Flatten → FC → Softmax 전체 과정이 바뀝니다.');
  container.appendChild(desc);

  const picker = el('div', { className: 'scenario-picker' });
  CLASSES.forEach((cls, i) => {
    const btn = el('button', {
      className: 'scenario-btn' + (cls === currentCls ? ' active' : ''),
      innerHTML: `<span class="scenario-icon">${ICONS[i]}</span><span>${cls}</span>`,
      onclick: () => { currentCls = cls; renderAll(); }
    });
    picker.appendChild(btn);
  });
  container.appendChild(picker);

  // ── Step 1: 피처맵 ──
  container.appendChild(renderFeatureMaps(data.maps));

  appendArrow(container, '↓ Flatten');

  // ── Step 2: Flatten ──
  container.appendChild(renderFlattenVector(data.flat));

  appendArrow(container, '↓ Fully Connected (가중치 × 입력 + 편향)');

  // ── Step 3: FC 계산 상세 ──
  container.appendChild(renderFcComputation(data));

  appendArrow(container, '↓ Softmax');

  // ── Step 4: 확률 + 예측 ──
  container.appendChild(renderPrediction(data));
}

// ━━━ 피처맵 렌더링 ━━━
function renderFeatureMaps(maps) {
  const section = el('div');
  section.innerHTML = '<h3>1. 피처맵 [4, 3, 3]</h3>';

  const row = el('div', { className: 'feature-maps-row' });
  maps.forEach((map, ch) => {
    const block = el('div', { className: 'feature-map' });
    block.innerHTML = `<div class="feature-map-label" style="color:${CH_COLORS[ch]}">채널 ${ch + 1}</div>`;
    const grid = el('div', { className: 'feature-map-grid', style: 'grid-template-columns:repeat(3,40px)' });
    const { max } = arrayMinMax(map);
    for (const r of map) {
      for (const v of r) {
        const cell = el('div', { className: 'feature-map-cell', textContent: v });
        cell.style.background = `rgba(${CH_RGBA[ch]},${(0.15 + (v / Math.max(max, 1)) * 0.55).toFixed(2)})`;
        cell.style.color = CH_COLORS[ch];
        grid.appendChild(cell);
      }
    }
    block.appendChild(grid);
    row.appendChild(block);
  });
  section.appendChild(row);
  return section;
}

// ━━━ Flatten 벡터 ━━━
function renderFlattenVector(flat) {
  const section = el('div');
  section.innerHTML = `<h3>2. 1D 벡터 [1, ${flat.length}]</h3>`;

  const vec = el('div', { className: 'flatten-vector' });
  flat.forEach((v, idx) => {
    const chIdx = Math.floor(idx / 9);
    const cell = el('div', { className: 'flatten-cell', textContent: v });
    cell.style.background = `rgba(${CH_RGBA[chIdx]},${(0.2 + (v / 5) * 0.5).toFixed(2)})`;
    cell.style.color = CH_COLORS[chIdx];
    cell.style.animation = `flattenSlide 0.3s ease ${idx * 0.015}s both`;
    vec.appendChild(cell);
  });

  // 인덱스 표시
  const idxRow = el('div', { className: 'flatten-vector flatten-idx-row' });
  flat.forEach((_, idx) => {
    const cell = el('div', { className: 'flatten-cell flatten-idx-cell', textContent: idx });
    idxRow.appendChild(cell);
  });

  section.appendChild(vec);
  section.appendChild(idxRow);
  return section;
}

// ━━━ FC 계산 상세 ━━━
function renderFcComputation(data) {
  const section = el('div');
  section.innerHTML = '<h3>3. FC 레이어 — 각 클래스 점수 계산</h3>';

  // 설명
  const explain = el('p', { className: 'scenario-desc' });
  explain.innerHTML = '각 출력 뉴런은 <code style="color:var(--kernel-color)">가중치 × 입력</code>의 합으로 점수(logit)를 계산합니다. 점수가 가장 높은 클래스가 예측 결과입니다.';
  section.appendChild(explain);

  // 각 클래스별 점수 행
  const table = el('div', { className: 'fc-score-table' });

  // 정렬: 예측 클래스가 위로
  const indices = CLASSES.map((_, i) => i).sort((a, b) => data.logits[b] - data.logits[a]);
  const maxLogit = Math.max(...data.logits);
  const minLogit = Math.min(...data.logits);

  indices.forEach((i, rank) => {
    const isPred = i === data.predIdx;
    const row = el('div', { className: 'fc-score-row' + (isPred ? ' fc-score-top' : '') });

    // 클래스 아이콘 + 이름
    const label = el('div', { className: 'fc-score-label' });
    label.innerHTML = `<span class="scenario-icon">${ICONS[i]}</span> ${CLASSES[i]}`;
    row.appendChild(label);

    // 계산식 요약: 상위 기여 항목 3개
    const detail = data.dotDetails[i];
    const topTerms = detail.terms
      .map((t, j) => ({ ...t, j }))
      .filter(t => t.prod !== 0)
      .sort((a, b) => Math.abs(b.prod) - Math.abs(a.prod))
      .slice(0, 4);

    const formula = el('div', { className: 'fc-score-formula' });
    const termsStr = topTerms.map(t =>
      `<span class="fc-term">${fmt(t.w, 2)}×${t.x}</span>`
    ).join(' + ') + ' + ...';
    formula.innerHTML = termsStr;
    row.appendChild(formula);

    // 점수 바
    const barWrap = el('div', { className: 'fc-score-bar-wrap' });
    const barRange = Math.max(maxLogit - minLogit, 1);
    const pct = ((data.logits[i] - minLogit) / barRange) * 100;
    const bar = el('div', { className: 'fc-score-bar' + (isPred ? ' fc-bar-top' : '') });
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = Math.max(pct, 2) + '%'; }, 50 + rank * 30);
    barWrap.appendChild(bar);
    row.appendChild(barWrap);

    // 점수 값
    const val = el('div', { className: 'fc-score-val' + (isPred ? ' fc-val-top' : '') });
    val.textContent = fmt(data.logits[i], 2);
    row.appendChild(val);

    table.appendChild(row);
  });

  section.appendChild(table);

  // ── 예측 클래스 상세 내적 펼쳐보기 ──
  section.appendChild(renderDotDetail(data));

  return section;
}

// ━━━ 예측 클래스 내적 상세 ━━━
function renderDotDetail(data) {
  const i = data.predIdx;
  const detail = data.dotDetails[i];
  const flat = data.flat;

  const box = el('div', { className: 'dot-detail-box' });
  box.innerHTML = `
    <h4>${ICONS[i]} ${CLASSES[i]} 뉴런 계산 상세</h4>
    <p class="dot-detail-desc">
      logit = Σ(w<sub>j</sub> × x<sub>j</sub>) + bias
      = <strong>${fmt(detail.sum, 2)}</strong>
    </p>
  `;

  // 모든 항목 표 (스크롤 가능)
  const termGrid = el('div', { className: 'dot-term-grid' });

  // 헤더
  ['j', 'x<sub>j</sub>', 'w<sub>j</sub>', 'w×x'].forEach(h => {
    const hd = el('div', { className: 'dot-term-header' });
    hd.innerHTML = h;
    termGrid.appendChild(hd);
  });

  // 각 항목 — 기여도 순으로 정렬
  const sorted = detail.terms
    .map((t, j) => ({ ...t, j }))
    .sort((a, b) => Math.abs(b.prod) - Math.abs(a.prod));

  const maxProd = Math.max(...sorted.map(t => Math.abs(t.prod)));

  sorted.forEach(t => {
    const isHigh = Math.abs(t.prod) > maxProd * 0.5;

    const jCell = el('div', { className: 'dot-term-cell', textContent: t.j });
    const xCell = el('div', { className: 'dot-term-cell' });
    xCell.textContent = t.x;
    const chIdx = Math.floor(t.j / 9);
    xCell.style.color = CH_COLORS[chIdx];

    const wCell = el('div', { className: 'dot-term-cell', textContent: fmt(t.w, 3) });
    wCell.style.color = 'var(--kernel-color)';

    const pCell = el('div', { className: 'dot-term-cell' + (isHigh ? ' dot-term-high' : '') });
    pCell.textContent = fmt(t.prod, 2);

    termGrid.appendChild(jCell);
    termGrid.appendChild(xCell);
    termGrid.appendChild(wCell);
    termGrid.appendChild(pCell);
  });

  box.appendChild(termGrid);

  // 합계
  const sumLine = el('div', { className: 'dot-sum-line' });
  sumLine.innerHTML = `Σ(w×x) = ${fmt(detail.sum - FC_BIAS[i], 2)} + bias(${FC_BIAS[i]}) = <strong>${fmt(detail.sum, 2)}</strong>`;
  box.appendChild(sumLine);

  return box;
}

// ━━━ Softmax + 예측 결과 ━━━
function renderPrediction(data) {
  const section = el('div');
  section.innerHTML = '<h3>4. Softmax 확률 & 예측 결과</h3>';

  const maxIdx = data.predIdx;
  const sorted = data.probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);

  // Softmax 수식
  const expLogits = data.logits.map(l => Math.exp(l));
  const sumExp = expLogits.reduce((a, b) => a + b, 0);

  const formulaBox = el('div', { className: 'softmax-formula-section' });
  formulaBox.innerHTML = `
    <h4>Softmax 계산</h4>
    <div class="softmax-explain">
      <div class="softmax-step">
        <span class="step-num">1</span>
        exp(logit): ${CLASSES[maxIdx]}의 exp(${fmt(data.logits[maxIdx], 2)}) = <strong>${fmt(expLogits[maxIdx], 1)}</strong>
      </div>
      <div class="softmax-step">
        <span class="step-num">2</span>
        전체 합 Σexp = <strong>${fmt(sumExp, 1)}</strong>
      </div>
      <div class="softmax-step">
        <span class="step-num">3</span>
        P(${CLASSES[maxIdx]}) = ${fmt(expLogits[maxIdx], 1)} / ${fmt(sumExp, 1)} = <strong>${(data.probs[maxIdx] * 100).toFixed(1)}%</strong>
      </div>
    </div>
  `;
  section.appendChild(formulaBox);

  // 확률 바
  const probBars = el('div', { className: 'prob-bars' });
  sorted.forEach(({ p, i }, rank) => {
    const isTop = i === maxIdx;
    const row = el('div', { className: 'prob-row' + (isTop ? ' prob-row-top' : '') });
    row.innerHTML = `
      <span class="prob-icon">${ICONS[i]}</span>
      <span class="prob-label">${CLASSES[i]}</span>
      <div class="prob-bar"><div class="prob-bar-fill${isTop ? ' prob-bar-top' : ''}" style="width:0%"></div></div>
      <span class="prob-value">${(p * 100).toFixed(1)}%</span>
    `;
    probBars.appendChild(row);
    setTimeout(() => {
      row.querySelector('.prob-bar-fill').style.width = (p * 100) + '%';
    }, 60 + rank * 40);
  });
  section.appendChild(probBars);

  // 예측 카드
  const verdict = el('div', { className: 'prediction-verdict' });
  verdict.innerHTML = `
    <span class="verdict-icon">${ICONS[maxIdx]}</span>
    <div class="verdict-text">
      <div class="verdict-main">모델 예측: <strong>${CLASSES[maxIdx]}</strong></div>
      <div class="verdict-sub">
        신뢰도 ${(data.probs[maxIdx] * 100).toFixed(1)}% —
        2순위 ${ICONS[sorted[1].i]} ${CLASSES[sorted[1].i]} (${(sorted[1].p * 100).toFixed(1)}%)
      </div>
    </div>
  `;
  section.appendChild(verdict);

  return section;
}

// ━━━ 유틸 ━━━
function el(tag, props = {}) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'className') e.className = v;
    else if (k === 'innerHTML') e.innerHTML = v;
    else if (k === 'textContent') e.textContent = v;
    else if (k === 'style' && typeof v === 'string') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  return e;
}

function appendArrow(container, text) {
  const arrow = el('div', { style: 'text-align:center;font-size:1.5rem;color:var(--text-secondary);margin:14px 0;' });
  arrow.textContent = text;
  container.appendChild(arrow);
}

function getNodeYPositions(n, svgH) {
  const margin = 30;
  const available = svgH - 2 * margin - 30;
  return Array.from({ length: n }, (_, i) => margin + (i / (n - 1 || 1)) * available);
}
