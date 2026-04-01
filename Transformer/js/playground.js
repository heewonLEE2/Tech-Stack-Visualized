// ===== 실전 파이프라인 체험 =====
import {
  matmul,
  transpose,
  scaleMatrix,
  softmaxRows,
  softmax,
  renderMatrix,
  renderOp,
  renderArrow,
  fmt,
  valueToColor,
  flatValues,
} from './matrix.js';

// ===== 1. 상수 & PRNG =====
const D_MODEL = 8;
const D_FF = 32;
const NUM_HEADS = 1; // 단일 헤드 (교육용 단순화)

// mulberry32 seeded PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

// Random matrix helper
function randMatrix(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rand() - 0.5) * 2),
  );
}
function randVector(len) {
  return Array.from({ length: len }, () => (rand() - 0.5) * 2);
}

// ===== 2. 어휘 사전 =====
const SPECIAL_TOKENS = ['<PAD>', '<START>', '<END>', '<UNK>'];
const KOREAN_SYLLABLES = [
  // 자주 사용되는 한국어 음절 (~100개)
  '가',
  '나',
  '다',
  '라',
  '마',
  '바',
  '사',
  '아',
  '자',
  '차',
  '카',
  '타',
  '파',
  '하',
  '는',
  '은',
  '이',
  '가',
  '를',
  '을',
  '에',
  '서',
  '로',
  '의',
  '와',
  '과',
  '도',
  '만',
  '부',
  '터',
  '까',
  '지',
  '고',
  '며',
  '면',
  '니',
  '다',
  '요',
  '습',
  '입',
  '했',
  '된',
  '한',
  '할',
  '합',
  '해',
  '히',
  '게',
  '께',
  '세',
  '학',
  '생',
  '선',
  '님',
  '분',
  '것',
  '수',
  '때',
  '중',
  '후',
  '전',
  '내',
  '외',
  '상',
  '하',
  '좌',
  '우',
  '대',
  '소',
  '인',
  '간',
  '천',
  '지',
  '산',
  '물',
  '불',
  '바',
  '람',
  '구',
  '름',
  '오',
  '늘',
  '어',
  '제',
  '내',
  '일',
  '무',
  '엇',
  '왜',
  '어',
  '떻',
  '그',
  '저',
  '이',
  '런',
  '적',
  '들',
  '것',
  '들',
  '요',
];

// 중복 제거 후 사전 구성
const uniqueSyllables = [...new Set(KOREAN_SYLLABLES)];
const VOCAB = [...SPECIAL_TOKENS, ...uniqueSyllables];
const token2id = {};
VOCAB.forEach((tok, i) => {
  token2id[tok] = i;
});

const VOCAB_SIZE = VOCAB.length;
const PAD_ID = 0,
  START_ID = 1,
  END_ID = 2,
  UNK_ID = 3;

// ===== 3. 가중치 생성 =====
const EMBEDDING_TABLE = randMatrix(VOCAB_SIZE, D_MODEL);

// Encoder Self-Attention weights
const W_Q = randMatrix(D_MODEL, D_MODEL);
const W_K = randMatrix(D_MODEL, D_MODEL);
const W_V = randMatrix(D_MODEL, D_MODEL);
const W_O = randMatrix(D_MODEL, D_MODEL);

// FFN weights
const W1 = randMatrix(D_MODEL, D_FF);
const b1 = randVector(D_FF);
const W2 = randMatrix(D_FF, D_MODEL);
const b2 = randVector(D_MODEL);

// Decoder Masked Self-Attention weights
const W_Q_self_dec = randMatrix(D_MODEL, D_MODEL);
const W_K_self_dec = randMatrix(D_MODEL, D_MODEL);
const W_V_self_dec = randMatrix(D_MODEL, D_MODEL);

// Decoder Cross-Attention weights
const W_Q_dec = randMatrix(D_MODEL, D_MODEL);
const W_K_dec = randMatrix(D_MODEL, D_MODEL);
const W_V_dec = randMatrix(D_MODEL, D_MODEL);

// Decoder FFN weights
const W1_dec = randMatrix(D_MODEL, D_FF);
const b1_dec = randVector(D_FF);
const W2_dec = randMatrix(D_FF, D_MODEL);
const b2_dec = randVector(D_MODEL);

// Output linear layer
const W_LINEAR = randMatrix(D_MODEL, VOCAB_SIZE);

// ===== 4. Positional Encoding =====
function positionalEncoding(seqLen, dModel) {
  const PE = [];
  for (let pos = 0; pos < seqLen; pos++) {
    const row = [];
    for (let i = 0; i < dModel; i++) {
      const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
      row.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
    }
    PE.push(row);
  }
  return PE;
}

