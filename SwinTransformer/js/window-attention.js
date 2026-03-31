// ===== Shifted Window Attention 시각화 =====

export function initWindowAttention() {
  const canvas = document.getElementById('window-attn-canvas');
  const sizeSlider = document.getElementById('window-size-slider');
  const sizeVal = document.getElementById('window-size-val');
  const modeSelect = document.getElementById('window-mode-select');
  const compareBtnW = document.getElementById('window-compare-btn');
  const compareBtnC = document.getElementById('cost-compare-btn');
  const compareW = document.getElementById('window-compare');
  const compareC = document.getElementById('cost-compare');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const GRID = 8; // feature map grid (simplified 8×8)
  const state = {
    windowSize: 4,
    mode: 'wmsa', // wmsa | swmsa | cyclic
    cyclicStep: 0,
  };

  const C = {
    text: '#e0e0e0',
    sub: '#a0a0b0',
    window: '#66BB6A',
    shift: '#26C6DA',
    mask: '#EF5350',
    attn: '#FFA726',
    grid: '#ffffff22',
    bg: '#0a1628',
    windowColors: [
      '#66BB6A',
      '#42A5F5',
      '#AB47BC',
      '#EF5350',
      '#FFA726',
      '#26C6DA',
      '#FF7043',
      '#78909C',
      '#E91E63',
    ],
  };

  function drawFeatureGrid(ox, oy, sz, M, shifted, showConnections) {
    const cellSz = sz / GRID;

    // Draw cells
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        let wr, wc;
        if (shifted) {
          const sr = (r + Math.floor(M / 2)) % GRID;
          const sc = (c + Math.floor(M / 2)) % GRID;
          wr = Math.floor(sr / M);
          wc = Math.floor(sc / M);
        } else {
          wr = Math.floor(r / M);
          wc = Math.floor(c / M);
        }
        const wi = wr * Math.ceil(GRID / M) + wc;
        const col = C.windowColors[wi % C.windowColors.length];

        ctx.fillStyle = col + '33';
        ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        ctx.strokeStyle = col + '88';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
      }
    }

    // Draw window borders
    const numW = Math.ceil(GRID / M);
    if (!shifted) {
      for (let wr = 0; wr < numW; wr++) {
        for (let wc = 0; wc < numW; wc++) {
          const wi = wr * numW + wc;
          const col = C.windowColors[wi % C.windowColors.length];
          const wx = ox + wc * M * cellSz;
          const wy = oy + wr * M * cellSz;
          const ww = Math.min(M, GRID - wc * M) * cellSz;
          const wh = Math.min(M, GRID - wr * M) * cellSz;
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(wx, wy, ww, wh);
        }
      }
    } else {
      // Shifted window borders
      const shiftPx = Math.floor(M / 2) * cellSz;
      for (let wr = 0; wr < numW; wr++) {
        for (let wc = 0; wc < numW; wc++) {
          const wi = wr * numW + wc;
          const col = C.windowColors[wi % C.windowColors.length];
          let wx = ox + wc * M * cellSz - shiftPx;
          let wy = oy + wr * M * cellSz - shiftPx;
          const ww = Math.min(M, GRID - wc * M) * cellSz;
          const wh = Math.min(M, GRID - wr * M) * cellSz;

          // Clip to grid area
          ctx.save();
          ctx.beginPath();
          ctx.rect(ox, oy, GRID * cellSz, GRID * cellSz);
          ctx.clip();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(wx, wy, ww, wh);
          // Also draw wrapped portions
          if (wx < ox) ctx.strokeRect(wx + GRID * cellSz, wy, ww, wh);
          if (wy < oy) ctx.strokeRect(wx, wy + GRID * cellSz, ww, wh);
          if (wx < ox && wy < oy)
            ctx.strokeRect(wx + GRID * cellSz, wy + GRID * cellSz, ww, wh);
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

    // Show attention connections inside one window for demo
    if (showConnections) {
      const wr = 0,
        wc = 0;
      const cxStart = shifted ? Math.floor(M / 2) : 0;
      const cyStart = shifted ? Math.floor(M / 2) : 0;
      const pairs = [];
      for (let dr = 0; dr < Math.min(M, 3); dr++) {
        for (let dc = 0; dc < Math.min(M, 3); dc++) {
          const from = { r: cyStart, c: cxStart };
          const to = { r: cyStart + dr, c: cxStart + dc };
          if (to.r < GRID && to.c < GRID && (dr !== 0 || dc !== 0)) {
            pairs.push([from, to]);
          }
        }
      }
      ctx.strokeStyle = C.attn + '66';
      ctx.lineWidth = 1;
      pairs.forEach(([f, t]) => {
        ctx.beginPath();
        ctx.moveTo(ox + (f.c + 0.5) * cellSz, oy + (f.r + 0.5) * cellSz);
        ctx.lineTo(ox + (t.c + 0.5) * cellSz, oy + (t.r + 0.5) * cellSz);
        ctx.stroke();
      });
      // Highlight source cell
      ctx.fillStyle = C.attn + '88';
      ctx.fillRect(
        ox + cxStart * cellSz,
        oy + cyStart * cellSz,
        cellSz,
        cellSz,
      );
    }

    // Outer border
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox, oy, GRID * cellSz, GRID * cellSz);
  }

  function drawWMSA() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const M = state.windowSize;

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText(`W-MSA: ${M}×${M} 고정 윈도우 내 셀프 어텐션`, W / 2, 28);

    const gridSz = 360;
    const ox = (W - gridSz) / 2 - 80;
    const oy = 55;
    drawFeatureGrid(ox, oy, gridSz, M, false, true);

    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText(
      `특징 맵: ${GRID}×${GRID},  윈도우: ${M}×${M},  윈도우 수: ${Math.ceil(GRID / M)}×${Math.ceil(GRID / M)}`,
      ox + gridSz / 2,
      oy + gridSz + 24,
    );

    // Side explanation
    const ex = ox + gridSz + 40,
      ey = oy + 20;
    ctx.font = 'bold 12px "Noto Sans KR"';
    ctx.fillStyle = C.window;
    ctx.textAlign = 'left';
    ctx.fillText('W-MSA 특징:', ex, ey);

    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    const notes = [
      '• 같은 색 = 같은 윈도우',
      `• 각 윈도우: ${M}×${M} = ${M * M}개 토큰`,
      '• 윈도우 내에서만 어텐션 계산',
      '• 윈도우 경계를 넘는 연결 없음',
      `• 연산량: O(n·M²) = O(${GRID * GRID}·${M * M})`,
      '',
      '⚠ 한계:',
      '  윈도우 간 정보 교환 불가',
      '  → SW-MSA로 해결',
    ];
    notes.forEach((n, i) => ctx.fillText(n, ex, ey + 22 + i * 18));
  }

  function drawSWMSA() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const M = state.windowSize;

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText(
      `SW-MSA: 윈도우를 (${Math.floor(M / 2)}, ${Math.floor(M / 2)})만큼 시프트`,
      W / 2,
      28,
    );

    const gridSz = 360;
    const ox = (W - gridSz) / 2 - 80;
    const oy = 55;
    drawFeatureGrid(ox, oy, gridSz, M, true, true);

    // Shift indicator
    const cellSz = gridSz / GRID;
    const shiftPx = Math.floor(M / 2) * cellSz;
    ctx.strokeStyle = C.shift;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    // horizontal
    ctx.beginPath();
    ctx.moveTo(ox, oy - 10);
    ctx.lineTo(ox + shiftPx, oy - 10);
    ctx.stroke();
    // vertical
    ctx.beginPath();
    ctx.moveTo(ox - 10, oy);
    ctx.lineTo(ox - 10, oy + shiftPx);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.shift;
    ctx.textAlign = 'center';
    ctx.fillText(`shift = ${Math.floor(M / 2)}`, ox + shiftPx / 2, oy - 16);

    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText(
      `시프트 후: 기존 윈도우 경계의 패치들이 새 윈도우에서 만남`,
      ox + gridSz / 2,
      oy + gridSz + 24,
    );

    // Side explanation
    const ex = ox + gridSz + 40,
      ey = oy + 20;
    ctx.font = 'bold 12px "Noto Sans KR"';
    ctx.fillStyle = C.shift;
    ctx.textAlign = 'left';
    ctx.fillText('SW-MSA 특징:', ex, ey);

    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    const notes = [
      `• 윈도우를 (${Math.floor(M / 2)},${Math.floor(M / 2)}) 이동`,
      '• 점선 = 시프트된 윈도우 경계',
      '• 기존 경계에 걸친 패치가 연결됨',
      '• ↔ 교차 윈도우 정보 교환!',
      '',
      '구현 (효율적):',
      '  1. Cyclic shift (torch.roll)',
      '  2. 일반 W-MSA 수행',
      '  3. Attention mask 적용',
      '  4. Reverse shift',
    ];
    notes.forEach((n, i) => ctx.fillText(n, ex, ey + 22 + i * 18));
  }

  function drawCyclic() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const M = state.windowSize;
    const shift = Math.floor(M / 2);

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText('Cyclic Shift: 효율적인 SW-MSA 구현', W / 2, 28);

    const gridSz = 200;
    const cellSz = gridSz / GRID;
    const gap = 100;

    // Step labels
    const steps = [
      { label: '① 원본', shifted: false, masked: false },
      { label: '② Cyclic Shift', shifted: true, masked: false },
      { label: '③ + Mask', shifted: true, masked: true },
    ];

    steps.forEach((step, si) => {
      const ox = 50 + si * (gridSz + gap);
      const oy = 70;

      ctx.font = 'bold 11px "Noto Sans KR"';
      ctx.fillStyle = si === 0 ? C.window : si === 1 ? C.shift : C.mask;
      ctx.textAlign = 'center';
      ctx.fillText(step.label, ox + gridSz / 2, oy - 10);

      // Draw grid with color coding
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          let origR = r,
            origC = c;
          if (step.shifted) {
            origR = (r + shift) % GRID;
            origC = (c + shift) % GRID;
          }
          const wr = Math.floor(origR / M);
          const wc = Math.floor(origC / M);
          const wi = wr * Math.ceil(GRID / M) + wc;
          const col = C.windowColors[wi % C.windowColors.length];

          ctx.fillStyle = col + '44';
          ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
          ctx.strokeStyle = col + '88';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        }
      }

      // Regular window boundaries
      const numW = Math.ceil(GRID / M);
      for (let wr = 0; wr < numW; wr++) {
        for (let wc = 0; wc < numW; wc++) {
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 2;
          const wx = ox + wc * M * cellSz;
          const wy = oy + wr * M * cellSz;
          const ww = Math.min(M, GRID - wc * M) * cellSz;
          const wh = Math.min(M, GRID - wr * M) * cellSz;
          ctx.strokeRect(wx, wy, ww, wh);
        }
      }

      // Mask overlay for step 3
      if (step.masked) {
        // The first window (top-left) after cyclic shift may contain mixed regions
        // Show mask on mixed windows
        ctx.fillStyle = C.mask + '22';
        ctx.strokeStyle = C.mask;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        // Mark boundary cells that need masking (simplified)
        for (let r = 0; r < GRID; r++) {
          for (let c = 0; c < GRID; c++) {
            const origR = (r + shift) % GRID;
            const origC = (c + shift) % GRID;
            const wr1 = Math.floor(origR / M);
            const wc1 = Math.floor(origC / M);
            const wr2 = Math.floor(r / M);
            const wc2 = Math.floor(c / M);
            // Check if any neighbors in same window have different origin window
            const wi1 = wr1 * numW + wc1;
            // If shifted cell is in first window but from different original window
            if (
              (wr2 === 0 && origR >= GRID - shift) ||
              (wc2 === 0 && origC >= GRID - shift)
            ) {
              ctx.fillStyle = C.mask + '44';
              ctx.fillRect(
                ox + c * cellSz + 1,
                oy + r * cellSz + 1,
                cellSz - 2,
                cellSz - 2,
              );
            }
          }
        }
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, gridSz, gridSz);

      // Arrow to next
      if (si < steps.length - 1) {
        const ax = ox + gridSz + 10;
        ctx.beginPath();
        ctx.strokeStyle = C.sub;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.moveTo(ax, oy + gridSz / 2);
        ctx.lineTo(ax + gap - 20, oy + gridSz / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.fillStyle = C.sub;
        ctx.moveTo(ax + gap - 20, oy + gridSz / 2);
        ctx.lineTo(ax + gap - 28, oy + gridSz / 2 - 5);
        ctx.lineTo(ax + gap - 28, oy + gridSz / 2 + 5);
        ctx.fill();
      }
    });

    // Explanation
    const ey = 320;
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'left';
    const explain = [
      `1. 원본 특징 맵의 윈도우: ${Math.ceil(GRID / M)}×${Math.ceil(GRID / M)} = ${Math.ceil(GRID / M) ** 2}개`,
      `2. torch.roll(x, shifts=(-${shift}, -${shift}), dims=(1,2))로 순환 이동`,
      `3. 이동 맵에 윈도우 파티션 적용 → 경계에 다른 영역 혼합`,
      '4. Attention Mask로 다른 영역 간 어텐션 차단 (빨간 영역)',
      '5. 어텐션 후 torch.roll로 원래 위치 복원',
    ];
    explain.forEach((e, i) => ctx.fillText(e, 50, ey + i * 20));

    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.shift;
    ctx.fillText(
      '✦ 이 방식으로 추가 윈도우 생성 없이 배치 연산으로 SW-MSA 구현 가능',
      50,
      ey + explain.length * 20 + 16,
    );
  }

  function render() {
    switch (state.mode) {
      case 'wmsa':
        drawWMSA();
        break;
      case 'swmsa':
        drawSWMSA();
        break;
      case 'cyclic':
        drawCyclic();
        break;
    }
  }

  // ─── Compare: W-MSA vs SW-MSA ───
  function toggleWindowCompare() {
    const open = compareW.style.display === 'none';
    compareW.style.display = open ? 'flex' : 'none';
    if (open) {
      compareW.innerHTML = '';
      const M = state.windowSize;

      ['W-MSA (고정)', 'SW-MSA (시프트)'].forEach((label, i) => {
        const div = document.createElement('div');
        div.style.cssText = 'flex:1;text-align:center;';
        const title = document.createElement('h4');
        title.textContent = label;
        title.style.color = i === 0 ? C.window : C.shift;
        div.appendChild(title);

        const cvs = document.createElement('canvas');
        cvs.width = 400;
        cvs.height = 400;
        cvs.style.cssText = 'max-width:100%;border-radius:8px;';
        div.appendChild(cvs);
        compareW.appendChild(div);

        const c = cvs.getContext('2d');
        const saved = ctx;
        // Temporarily use compare canvas context
        const gridSz = 350;
        const cellSzC = gridSz / GRID;
        const oxC = 25,
          oyC = 25;

        // Draw grid
        for (let r = 0; r < GRID; r++) {
          for (let cc = 0; cc < GRID; cc++) {
            let wr, wc;
            if (i === 1) {
              const sr = (r + Math.floor(M / 2)) % GRID;
              const sc = (cc + Math.floor(M / 2)) % GRID;
              wr = Math.floor(sr / M);
              wc = Math.floor(sc / M);
            } else {
              wr = Math.floor(r / M);
              wc = Math.floor(cc / M);
            }
            const wi = wr * Math.ceil(GRID / M) + wc;
            const col = C.windowColors[wi % C.windowColors.length];
            c.fillStyle = col + '33';
            c.fillRect(oxC + cc * cellSzC, oyC + r * cellSzC, cellSzC, cellSzC);
            c.strokeStyle = col + '66';
            c.lineWidth = 0.5;
            c.strokeRect(
              oxC + cc * cellSzC,
              oyC + r * cellSzC,
              cellSzC,
              cellSzC,
            );
          }
        }

        // Window borders
        const numW = Math.ceil(GRID / M);
        if (i === 0) {
          for (let wr = 0; wr < numW; wr++) {
            for (let wc = 0; wc < numW; wc++) {
              const col =
                C.windowColors[(wr * numW + wc) % C.windowColors.length];
              c.strokeStyle = col;
              c.lineWidth = 2.5;
              c.strokeRect(
                oxC + wc * M * cellSzC,
                oyC + wr * M * cellSzC,
                Math.min(M, GRID - wc * M) * cellSzC,
                Math.min(M, GRID - wr * M) * cellSzC,
              );
            }
          }
        } else {
          const shiftPx = Math.floor(M / 2) * cellSzC;
          for (let wr = 0; wr < numW; wr++) {
            for (let wc = 0; wc < numW; wc++) {
              const col =
                C.windowColors[(wr * numW + wc) % C.windowColors.length];
              c.strokeStyle = col;
              c.lineWidth = 2.5;
              c.setLineDash([6, 3]);
              let wx = oxC + wc * M * cellSzC - shiftPx;
              let wy = oyC + wr * M * cellSzC - shiftPx;
              c.save();
              c.beginPath();
              c.rect(oxC, oyC, GRID * cellSzC, GRID * cellSzC);
              c.clip();
              c.strokeRect(
                wx,
                wy,
                Math.min(M, GRID - wc * M) * cellSzC,
                Math.min(M, GRID - wr * M) * cellSzC,
              );
              if (wx < oxC)
                c.strokeRect(
                  wx + GRID * cellSzC,
                  wy,
                  Math.min(M, GRID - wc * M) * cellSzC,
                  Math.min(M, GRID - wr * M) * cellSzC,
                );
              if (wy < oyC)
                c.strokeRect(
                  wx,
                  wy + GRID * cellSzC,
                  Math.min(M, GRID - wc * M) * cellSzC,
                  Math.min(M, GRID - wr * M) * cellSzC,
                );
              c.setLineDash([]);
              c.restore();
            }
          }
        }

        c.strokeStyle = '#ffffff44';
        c.lineWidth = 1;
        c.strokeRect(oxC, oyC, gridSz, gridSz);

        // Label
        c.font = '11px "Noto Sans KR"';
        c.fillStyle = '#a0a0b0';
        c.textAlign = 'center';
        c.fillText(
          i === 0
            ? `윈도우 경계 고정 → 경계 패치 단절`
            : `윈도우 시프트 → 경계 패치 연결`,
          oxC + gridSz / 2,
          oyC + gridSz + 20,
        );
      });
    }
  }

  // ─── Compare: Cost (Global vs Window) ───
  function toggleCostCompare() {
    const open = compareC.style.display === 'none';
    compareC.style.display = open ? 'flex' : 'none';
    if (open) {
      compareC.innerHTML = '';
      const cvs = document.createElement('canvas');
      cvs.width = 900;
      cvs.height = 380;
      cvs.style.cssText = 'max-width:100%;border-radius:8px;';
      compareC.appendChild(cvs);
      drawCostChart(cvs.getContext('2d'), cvs.width, cvs.height);
    }
  }

  function drawCostChart(c, W, H) {
    const M = state.windowSize;
    c.font = 'bold 14px "Noto Sans KR"';
    c.fillStyle = C.text;
    c.textAlign = 'center';
    c.fillText(
      `연산량 비교: Global Attention vs Window Attention (M=${M})`,
      W / 2,
      28,
    );

    // Compute FLOPs for different resolutions (hw values)
    const Cv = 96;
    const resolutions = [
      { label: '56×56', hw: 3136 },
      { label: '28×28', hw: 784 },
      { label: '14×14', hw: 196 },
      { label: '7×7', hw: 49 },
    ];

    const chartX = 100,
      chartY = 60,
      chartW = 700,
      chartH = 240;
    const barW = 50,
      gap = 130;

    // Find max
    let maxVal = 0;
    resolutions.forEach((r) => {
      const globalFlops = 4 * r.hw * Cv * Cv + 2 * r.hw * r.hw * Cv;
      const windowFlops = 4 * r.hw * Cv * Cv + 2 * M * M * r.hw * Cv;
      maxVal = Math.max(maxVal, globalFlops, windowFlops);
    });

    resolutions.forEach((r, i) => {
      const globalFlops = 4 * r.hw * Cv * Cv + 2 * r.hw * r.hw * Cv;
      const windowFlops = 4 * r.hw * Cv * Cv + 2 * M * M * r.hw * Cv;
      const bx = chartX + i * gap + 30;
      const maxH = chartH - 20;

      // Global bar
      const gh = (globalFlops / maxVal) * maxH;
      c.fillStyle = '#EF535066';
      c.fillRect(bx, chartY + chartH - gh, barW, gh);
      c.strokeStyle = '#EF5350';
      c.lineWidth = 1.5;
      c.strokeRect(bx, chartY + chartH - gh, barW, gh);

      // Window bar
      const wh = (windowFlops / maxVal) * maxH;
      c.fillStyle = '#66BB6A66';
      c.fillRect(bx + barW + 8, chartY + chartH - wh, barW, wh);
      c.strokeStyle = '#66BB6A';
      c.strokeRect(bx + barW + 8, chartY + chartH - wh, barW, wh);

      // Ratio
      const ratio =
        globalFlops > 0 ? ((windowFlops / globalFlops) * 100).toFixed(1) : '—';
      c.font = '9px monospace';
      c.fillStyle = '#66BB6A';
      c.textAlign = 'center';
      c.fillText(
        `${ratio}%`,
        bx + barW + 4,
        chartY + chartH - Math.max(gh, wh) - 8,
      );

      // Label
      c.font = '11px "Noto Sans KR"';
      c.fillStyle = C.sub;
      c.textAlign = 'center';
      c.fillText(r.label, bx + barW + 4, chartY + chartH + 18);
    });

    // Axis
    c.strokeStyle = '#ffffff33';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(chartX, chartY);
    c.lineTo(chartX, chartY + chartH);
    c.lineTo(chartX + chartW, chartY + chartH);
    c.stroke();

    // Legend
    const ly = chartY + chartH + 40;
    c.fillStyle = '#EF535066';
    c.fillRect(chartX + 150, ly, 16, 16);
    c.strokeStyle = '#EF5350';
    c.strokeRect(chartX + 150, ly, 16, 16);
    c.font = '11px "Noto Sans KR"';
    c.fillStyle = C.sub;
    c.textAlign = 'left';
    c.fillText('Global Attention: Ω = 4hwC² + 2(hw)²C', chartX + 172, ly + 13);

    c.fillStyle = '#66BB6A66';
    c.fillRect(chartX + 150, ly + 24, 16, 16);
    c.strokeStyle = '#66BB6A';
    c.strokeRect(chartX + 150, ly + 24, 16, 16);
    c.fillStyle = C.sub;
    c.fillText(
      `Window Attention: Ω = 4hwC² + 2M²hwC  (M=${M})`,
      chartX + 172,
      ly + 37,
    );

    c.font = '10px "Noto Sans KR"';
    c.fillStyle = '#66BB6A';
    c.fillText(
      '✦ 고해상도(56×56)에서 Window Attention의 절감 효과가 극적!',
      chartX + 150,
      ly + 62,
    );
  }

  // ─── Events ───
  sizeSlider.addEventListener('input', () => {
    state.windowSize = parseInt(sizeSlider.value);
    sizeVal.textContent = state.windowSize;
    render();
    if (window.__swinProgress)
      window.__swinProgress.save('section-window-attention');
  });

  modeSelect.addEventListener('change', () => {
    state.mode = modeSelect.value;
    render();
    if (window.__swinProgress)
      window.__swinProgress.save('section-window-attention');
  });

  compareBtnW.addEventListener('click', toggleWindowCompare);
  compareBtnC.addEventListener('click', toggleCostCompare);

  render();
}
