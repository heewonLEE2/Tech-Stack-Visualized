// ===== 패치 임베딩, 위치 임베딩, CLS 토큰, 인코더 블록 시각화 =====

// PRNG
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

function valueToColor(v) {
  // v in [-1, 1]
  const t = (v + 1) / 2; // [0, 1]
  const r = Math.floor(t * 79 + (1 - t) * 233);
  const g = Math.floor(t * 195 + (1 - t) * 69);
  const b = Math.floor(t * 247 + (1 - t) * 96);
  return `rgb(${r},${g},${b})`;
}

// ===== 패치 임베딩 시각화 =====
function drawPatchEmbedding(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const colors = {
    text: '#e0e0e0',
    textSub: '#a0a0b0',
    patch: '#ffb74d',
    embed: '#81c784',
    arrow: '#a0a0b0',
  };

  // 패치 벡터 (Flatten)
  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText('패치 (Flatten)', 100, 30);

  // 패치 픽셀 시각화 (4x4 그리드 = 16 값)
  const patchStartX = 30,
    patchStartY = 45;
  const cellSize = 22;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = rand() * 2 - 1;
      ctx.fillStyle = valueToColor(val);
      ctx.fillRect(
        patchStartX + c * cellSize,
        patchStartY + r * cellSize,
        cellSize - 1,
        cellSize - 1,
      );
    }
  }

  // 화살표: Flatten
  ctx.font = '11px sans-serif';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';
  ctx.fillText('Flatten', 100, 160);

  // Flattened 1D 벡터
  const flatY = 175;
  const flatW = 140,
    flatH = 25;
  const numCells = 12;
  const cw = flatW / numCells;
  for (let i = 0; i < numCells; i++) {
    const val = rand() * 2 - 1;
    ctx.fillStyle = valueToColor(val);
    ctx.fillRect(patchStartX + i * cw, flatY, cw - 1, flatH);
  }
  ctx.font = '10px monospace';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';
  ctx.fillText('P²×C = 768', 100, flatY + flatH + 14);

  // 화살표: Linear
  drawArrow(ctx, 185, flatY + 12, 280, flatY + 12, colors.arrow);
  ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.embed;
  ctx.textAlign = 'center';
  ctx.fillText('× E', 232, flatY + 4);
  ctx.font = '10px monospace';
  ctx.fillStyle = colors.textSub;
  ctx.fillText('선형 투영', 232, flatY + 28);

  // 투영 행렬 E (작은 시각화)
  const matX = 290,
    matY = 50;
  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText('투영 행렬 E', 370, 30);
  ctx.font = '10px monospace';
  ctx.fillStyle = colors.textSub;
  ctx.fillText('ℝ^(P²·C × D)', 370, 46);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const val = rand() * 2 - 1;
      ctx.fillStyle = valueToColor(val);
      ctx.fillRect(matX + c * 20, matY + 10 + r * 20, 18, 18);
    }
  }

  // 화살표: 결과
  drawArrow(ctx, 460, flatY + 12, 520, flatY + 12, colors.arrow);
  ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText('=', 490, flatY + 8);

  // 결과 임베딩 벡터
  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.embed;
  ctx.textAlign = 'center';
  ctx.fillText('패치 임베딩', 650, 30);

  const embedX = 530,
    embedY = flatY - 20;
  const embedW = 240,
    embedH = 25;
  const eCells = 16;
  const ecw = embedW / eCells;
  for (let i = 0; i < eCells; i++) {
    const val = rand() * 2 - 1;
    ctx.fillStyle = valueToColor(val);
    ctx.fillRect(embedX + i * ecw, embedY + 20, ecw - 1, embedH);
  }
  ctx.font = '10px monospace';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';
  ctx.fillText('D = 768', 650, embedY + embedH + 34);

  // N개 패치 정보
  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';

  // 여러 패치 임베딩 (스택)
  for (let row = 0; row < 5; row++) {
    const oy = embedY + 70 + row * 30;
    for (let i = 0; i < eCells; i++) {
      const val = rand() * 2 - 1;
      ctx.fillStyle = valueToColor(val) + (row === 0 ? '' : '88');
      ctx.fillRect(embedX + i * ecw, oy, ecw - 1, 22);
    }
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Patch ${row + 1}`, embedX - 8, oy + 15);
  }
  ctx.fillStyle = colors.textSub;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⋮', 650, embedY + 230);
  ctx.fillText('총 N개 패치 → [N, D] 행렬', 650, embedY + 255);
}

// ===== 위치 임베딩 히트맵 =====
function drawPositionHeatmap(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const gridSize = 8; // 8x8 = 64 positions (simplified)
  const cellSize = Math.min((W - 40) / gridSize, (H - 60) / gridSize);
  const offsetX = (W - gridSize * cellSize) / 2;
  const offsetY = 30;

  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#e0e0e0';
  ctx.textAlign = 'center';
  ctx.fillText('학습된 위치 임베딩 (각 패치 위치)', W / 2, 20);

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // 시뮬레이션: 위치에 따른 패턴
      const posVal =
        Math.sin(r * 0.5 + c * 0.3) * 0.5 + Math.cos(r * 0.3 - c * 0.5) * 0.3;
      const hue = 200 + posVal * 60;
      const light = 40 + (posVal + 0.8) * 25;
      ctx.fillStyle = `hsl(${hue}, 70%, ${light}%)`;
      ctx.fillRect(
        offsetX + c * cellSize,
        offsetY + r * cellSize,
        cellSize - 2,
        cellSize - 2,
      );

      // 위치 번호
      const idx = r * gridSize + c;
      if (gridSize <= 8) {
        ctx.font = '9px monospace';
        ctx.fillStyle = '#ffffff88';
        ctx.textAlign = 'center';
        ctx.fillText(
          idx,
          offsetX + c * cellSize + cellSize / 2,
          offsetY + r * cellSize + cellSize / 2 + 3,
        );
      }
    }
  }

  ctx.font = '11px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#a0a0b0';
  ctx.textAlign = 'center';
  ctx.fillText(
    '색상이 유사한 위치 = 비슷한 임베딩 벡터',
    W / 2,
    offsetY + gridSize * cellSize + 25,
  );
  ctx.fillText(
    '→ 인접 패치끼리 유사한 패턴을 학습',
    W / 2,
    offsetY + gridSize * cellSize + 42,
  );
}

// ===== 위치 유사도 행렬 =====
function drawPositionSimilarity(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const size = 9; // 9x9 (CLS + 8x1 패치 단순화)
  const cellSize = Math.min((W - 60) / size, (H - 80) / size);
  const offsetX = (W - size * cellSize) / 2;
  const offsetY = 40;

  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#e0e0e0';
  ctx.textAlign = 'center';
  ctx.fillText('위치 임베딩 간 코사인 유사도', W / 2, 20);

  // 가상 유사도 행렬 (대각선=1, 거리가 멀수록 작아짐)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let sim;
      if (r === c) {
        sim = 1.0;
      } else if (r === 0 || c === 0) {
        // CLS와 패치 간 유사도
        sim = 0.2 + rand() * 0.15;
      } else {
        // 거리 기반 유사도
        const dist = Math.abs(r - c);
        sim = Math.max(0, 1.0 - dist * 0.18 + (rand() - 0.5) * 0.1);
      }

      const red = Math.floor((1 - sim) * 30);
      const green = Math.floor(sim * 60 + 20);
      const blue = Math.floor(sim * 180 + 40);
      ctx.fillStyle = `rgb(${red + 20}, ${green}, ${blue})`;
      ctx.fillRect(
        offsetX + c * cellSize,
        offsetY + r * cellSize,
        cellSize - 1,
        cellSize - 1,
      );

      if (size <= 12) {
        ctx.font = '9px monospace';
        ctx.fillStyle = sim > 0.5 ? '#fff' : '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText(
          sim.toFixed(1),
          offsetX + c * cellSize + cellSize / 2,
          offsetY + r * cellSize + cellSize / 2 + 3,
        );
      }
    }
  }

  // 라벨
  ctx.font = '9px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#a0a0b0';
  const labels = ['CLS', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
  labels.forEach((label, i) => {
    ctx.textAlign = 'right';
    ctx.fillText(label, offsetX - 4, offsetY + i * cellSize + cellSize / 2 + 3);
    ctx.textAlign = 'center';
    ctx.fillText(label, offsetX + i * cellSize + cellSize / 2, offsetY - 5);
  });

  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#a0a0b0';
  ctx.textAlign = 'center';
  ctx.fillText(
    '대각선 = 1.0 (자기 자신), 가까운 패치 = 높은 유사도',
    W / 2,
    offsetY + size * cellSize + 22,
  );
}

// ===== CLS 토큰 시각화 =====
function drawClsToken(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const seqLen = 10; // CLS + 9 patches
  const boxW = 70,
    boxH = 180,
    gap = 8;
  const startX = (W - seqLen * (boxW + gap)) / 2;
  const startY = 80;

  ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#e0e0e0';
  ctx.textAlign = 'center';
  ctx.fillText('입력 시퀀스: [CLS] + 패치 임베딩 + 위치 임베딩', W / 2, 30);

  for (let i = 0; i < seqLen; i++) {
    const x = startX + i * (boxW + gap);
    const isCls = i === 0;

    // 박스 배경
    const color = isCls ? '#e94560' : '#81c784';
    ctx.fillStyle = color + '22';
    ctx.strokeStyle = color;
    ctx.lineWidth = isCls ? 3 : 1.5;
    roundRect(ctx, x, startY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    // 라벨
    ctx.font = `bold ${isCls ? 13 : 11}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(isCls ? '[CLS]' : `Patch ${i}`, x + boxW / 2, startY + 20);

    // 임베딩 벡터 시각화 (세로 셀)
    const cellH = 14,
      cellW = 50;
    const vStartX = x + (boxW - cellW) / 2;
    const vStartY = startY + 32;
    for (let j = 0; j < 8; j++) {
      const val = rand() * 2 - 1;
      ctx.fillStyle = valueToColor(val);
      ctx.fillRect(vStartX, vStartY + j * (cellH + 1), cellW, cellH);
    }
    ctx.font = '8px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText('⋮', x + boxW / 2, startY + boxH - 20);
    ctx.fillText('D=768', x + boxW / 2, startY + boxH - 6);
  }

  // 점선 (더 많은 패치 표시)
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#a0a0b0';
  ctx.textAlign = 'left';

  // 하단 설명
  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#a0a0b0';
  ctx.textAlign = 'center';
  ctx.fillText(
    '총 시퀀스 길이: N+1 (1 CLS + N 패치)',
    W / 2,
    startY + boxH + 30,
  );
  ctx.fillText(
    '각 토큰: D차원 벡터 = 패치 임베딩 + 위치 임베딩',
    W / 2,
    startY + boxH + 50,
  );

  // CLS 강조 — CLS 박스 중앙 위쪽에 주석 표시 (Patch 박스와 겹치지 않도록)
  const clsBoxCX = startX + boxW / 2;
  const noteY1 = startY - 34;
  const noteY2 = startY - 18;

  // 작은 화살표 (주석 → CLS 박스 상단)
  ctx.beginPath();
  ctx.strokeStyle = '#e9456088';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.moveTo(clsBoxCX, noteY2 + 2);
  ctx.lineTo(clsBoxCX, startY - 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.fillStyle = '#e9456088';
  ctx.moveTo(clsBoxCX, startY - 4);
  ctx.lineTo(clsBoxCX - 4, startY - 11);
  ctx.lineTo(clsBoxCX + 4, startY - 11);
  ctx.fill();

  ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#e94560';
  ctx.textAlign = 'center';
  ctx.fillText('학습 가능한 파라미터', clsBoxCX, noteY1);
  ctx.fillText('최종 분류에 사용', clsBoxCX, noteY2);
}