// ===== 5. LayerNorm =====
function layerNorm(matrix) {
  return matrix.map((row) => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
    const std = Math.sqrt(variance + 1e-6);
    return row.map((v) => (v - mean) / std);
  });
}

// ===== 6. ReLU =====
function relu(x) {
  return Math.max(0, x);
}

// ===== 7. 행렬 덧셈 =====
function addMatrices(A, B) {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

// ===== 8. 파이프라인 계산 =====
function computePipeline(text) {
  // Step 1: 토큰화
  const chars = text.split('');
  const tokens = ['<START>', ...chars, '<END>'];

  // Step 2: 정수 인코딩
  const ids = tokens.map((t) =>
    token2id[t] !== undefined ? token2id[t] : UNK_ID,
  );

  const seqLen = tokens.length;

  // Step 3: 임베딩 조회
  const embedding = ids.map((id) => [...EMBEDDING_TABLE[id]]);

  // Step 4: + Positional Encoding
  const PE = positionalEncoding(seqLen, D_MODEL);
  const embPlusPE = addMatrices(embedding, PE);

  // Step 5: Self-Attention
  const Qmat = matmul(embPlusPE, W_Q);
  const Kmat = matmul(embPlusPE, W_K);
  const Vmat = matmul(embPlusPE, W_V);
  const dk = D_MODEL;
  const QKt = matmul(Qmat, transpose(Kmat));
  const scaled = scaleMatrix(QKt, 1 / Math.sqrt(dk));
  const attnWeights = softmaxRows(scaled);
  const attnOutput = matmul(attnWeights, Vmat);

  // Step 6: Add & Norm (residual + layer norm)
  const residual1 = addMatrices(embPlusPE, attnOutput);
  const norm1 = layerNorm(residual1);

  // Step 7: FFN
  // ReLU(x*W1 + b1) * W2 + b2
  const xW1 = matmul(norm1, W1);
  const xW1b1 = xW1.map((row) => row.map((v, j) => v + b1[j]));
  const reluOut = xW1b1.map((row) => row.map((v) => relu(v)));
  const ffnOut = matmul(reluOut, W2).map((row) => row.map((v, j) => v + b2[j]));

  // Step 8: Add & Norm 2
  const residual2 = addMatrices(norm1, ffnOut);
  const encoderOutput = layerNorm(residual2);

  // Step 9: Autoregressive Decoder (full sub-layer pipeline)
  // Encoder K/V for Cross-Attention (shared across all decode steps)
  const encK = matmul(encoderOutput, W_K_dec);
  const encV = matmul(encoderOutput, W_V_dec);

  const MAX_DECODE_STEPS = 8;
  const decoderSteps = []; // each entry = one autoregressive step
  let decTokensSoFar = [START_ID];

  // Causal mask: lower-triangular (row i can attend to columns 0..i)
  function causalMask(scores, seqLen) {
    return scores.map((row, i) => row.map((v, j) => (j <= i ? v : -1e9)));
  }

  for (let step = 0; step < MAX_DECODE_STEPS; step++) {
    const decSeqLen = decTokensSoFar.length;
    const decTokenNames = decTokensSoFar.map((id) => VOCAB[id]);

    // Embedding + PE for all decoder tokens so far
    const decEmb = decTokensSoFar.map((id) => [...EMBEDDING_TABLE[id]]);
    const decPE = positionalEncoding(decSeqLen, D_MODEL);
    const decInput = addMatrices(decEmb, decPE);

    // ── Sub-layer 1: Masked Self-Attention ──
    const selfQ = matmul(decInput, W_Q_self_dec);
    const selfK = matmul(decInput, W_K_self_dec);
    const selfV = matmul(decInput, W_V_self_dec);
    const selfQKt = matmul(selfQ, transpose(selfK));
    const selfScaled = scaleMatrix(selfQKt, 1 / Math.sqrt(D_MODEL));
    const selfMasked = causalMask(selfScaled, decSeqLen);
    const selfAttnWeights = softmaxRows(selfMasked);
    const selfAttnOutput = matmul(selfAttnWeights, selfV);

    // ── Sub-layer 1: Add & Norm ──
    const selfResidual = addMatrices(decInput, selfAttnOutput);
    const selfNorm = layerNorm(selfResidual);

    // ── Sub-layer 2: Cross-Attention ──
    // Q from decoder (last position for display, full sequence for computation)
    const crossQ = matmul(selfNorm, W_Q_dec);
    const crossQKt = matmul(crossQ, transpose(encK));
    const crossScaled = scaleMatrix(crossQKt, 1 / Math.sqrt(D_MODEL));
    const crossWeights = softmaxRows(crossScaled);
    const crossOutput = matmul(crossWeights, encV);

    // ── Sub-layer 2: Add & Norm ──
    const crossResidual = addMatrices(selfNorm, crossOutput);
    const crossNorm = layerNorm(crossResidual);

    // ── Sub-layer 3: FFN ──
    const decXW1 = matmul(crossNorm, W1_dec);
    const decXW1b1 = decXW1.map((row) => row.map((v, j) => v + b1_dec[j]));
    const decReluOut = decXW1b1.map((row) => row.map((v) => relu(v)));
    const decFfnOut = matmul(decReluOut, W2_dec).map((row) =>
      row.map((v, j) => v + b2_dec[j]),
    );

    // ── Sub-layer 3: Add & Norm ──
    const ffnResidual = addMatrices(crossNorm, decFfnOut);
    const decoderLayerOutput = layerNorm(ffnResidual);

    // Linear + Softmax (use last position for next-token prediction)
    const lastPos = [decoderLayerOutput[decSeqLen - 1]];
    const logits = matmul(lastPos, W_LINEAR); // [1 × VOCAB_SIZE]
    // Mask out invalid tokens (PAD, START, UNK) — real models never predict these
    const maskedLogits = logits[0].map((v, i) =>
      i === PAD_ID || i === START_ID || i === UNK_ID ? -1e9 : v,
    );
    const probs = softmax(maskedLogits);

    // Top-5
    const indexed = probs.map((p, i) => ({ token: VOCAB[i], prob: p, id: i }));
    indexed.sort((a, b) => b.prob - a.prob);
    const top5 = indexed.slice(0, 5);

    // Greedy pick
    const predictedId = indexed[0].id;
    const predictedToken = indexed[0].token;

    decoderSteps.push({
      step,
      decTokenIds: [...decTokensSoFar],
      decTokenNames: [...decTokenNames],
      // Sub-layer 1: Masked Self-Attention
      selfAttnWeights,
      selfAttnOutput,
      selfNorm,
      // Sub-layer 2: Cross-Attention
      crossWeights,
      crossOutput,
      crossNorm,
      // Sub-layer 3: FFN
      decFfnOut,
      decoderLayerOutput,
      // Prediction
      probs,
      top5,
      predictedId,
      predictedToken,
    });

    // Stop if <END> predicted
    if (predictedId === END_ID) break;

    // Feed predicted token back
    decTokensSoFar.push(predictedId);
  }

  // Collect the generated sequence
  const generatedTokens = decoderSteps.map((s) => s.predictedToken);

  return {
    // Step 1
    text,
    chars,
    tokens,
    // Step 2
    ids,
    // Step 3
    embedding,
    seqLen,
    // Step 4
    PE,
    embPlusPE,
    // Step 5
    Qmat,
    Kmat,
    Vmat,
    QKt,
    scaled,
    attnWeights,
    attnOutput,
    dk,
    // Step 6
    residual1,
    norm1,
    // Step 7
    xW1,
    xW1b1,
    reluOut,
    ffnOut,
    // Step 8
    residual2,
    encoderOutput,
    // Step 9
    decoderSteps,
    generatedTokens,
  };
}

// ===== 렌더링 헬퍼 =====

function createStepBox(title, desc) {
  const box = document.createElement('div');
  box.className = 'pg-step-box';

  const h = document.createElement('h3');
  h.textContent = title;
  box.appendChild(h);

  if (desc) {
    const p = document.createElement('p');
    p.className = 'pg-step-desc';
    p.innerHTML = desc;
    box.appendChild(p);
  }
  return box;
}

function renderTokenPills(container, tokens, ids) {
  const row = document.createElement('div');
  row.className = 'pg-token-row';
  tokens.forEach((tok, i) => {
    const pill = document.createElement('span');
    const isSpecial = tok.startsWith('<') && tok.endsWith('>');
    const isUnk = ids && ids[i] === UNK_ID && !isSpecial;
    pill.className =
      'pg-token' + (isSpecial ? ' special' : '') + (isUnk ? ' unknown' : '');
    pill.textContent = tok;
    pill.style.animationDelay = i * 0.08 + 's';
    row.appendChild(pill);
  });
  container.appendChild(row);
}

function renderMappingTable(container, tokens, ids) {
  const table = document.createElement('div');
  table.className = 'pg-mapping-table';
  tokens.forEach((tok, i) => {
    const item = document.createElement('div');
    item.className = 'pg-mapping-item';
    const isUnk =
      ids[i] === UNK_ID && !(tok.startsWith('<') && tok.endsWith('>'));
    item.innerHTML = `<span class="pg-token${tok.startsWith('<') ? ' special' : ''}${isUnk ? ' unknown' : ''}">${tok}</span>
      <span class="pg-arrow">→</span>
      <span class="pg-id-badge${isUnk ? ' unknown' : ''}">${ids[i]}</span>`;
    table.appendChild(item);
  });
  container.appendChild(table);
}

function renderMatrixWithLabels(container, data, label, color, rowLabels) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:inline-block;vertical-align:top;margin:8px;';

  const lbl = document.createElement('div');
  lbl.className = 'matrix-label';
  lbl.style.color = color;
  lbl.textContent = label;
  wrapper.appendChild(lbl);

  if (rowLabels) {
    const tableEl = document.createElement('div');
    tableEl.style.cssText = 'display:flex;align-items:flex-start;';

    // Row labels column — use CSS grid with same gap as matrix-grid (2px)
    const labels = document.createElement('div');
    labels.style.cssText = 'display:grid;gap:2px;margin-right:4px;';
    rowLabels.forEach((rl) => {
      const l = document.createElement('div');
      l.style.cssText =
        'height:32px;display:flex;align-items:center;justify-content:flex-end;font-size:0.7rem;color:#999;padding-right:4px;white-space:nowrap;';
      l.textContent = rl;
      labels.appendChild(l);
    });
    tableEl.appendChild(labels);

    // Matrix grid (no extra wrapper margin)
    const cols = data[0].length;
    const cellSize = 44;
    const grid = document.createElement('div');
    grid.className = 'matrix-grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;

    const flat = flatValues(data);
    const min = Math.min(...flat),
      max = Math.max(...flat);
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.style.background = valueToColor(data[i][j], min, max);
        cell.style.color = '#fff';
        cell.style.width = cellSize + 'px';
        cell.textContent = fmt(data[i][j], 2);
        grid.appendChild(cell);
      }
    }
    tableEl.appendChild(grid);
    wrapper.appendChild(tableEl);
  } else {
    renderMatrix(wrapper, data, '', color, { cellSize: 44, decimals: 2 });
    const matrixEl = wrapper.querySelector('.matrix .matrix-label');
    if (matrixEl) matrixEl.remove();
  }

  container.appendChild(wrapper);
}

