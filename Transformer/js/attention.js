// ===== Scaled Dot-Product Attention & Multi-Head Attention =====
import {
  matmul,
  transpose,
  scaleMatrix,
  softmaxRows,
  renderMatrix,
  renderOp,
  renderArrow,
  fmt,
} from './matrix.js';

// ===== Scaled Dot-Product Attention =====
let attnStep = 0;
const ATTN_STEPS = [
  {
    label: '단계 1/5: Q, K, V 입력',
    desc: 'Query, Key, Value 행렬을 확인합니다. 셀을 클릭하여 값을 편집할 수 있습니다.',
  },
  {
    label: '단계 2/5: QK^T 행렬곱',
    desc: 'Q와 K의 전치행렬을 곱하여 유사도 점수를 계산합니다.',
  },
  {
    label: '단계 3/5: 스케일링 (1/√d_k)',
    desc: '√d_k로 나누어 내적값이 커지는 것을 방지하고, softmax가 극단적인 분포로 포화되지 않게 합니다.',
  },
  {
    label: '단계 4/5: Softmax',
    desc: '각 행에 softmax를 적용하여 어텐션 가중치를 얻습니다.',
  },
  {
    label: '단계 5/5: V 가중합',
    desc: '어텐션 가중치와 V를 곱하여 최종 출력을 계산합니다.',
  },
];

// Default Q, K, V (4×3)
let Q = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
];
let K = [
  [1, 1, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 1],
];
let V = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
];

function computeAttention(Q, K, V) {
  const dk = K[0].length;
  const QKt = matmul(Q, transpose(K));
  const scaled = scaleMatrix(QKt, 1 / Math.sqrt(dk));
  const weights = softmaxRows(scaled);
  const output = matmul(weights, V);
  return { QKt, scaled, weights, output, dk };
}

