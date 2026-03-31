// ===== 패치 파티션 & 패치 머징 시각화 =====

export function initPatch() {
  const canvas = document.getElementById('patch-canvas');
  const modeSelect = document.getElementById('patch-mode-select');
  const codeEl = document.getElementById('patch-code');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const state = { mode: 'partition' };

  const C = {
    bg: '#0a1628',
    grid: '#66BB6A',
    gridDim: '#66BB6A55',
    merge: '#FFA726',
    text: '#e0e0e0',
    sub: '#a0a0b0',
    stages: ['#66BB6A', '#42A5F5', '#AB47BC', '#EF5350'],
    stagesBg: ['#66BB6A22', '#42A5F522', '#AB47BC22', '#EF535022'],
  };

  // Generate gradient sample image
  function genImg(sz) {
    const d = [];
    for (let y = 0; y < sz; y++) {
      const row = [];
      for (let x = 0; x < sz; x++) {
        const r = Math.floor((x / sz) * 180 + 50);
        const g = Math.floor((y / sz) * 160 + 40);
        const b = Math.floor(((x + y) / (2 * sz)) * 140 + 60);
        row.push([r, g, b]);
      }
      d.push(row);
    }
    // Add shapes for visual interest
    const cx = sz * 0.35,
      cy = sz * 0.35,
      rad = sz * 0.15;
    for (let y = 0; y < sz; y++)
      for (let x = 0; x < sz; x++)
        if (Math.hypot(x - cx, y - cy) < rad) d[y][x] = [230, 110, 50];
    const rx = sz * 0.6,
      ry = sz * 0.55;
    for (
      let y = Math.floor(ry);
      y < Math.min(Math.floor(ry + sz * 0.2), sz);
      y++
    )
      for (
        let x = Math.floor(rx);
        x < Math.min(Math.floor(rx + sz * 0.2), sz);
        x++
      )
        d[y][x] = [60, 170, 210];
    return d;
  }

  const IMG_SZ = 56; // simplified grid
  const imgData = genImg(IMG_SZ);

  function drawImage(ox, oy, sz) {
    const scale = sz / IMG_SZ;
    for (let y = 0; y < IMG_SZ; y++) {
      for (let x = 0; x < IMG_SZ; x++) {
        const [r, g, b] = imgData[y][x];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(ox + x * scale, oy + y * scale, scale + 0.5, scale + 0.5);
      }
    }
  }

  function drawGrid(ox, oy, sz, patchSize, color) {
    const scale = sz / IMG_SZ;
    const n = Math.floor(IMG_SZ / patchSize);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= n; i++) {
      const p = i * patchSize * scale;
      ctx.beginPath();
      ctx.moveTo(ox + p, oy);
      ctx.lineTo(ox + p, oy + n * patchSize * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, oy + p);
      ctx.lineTo(ox + n * patchSize * scale, oy + p);
      ctx.stroke();
    }
  }

  function drawPartition() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText('패치 파티션: 이미지 → 4×4 패치 → 토큰 시퀀스', W / 2, 28);

    // Left: Original image
    const imgSz = 260;
    const ox1 = 60,
      oy1 = 60;
    drawImage(ox1, oy1, imgSz);
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox1, oy1, imgSz, imgSz);

    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText('입력: 224×224×3', ox1 + imgSz / 2, oy1 + imgSz + 20);

    // Arrow
    const ax = ox1 + imgSz + 30;
    ctx.beginPath();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(ax, oy1 + imgSz / 2);
    ctx.lineTo(ax + 50, oy1 + imgSz / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = C.grid;
    ctx.moveTo(ax + 50, oy1 + imgSz / 2);
    ctx.lineTo(ax + 42, oy1 + imgSz / 2 - 6);
    ctx.lineTo(ax + 42, oy1 + imgSz / 2 + 6);
    ctx.fill();

    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.grid;
    ctx.textAlign = 'center';
    ctx.fillText('4×4 분할', ax + 25, oy1 + imgSz / 2 - 12);

    // Right: Patched image
    const ox2 = ax + 70;
    drawImage(ox2, oy1, imgSz);
    drawGrid(ox2, oy1, imgSz, 4, C.grid);

    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText(
      '패치: 56×56 = 3,136개 (각 4×4×3 = 48차원)',
      ox2 + imgSz / 2,
      oy1 + imgSz + 20,
    );

    // Second arrow → token sequence
    const ax2 = ox2 + imgSz + 30;
    ctx.beginPath();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(ax2, oy1 + imgSz / 2);
    ctx.lineTo(ax2 + 40, oy1 + imgSz / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = C.grid;
    ctx.moveTo(ax2 + 40, oy1 + imgSz / 2);
    ctx.lineTo(ax2 + 32, oy1 + imgSz / 2 - 6);
    ctx.lineTo(ax2 + 32, oy1 + imgSz / 2 + 6);
    ctx.fill();

    ctx.fillStyle = C.grid;
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillText('Linear', ax2 + 20, oy1 + imgSz / 2 - 12);
    ctx.fillText('Proj', ax2 + 20, oy1 + imgSz / 2 + 22);

    // Token sequence visualization
    const tx = ax2 + 60,
      ty = oy1 + 30;
    const tw = 140,
      th = imgSz - 60;
    ctx.fillStyle = C.stagesBg[0];
    ctx.strokeStyle = C.stages[0];
    ctx.lineWidth = 1.5;
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeRect(tx, ty, tw, th);

    // Token rows
    const numShow = 8;
    const rh = th / (numShow + 2);
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < numShow; i++) {
      const ry = ty + 4 + i * rh;
      ctx.fillStyle = C.stages[0] + '40';
      ctx.fillRect(tx + 4, ry, tw - 8, rh - 2);
      ctx.fillStyle = C.sub;
      ctx.fillText(`token ${i}`, tx + tw / 2, ry + rh / 2 + 3);
    }
    ctx.fillStyle = C.sub;
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillText('⋮', tx + tw / 2, ty + th - 18);
    ctx.fillText(`[3136, 96]`, tx + tw / 2, ty + th + 16);

    // Note
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = '#66BB6A';
    ctx.textAlign = 'left';
    ctx.fillText(
      '✦ Swin은 4×4 패치 사용 (ViT의 16×16보다 4배 작음)',
      60,
      H - 50,
    );
    ctx.fillText(
      '✦ 작은 패치 → 더 많은 토큰 → 윈도우 어텐션으로 효율 유지',
      60,
      H - 32,
    );
  }

  function drawMerging() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText(
      '패치 머징: 2×2 인접 패치를 결합하여 해상도 ½, 채널 2×',
      W / 2,
      28,
    );

    // Before merging: 4×4 grid
    const gSz = 200,
      ox = 80,
      oy = 70;
    const cellSz = gSz / 4;
    const pColors = ['#66BB6A', '#42A5F5', '#AB47BC', '#EF5350'];

    ctx.font = '12px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText('입력: H×W, C 차원', ox + gSz / 2, oy - 8);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const ci = Math.floor(r / 2) * 2 + Math.floor(c / 2);
        const col = pColors[ci];
        ctx.fillStyle = col + '44';
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);

        ctx.font = '9px monospace';
        ctx.fillStyle = C.text;
        ctx.textAlign = 'center';
        ctx.fillText(
          `(${r},${c})`,
          ox + c * cellSz + cellSz / 2,
          oy + r * cellSz + cellSz / 2 + 3,
        );
      }
    }

    // 2×2 grouping highlight
    for (let gr = 0; gr < 2; gr++) {
      for (let gc = 0; gc < 2; gc++) {
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(
          ox + gc * 2 * cellSz,
          oy + gr * 2 * cellSz,
          2 * cellSz,
          2 * cellSz,
        );
      }
    }

    // Arrow
    const ax = ox + gSz + 30;
    ctx.beginPath();
    ctx.strokeStyle = C.merge;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(ax, oy + gSz / 2);
    ctx.lineTo(ax + 60, oy + gSz / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = C.merge;
    ctx.moveTo(ax + 60, oy + gSz / 2);
    ctx.lineTo(ax + 52, oy + gSz / 2 - 6);
    ctx.lineTo(ax + 52, oy + gSz / 2 + 6);
    ctx.fill();
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.merge;
    ctx.textAlign = 'center';
    ctx.fillText('concat', ax + 30, oy + gSz / 2 - 14);
    ctx.fillText('2×2', ax + 30, oy + gSz / 2 + 22);

    // Concat result: 4 channels stacked
    const cx = ax + 80,
      cW = 50,
      cH = gSz;
    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText('H/2 × W/2, 4C', cx + cW * 2, oy - 8);

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = pColors[i] + '44';
      ctx.strokeStyle = pColors[i];
      ctx.lineWidth = 1;
      ctx.fillRect(cx + i * cW, oy, cW, cH);
      ctx.strokeRect(cx + i * cW, oy, cW, cH);
      ctx.font = '9px "Noto Sans KR"';
      ctx.fillStyle = pColors[i];
      ctx.textAlign = 'center';
      ctx.fillText(
        ['좌상', '좌하', '우상', '우하'][i],
        cx + i * cW + cW / 2,
        oy + cH / 2 + 3,
      );
    }

    // Arrow 2: Linear projection
    const ax2 = cx + 4 * cW + 20;
    ctx.beginPath();
    ctx.strokeStyle = C.merge;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(ax2, oy + gSz / 2);
    ctx.lineTo(ax2 + 60, oy + gSz / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = C.merge;
    ctx.moveTo(ax2 + 60, oy + gSz / 2);
    ctx.lineTo(ax2 + 52, oy + gSz / 2 - 6);
    ctx.lineTo(ax2 + 52, oy + gSz / 2 + 6);
    ctx.fill();
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.merge;
    ctx.textAlign = 'center';
    ctx.fillText('Linear', ax2 + 30, oy + gSz / 2 - 14);
    ctx.fillText('4C→2C', ax2 + 30, oy + gSz / 2 + 22);

    // Output: 2 channels
    const ox2 = ax2 + 80,
      oW = 100;
    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText('H/2 × W/2, 2C', ox2 + oW / 2, oy - 8);

    ctx.fillStyle = '#42A5F533';
    ctx.strokeStyle = '#42A5F5';
    ctx.lineWidth = 1.5;
    ctx.fillRect(ox2, oy, oW, cH);
    ctx.strokeRect(ox2, oy, oW, cH);
    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = '#42A5F5';
    ctx.fillText('2C', ox2 + oW / 2, oy + cH / 2 + 4);

    // Note
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.merge;
    ctx.textAlign = 'left';
    ctx.fillText(
      '✦ Patch Merging = CNN의 stride-2 conv / pooling과 유사한 역할',
      80,
      H - 50,
    );
    ctx.fillText(
      '✦ 해상도 ½ × ½ = ¼ 토큰 수 감소 → 이후 Stage 연산량 대폭 절감',
      80,
      H - 32,
    );
  }

  function drawStages() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText('4-Stage 해상도 변화: 패치 머징으로 점진적 축소', W / 2, 28);

    const stages = [
      {
        label: 'Stage 1',
        res: '56×56',
        ch: 'C=96',
        blocks: 2,
        grid: 14,
        color: C.stages[0],
      },
      {
        label: 'Stage 2',
        res: '28×28',
        ch: 'C=192',
        blocks: 2,
        grid: 7,
        color: C.stages[1],
      },
      {
        label: 'Stage 3',
        res: '14×14',
        ch: 'C=384',
        blocks: 6,
        grid: 4,
        color: C.stages[2],
      },
      {
        label: 'Stage 4',
        res: '7×7',
        ch: 'C=768',
        blocks: 2,
        grid: 2,
        color: C.stages[3],
      },
    ];

    const baseY = 70;
    const maxGrid = 14;
    const cellBase = 16;
    let xCursor = 40;

    stages.forEach((s, si) => {
      const gridPx = s.grid * cellBase;
      const yOff = baseY + (maxGrid * cellBase - gridPx) / 2;

      // Grid
      for (let r = 0; r < s.grid; r++) {
        for (let c = 0; c < s.grid; c++) {
          ctx.fillStyle = s.color + '25';
          ctx.strokeStyle = s.color + '66';
          ctx.lineWidth = 0.5;
          ctx.fillRect(
            xCursor + c * cellBase,
            yOff + r * cellBase,
            cellBase,
            cellBase,
          );
          ctx.strokeRect(
            xCursor + c * cellBase,
            yOff + r * cellBase,
            cellBase,
            cellBase,
          );
        }
      }
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(xCursor, yOff, gridPx, gridPx);

      // Labels
      ctx.font = 'bold 12px "Noto Sans KR"';
      ctx.fillStyle = s.color;
      ctx.textAlign = 'center';
      ctx.fillText(s.label, xCursor + gridPx / 2, yOff + gridPx + 22);
      ctx.font = '10px "Noto Sans KR"';
      ctx.fillStyle = C.sub;
      ctx.fillText(`${s.res}`, xCursor + gridPx / 2, yOff + gridPx + 38);
      ctx.fillText(
        `${s.ch} (${s.blocks} blocks)`,
        xCursor + gridPx / 2,
        yOff + gridPx + 52,
      );

      // Arrow to next
      if (si < stages.length - 1) {
        const arrowStart = xCursor + gridPx + 10;
        const arrowEnd = arrowStart + 40;
        const arrowY = baseY + (maxGrid * cellBase) / 2;
        ctx.beginPath();
        ctx.strokeStyle = C.merge;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.moveTo(arrowStart, arrowY);
        ctx.lineTo(arrowEnd, arrowY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.fillStyle = C.merge;
        ctx.moveTo(arrowEnd, arrowY);
        ctx.lineTo(arrowEnd - 6, arrowY - 4);
        ctx.lineTo(arrowEnd - 6, arrowY + 4);
        ctx.fill();

        ctx.font = '8px "Noto Sans KR"';
        ctx.fillStyle = C.merge;
        ctx.textAlign = 'center';
        ctx.fillText('Merge', arrowStart + 20, arrowY - 8);
      }

      xCursor += gridPx + 60;
    });

    // Token count comparison
    const tableY = baseY + maxGrid * cellBase + 70;
    ctx.font = 'bold 12px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText('토큰 수 변화', W / 2, tableY);

    const barMaxW = 400,
      barH = 18;
    const counts = [3136, 784, 196, 49];
    const maxCount = counts[0];

    counts.forEach((cnt, i) => {
      const s = stages[i];
      const barW = (cnt / maxCount) * barMaxW;
      const by = tableY + 16 + i * (barH + 6);
      const bx = 200;

      ctx.fillStyle = s.color + '44';
      ctx.fillRect(bx, by, barW, barH);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW, barH);

      ctx.font = '10px "Noto Sans KR"';
      ctx.textAlign = 'right';
      ctx.fillStyle = s.color;
      ctx.fillText(s.label, bx - 8, by + barH / 2 + 4);

      ctx.textAlign = 'left';
      ctx.fillStyle = C.text;
      ctx.fillText(
        `${cnt.toLocaleString()} tokens (${s.res})`,
        bx + barW + 10,
        by + barH / 2 + 4,
      );
    });
  }

  function render() {
    switch (state.mode) {
      case 'partition':
        drawPartition();
        break;
      case 'merging':
        drawMerging();
        break;
      case 'stages':
        drawStages();
        break;
    }
  }

  // Sync code highlight
  function syncCode() {
    if (!codeEl) return;
    const lines = codeEl.textContent.split('\n');
    // Simply highlight relevant section name
  }

  modeSelect.addEventListener('change', () => {
    state.mode = modeSelect.value;
    render();
    syncCode();
    if (window.__swinProgress) window.__swinProgress.save('section-patch');
  });

  render();
}