function renderHeatmapDiv(container, data, rowLabels, colLabels, title) {
  const box = document.createElement('div');
  box.style.margin = '12px 0';

  if (title) {
    const t = document.createElement('div');
    t.className = 'matrix-label';
    t.style.color = 'var(--k-color)';
    t.textContent = title;
    box.appendChild(t);
  }

  const canvas = document.createElement('canvas');
  const cellW = 40,
    cellH = 28;
  const offsetX = 60,
    offsetY = 30;
  const rows = data.length,
    cols = data[0].length;

  canvas.width = cols * cellW + offsetX + 10;
  canvas.height = rows * cellH + offsetY + 10;
  canvas.style.cssText = 'display:block;margin:0 auto;';

  const ctx = canvas.getContext('2d');
  const flat = data.flat();
  const min = Math.min(...flat),
    max = Math.max(...flat);

  // Column labels
  if (colLabels) {
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.fillStyle = '#999';
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    colLabels.forEach((l, j) => {
      ctx.fillText(
        l.length > 5 ? l.slice(0, 5) : l,
        offsetX + j * cellW + cellW / 2,
        offsetY - 8,
      );
    });
  }

  // Row labels
  if (rowLabels) {
    ctx.textAlign = 'right';
    rowLabels.forEach((l, i) => {
      ctx.fillText(
        l.length > 6 ? l.slice(0, 6) : l,
        offsetX - 6,
        offsetY + i * cellH + cellH / 2 + 4,
      );
    });
  }

  // Cells
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = valueToColor(data[i][j], min, max, 'warm');
      ctx.fillRect(
        offsetX + j * cellW,
        offsetY + i * cellH,
        cellW - 2,
        cellH - 2,
      );
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        fmt(data[i][j], 2),
        offsetX + j * cellW + cellW / 2,
        offsetY + i * cellH + cellH / 2 + 3,
      );
    }
  }

  box.appendChild(canvas);
  container.appendChild(box);
}