export function initAttention() {
  const container = document.getElementById('attention-container');
  const prevBtn = document.getElementById('attn-prev');
  const nextBtn = document.getElementById('attn-next');
  const stepLabel = document.getElementById('attn-step-label');
  attnStep = 0;

  function render() {
    container.innerHTML = '';
    stepLabel.textContent = ATTN_STEPS[attnStep].label;
    prevBtn.disabled = attnStep === 0;
    nextBtn.disabled = attnStep === ATTN_STEPS.length - 1;

    // Description
    const desc = document.createElement('p');
    desc.style.cssText = 'color:#aaa;font-size:0.85rem;margin-bottom:16px;';
    desc.textContent = ATTN_STEPS[attnStep].desc;
    container.appendChild(desc);

    const row = document.createElement('div');
    row.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;';

    const { QKt, scaled, weights, output, dk } = computeAttention(Q, K, V);

    const onEdit = () => render();

    if (attnStep >= 0) {
      renderMatrix(row, Q, 'Q', 'var(--q-color)', {
        editable: true,
        onEdit: (d) => {
          Q = d;
          render();
        },
      });
      renderMatrix(row, K, 'K', 'var(--k-color)', {
        editable: true,
        onEdit: (d) => {
          K = d;
          render();
        },
      });
      renderMatrix(row, V, 'V', 'var(--v-color)', {
        editable: true,
        onEdit: (d) => {
          V = d;
          render();
        },
      });
    }

    if (attnStep >= 1) {
      renderArrow(row);
      renderMatrix(row, QKt, 'QK^T', '#e0e0e0');
    }

    if (attnStep >= 2) {
      renderOp(row, `÷ √${dk}`);
      renderMatrix(row, scaled, `Scaled (÷√${dk})`, '#e0e0e0');
    }

    if (attnStep >= 3) {
      renderOp(row, 'σ');
      renderMatrix(row, weights, 'Softmax', '#FFA726');
    }

    if (attnStep >= 4) {
      renderOp(row, '×V →');
      renderMatrix(row, output, 'Output', '#E040FB');
    }

    container.appendChild(row);
  }

  prevBtn.addEventListener('click', () => {
    if (attnStep > 0) {
      attnStep--;
      render();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (attnStep < ATTN_STEPS.length - 1) {
      attnStep++;
      render();
      if (attnStep === ATTN_STEPS.length - 1 && window.__transformerProgress) {
        window.__transformerProgress.save('section-attention');
      }
    }
  });
  render();

  // ===== Compare Mode: Scaling vs No-Scaling =====
  const compareBtn = document.getElementById('attn-compare-btn');
  const compareContainer = document.getElementById('attn-compare');
  let compareVisible = false;

  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      compareVisible = !compareVisible;
      compareContainer.style.display = compareVisible ? 'flex' : 'none';
      compareBtn.textContent = compareVisible
        ? '⚖ 비교 모드 닫기'
        : '⚖ Scaling 유무 비교';
      if (compareVisible) renderCompare();
    });
  }

  function renderCompare() {
    compareContainer.innerHTML = '';
    const dk = K[0].length;
    const QKt = matmul(Q, transpose(K));
    // Without scaling
    const noScaleWeights = softmaxRows(QKt);
    const noScaleOut = matmul(noScaleWeights, V);
    // With scaling
    const scaled = scaleMatrix(QKt, 1 / Math.sqrt(dk));
    const scaledWeights = softmaxRows(scaled);
    const scaledOut = matmul(scaledWeights, V);

    // Left: No scaling
    const left = document.createElement('div');
    left.className = 'compare-side';
    left.innerHTML = '<h4>❌ Scaling 없음 (QK<sup>T</sup>)</h4>';
    const leftRow = document.createElement('div');
    leftRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
    renderMatrix(leftRow, noScaleWeights, 'Softmax(QK^T)', '#EF5350');
    renderMatrix(leftRow, noScaleOut, 'Output', '#E040FB');
    left.appendChild(leftRow);
    const leftNote = document.createElement('p');
    leftNote.style.cssText =
      'margin-top:12px;font-size:0.82rem;color:var(--accent);';
    leftNote.textContent =
      '⚠ softmax 가중치가 극단적 (한 값에 집중) → 기울기 소실';
    left.appendChild(leftNote);

    // Right: With scaling
    const right = document.createElement('div');
    right.className = 'compare-side';
    right.innerHTML =
      '<h4>✅ Scaling 적용 (QK<sup>T</sup>/√d<sub>k</sub>)</h4>';
    const rightRow = document.createElement('div');
    rightRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
    renderMatrix(rightRow, scaledWeights, `Softmax(÷√${dk})`, '#FFA726');
    renderMatrix(rightRow, scaledOut, 'Output', '#E040FB');
    right.appendChild(rightRow);
    const rightNote = document.createElement('p');
    rightNote.style.cssText =
      'margin-top:12px;font-size:0.82rem;color:var(--v-color);';
    rightNote.textContent = '✓ 가중치가 더 균등하게 분포 → 안정적인 학습';
    right.appendChild(rightNote);

    compareContainer.appendChild(left);
    compareContainer.appendChild(right);
  }
}

