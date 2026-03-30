// ===== 이미지 패치 분할 시각화 =====

// 샘플 이미지를 생성 (컬러 그라데이션)
function generateSampleImage(size) {
  const data = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const r = Math.floor((x / size) * 200 + 55);
      const g = Math.floor((y / size) * 180 + 40);
      const b = Math.floor(((x + y) / (2 * size)) * 160 + 60);
      row.push([r, g, b]);
    }
    data.push(row);
  }
  return data;
}

// 원본 이미지에 오브젝트 형태 추가
function addShapeToImage(data, size) {
  // 원형 물체
  const cx = size * 0.4,
    cy = size * 0.4,
    radius = size * 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < radius) {
        data[y][x] = [240, 120, 60];
      }
    }
  }
  // 사각형 물체
  const rx = size * 0.6,
    ry = size * 0.55,
    rw = size * 0.22,
    rh = size * 0.25;
  for (let y = Math.floor(ry); y < Math.min(Math.floor(ry + rh), size); y++) {
    for (let x = Math.floor(rx); x < Math.min(Math.floor(rx + rw), size); x++) {
      data[y][x] = [60, 180, 220];
    }
  }
  return data;
}

export function initPatch() {
  const originalCanvas = document.getElementById('patch-original-canvas');
  const gridCanvas = document.getElementById('patch-grid-canvas');
  const flattenViz = document.getElementById('patch-flatten-viz');
  const patchSelect = document.getElementById('patch-size-select');
  const patchBadge = document.getElementById('patch-count-badge');
  if (!originalCanvas || !gridCanvas) return;

  const IMG_SIZE = 112; // 시뮬레이션 이미지 크기 (가벼운 연산)
  let imgData = addShapeToImage(generateSampleImage(IMG_SIZE), IMG_SIZE);

  function drawOriginal(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const scale = W / IMG_SIZE;
    for (let y = 0; y < IMG_SIZE; y++) {
      for (let x = 0; x < IMG_SIZE; x++) {
        const [r, g, b] = imgData[y][x];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
      }
    }
  }

  function drawPatchGrid(ctx, W, H, patchSize) {
    ctx.clearRect(0, 0, W, H);
    const numPatches = Math.floor(IMG_SIZE / patchSize);
    const scale = W / IMG_SIZE;

    // 이미지 그리기
    for (let y = 0; y < IMG_SIZE; y++) {
      for (let x = 0; x < IMG_SIZE; x++) {
        const [r, g, b] = imgData[y][x];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
      }
    }

    // 그리드 선 그리기
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    for (let i = 0; i <= numPatches; i++) {
      const pos = i * patchSize * scale;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, numPatches * patchSize * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(numPatches * patchSize * scale, pos);
      ctx.stroke();
    }

    // 패치 번호
    ctx.font = `bold ${Math.max(10, Math.min(14, patchSize * scale * 0.35))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let idx = 1;
    for (let py = 0; py < numPatches; py++) {
      for (let px = 0; px < numPatches; px++) {
        const cx = (px + 0.5) * patchSize * scale;
        const cy = (py + 0.5) * patchSize * scale;
        if (numPatches <= 16) {
          // 숫자가 너무 많으면 생략
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(cx - 12, cy - 8, 24, 16);
          ctx.fillStyle = '#fff';
          ctx.fillText(idx, cx, cy);
        }
        idx++;
      }
    }

    patchBadge.textContent = `${numPatches * numPatches}개 패치`;
  }

  function drawFlatten(patchSize) {
    flattenViz.innerHTML = '';
    const numPatches = Math.floor(IMG_SIZE / patchSize);
    const totalPatches = numPatches * numPatches;
    const displayCount = Math.min(totalPatches, 20);

    const container = document.createElement('div');
    container.style.cssText =
      'display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;';

    for (let i = 0; i < displayCount; i++) {
      const py = Math.floor(i / numPatches);
      const px = i % numPatches;

      // 패치 평균 색상
      const startX = px * patchSize;
      const startY = py * patchSize;
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;
      for (let y = startY; y < Math.min(startY + patchSize, IMG_SIZE); y++) {
        for (let x = startX; x < Math.min(startX + patchSize, IMG_SIZE); x++) {
          const [r, g, b] = imgData[y][x];
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
      const avgR = Math.round(rSum / count);
      const avgG = Math.round(gSum / count);
      const avgB = Math.round(bSum / count);

      const box = document.createElement('div');
      box.style.cssText = `
        width:40px;height:40px;border-radius:4px;
        background:rgb(${avgR},${avgG},${avgB});
        border:1px solid rgba(79,195,247,0.3);
        display:flex;align-items:center;justify-content:center;
        font-size:10px;color:#fff;font-weight:bold;
        text-shadow:0 0 3px rgba(0,0,0,0.8);
        animation:scaleIn 0.3s ease forwards;
        opacity:0;animation-delay:${i * 0.03}s;
      `;
      box.textContent = i + 1;
      container.appendChild(box);
    }

    if (totalPatches > displayCount) {
      const dots = document.createElement('span');
      dots.style.cssText =
        'color:var(--text-secondary);font-size:14px;padding:0 8px;';
      dots.textContent = `… 총 ${totalPatches}개`;
      container.appendChild(dots);
    }

    // 화살표 행
    const arrowDiv = document.createElement('div');
    arrowDiv.style.cssText =
      'text-align:center;color:var(--text-secondary);padding:10px 0 6px;font-size:13px;';
    arrowDiv.innerHTML = '↓ Flatten (2D → 1D 시퀀스)';

    const dimDiv = document.createElement('div');
    dimDiv.style.cssText =
      'text-align:center;color:var(--patch-color);font-size:13px;font-family:monospace;';
    dimDiv.textContent = `[${totalPatches}, ${patchSize}×${patchSize}×3] = [${totalPatches}, ${patchSize * patchSize * 3}]`;

    flattenViz.appendChild(container);
    flattenViz.appendChild(arrowDiv);
    flattenViz.appendChild(dimDiv);
  }

  function render() {
    const patchSize = parseInt(patchSelect.value);
    const octx = originalCanvas.getContext('2d');
    const gctx = gridCanvas.getContext('2d');
    drawOriginal(octx, originalCanvas.width, originalCanvas.height);
    drawPatchGrid(gctx, gridCanvas.width, gridCanvas.height, patchSize);
    drawFlatten(patchSize);
  }

  patchSelect.addEventListener('change', render);
  render();
}