function renderProbBars(container, top10) {
  const barContainer = document.createElement('div');
  barContainer.className = 'pg-prob-bars';

  const maxProb = Math.max(...top10.map((t) => t.prob));

  top10.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'pg-prob-row';

    const label = document.createElement('span');
    label.className = 'pg-prob-label';
    label.textContent = `${item.token} (ID:${item.id})`;

    const barOuter = document.createElement('div');
    barOuter.className = 'pg-prob-bar';

    const barFill = document.createElement('div');
    barFill.className = 'pg-prob-bar-fill';
    const pct = (item.prob / maxProb) * 100;
    barFill.style.width = '0%';
    barFill.style.animationDelay = i * 0.05 + 's';
    // Animate after render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        barFill.style.width = pct + '%';
      });
    });

    const value = document.createElement('span');
    value.className = 'pg-prob-value';
    value.textContent = (item.prob * 100).toFixed(2) + '%';

    barOuter.appendChild(barFill);
    row.appendChild(label);
    row.appendChild(barOuter);
    row.appendChild(value);
    barContainer.appendChild(row);
  });

  container.appendChild(barContainer);
}

// ===== 10단계 렌더링 =====

const STEPS = [
  {
    title: 'Step 1: 토큰화',
    desc: '입력 문장을 글자(character) 단위로 분리하고, 시작/끝 특수 토큰을 추가합니다.',
  },
  {
    title: 'Step 2: 정수 인코딩',
    desc: '각 토큰을 어휘 사전(Vocabulary)의 정수 ID로 매핑합니다. 사전에 없는 글자는 <span style="color:var(--accent)">&lt;UNK&gt;</span>로 처리됩니다.',
  },
  {
    title: 'Step 3: 임베딩 조회',
    desc:
      '정수 ID로 임베딩 테이블에서 d_model=' +
      D_MODEL +
      ' 차원 벡터를 조회합니다.',
  },
  {
    title: 'Step 4: + Positional Encoding',
    desc: '임베딩 벡터에 위치 인코딩(PE)을 더해 위치 정보를 주입합니다. <code>최종 입력 = Embedding + PE</code>',
  },
  {
    title: 'Step 5: Self-Attention',
    desc: 'Q, K, V를 계산하고 Attention(Q,K,V) = softmax(QK<sup>T</sup>/√d<sub>k</sub>)V 를 수행합니다.',
  },
  {
    title: 'Step 6: Add & Norm ①',
    desc: 'Attention 출력과 입력(Step 4)을 잔차 연결(Residual Connection)한 뒤 LayerNorm을 적용합니다.',
  },
  {
    title: 'Step 7: Feed-Forward Network',
    desc: '<code>FFN(x) = ReLU(xW₁ + b₁)W₂ + b₂</code> — 각 위치에 동일한 FFN을 독립적으로 적용합니다.',
  },
  {
    title: 'Step 8: Add & Norm ②',
    desc: 'FFN 출력과 Step 6 결과를 잔차 연결 → LayerNorm = <strong>인코더 출력</strong>',
  },
  {
    title: 'Step 9: 디코더 (자동회귀 생성)',
    desc: '&lt;START&gt; 토큰부터 시작하여 매 스텝마다 <strong>① Masked Self-Attention → Add&amp;Norm → ② Cross-Attention → Add&amp;Norm → ③ FFN → Add&amp;Norm → Linear → Softmax</strong>를 거쳐 한 글자씩 예측합니다. 예측된 토큰을 다시 입력으로 사용하는 <strong>자동회귀(Autoregressive)</strong> 디코딩입니다.',
  },
];