// ===== Multi-Head Attention =====
export function initMultiHead() {
  const container = document.getElementById('multihead-container');
  const tabBar = document.getElementById('head-tabs');
  const slider = document.getElementById('head-count-slider');
  const valSpan = document.getElementById('head-count-val');

  let numHeads = parseInt(slider.value);
  let activeHead = 0;

  // Generate random data for heads
  function genHeadData(h) {
    const seqLen = 4,
      dHead = 3;
    const rand = () => +(Math.random() * 2 - 1).toFixed(2);
    const makeMat = () =>
      Array.from({ length: seqLen }, () => Array.from({ length: dHead }, rand));
    return { Q: makeMat(), K: makeMat(), V: makeMat() };
  }

  let headData = Array.from({ length: numHeads }, (_, i) => genHeadData(i));

  function renderTabs() {
    tabBar.innerHTML = '';
    for (let i = 0; i < numHeads; i++) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === activeHead ? ' active' : '');
      btn.textContent = `Head ${i + 1}`;
      btn.addEventListener('click', () => {
        activeHead = i;
        renderTabs();
        renderHead();
      });
      tabBar.appendChild(btn);
    }
    const concatBtn = document.createElement('button');
    concatBtn.className = 'tab-btn' + (activeHead === -1 ? ' active' : '');
    concatBtn.textContent = 'Concat → W_O';
    concatBtn.addEventListener('click', () => {
      activeHead = -1;
      renderTabs();
      renderConcat();
    });
    tabBar.appendChild(concatBtn);
  }

  function renderHead() {
    container.innerHTML = '';
    if (activeHead < 0) {
      renderConcat();
      return;
    }
    const hd = headData[activeHead];
    const { QKt, scaled, weights, output } = computeAttention(hd.Q, hd.K, hd.V);

    const title = document.createElement('h3');
    title.style.color = 'var(--text-heading)';
    title.textContent = `Head ${activeHead + 1} 어텐션 히트맵`;
    container.appendChild(title);

    const row = document.createElement('div');
    row.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;';
    renderMatrix(row, hd.Q, 'Q_h', 'var(--q-color)');
    renderMatrix(row, hd.K, 'K_h', 'var(--k-color)');
    renderMatrix(row, hd.V, 'V_h', 'var(--v-color)');
    renderArrow(row);
    renderMatrix(row, weights, 'Attn Weights', '#FFA726');
    renderArrow(row);
    renderMatrix(row, output, 'Head Output', '#E040FB');
    container.appendChild(row);
  }

  function renderConcat() {
    container.innerHTML = '';

    const title = document.createElement('h3');
    title.style.color = 'var(--text-heading)';
    title.textContent = 'Concat → Linear (W_O)';
    container.appendChild(title);

    const desc = document.createElement('p');
    desc.style.cssText = 'color:#aaa;font-size:0.85rem;margin-bottom:16px;';
    desc.textContent = `${numHeads}개 헤드의 출력을 이어붙인 뒤 선형 변환(W_O)을 적용합니다.`;
    container.appendChild(desc);

    const row = document.createElement('div');
    row.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;';

    // Compute each head output and concat
    const outputs = headData.map(
      (hd) => computeAttention(hd.Q, hd.K, hd.V).output,
    );
    // Concat columns
    const concatMat = outputs[0].map((row, i) =>
      outputs.reduce((acc, o) => acc.concat(o[i]), []),
    );

    renderMatrix(row, concatMat, 'Concat', '#CE93D8');
    renderArrow(row);

    // W_O: simple identity-like for demo
    const outDim = 3;
    const finalMat = concatMat.map((r) => {
      const out = [];
      for (let j = 0; j < outDim; j++) {
        let sum = 0;
        for (let k = 0; k < r.length; k++)
          sum += r[k] * (k % outDim === j ? 0.5 : 0.1);
        out.push(+sum.toFixed(2));
      }
      return out;
    });

    renderMatrix(row, finalMat, 'Output (W_O)', '#E040FB');
    container.appendChild(row);
  }

  slider.addEventListener('input', () => {
    numHeads = parseInt(slider.value);
    valSpan.textContent = numHeads;
    headData = Array.from({ length: numHeads }, (_, i) => genHeadData(i));
    activeHead = 0;
    renderTabs();
    renderHead();
    // Code panel sync
    const code = document.getElementById('mh-code');
    if (code) {
      code.textContent = `import torch.nn as nn\n\nmha = nn.MultiheadAttention(\n    embed_dim=512, num_heads=${numHeads}\n)\n# query, key, value: [seq_len, batch, 512]\nattn_out, attn_weights = mha(query, key, value)\n# attn_out: [seq_len, batch, 512]`;
    }
    if (window.__transformerProgress)
      window.__transformerProgress.save('section-multihead');
  });

  renderTabs();
  renderHead();

  // ===== Real Model Data =====
  const realBtn = document.getElementById('real-attn-btn');
  const realContainer = document.getElementById('real-attn-container');
  let realDataLoaded = false;

  if (realBtn && realContainer) {
    realBtn.addEventListener('click', async () => {
      const isVisible = realContainer.style.display !== 'none';
      realContainer.style.display = isVisible ? 'none' : 'block';
      realBtn.textContent = isVisible
        ? '📊 실제 모델 데이터 보기'
        : '📊 실제 모델 데이터 숨기기';
      if (!isVisible && !realDataLoaded) {
        try {
          const res = await fetch('./js/data/attention_patterns.json');
          const data = await res.json();
          realDataLoaded = true;
          realContainer.innerHTML = '';
          const label = document.createElement('div');
          label.className = 'real-data-label';
          label.textContent = '🔬 실제 학습된 모델의 어텐션 가중치입니다';
          realContainer.appendChild(label);
          const info = document.createElement('p');
          info.style.cssText =
            'color:#aaa;font-size:0.85rem;margin-bottom:12px;';
          info.textContent = `입력: "${data.tokens.join(' ')}" | ${data.num_heads}개 헤드`;
          realContainer.appendChild(info);
          data.heads.forEach((head) => {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'margin-bottom:16px;';
            const title = document.createElement('h4');
            title.style.cssText =
              'color:var(--text-heading);margin-bottom:4px;';
            title.textContent = head.name;
            wrap.appendChild(title);
            const desc = document.createElement('p');
            desc.style.cssText =
              'color:#aaa;font-size:0.82rem;margin-bottom:8px;';
            desc.textContent = head.description;
            wrap.appendChild(desc);
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:flex-start;gap:12px;';
            renderMatrix(row, head.weights, 'Attn Weights', '#FFA726');
            // Mini heatmap labels
            const labels = document.createElement('div');
            labels.style.cssText = 'font-size:0.75rem;color:#888;';
            labels.innerHTML = data.tokens
              .map((t, i) => `<div>${t}</div>`)
              .join('');
            row.appendChild(labels);
            wrap.appendChild(row);
            realContainer.appendChild(wrap);
          });
        } catch (e) {
          realContainer.innerHTML =
            '<p style="color:#e94560">데이터를 불러올 수 없습니다.</p>';
        }
      }
    });
  }
}

