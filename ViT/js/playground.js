// ===== 실전 파이프라인 체험 (ViT) =====

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

function valueToColor(v) {
  const t = (v + 1) / 2;
  const r = Math.floor(t * 79 + (1 - t) * 233);
  const g = Math.floor(t * 195 + (1 - t) * 69);
  const b = Math.floor(t * 247 + (1 - t) * 96);
  return `rgb(${r},${g},${b})`;
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

// 샘플 이미지 데이터
const SAMPLE_IMAGES = {
  cat: {
    label: '고양이',
    emoji: '🐱',
    colors: [
      [200, 120, 80],
      [220, 140, 90],
      [180, 100, 70],
      [210, 130, 85],
      [190, 110, 75],
      [200, 150, 100],
      [170, 90, 65],
      [215, 135, 88],
      [195, 125, 82],
    ],
    topClasses: [
      { name: 'tabby cat', ko: '줄무늬 고양이', prob: 0.68 },
      { name: 'tiger cat', ko: '호랑이 고양이', prob: 0.18 },
      { name: 'Egyptian cat', ko: '이집트 고양이', prob: 0.07 },
      { name: 'lynx', ko: '린크스', prob: 0.04 },
      { name: 'Persian cat', ko: '페르시안', prob: 0.02 },
    ],
  },
  dog: {
    label: '강아지',
    emoji: '🐶',
    colors: [
      [160, 130, 80],
      [170, 140, 90],
      [150, 120, 70],
      [165, 135, 85],
      [155, 125, 75],
      [180, 150, 100],
      [140, 110, 65],
      [175, 145, 88],
      [160, 130, 82],
    ],
    topClasses: [
      { name: 'golden retriever', ko: '골든 리트리버', prob: 0.72 },
      { name: 'Labrador retriever', ko: '래브라도 리트리버', prob: 0.12 },
      { name: 'cocker spaniel', ko: '코커 스패니얼', prob: 0.08 },
      { name: 'Irish setter', ko: '아이리시 세터', prob: 0.05 },
      { name: 'beagle', ko: '비글', prob: 0.02 },
    ],
  },
  car: {
    label: '자동차',
    emoji: '🚗',
    colors: [
      [60, 60, 80],
      [100, 100, 120],
      [80, 80, 100],
      [200, 40, 40],
      [180, 30, 30],
      [70, 70, 90],
      [150, 150, 160],
      [90, 90, 110],
      [110, 110, 130],
    ],
    topClasses: [
      { name: 'sports car', ko: '스포츠카', prob: 0.65 },
      { name: 'convertible', ko: '컨버터블', prob: 0.15 },
      { name: 'racer', ko: '레이서', prob: 0.1 },
      { name: 'limousine', ko: '리무진', prob: 0.06 },
      { name: 'minivan', ko: '미니밴', prob: 0.03 },
    ],
  },
  flower: {
    label: '꽃',
    emoji: '🌸',
    colors: [
      [220, 140, 180],
      [230, 120, 170],
      [200, 160, 190],
      [240, 100, 160],
      [210, 150, 175],
      [225, 130, 165],
      [215, 145, 185],
      [235, 110, 155],
      [205, 155, 180],
    ],
    topClasses: [
      { name: 'daisy', ko: '데이지', prob: 0.58 },
      { name: 'rose', ko: '장미', prob: 0.22 },
      { name: 'tulip', ko: '튤립', prob: 0.1 },
      { name: 'sunflower', ko: '해바라기', prob: 0.06 },
      { name: 'dandelion', ko: '민들레', prob: 0.03 },
    ],
  },
};

const STEPS = [
  {
    title: '1단계: 이미지 입력',
    desc: '224×224×3 크기의 RGB 이미지를 입력합니다.',
  },
  {
    title: '2단계: 패치 분할',
    desc: '이미지를 3×3 = 9개의 패치로 분할합니다. (교육용 단순화, 실제: 14×14=196개)',
  },
  {
    title: '3단계: 패치 플래튼(Flatten)',
    desc: '각 패치를 1D 벡터로 펼칩니다. P×P×C 차원의 벡터가 됩니다.',
  },
  {
    title: '4단계: 선형 투영(Linear Projection)',
    desc: '각 패치 벡터를 학습된 행렬 E를 곱해 D차원 임베딩으로 변환합니다.',
  },
  {
    title: '5단계: CLS 토큰 + 위치 임베딩',
    desc: '[CLS] 토큰을 앞에 추가하고, 모든 토큰에 위치 임베딩을 더합니다.',
  },
  {
    title: '6단계: Transformer 인코더',
    desc: 'Layer Norm → Multi-Head Self-Attention → Add → Layer Norm → MLP → Add 구조를 L번 반복합니다.',
  },
  {
    title: '7단계: Self-Attention 계산',
    desc: '각 패치가 다른 모든 패치에 대해 어텐션 가중치를 계산합니다.',
  },
  {
    title: '8단계: CLS 토큰 추출',
    desc: '인코더 출력에서 CLS 토큰의 벡터만 추출합니다. 이 벡터가 이미지 전체 표현입니다.',
  },
  {
    title: '9단계: MLP Head → 분류',
    desc: 'CLS 벡터를 MLP Head에 통과시켜 최종 클래스 확률을 출력합니다.',
  },
];

export function initPlayground() {
  const container = document.getElementById('pg-container');
  const runBtn = document.getElementById('pg-run-btn');
  const prevBtn = document.getElementById('pg-prev');
  const nextBtn = document.getElementById('pg-next');
  const stepLabel = document.getElementById('pg-step-label');
  const imageSelect = document.getElementById('pg-image-select');
  if (!container || !runBtn) return;

  let currentStep = -1;
  let currentImage = null;

  function getImageData() {
    return SAMPLE_IMAGES[imageSelect.value];
  }

  function updateControls() {
    prevBtn.disabled = currentStep <= 0;
    nextBtn.disabled = currentStep >= STEPS.length - 1;
    if (currentStep >= 0) {
      stepLabel.textContent = `${STEPS[currentStep].title} (${currentStep + 1}/${STEPS.length})`;
    }
  }

  function renderStep(step) {
    container.innerHTML = '';
    currentImage = getImageData();
    const rand = mulberry32(step * 7 + 42);

    // 단계 설명
    const descDiv = document.createElement('div');
    descDiv.style.cssText =
      'margin-bottom:16px;padding:12px 16px;background:var(--bg-card);border-radius:8px;border-left:4px solid var(--patch-color);';
    descDiv.innerHTML = `<strong style="color:var(--text-heading)">${STEPS[step].title}</strong><br><span style="color:var(--text-secondary);font-size:0.85rem">${STEPS[step].desc}</span>`;
    container.appendChild(descDiv);

    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = 860;
    canvas.height = 400;
    canvas.style.cssText = 'display:block;margin:0 auto;max-width:100%;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    if (step === 0) renderStep0(ctx, canvas, currentImage);
    else if (step === 1) renderStep1(ctx, canvas, currentImage);
    else if (step === 2) renderStep2(ctx, canvas, currentImage, rand);
    else if (step === 3) renderStep3(ctx, canvas, currentImage, rand);
    else if (step === 4) renderStep4(ctx, canvas, currentImage, rand);
    else if (step === 5) renderStep5(ctx, canvas, currentImage);
    else if (step === 6) renderStep6(ctx, canvas, currentImage, rand);
    else if (step === 7) renderStep7(ctx, canvas, currentImage, rand);
    else if (step === 8) renderStep8(ctx, canvas, currentImage);
  }

  // 1단계: 이미지 입력
  function renderStep0(ctx, canvas, img) {
    const W = canvas.width,
      H = canvas.height;
    const gridSize = 3;
    const imgSize = 240;
    const imgX = (W - imgSize) / 2,
      imgY = 40;
    const cellSize = imgSize / gridSize;

    // 이미지 그리기
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const [pr, pg, pb] = img.colors[r * gridSize + c];
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.fillRect(
          imgX + c * cellSize,
          imgY + r * cellSize,
          cellSize,
          cellSize,
        );
      }
    }
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(imgX, imgY, imgSize, imgSize);

    // 라벨
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(img.emoji, W / 2, imgY + imgSize + 50);

    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(`입력 이미지: ${img.label}`, W / 2, imgY + imgSize + 80);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText(
      'Shape: [224, 224, 3] (H × W × C)',
      W / 2,
      imgY + imgSize + 100,
    );
  }

  // 2단계: 패치 분할
  function renderStep1(ctx, canvas, img) {
    const W = canvas.width,
      H = canvas.height;
    const gridSize = 3;
    const imgSize = 200;
    const imgX = 80,
      imgY = 40;
    const cellSize = imgSize / gridSize;

    // 원본
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const [pr, pg, pb] = img.colors[r * gridSize + c];
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.fillRect(
          imgX + c * cellSize,
          imgY + r * cellSize,
          cellSize,
          cellSize,
        );
      }
    }

    // 그리드
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 3;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(imgX + i * cellSize, imgY);
      ctx.lineTo(imgX + i * cellSize, imgY + imgSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(imgX, imgY + i * cellSize);
      ctx.lineTo(imgX + imgSize, imgY + i * cellSize);
      ctx.stroke();
    }

    // 패치 번호
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.fillText(
          r * gridSize + c + 1,
          imgX + c * cellSize + cellSize / 2,
          imgY + r * cellSize + cellSize / 2,
        );
        ctx.shadowBlur = 0;
      }
    }

    // 화살표
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '24px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('→', imgX + imgSize + 30, imgY + imgSize / 2);

    // 분리된 패치들
    const patchStartX = imgX + imgSize + 80;
    const patchSize = 55;
    const pGap = 8;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const idx = r * gridSize + c;
        const px = patchStartX + c * (patchSize + pGap);
        const py = imgY + r * (patchSize + pGap);
        const [pr, pg, pb] = img.colors[idx];
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.fillRect(px, py, patchSize, patchSize);
        ctx.strokeStyle = '#4fc3f788';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, patchSize, patchSize);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 2;
        ctx.fillText(`P${idx + 1}`, px + patchSize / 2, py + patchSize / 2);
        ctx.shadowBlur = 0;
      }
    }

    ctx.font = '12px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(
      '9개 패치 (3×3)',
      patchStartX + (gridSize * (patchSize + pGap)) / 2,
      imgY + imgSize + 30,
    );
  }

  // 3단계: 플래튼
  function renderStep2(ctx, canvas, img, rand) {
    const W = canvas.width,
      H = canvas.height;
    const gridSize = 3;
    const numPatches = gridSize * gridSize;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText('각 패치를 1D 벡터로 펼치기 (Flatten)', W / 2, 20);

    const startY = 50;
    const rowH = 35;
    const patchW = 40;
    const vecW = 300;

    for (let i = 0; i < numPatches; i++) {
      const y = startY + i * rowH;
      const [pr, pg, pb] = img.colors[i];

      // 패치 미니 아이콘
      ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
      ctx.fillRect(30, y, patchW - 5, rowH - 5);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`P${i + 1}`, 30 + (patchW - 5) / 2, y + (rowH - 5) / 2 + 4);

      // 화살표
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#a0a0b0';
      ctx.fillText('→', patchW + 40, y + (rowH - 5) / 2 + 4);

      // 1D 벡터
      const vecX = patchW + 60;
      const numCells = 20;
      const cw = vecW / numCells;
      for (let j = 0; j < numCells; j++) {
        const val = rand() * 2 - 1;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(vecX + j * cw, y, cw - 1, rowH - 6);
      }

      // 차원 표시
      ctx.font = '9px monospace';
      ctx.fillStyle = '#a0a0b0';
      ctx.textAlign = 'left';
      ctx.fillText(`P²×C`, vecX + vecW + 10, y + (rowH - 5) / 2 + 3);
    }

    ctx.font = '12px monospace';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'center';
    ctx.fillText(
      `출력 shape: [${numPatches}, P²×C] = [9, 768]`,
      W / 2,
      startY + numPatches * rowH + 15,
    );
  }

  // 4단계: 선형 투영
  function renderStep3(ctx, canvas, img, rand) {
    const W = canvas.width,
      H = canvas.height;
    const numPatches = 9;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText('패치 벡터 × 투영 행렬 E → 패치 임베딩', W / 2, 20);

    // 입력
    const inX = 30,
      inY = 50,
      inW = 160,
      inH = 250;
    ctx.strokeStyle = '#ffb74d';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inX, inY, inW, inH);
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffb74d';
    ctx.textAlign = 'center';
    ctx.fillText('패치 벡터들', inX + inW / 2, inY - 8);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText('[9, P²×C]', inX + inW / 2, inY + inH + 14);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 10; c++) {
        const val = rand() * 2 - 1;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(inX + 5 + c * 15, inY + 5 + r * 27, 13, 22);
      }
    }

    // 곱하기
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#a0a0b0';
    ctx.textAlign = 'center';
    ctx.fillText('×', inX + inW + 25, inY + inH / 2);

    // 행렬 E
    const eX = inX + inW + 50,
      eY = inY + 30,
      eW = 130,
      eH = 180;
    ctx.strokeStyle = '#81c784';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(eX, eY, eW, eH);
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#81c784';
    ctx.textAlign = 'center';
    ctx.fillText('투영 행렬 E', eX + eW / 2, eY - 8);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText('[P²×C, D]', eX + eW / 2, eY + eH + 14);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const val = rand() * 2 - 1;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(eX + 5 + c * 15, eY + 5 + r * 22, 13, 18);
      }
    }

    // 등호
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#a0a0b0';
    ctx.textAlign = 'center';
    ctx.fillText('=', eX + eW + 25, inY + inH / 2);

    // 결과
    const outX = eX + eW + 50,
      outY = inY,
      outW = 200,
      outH = inH;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(outX, outY, outW, outH);
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'center';
    ctx.fillText('패치 임베딩', outX + outW / 2, outY - 8);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText('[9, D] = [9, 768]', outX + outW / 2, outY + outH + 14);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 12; c++) {
        const val = rand() * 2 - 1;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(outX + 5 + c * 16, outY + 5 + r * 27, 14, 22);
      }
    }
  }

  // 5단계: CLS + 위치 임베딩
  function renderStep4(ctx, canvas, img, rand) {
    const W = canvas.width,
      H = canvas.height;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText('[CLS] 토큰 추가 + 위치 임베딩(E_pos) 합산', W / 2, 20);

    const tokenW = 70,
      tokenH = 60,
      gap = 7;
    const seqLen = 10; // CLS + 9 patches
    const labelW = 90; // 왼쪽 레이블 영역 확보
    const startX = Math.max(labelW, (W - seqLen * (tokenW + gap)) / 2);

    // 패치 임베딩 행
    const row1Y = 50;
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#81c784';
    ctx.textAlign = 'left';
    ctx.fillText('패치 임베딩:', 10, row1Y + tokenH / 2 + 4);

    for (let i = 0; i < seqLen; i++) {
      const x = startX + i * (tokenW + gap);
      const isCls = i === 0;
      ctx.fillStyle = isCls ? '#e9456022' : '#81c78422';
      ctx.strokeStyle = isCls ? '#e94560' : '#81c784';
      ctx.lineWidth = isCls ? 2 : 1;
      roundRect(ctx, x, row1Y, tokenW, tokenH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${isCls ? 'bold 11' : '10'}px sans-serif`;
      ctx.fillStyle = isCls ? '#e94560' : '#81c784';
      ctx.textAlign = 'center';
      ctx.fillText(isCls ? '[CLS]' : `P${i}`, x + tokenW / 2, row1Y + 20);

      // 미니 벡터
      for (let j = 0; j < 6; j++) {
        const val = rand() * 2 - 1;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(x + 5 + j * 10, row1Y + 30, 8, 18);
      }
    }

    // + 기호
    const plusY = row1Y + tokenH + 10;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffb74d';
    ctx.textAlign = 'center';
    ctx.fillText('+', W / 2, plusY + 8);

    // 위치 임베딩 행
    const row2Y = plusY + 20;
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffb74d';
    ctx.textAlign = 'left';
    ctx.fillText('위치 임베딩:', 10, row2Y + tokenH / 2 + 4);

    for (let i = 0; i < seqLen; i++) {
      const x = startX + i * (tokenW + gap);
      ctx.fillStyle = '#ffb74d22';
      ctx.strokeStyle = '#ffb74d';
      ctx.lineWidth = 1;
      roundRect(ctx, x, row2Y, tokenW, tokenH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#ffb74d';
      ctx.textAlign = 'center';
      ctx.fillText(`pos ${i}`, x + tokenW / 2, row2Y + 20);

      for (let j = 0; j < 6; j++) {
        const val = Math.sin(i * 0.5 + j * 0.3) * 0.5 + (rand() - 0.5) * 0.5;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(x + 5 + j * 10, row2Y + 30, 8, 18);
      }
    }

    // = 기호
    const eqY = row2Y + tokenH + 10;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'center';
    ctx.fillText('=', W / 2, eqY + 8);

    // 결과 행
    const row3Y = eqY + 20;
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#4fc3f7';
    ctx.textAlign = 'left';
    ctx.fillText('입력 시퀀스:', 10, row3Y + tokenH / 2 + 4);

    for (let i = 0; i < seqLen; i++) {
      const x = startX + i * (tokenW + gap);
      const isCls = i === 0;
      ctx.fillStyle = isCls ? '#e9456033' : '#4fc3f722';
      ctx.strokeStyle = isCls ? '#e94560' : '#4fc3f7';
      ctx.lineWidth = 2;
      roundRect(ctx, x, row3Y, tokenW, tokenH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${isCls ? 'bold 11' : '10'}px sans-serif`;
      ctx.fillStyle = isCls ? '#e94560' : '#4fc3f7';
      ctx.textAlign = 'center';
      ctx.fillText(isCls ? '[CLS]' : `z${i}`, x + tokenW / 2, row3Y + 20);

      for (let j = 0; j < 6; j++) {
        const val = rand() * 2 - 1;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(x + 5 + j * 10, row3Y + 30, 8, 18);
      }
    }

    ctx.font = '11px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.textAlign = 'center';
    ctx.fillText(
      'z₀ = [x_class; x¹_p·E; x²_p·E; …; xᴺ_p·E] + E_pos  → shape: [10, 768]',
      W / 2,
      row3Y + tokenH + 20,
    );
  }

  // 6단계: Transformer 인코더
  function renderStep5(ctx, canvas, img) {
    const W = canvas.width,
      H = canvas.height;
    const numLayers = 3;
    const blockW = 180,
      blockH = 280;
    const gap = 40;
    const startX = (W - numLayers * blockW - (numLayers - 1) * gap) / 2;
    const startY = 50;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Transformer Encoder × L Layers (여기서는 L=3 표시)',
      W / 2,
      25,
    );

    const subBlocks = [
      { label: 'Layer Norm', color: '#ffb74d' },
      { label: 'Multi-Head SA', color: '#7e57c2' },
      { label: '+ 잔차 연결', color: '#4fc3f7' },
      { label: 'Layer Norm', color: '#ffb74d' },
      { label: 'MLP (FFN)', color: '#26a69a' },
      { label: '+ 잔차 연결', color: '#4fc3f7' },
    ];
    const sbH = 32,
      sbGap = 10;

    for (let l = 0; l < numLayers; l++) {
      const bx = startX + l * (blockW + gap);

      ctx.strokeStyle = '#7e57c2';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      roundRect(ctx, bx, startY, blockW, blockH, 8);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#e0e0e0';
      ctx.textAlign = 'center';
      ctx.fillText(`Layer ${l + 1}`, bx + blockW / 2, startY + 18);

      subBlocks.forEach((sb, i) => {
        const sy = startY + 28 + i * (sbH + sbGap);
        ctx.fillStyle = sb.color + '22';
        ctx.strokeStyle = sb.color;
        ctx.lineWidth = 1;
        roundRect(ctx, bx + 12, sy, blockW - 24, sbH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = '10px "Noto Sans KR", sans-serif';
        ctx.fillStyle = sb.color;
        ctx.textAlign = 'center';
        ctx.fillText(sb.label, bx + blockW / 2, sy + sbH / 2 + 4);
      });

      // 화살표
      if (l < numLayers - 1) {
        const arrowX = bx + blockW + 5;
        const arrowY = startY + blockH / 2;
        ctx.beginPath();
        ctx.strokeStyle = '#a0a0b0';
        ctx.lineWidth = 2;
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + gap - 10, arrowY);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = '#a0a0b0';
        ctx.moveTo(arrowX + gap - 10, arrowY);
        ctx.lineTo(arrowX + gap - 18, arrowY - 5);
        ctx.lineTo(arrowX + gap - 18, arrowY + 5);
        ctx.fill();
      }
    }

    ctx.font = '12px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#a0a0b0';
    ctx.textAlign = 'center';
    ctx.fillText(
      '입력: [10, 768] → 출력: [10, 768]  (시퀀스 길이와 차원 유지)',
      W / 2,
      startY + blockH + 30,
    );
    ctx.fillStyle = '#ffb74d';
    ctx.fillText(
      '※ ViT는 Pre-Norm: LayerNorm을 Attention/MLP 앞에 적용',
      W / 2,
      startY + blockH + 50,
    );
  }

  // 7단계: Self-Attention
  function renderStep6(ctx, canvas, img, rand) {
    const W = canvas.width,
      H = canvas.height;
    const gridSize = 3;
    const seqLen = gridSize * gridSize + 1;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Self-Attention: 각 토큰이 모든 토큰에 대해 어텐션 가중치 계산',
      W / 2,
      20,
    );

    // 어텐션 행렬
    const cellSize = 28;
    const matX = (W - seqLen * cellSize) / 2 + 30;
    const matY = 60;

    const labels = ['CLS', ...Array.from({ length: 9 }, (_, i) => `P${i + 1}`)];

    // 어텐션 가중치
    for (let i = 0; i < seqLen; i++) {
      const scores = [];
      for (let j = 0; j < seqLen; j++) {
        let s = rand() * 2;
        if (i === j) s += 3;
        if (i === 0 || j === 0) s += 0.5;
        scores.push(s);
      }
      const weights = softmax(scores);

      for (let j = 0; j < seqLen; j++) {
        const w = weights[j];
        const brightness = Math.floor(w * 200 + 30);
        ctx.fillStyle = `rgb(${Math.floor(w * 50)}, ${Math.floor(w * 160 + 30)}, ${brightness})`;
        ctx.fillRect(
          matX + j * cellSize,
          matY + i * cellSize,
          cellSize - 1,
          cellSize - 1,
        );

        if (cellSize >= 25) {
          ctx.font = '8px monospace';
          ctx.fillStyle = w > 0.12 ? '#fff' : '#555';
          ctx.textAlign = 'center';
          ctx.fillText(
            w.toFixed(2),
            matX + j * cellSize + cellSize / 2,
            matY + i * cellSize + cellSize / 2 + 3,
          );
        }
      }
    }

    // 라벨
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#a0a0b0';
    labels.forEach((l, i) => {
      ctx.textAlign = 'right';
      ctx.fillText(l, matX - 5, matY + i * cellSize + cellSize / 2 + 3);
      ctx.textAlign = 'center';
      ctx.fillText(l, matX + i * cellSize + cellSize / 2, matY - 5);
    });

    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#a0a0b0';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Attention(Q,K,V) = softmax(QK^T / √d_k) × V',
      W / 2,
      matY + seqLen * cellSize + 25,
    );

    // 설명
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#7e57c2';
    ctx.fillText(
      '밝은 셀 = 높은 어텐션 (해당 토큰을 많이 참조)',
      W / 2,
      matY + seqLen * cellSize + 50,
    );
    ctx.fillStyle = '#e94560';
    ctx.fillText(
      'CLS 토큰은 모든 패치 정보를 전역적으로 수집',
      W / 2,
      matY + seqLen * cellSize + 70,
    );
  }

  // 8단계: CLS 추출
  function renderStep7(ctx, canvas, img, rand) {
    const W = canvas.width,
      H = canvas.height;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText('인코더 출력에서 CLS 토큰만 추출', W / 2, 20);

    const tokenW = 60,
      tokenH = 115;
    const seqLen = 10;
    const gap = 8;
    const startX = (W - seqLen * (tokenW + gap)) / 2;
    const startY = 40;

    for (let i = 0; i < seqLen; i++) {
      const x = startX + i * (tokenW + gap);
      const isCls = i === 0;

      ctx.globalAlpha = isCls ? 1 : 0.3;
      ctx.fillStyle = isCls ? '#e9456033' : '#55558022';
      ctx.strokeStyle = isCls ? '#e94560' : '#555580';
      ctx.lineWidth = isCls ? 3 : 1;
      roundRect(ctx, x, startY, tokenW, tokenH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${isCls ? 'bold 12' : '10'}px sans-serif`;
      ctx.fillStyle = isCls ? '#e94560' : '#777';
      ctx.textAlign = 'center';
      ctx.fillText(isCls ? 'CLS' : `P${i}`, x + tokenW / 2, startY + 18);

      // 벡터
      for (let j = 0; j < 5; j++) {
        const val = rand() * 2 - 1;
        ctx.fillStyle = valueToColor(val);
        ctx.fillRect(x + 8, startY + 28 + j * 13, tokenW - 16, 11);
      }
      ctx.font = '8px monospace';
      ctx.fillStyle = '#a0a0b0';
      ctx.fillText('D=768', x + tokenW / 2, startY + tokenH - 10);
      ctx.globalAlpha = 1;
    }

    // 화살표: CLS → 아래
    const clsCX = startX + tokenW / 2;
    ctx.beginPath();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.moveTo(clsCX, startY + tokenH + 10);
    ctx.lineTo(clsCX, startY + tokenH + 50);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = '#e94560';
    ctx.moveTo(clsCX, startY + tokenH + 55);
    ctx.lineTo(clsCX - 8, startY + tokenH + 42);
    ctx.lineTo(clsCX + 8, startY + tokenH + 42);
    ctx.fill();

    // 추출된 CLS 벡터
    const clsBoxY = startY + tokenH + 65;
    ctx.fillStyle = '#e9456033';
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    roundRect(ctx, 80, clsBoxY, W - 160, 60, 8);
    ctx.fill();
    ctx.stroke();

    // 벡터 시각화
    const vecCells = 40;
    const cw = (W - 200) / vecCells;
    for (let i = 0; i < vecCells; i++) {
      const val = rand() * 2 - 1;
      ctx.fillStyle = valueToColor(val);
      ctx.fillRect(100 + i * cw, clsBoxY + 10, cw - 1, 35);
    }

    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e94560';
    ctx.textAlign = 'center';
    ctx.fillText('CLS 출력 벡터 = 이미지 전체의 표현', W / 2, clsBoxY + 75);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText('shape: [1, D] = [1, 768]', W / 2, clsBoxY + 95);

    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#7e57c2';
    ctx.fillText(
      'Self-Attention을 통해 모든 패치 정보가 CLS 토큰에 집약됨',
      W / 2,
      clsBoxY + 120,
    );
  }

  // 9단계: MLP Head → 분류
  function renderStep8(ctx, canvas, img) {
    const W = canvas.width,
      H = canvas.height;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.fillText(
      `MLP Head → 최종 분류 결과: ${img.emoji} ${img.label}`,
      W / 2,
      20,
    );

    // CLS → LN → Linear → softmax → 결과
    const blocks = [
      { label: 'CLS 벡터', sub: 'D=768', color: '#e94560', w: 100 },
      { label: 'Layer Norm', sub: '정규화', color: '#ffb74d', w: 100 },
      { label: 'Linear', sub: 'D → K', color: '#7e57c2', w: 90 },
      { label: 'Softmax', sub: '확률 분포', color: '#26a69a', w: 90 },
    ];

    const blockH = 50,
      gap = 30;
    let totalW =
      blocks.reduce((s, b) => s + b.w, 0) + (blocks.length - 1) * gap;
    let bx = (W - totalW) / 2;
    const by = 50;

    blocks.forEach((b, i) => {
      ctx.fillStyle = b.color + '22';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      roundRect(ctx, bx, by, b.w, blockH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
      ctx.fillStyle = b.color;
      ctx.textAlign = 'center';
      ctx.fillText(b.label, bx + b.w / 2, by + 20);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#a0a0b0';
      ctx.fillText(b.sub, bx + b.w / 2, by + 36);

      bx += b.w;
      if (i < blocks.length - 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#a0a0b0';
        ctx.lineWidth = 2;
        ctx.moveTo(bx + 5, by + blockH / 2);
        ctx.lineTo(bx + gap - 5, by + blockH / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = '#a0a0b0';
        ctx.moveTo(bx + gap - 5, by + blockH / 2);
        ctx.lineTo(bx + gap - 13, by + blockH / 2 - 5);
        ctx.lineTo(bx + gap - 13, by + blockH / 2 + 5);
        ctx.fill();
        bx += gap;
      }
    });

    // 분류 결과 바 차트
    const barStartY = by + blockH + 50;
    const barMaxW = 400;
    const barH = 30;
    const barGap = 8;
    const barX = (W - barMaxW - 250) / 2;

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'left';
    ctx.fillText('분류 결과 (Top-5 확률):', barX, barStartY - 8);

    img.topClasses.forEach((cls, i) => {
      const y = barStartY + 10 + i * (barH + barGap);
      const barW = cls.prob * barMaxW;

      // 배경
      ctx.fillStyle = '#4fc3f711';
      roundRect(ctx, barX, y, barMaxW, barH, 4);
      ctx.fill();

      // 바
      const alpha = i === 0 ? 0.8 : 0.4;
      ctx.fillStyle = `rgba(79, 195, 247, ${alpha})`;
      roundRect(ctx, barX, y, barW, barH, 4);
      ctx.fill();

      // 퍼센트
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#4fc3f7';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${(cls.prob * 100).toFixed(1)}%`,
        barX + barW + 8,
        y + barH / 2 + 5,
      );

      // 클래스 이름
      ctx.font = `${i === 0 ? 'bold ' : ''}12px "Noto Sans KR", sans-serif`;
      ctx.fillStyle = i === 0 ? '#e0e0e0' : '#a0a0b0';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${cls.ko} (${cls.name})`,
        barX + barMaxW + 70,
        y + barH / 2 + 5,
      );
    });

    // 최종 예측
    const finalY = barStartY + 10 + 5 * (barH + barGap) + 10;
    ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#81c784';
    ctx.textAlign = 'center';
    ctx.fillText(
      `✓ 최종 예측: ${img.topClasses[0].ko} (${(img.topClasses[0].prob * 100).toFixed(1)}%)`,
      W / 2,
      finalY,
    );
  }

  // 이벤트 핸들러
  runBtn.addEventListener('click', () => {
    currentStep = 0;
    updateControls();
    renderStep(currentStep);
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      updateControls();
      renderStep(currentStep);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      updateControls();
      renderStep(currentStep);
    }
  });
}