function renderStep1(container, state) {
  const box = createStepBox(STEPS[0].title, STEPS[0].desc);

  const inputShow = document.createElement('div');
  inputShow.className = 'pg-input-show';
  inputShow.innerHTML = `<span style="color:var(--text-secondary)">입력:</span> <strong>"${state.text}"</strong>`;
  box.appendChild(inputShow);

  const arrow = document.createElement('div');
  arrow.style.cssText =
    'text-align:center;font-size:1.5rem;color:#888;margin:12px 0;';
  arrow.textContent = '↓';
  box.appendChild(arrow);

  renderTokenPills(box, state.tokens, state.ids);

  const info = document.createElement('div');
  info.className = 'pg-info';
  info.textContent = `총 ${state.tokens.length}개 토큰 (START + ${state.chars.length}글자 + END)`;
  box.appendChild(info);

  container.appendChild(box);
}

function renderStep2(container, state) {
  const box = createStepBox(STEPS[1].title, STEPS[1].desc);
  renderMappingTable(box, state.tokens, state.ids);

  const unkCount = state.ids.filter(
    (id, i) =>
      id === UNK_ID &&
      !(state.tokens[i].startsWith('<') && state.tokens[i].endsWith('>')),
  ).length;
  if (unkCount > 0) {
    const warn = document.createElement('div');
    warn.className = 'pg-warning';
    warn.textContent = `⚠ ${unkCount}개 토큰이 사전에 없어 UNK(ID:${UNK_ID})로 대체되었습니다.`;
    box.appendChild(warn);
  }

  container.appendChild(box);
}

function renderStep3(container, state) {
  const box = createStepBox(STEPS[2].title, STEPS[2].desc);

  const info = document.createElement('div');
  info.className = 'pg-info';
  info.textContent = `Embedding Table: [${VOCAB_SIZE} × ${D_MODEL}] → 조회 결과: [${state.seqLen} × ${D_MODEL}]`;
  box.appendChild(info);

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;overflow-x:auto;';
  renderMatrixWithLabels(
    row,
    state.embedding,
    `Embedding [${state.seqLen}×${D_MODEL}]`,
    'var(--v-color)',
    state.tokens,
  );
  box.appendChild(row);

  container.appendChild(box);
}