// ===== Decoder Special Structures =====
let decoderStep = 0;
const DEC_STEPS = [
  {
    label: '단계 1/3: Masked Self-Attention',
    desc: '미래 토큰을 참조할 수 없도록 마스크를 적용합니다.',
  },
  {
    label: '단계 2/3: Cross-Attention',
    desc: 'Q는 디코더, K/V는 인코더 출력에서 가져옵니다.',
  },
  {
    label: '단계 3/3: 자기회귀 생성',
    desc: '토큰을 하나씩 생성하며 이전 출력이 다음 입력이 됩니다.',
  },
];

export function initDecoder() {
  const container = document.getElementById('decoder-container');
  const prevBtn = document.getElementById('decoder-prev');
  const nextBtn = document.getElementById('decoder-next');
  const stepLabel = document.getElementById('decoder-step-label');
  decoderStep = 0;

  function render() {
    container.innerHTML = '';
    stepLabel.textContent = DEC_STEPS[decoderStep].label;
    prevBtn.disabled = decoderStep === 0;
    nextBtn.disabled = decoderStep === DEC_STEPS.length - 1;

    const desc = document.createElement('p');
    desc.style.cssText = 'color:#aaa;font-size:0.85rem;margin-bottom:16px;';
    desc.textContent = DEC_STEPS[decoderStep].desc;
    container.appendChild(desc);

    if (decoderStep === 0) renderMaskedAttention(container);
    else if (decoderStep === 1) renderCrossAttention(container);
    else renderAutoregressive(container);
  }

  prevBtn.addEventListener('click', () => {
    if (decoderStep > 0) {
      decoderStep--;
      render();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (decoderStep < DEC_STEPS.length - 1) {
      decoderStep++;
      render();
      if (
        decoderStep === DEC_STEPS.length - 1 &&
        window.__transformerProgress
      ) {
        window.__transformerProgress.save('section-decoder');
      }
    }
  });
  render();
}

function renderMaskedAttention(container) {
  const seqLen = 4,
    dk = 3;
  const Q_d = [
    [1, 0, 1],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
  ];
  const K_d = [
    [1, 1, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ];
  const V_d = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
  ];

  const QKt = matmul(Q_d, transpose(K_d));
  const scaledVal = 1 / Math.sqrt(dk);
  const scaled = scaleMatrix(QKt, scaledVal);

  // Apply mask: set upper triangle to -Infinity
  const masked = scaled.map((row, i) => row.map((v, j) => (j > i ? -1e9 : v)));
  const weights = softmaxRows(masked);

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;';

  renderMatrix(row, scaled, 'Scaled Scores', '#e0e0e0');
  renderOp(row, '+ Mask →');

  // Render masked matrix with visual mask overlay
  const maskedForDisplay = scaled.map((r, i) =>
    r.map((v, j) => (j > i ? -99 : +v.toFixed(2))),
  );
  const mw = renderMatrix(row, maskedForDisplay, 'Masked (−∞)', '#EF5350');

  // Color the masked cells
  const cells = mw.querySelectorAll('.matrix-cell');
  cells.forEach((cell) => {
    const ci = parseInt(cell.dataset.row);
    const cj = parseInt(cell.dataset.col);
    if (cj > ci) {
      cell.style.background = '#333';
      cell.style.color = '#666';
      cell.textContent = '−∞';
    }
  });

  renderArrow(row);
  renderMatrix(row, weights, 'Attn Weights', '#FFA726');

  container.appendChild(row);

  // Explanation
  const note = document.createElement('div');
  note.style.cssText =
    'margin-top:16px;padding:12px;background:var(--bg-card);border-radius:6px;color:var(--text-secondary);font-size:0.85rem;';
  note.innerHTML =
    '상삼각 영역(미래 위치)에 <strong>−∞</strong>를 더하면 softmax 후 해당 가중치가 <strong>0</strong>이 됩니다.<br>→ 각 토큰은 자신과 이전 토큰만 참조할 수 있습니다.';
  container.appendChild(note);
}

function renderCrossAttention(container) {
  const encOut = [
    [0.8, 0.1, 0.5],
    [0.2, 0.9, 0.3],
    [0.5, 0.5, 0.7],
    [0.1, 0.3, 0.9],
  ];
  const decQ = [
    [0.6, 0.4, 0.2],
    [0.3, 0.7, 0.5],
    [0.9, 0.1, 0.8],
    [0.4, 0.6, 0.3],
  ];

  const { weights, output } = computeAttention(decQ, encOut, encOut);

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;';

  renderMatrix(row, decQ, 'Q (디코더)', 'var(--decoder-color)');
  renderMatrix(row, encOut, 'K (인코더)', 'var(--encoder-color)');
  renderMatrix(row, encOut, 'V (인코더)', 'var(--encoder-color)');
  renderArrow(row);
  renderMatrix(row, weights, 'Cross-Attn Weights', '#FFA726');
  renderArrow(row);
  renderMatrix(row, output, 'Output', '#E040FB');

  container.appendChild(row);

  const note = document.createElement('div');
  note.style.cssText =
    'margin-top:16px;padding:12px;background:var(--bg-card);border-radius:6px;color:var(--text-secondary);font-size:0.85rem;';
  note.innerHTML =
    '<strong>Q</strong>는 디코더에서, <strong>K</strong>와 <strong>V</strong>는 인코더의 최종 출력에서 가져옵니다.<br>→ 디코더가 인코더의 정보를 "질의"하는 구조입니다.';
  container.appendChild(note);
}

function renderAutoregressive(container) {
  const tokens = ['<start>', '나는', '학생', '입니다', '<end>'];
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'text-align:center;';

  const title = document.createElement('div');
  title.style.cssText =
    'color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;';
  title.textContent = '각 시점에서 생성된 토큰이 다음 입력으로 사용됩니다:';
  wrapper.appendChild(title);

  for (let step = 0; step < tokens.length; step++) {
    const row = document.createElement('div');
    row.className = 'anim-slide-right';
    row.style.cssText = `display:flex;align-items:center;gap:8px;justify-content:center;margin:8px 0;animation-delay:${step * 0.2}s;opacity:0;`;

    const stepLabel = document.createElement('span');
    stepLabel.style.cssText =
      'color:var(--text-secondary);font-size:0.8rem;width:50px;text-align:right;';
    stepLabel.textContent = `t=${step}`;
    row.appendChild(stepLabel);

    // Input tokens up to this step
    for (let i = 0; i <= step; i++) {
      const tok = document.createElement('span');
      tok.style.cssText = `padding:4px 10px;border-radius:4px;font-size:0.8rem;margin:2px;background:${i === step ? 'var(--decoder-color)' : 'var(--bg-card)'};color:#fff;`;
      tok.textContent = tokens[i];
      row.appendChild(tok);
    }

    if (step < tokens.length - 1) {
      const arrow = document.createElement('span');
      arrow.style.cssText = 'color:#888;font-size:1rem;';
      arrow.textContent = '→';
      row.appendChild(arrow);

      const outTok = document.createElement('span');
      outTok.style.cssText =
        'padding:4px 10px;border-radius:4px;font-size:0.8rem;background:var(--accent);color:#fff;';
      outTok.textContent = tokens[step + 1];
      row.appendChild(outTok);
    } else {
      const done = document.createElement('span');
      done.style.cssText =
        'color:var(--v-color);font-size:0.8rem;margin-left:4px;';
      done.textContent = '✓ 생성 완료';
      row.appendChild(done);
    }

    wrapper.appendChild(row);
  }

  container.appendChild(wrapper);
}
