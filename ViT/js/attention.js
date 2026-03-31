// ===== Self-Attention 시각화 (ViT) =====

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function roundRect(ctx, x, y, w, h, r) {
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
}

export function initAttention() {
  const mapCanvas = document.getElementById('attn-map-canvas');
  const overlayCanvas = document.getElementById('attn-overlay-canvas');
  const weightsCanvas = document.getElementById('attn-weights-canvas');
  const patchSlider = document.getElementById('attn-patch-slider');
  const patchVal = document.getElementById('attn-patch-val');
  const headSlider = document.getElementById('attn-head-slider');
  const headVal = document.getElementById('attn-head-val');
  const headTypeEl = document.getElementById('attn-head-type');

  let headTypeLabels = [
    '지역적',
    '전역적',
    '행 패턴',
    '대각선',
    'CLS 집중',
    '자기 참조',
  ];
  let headTypeColors = [
    '#4fc3f7',
    '#81c784',
    '#ffb74d',
    '#ce93d8',
    '#ef5350',
    '#90a4ae',
  ];
  let usingRealData = false;

  function updateHeadTypeBadge() {
    if (!headTypeEl) return;
    const h = parseInt(headSlider.value) - 1;
    headTypeEl.textContent = headTypeLabels[h];
    headTypeEl.style.background = headTypeColors[h];
  }

  if (!mapCanvas || !overlayCanvas || !weightsCanvas) return;

  const gridSize = 3; // 3x3 패치 (교육용 단순화)
  const seqLen = gridSize * gridSize + 1; // +1 for CLS

  // 폴백: 프로시저 생성 어텐션 가중치
  function generateFallbackAttentions() {
    const fallbackLabels = ['지역적', '전역적', '행 패턴'];
    const fallbackColors = ['#4fc3f7', '#81c784', '#ffb74d'];
    const atts = [];
    for (let h = 0; h < 6; h++) {
      const rand = mulberry32(100 + h * 37);
      const attnMatrix = [];
      for (let i = 0; i < seqLen; i++) {
        const row = [];
        for (let j = 0; j < seqLen; j++) {
          let score = rand() * 2 - 1;
          if (i === j) score += 2;
          if (i === 0 || j === 0) score += 0.5;
          if (i > 0 && j > 0) {
            const ri = Math.floor((i - 1) / gridSize),
              ci = (i - 1) % gridSize;
            const rj = Math.floor((j - 1) / gridSize),
              cj = (j - 1) % gridSize;
            const dist = Math.abs(ri - rj) + Math.abs(ci - cj);
            if (h % 3 === 0) score += Math.max(0, 2 - dist);
            if (h % 3 === 1) score += dist * 0.3;
            if (h % 3 === 2) score += ri === rj ? 1.5 : 0;
          }
          row.push(score);
        }
        attnMatrix.push(softmax(row));
      }
      atts.push(attnMatrix);
    }
    headTypeLabels = fallbackLabels.concat(fallbackLabels);
    headTypeColors = fallbackColors.concat(fallbackColors);
    return atts;
  }

  // 실제 모델 데이터 로드 시도 → 성공 시 headAttentions 교체
  let headAttentions = generateFallbackAttentions();

  fetch('./js/data/attention_patterns.json')
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => {
      if (data.heads && data.heads.length === 6) {
        headAttentions = data.heads.map((h) => h.weights);
        headTypeLabels = data.heads.map((h) => h.name.replace(/\s*\(.*\)/, ''));
        headTypeColors = [
          '#4fc3f7',
          '#81c784',
          '#ffb74d',
          '#ce93d8',
          '#ef5350',
          '#90a4ae',
        ];
        usingRealData = true;
        renderAll();
      }
    })
    .catch(() => {
      /* 폴백 데이터 사용 */
    });

  // 이미지 색상 (3x3 패치)
  const patchColors = [
    [200, 100, 60],
    [180, 140, 70],
    [100, 180, 100],
    [80, 150, 200],
    [160, 80, 180],
    [220, 160, 60],
    [100, 200, 180],
    [200, 80, 120],
    [140, 140, 180],
  ];

  function getAttention() {
    const headIdx = parseInt(headSlider.value) - 1;
    return headAttentions[headIdx];
  }

  function drawAttnMap(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const patchIdx = parseInt(patchSlider.value);
    patchVal.textContent = patchIdx === 0 ? 'CLS' : `Patch ${patchIdx}`;

    const headIdx = parseInt(headSlider.value) - 1;
    const attn = getAttention();
    const weights = attn[patchIdx]; // 선택된 패치의 어텐션 가중치

    const cellSize = Math.min((W - 60) / seqLen, (H - 80) / seqLen);
    const offsetX = (W - seqLen * cellSize) / 2;
    const offsetY = 50;

    // 헤드 유형 부제 표시
    const typeLabel = headTypeLabels[headIdx];
    const typeColor = headTypeColors[headIdx];

    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${patchIdx === 0 ? 'CLS' : 'Patch ' + patchIdx} → 각 토큰에 대한 어텐션`,
      W / 2,
      18,
    );
    // 헤드 유형 부제
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = typeColor;
    ctx.fillText(`헤드 유형: ${typeLabel}`, W / 2, 36);

    // 어텐션 바 차트
    const barW = cellSize * 0.8;
    const maxBarH = H - 120;

    for (let j = 0; j < seqLen; j++) {
      const x = offsetX + j * cellSize;
      const w = weights[j];
      const barH = w * maxBarH;

      // 바
      const hue = j === 0 ? 345 : 120 + j * 15;
      const alpha = 0.3 + w * 0.7;
      ctx.fillStyle = `hsla(${hue}, 65%, 55%, ${alpha})`;
      roundRect(
        ctx,
        x + (cellSize - barW) / 2,
        offsetY + maxBarH - barH,
        barW,
        barH,
        3,
      );
      ctx.fill();

      // 값
      ctx.font = '10px monospace';
      ctx.fillStyle = '#e0e0e0';
      ctx.textAlign = 'center';
      ctx.fillText(
        w.toFixed(2),
        x + cellSize / 2,
        offsetY + maxBarH - barH - 6,
      );

      // 라벨
      ctx.font = '9px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#a0a0b0';
      ctx.fillText(
        j === 0 ? 'CLS' : `P${j}`,
        x + cellSize / 2,
        offsetY + maxBarH + 16,
      );
    }
  }

  function drawAttnOverlay(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const patchIdx = parseInt(patchSlider.value);
    const attn = getAttention();
    const weights = attn[patchIdx];

    const cellSize = W / gridSize;
    const padding = 5;

    // 이미지 패치 그리기
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const idx = r * gridSize + c;
        const [pr, pg, pb] = patchColors[idx];
        const tokenIdx = idx + 1; // offset by CLS
        const w = weights[tokenIdx];

        // 패치 색상 + 어텐션 오버레이
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.fillRect(
          c * cellSize + padding,
          r * cellSize + padding,
          cellSize - padding * 2,
          cellSize - padding * 2,
        );

        // 어텐션 오버레이 (밝기)
        ctx.fillStyle = `rgba(255, 255, 100, ${w * 0.6})`;
        ctx.fillRect(
          c * cellSize + padding,
          r * cellSize + padding,
          cellSize - padding * 2,
          cellSize - padding * 2,
        );

        // 테두리 (선택된 패치)
        if (tokenIdx === patchIdx) {
          ctx.strokeStyle = '#e94560';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            c * cellSize + padding,
            r * cellSize + padding,
            cellSize - padding * 2,
            cellSize - padding * 2,
          );
        }

        // 어텐션 값
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(
          w.toFixed(2),
          c * cellSize + cellSize / 2,
          r * cellSize + cellSize / 2,
        );
        ctx.shadowBlur = 0;

        // 패치 번호
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#ffffff88';
        ctx.fillText(
          `P${idx + 1}`,
          c * cellSize + cellSize / 2,
          r * cellSize + cellSize / 2 + 20,
        );
      }
    }

    // CLS 어텐션 표시
    if (patchIdx === 0) {
      ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#e94560';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('CLS 토큰이 모든 패치를 참조', W / 2, H - 5);
    }
  }

  function drawAttnWeights(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const attn = getAttention();
    const headIdx = parseInt(headSlider.value);
    headVal.textContent = `Head ${headIdx}`;

    const hType = headIdx - 1;
    const typeLabel = headTypeLabels[hType];
    const typeColor = headTypeColors[hType];

    const cellSize = Math.min((W - 120) / seqLen, (H - 100) / seqLen);
    const offsetX = (W - seqLen * cellSize) / 2 + 30;
    const offsetY = 55;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Head ${headIdx} - 어텐션 가중치 행렬 (softmax 후)`,
      W / 2,
      22,
    );
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = typeColor;
    ctx.fillText(`헤드 유형: ${typeLabel}`, W / 2, 40);

    // 행렬
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < seqLen; j++) {
        const w = attn[i][j];
        const brightness = Math.floor(w * 220 + 20);
        ctx.fillStyle = `rgb(${Math.floor(w * 60)}, ${Math.floor(w * 180 + 20)}, ${brightness})`;
        ctx.fillRect(
          offsetX + j * cellSize,
          offsetY + i * cellSize,
          cellSize - 1,
          cellSize - 1,
        );

        if (seqLen <= 12 && cellSize >= 20) {
          ctx.font = '8px monospace';
          ctx.fillStyle = w > 0.15 ? '#fff' : '#666';
          ctx.textAlign = 'center';
          ctx.fillText(
            w.toFixed(2),
            offsetX + j * cellSize + cellSize / 2,
            offsetY + i * cellSize + cellSize / 2 + 3,
          );
        }
      }
    }

    // 라벨
    ctx.font = '9px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#a0a0b0';
    const labels = [
      'CLS',
      ...Array.from({ length: gridSize * gridSize }, (_, i) => `P${i + 1}`),
    ];
    labels.forEach((label, i) => {
      ctx.textAlign = 'right';
      ctx.fillText(
        label,
        offsetX - 6,
        offsetY + i * cellSize + cellSize / 2 + 3,
      );
      ctx.textAlign = 'center';
      ctx.fillText(label, offsetX + i * cellSize + cellSize / 2, offsetY - 6);
    });

    // 대각선 자기-어텐션 강조 테두리
    ctx.strokeStyle = 'rgba(255, 200, 50, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i < seqLen; i++) {
      ctx.strokeRect(
        offsetX + i * cellSize + 0.5,
        offsetY + i * cellSize + 0.5,
        cellSize - 2,
        cellSize - 2,
      );
    }
    ctx.setLineDash([]);

    // 축 라벨
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#a0a0b0';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Key (참조 대상 토큰)',
      offsetX + (seqLen * cellSize) / 2,
      offsetY + seqLen * cellSize + 20,
    );
    ctx.save();
    ctx.translate(offsetX - 40, offsetY + (seqLen * cellSize) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Query (질의 토큰)', 0, 0);
    ctx.restore();

    // 대각선 범례
    ctx.font = '10px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(255, 200, 50, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(
      '◇ 점선 = 자기 자신에 대한 어텐션',
      W - 10,
      offsetY + seqLen * cellSize + 20,
    );

    // 실제 모델 데이터 라벨
    if (usingRealData) {
      ctx.font = '9px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#81c784';
      ctx.textAlign = 'left';
      ctx.fillText(
        '📊 실제 학습된 ViT-Base/16 모델의 값입니다',
        10,
        offsetY + seqLen * cellSize + 20,
      );
    }
  }

  function renderAll() {
    updateHeadTypeBadge();
    drawAttnMap(mapCanvas.getContext('2d'), mapCanvas.width, mapCanvas.height);
    drawAttnOverlay(
      overlayCanvas.getContext('2d'),
      overlayCanvas.width,
      overlayCanvas.height,
    );
    drawAttnWeights(
      weightsCanvas.getContext('2d'),
      weightsCanvas.width,
      weightsCanvas.height,
    );
  }

  patchSlider.addEventListener('input', renderAll);
  headSlider.addEventListener('input', () => {
    renderAll();
    if (window.__vitProgress) {
      window.__vitProgress.save('section-attention');
    }
    // Code panel sync
    const numHeads = parseInt(headSlider.value);
    const codeEl = document.getElementById('attn-code');
    if (codeEl) {
      codeEl.textContent = `import torch.nn as nn

D = 768       # 임베딩 차원
num_heads = ${numHeads} # 어텐션 헤드 수

mha = nn.MultiheadAttention(
    embed_dim=D,
    num_heads=${numHeads},
    batch_first=True
)
# Q, K, V 모두 같은 입력 (Self-Attention)
# 입력: [batch, N+1, D]
attn_output, attn_weights = mha(z, z, z)`;
    }
  });

  // ───── Compare Mode: Scaling 유무 비교 ─────
  const compareBtn = document.getElementById('attn-compare-btn');
  const compareContainer = document.getElementById('attn-compare');
  let compareVisible = false;

  if (compareBtn && compareContainer) {
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
    const headIdx = parseInt(headSlider.value) - 1;
    const d_k = 64; // 768 / 12 heads

    // Generate raw scores (before softmax) for one row
    const rand = mulberry32(200 + headIdx);
    const rawScores = [];
    for (let j = 0; j < seqLen; j++) {
      let score = rand() * 4 - 1;
      if (j === 0) score += 1;
      rawScores.push(score * Math.sqrt(d_k)); // Simulate un-scaled scores
    }

    // No scaling: softmax(QK^T)
    const noScaleWeights = softmax(rawScores);
    // With scaling: softmax(QK^T / sqrt(d_k))
    const scaledScores = rawScores.map((s) => s / Math.sqrt(d_k));
    const scaledWeights = softmax(scaledScores);

    const configs = [
      {
        label: '❌ Scaling 없음 (QK<sup>T</sup>)',
        weights: noScaleWeights,
        note: '⚠ softmax 가중치가 극단적 → 기울기 소실 위험',
        noteColor: 'var(--accent)',
      },
      {
        label: '✅ Scaling 적용 (QK<sup>T</sup> / √d<sub>k</sub>)',
        weights: scaledWeights,
        note: '✓ 부드러운 분포 → 안정적인 학습',
        noteColor: 'var(--attn-color)',
      },
    ];

    configs.forEach((cfg) => {
      const side = document.createElement('div');
      side.className = 'compare-side';
      side.innerHTML = `<h4>${cfg.label}</h4>`;

      // Mini bar chart
      const canvas = document.createElement('canvas');
      canvas.width = 350;
      canvas.height = 200;
      canvas.style.cssText = 'border-radius:8px;background:#0d1117;';
      side.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      const barW = (canvas.width - 40) / seqLen;
      const maxBarH = 150;
      const offsetY = 10;
      const labels = [
        'CLS',
        ...Array.from({ length: seqLen - 1 }, (_, i) => `P${i + 1}`),
      ];

      for (let j = 0; j < seqLen; j++) {
        const w = cfg.weights[j];
        const barH = w * maxBarH;
        const x = 20 + j * barW;

        ctx.fillStyle = w > 0.3 ? '#EF5350' : '#4fc3f7';
        ctx.fillRect(x + 2, offsetY + maxBarH - barH, barW - 4, barH);

        ctx.font = '9px monospace';
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'center';
        ctx.fillText(w.toFixed(3), x + barW / 2, offsetY + maxBarH - barH - 4);

        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(labels[j], x + barW / 2, offsetY + maxBarH + 14);
      }

      // Max weight info
      const maxW = Math.max(...cfg.weights);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#a0a0b0';
      ctx.textAlign = 'left';
      ctx.fillText(`max: ${maxW.toFixed(4)}`, 20, offsetY + maxBarH + 30);

      const note = document.createElement('p');
      note.style.cssText = `margin-top:8px;font-size:0.82rem;color:${cfg.noteColor};`;
      note.textContent = cfg.note;
      side.appendChild(note);

      compareContainer.appendChild(side);
    });
  }

  renderAll();
}