function renderStep4(container, state) {
  const box = createStepBox(STEPS[3].title, STEPS[3].desc);

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;overflow-x:auto;';

  renderMatrixWithLabels(
    row,
    state.embedding,
    'Embedding',
    'var(--v-color)',
    state.tokens,
  );
  renderOp(row, '+');
  renderMatrixWithLabels(row, state.PE, 'PE', 'var(--k-color)', state.tokens);
  renderOp(row, '=');
  renderMatrixWithLabels(
    row,
    state.embPlusPE,
    '최종 입력',
    'var(--q-color)',
    state.tokens,
  );

  box.appendChild(row);
  container.appendChild(box);
}

function renderStep5(container, state) {
  const box = createStepBox(STEPS[4].title, STEPS[4].desc);

  // Q, K, V matrices
  const sub1 = document.createElement('div');
  sub1.innerHTML =
    '<div class="pg-substep">Q = Input × W_Q, K = Input × W_K, V = Input × W_V</div>';
  const row1 = document.createElement('div');
  row1.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;overflow-x:auto;margin-bottom:16px;';
  renderMatrixWithLabels(
    row1,
    state.Qmat,
    `Q [${state.seqLen}×${D_MODEL}]`,
    'var(--q-color)',
    state.tokens,
  );
  renderMatrixWithLabels(
    row1,
    state.Kmat,
    `K [${state.seqLen}×${D_MODEL}]`,
    'var(--k-color)',
    state.tokens,
  );
  renderMatrixWithLabels(
    row1,
    state.Vmat,
    `V [${state.seqLen}×${D_MODEL}]`,
    'var(--v-color)',
    state.tokens,
  );
  box.appendChild(sub1);
  box.appendChild(row1);

  // Attention heatmap
  const sub2 = document.createElement('div');
  sub2.innerHTML =
    '<div class="pg-substep">Attention Weights = softmax(QK<sup>T</sup> / √d<sub>k</sub>)</div>';
  box.appendChild(sub2);
  renderHeatmapDiv(
    box,
    state.attnWeights,
    state.tokens,
    state.tokens,
    'Attention Weights (각 행의 합 = 1)',
  );

  // Output
  const sub3 = document.createElement('div');
  sub3.innerHTML =
    '<div class="pg-substep">Attention Output = Weights × V</div>';
  const row3 = document.createElement('div');
  row3.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;overflow-x:auto;';
  renderMatrixWithLabels(
    row3,
    state.attnOutput,
    `Attn Output [${state.seqLen}×${D_MODEL}]`,
    '#E040FB',
    state.tokens,
  );
  box.appendChild(sub3);
  box.appendChild(row3);

  container.appendChild(box);
}

function renderStep6(container, state) {
  const box = createStepBox(STEPS[5].title, STEPS[5].desc);

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;overflow-x:auto;';

  renderMatrixWithLabels(
    row,
    state.embPlusPE,
    'Input (Step4)',
    'var(--q-color)',
    state.tokens,
  );
  renderOp(row, '+');
  renderMatrixWithLabels(
    row,
    state.attnOutput,
    'Attn Out',
    '#E040FB',
    state.tokens,
  );
  renderOp(row, '→ LN →');
  renderMatrixWithLabels(
    row,
    state.norm1,
    'Norm₁ 출력',
    'var(--v-color)',
    state.tokens,
  );

  box.appendChild(row);
  container.appendChild(box);
}

function renderStep7(container, state) {
  const box = createStepBox(STEPS[6].title, STEPS[6].desc);

  const info = document.createElement('div');
  info.className = 'pg-info';
  info.innerHTML =
    `W₁: [${D_MODEL}×${D_FF}], b₁: [${D_FF}], W₂: [${D_FF}×${D_MODEL}], b₂: [${D_MODEL}]<br>` +
    `중간 확장: ${D_MODEL} → ${D_FF} → ${D_MODEL}`;
  box.appendChild(info);

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;overflow-x:auto;';

  renderMatrixWithLabels(
    row,
    state.norm1,
    `입력 [${state.seqLen}×${D_MODEL}]`,
    'var(--v-color)',
    state.tokens,
  );
  renderOp(row, '→ FFN →');
  renderMatrixWithLabels(
    row,
    state.ffnOut,
    `FFN 출력 [${state.seqLen}×${D_MODEL}]`,
    'var(--k-color)',
    state.tokens,
  );

  box.appendChild(row);
  container.appendChild(box);
}