// ===== 인코더 블록 시각화 =====
function drawEncoderBlock(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const layerSlider = document.getElementById('encoder-layer-slider');
  const layerVal = document.getElementById('encoder-layer-val');
  const numLayers = layerSlider ? parseInt(layerSlider.value) : 3;
  if (layerVal) layerVal.textContent = numLayers;

  const colors = {
    ln: '#ffb74d',
    msa: '#7e57c2',
    mlp: '#26a69a',
    add: '#4fc3f7',
    text: '#e0e0e0',
    textSub: '#a0a0b0',
    arrow: '#a0a0b0',
  };

  // 단일 인코더 블록 그리기
  function drawBlock(x, y, w, h, idx) {
    // 외곽
    ctx.strokeStyle = colors.msa;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // 블록 번호
    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    ctx.fillText(`Layer ${idx + 1}`, x + 8, y + 18);

    const bw = w - 30,
      bh = 30;
    const bx = x + 15;
    let by = y + 35;
    const stepH = 50;

    // Layer Norm 1
    drawSmallBlock(ctx, bx, by, bw, bh, 'Layer Norm', colors.ln);
    by += stepH;

    // Multi-Head Self-Attention
    drawSmallBlock(
      ctx,
      bx,
      by,
      bw,
      bh,
      'Multi-Head Self-Attention',
      colors.msa,
    );
    by += stepH;

    // Add (잔차)
    drawSmallBlock(ctx, bx, by, bw, bh, '+ Add (잔차 연결)', colors.add);
    by += stepH;

    // Layer Norm 2
    drawSmallBlock(ctx, bx, by, bw, bh, 'Layer Norm', colors.ln);
    by += stepH;

    // MLP
    drawSmallBlock(ctx, bx, by, bw, bh, 'MLP (FFN)', colors.mlp);
    by += stepH;

    // Add (잔차)
    drawSmallBlock(ctx, bx, by, bw, bh, '+ Add (잔차 연결)', colors.add);

    // 내부 화살표
    for (let i = 0; i < 5; i++) {
      const ay = y + 35 + i * stepH + bh;
      drawSmallArrow(
        ctx,
        x + w / 2,
        ay + 2,
        x + w / 2,
        ay + stepH - bh - 2,
        colors.arrow,
      );
    }
  }

  function drawSmallBlock(ctx, x, y, w, h, label, color) {
    ctx.fillStyle = color + '22';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  }

  function drawSmallArrow(ctx, x1, y1, x2, y2, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 4, y2 - 6);
    ctx.lineTo(x2 + 4, y2 - 6);
    ctx.fill();
  }

  const blockW = 220,
    blockH = 350;
  const blockGap = 20;
  const padX = 20;
  const totalW = numLayers * (blockW + blockGap) - blockGap + padX * 2;

  // 캔버스 너비를 레이어 수에 맞게 동적 조정 → viz-container의 overflow-x: auto로 스크롤
  canvas.width = Math.max(860, totalW);
  const CW = canvas.width;

  ctx.clearRect(0, 0, CW, canvas.height);

  const startX = padX;

  ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText(`Transformer Encoder × ${numLayers} Layers`, CW / 2, 30);

  // 입력 표시
  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';
  ctx.fillText('입력: [CLS + 패치 임베딩 + 위치 임베딩]', CW / 2, 52);

  const baseY = 70;
  for (let i = 0; i < numLayers; i++) {
    const bx = startX + i * (blockW + blockGap);
    drawBlock(bx, baseY, blockW, blockH, i);

    // 레이어 간 화살표
    if (i < numLayers - 1) {
      drawSmallArrow(
        ctx,
        bx + blockW + 2,
        baseY + blockH / 2,
        bx + blockW + blockGap - 2,
        baseY + blockH / 2,
        colors.arrow,
      );
    }
  }

  // 출력 표시
  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';
  ctx.fillText(
    '출력: 인코딩된 토큰 시퀀스 [N+1, D]',
    CW / 2,
    baseY + blockH + 30,
  );

  // Pre-Norm 강조
  ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.ln;
  ctx.textAlign = 'center';
  ctx.fillText(
    '※ ViT는 Pre-Norm 구조: LayerNorm을 Attention/MLP 앞에 적용',
    CW / 2,
    baseY + blockH + 55,
  );
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 8;
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4));
  ctx.fill();
}

// ===== Export =====
export function initEmbedding(type) {
  if (type === 'patch') {
    const canvas = document.getElementById('patch-embed-canvas');
    if (canvas) drawPatchEmbedding(canvas);
  } else if (type === 'position') {
    const heatmap = document.getElementById('pos-embed-heatmap');
    const sim = document.getElementById('pos-embed-similarity');
    if (heatmap) drawPositionHeatmap(heatmap);
    if (sim) drawPositionSimilarity(sim);
  } else if (type === 'cls') {
    const canvas = document.getElementById('cls-token-canvas');
    if (canvas) drawClsToken(canvas);
  } else if (type === 'encoder') {
    const canvas = document.getElementById('encoder-block-canvas');
    if (canvas) {
      drawEncoderBlock(canvas);
      const slider = document.getElementById('encoder-layer-slider');
      if (slider) {
        slider.addEventListener('input', () => drawEncoderBlock(canvas));
      }
    }
  }
}