function renderStep8(container, state) {
  const box = createStepBox(STEPS[7].title, STEPS[7].desc);

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;overflow-x:auto;';

  renderMatrixWithLabels(
    row,
    state.norm1,
    'Norm₁ (Step6)',
    'var(--v-color)',
    state.tokens,
  );
  renderOp(row, '+');
  renderMatrixWithLabels(
    row,
    state.ffnOut,
    'FFN Out',
    'var(--k-color)',
    state.tokens,
  );
  renderOp(row, '→ LN →');
  renderMatrixWithLabels(
    row,
    state.encoderOutput,
    '인코더 출력',
    'var(--encoder-color)',
    state.tokens,
  );

  box.appendChild(row);
  container.appendChild(box);
}

function renderStep9(container, state) {
  const box = createStepBox(STEPS[8].title, STEPS[8].desc);

  const { decoderSteps, generatedTokens } = state;

  // Generated sequence summary at top
  const seqSummary = document.createElement('div');
  seqSummary.className = 'pg-generated-seq';
  seqSummary.innerHTML = '<span class="pg-gen-label">생성된 시퀀스:</span> ';
  const seqPills = document.createElement('span');
  seqPills.className = 'pg-token-row';
  seqPills.style.display = 'inline-flex';

  // START pill
  const startPill = document.createElement('span');
  startPill.className = 'pg-token special';
  startPill.textContent = '<START>';
  seqPills.appendChild(startPill);

  generatedTokens.forEach((tok) => {
    const arrow = document.createElement('span');
    arrow.className = 'pg-gen-arrow';
    arrow.textContent = '→';
    seqPills.appendChild(arrow);

    const pill = document.createElement('span');
    const isSpecial = tok.startsWith('<') && tok.endsWith('>');
    pill.className = 'pg-token' + (isSpecial ? ' special' : '');
    pill.textContent = tok;
    seqPills.appendChild(pill);
  });
  seqSummary.appendChild(seqPills);
  box.appendChild(seqSummary);

  // Each decode step
  decoderSteps.forEach((ds, idx) => {
    const stepBox = document.createElement('div');
    stepBox.className = 'pg-decode-step';

    // Step header
    const header = document.createElement('div');
    header.className = 'pg-decode-header';
    header.innerHTML = `<span class="pg-decode-step-num">디코딩 ${idx + 1}단계</span>`;

    // Show decoder input tokens
    const inputRow = document.createElement('div');
    inputRow.className = 'pg-decode-input-row';
    inputRow.innerHTML =
      '<span class="pg-decode-input-label">디코더 입력:</span> ';
    ds.decTokenNames.forEach((tok) => {
      const p = document.createElement('span');
      const isSpecial = tok.startsWith('<') && tok.endsWith('>');
      p.className = 'pg-token small' + (isSpecial ? ' special' : '');
      p.textContent = tok;
      inputRow.appendChild(p);
    });
    header.appendChild(inputRow);
    stepBox.appendChild(header);

    // ── Sub-layer 1: Masked Self-Attention ──
    const selfAttnTitle = document.createElement('div');
    selfAttnTitle.className = 'pg-substep pg-sublayer-title';
    selfAttnTitle.innerHTML =
      '① <strong>Masked Self-Attention</strong> — 디코더 토큰끼리 attention (미래 토큰은 마스킹)';
    stepBox.appendChild(selfAttnTitle);

    renderHeatmapDiv(
      stepBox,
      ds.selfAttnWeights,
      ds.decTokenNames,
      ds.decTokenNames,
      `Masked Self-Attention Weights (causal mask 적용)`,
    );

    // ── Sub-layer 1: Add & Norm ──
    const selfNormTitle = document.createElement('div');
    selfNormTitle.className = 'pg-substep pg-sublayer-title';
    selfNormTitle.innerHTML = '→ Add & Norm: 잔차 연결 + LayerNorm';
    stepBox.appendChild(selfNormTitle);

    // ── Sub-layer 2: Cross-Attention ──
    const crossTitle = document.createElement('div');
    crossTitle.className = 'pg-substep pg-sublayer-title';
    crossTitle.innerHTML =
      '② <strong>Cross-Attention</strong> — Q=디코더, K/V=인코더 출력';
    stepBox.appendChild(crossTitle);

    // Show last row of cross-attention weights for the predicting position
    const lastIdx = ds.decTokenNames.length - 1;
    renderHeatmapDiv(
      stepBox,
      [ds.crossWeights[lastIdx]],
      [ds.decTokenNames[lastIdx]],
      state.tokens,
      `Cross-Attention (${ds.decTokenNames[lastIdx]} → 인코더)`,
    );

    // ── Sub-layer 2: Add & Norm ──
    const crossNormTitle = document.createElement('div');
    crossNormTitle.className = 'pg-substep pg-sublayer-title';
    crossNormTitle.innerHTML = '→ Add & Norm: 잔차 연결 + LayerNorm';
    stepBox.appendChild(crossNormTitle);

    // ── Sub-layer 3: FFN ──
    const ffnTitle = document.createElement('div');
    ffnTitle.className = 'pg-substep pg-sublayer-title';
    ffnTitle.innerHTML =
      '③ <strong>Feed-Forward Network</strong> — ReLU(xW₁+b₁)W₂+b₂';
    stepBox.appendChild(ffnTitle);

    // ── Sub-layer 3: Add & Norm ──
    const ffnNormTitle = document.createElement('div');
    ffnNormTitle.className = 'pg-substep pg-sublayer-title';
    ffnNormTitle.innerHTML =
      '→ Add & Norm: 잔차 연결 + LayerNorm = <strong>디코더 레이어 출력</strong>';
    stepBox.appendChild(ffnNormTitle);

    // ── Linear → Softmax ──
    const linearTitle = document.createElement('div');
    linearTitle.className = 'pg-substep pg-sublayer-title';
    linearTitle.innerHTML =
      '④ <strong>Linear → Softmax</strong> — 마지막 위치의 출력으로 다음 토큰 확률 예측';
    stepBox.appendChild(linearTitle);

    // Top-5 probability bars
    const probTitle = document.createElement('div');
    probTitle.className = 'pg-substep';
    probTitle.textContent = '상위 5개 예측 확률';
    stepBox.appendChild(probTitle);
    renderProbBars(stepBox, ds.top5);

    // Prediction result
    const result = document.createElement('div');
    result.className = 'pg-decode-result';
    const isEnd = ds.predictedId === END_ID;
    result.innerHTML =
      `예측: <span class="pg-token${isEnd ? ' special' : ''}" style="margin:0 4px;">${ds.predictedToken}</span>` +
      ` (확률 ${(ds.top5[0].prob * 100).toFixed(2)}%)` +
      (isEnd
        ? ' — <em>종료 토큰 생성, 디코딩 중단</em>'
        : ' → 다음 입력으로 피드백');
    stepBox.appendChild(result);

    box.appendChild(stepBox);
  });

  // 구조 안내
  const structure = document.createElement('div');
  structure.className = 'pg-notice pg-structure-notice';
  structure.innerHTML =
    '<strong>디코더 레이어 구조 (각 디코딩 단계마다 실행):</strong><br>' +
    '입력(Embedding+PE) → ① Masked Self-Attention → Add&Norm → ② Cross-Attention(Q=디코더, K/V=인코더) → Add&Norm → ③ FFN → Add&Norm → Linear → Softmax → 예측';
  box.appendChild(structure);

  // 면책 안내
  const notice = document.createElement('div');
  notice.className = 'pg-notice';
  notice.innerHTML =
    '⚠ <strong>참고:</strong> 가중치가 랜덤(seed=42)이므로 출력은 의미 없는 확률 분포입니다. ' +
    '그러나 <strong>Masked Self-Attention → Cross-Attention → FFN → 예측 → 피드백</strong>으로 이어지는 ' +
    '<em>디코더의 전체 서브레이어 구조와 자동회귀 디코딩 흐름</em>은 실제 Transformer와 동일합니다.';
  box.appendChild(notice);

  container.appendChild(box);
}

const stepRenderers = [
  renderStep1,
  renderStep2,
  renderStep3,
  renderStep4,
  renderStep5,
  renderStep6,
  renderStep7,
  renderStep8,
  renderStep9,
];

// ===== 초기화 =====
export function initPlayground() {
  const input = document.getElementById('pg-input');
  const runBtn = document.getElementById('pg-run-btn');
  const prevBtn = document.getElementById('pg-prev');
  const nextBtn = document.getElementById('pg-next');
  const stepLabel = document.getElementById('pg-step-label');
  const stepsContainer = document.getElementById('pg-steps-container');

  let currentStep = -1;
  let state = null;

  function updateControls() {
    if (currentStep < 0) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      stepLabel.textContent = '입력 후 "실행"을 클릭하세요';
      return;
    }
    prevBtn.disabled = currentStep === 0;
    nextBtn.disabled = currentStep === STEPS.length - 1;
    stepLabel.textContent = `${currentStep + 1} / ${STEPS.length}: ${STEPS[currentStep].title}`;
  }

  function renderCurrentStep() {
    stepsContainer.innerHTML = '';
    if (currentStep >= 0 && state) {
      stepRenderers[currentStep](stepsContainer, state);
    }
    updateControls();
  }

  function run() {
    const text = input.value.trim();
    if (!text) return;
    state = computePipeline(text);
    currentStep = 0;
    renderCurrentStep();
  }

  runBtn.addEventListener('click', () => {
    run();
    if (window.__transformerProgress)
      window.__transformerProgress.save('section-playground');
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      run();
      if (window.__transformerProgress)
        window.__transformerProgress.save('section-playground');
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      renderCurrentStep();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderCurrentStep();
    }
  });
}
