// ===== 상대적 위치 바이어스 시각화 =====

export function initPositionBias() {
  const canvas = document.getElementById('bias-canvas');
  const windowSlider = document.getElementById('bias-window-slider');
  const windowVal = document.getElementById('bias-window-val');
  const displaySelect = document.getElementById('bias-display-select');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const state = {
    M: 7,
    display: 'bias-matrix', // bias-matrix | coord-index
    hoverCell: null,
  };

  const C = {
    text: '#e0e0e0',
    sub: '#a0a0b0',
    bias: '#42A5F5',
    positive: '#66BB6A',
    negative: '#EF5350',
    neutral: '#1a1a2e',
    highlight: '#FFA726',
  };

  // Compute relative position bias matrix for window size M
  function computeBiasIndex(M) {
    const n = M * M;
    const index = Array.from({ length: n }, () => new Array(n));
    const biasVals = new Map(); // hash → simulated bias value

    for (let i = 0; i < n; i++) {
      const ri = Math.floor(i / M),
        ci = i % M;
      for (let j = 0; j < n; j++) {
        const rj = Math.floor(j / M),
          cj = j % M;
        const dr = ri - rj; // range: -(M-1) to +(M-1)
        const dc = ci - cj;
        const idxR = dr + M - 1;
        const idxC = dc + M - 1;
        const flatIdx = idxR * (2 * M - 1) + idxC;
        index[i][j] = { dr, dc, flatIdx };

        if (!biasVals.has(flatIdx)) {
          // Simulate a learned bias: closer = higher
          const dist = Math.sqrt(dr * dr + dc * dc);
          const maxDist = Math.sqrt(2) * (M - 1);
          biasVals.set(
            flatIdx,
            1.5 - (dist / maxDist) * 3 + Math.sin(flatIdx * 0.7) * 0.3,
          );
        }
      }
    }
    return { index, biasVals, n };
  }

  function getColor(val, minV, maxV) {
    const t = maxV === minV ? 0.5 : (val - minV) / (maxV - minV);
    if (t > 0.5) {
      const s = (t - 0.5) * 2;
      const r = Math.floor(102 * (1 - s) + 102 * s);
      const g = Math.floor(187 * (1 - s) + 187 * s);
      const b = Math.floor(106 * (1 - s) + 106 * s);
      return `rgba(${r},${g},${b},${0.3 + s * 0.6})`;
    } else {
      const s = t * 2;
      const r = Math.floor(239 * (1 - s) + 160 * s);
      const g = Math.floor(83 * (1 - s) + 160 * s);
      const b = Math.floor(80 * (1 - s) + 160 * s);
      return `rgba(${r},${g},${b},${0.3 + (1 - s) * 0.6})`;
    }
  }

  function drawBiasMatrix() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const M = state.M;
    const { index, biasVals, n } = computeBiasIndex(M);

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText(
      `상대적 위치 바이어스 행렬 B (M=${M}, 크기: ${n}×${n})`,
      W / 2,
      24,
    );

    // Matrix heatmap
    const maxCells = 49; // Max M=7 → 49
    const matSz = Math.min(420, H - 110);
    const cellSz = matSz / n;
    const ox = 60,
      oy = 45;

    // Get value range
    let minV = Infinity,
      maxV = -Infinity;
    biasVals.forEach((v) => {
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    });

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const val = biasVals.get(index[i][j].flatIdx);
        ctx.fillStyle = getColor(val, minV, maxV);
        ctx.fillRect(ox + j * cellSz, oy + i * cellSz, cellSz, cellSz);

        // Highlight hovered row/col
        if (state.hoverCell) {
          if (state.hoverCell.i === i || state.hoverCell.j === j) {
            ctx.fillStyle = '#ffffff11';
            ctx.fillRect(ox + j * cellSz, oy + i * cellSz, cellSz, cellSz);
          }
          if (state.hoverCell.i === i && state.hoverCell.j === j) {
            ctx.strokeStyle = C.highlight;
            ctx.lineWidth = 2;
            ctx.strokeRect(ox + j * cellSz, oy + i * cellSz, cellSz, cellSz);
          }
        }

        // Cell value for small matrices
        if (n <= 16 && cellSz > 18) {
          ctx.font = `${Math.min(9, cellSz * 0.35)}px monospace`;
          ctx.fillStyle = '#ffffffcc';
          ctx.textAlign = 'center';
          ctx.fillText(
            val.toFixed(1),
            ox + (j + 0.5) * cellSz,
            oy + (i + 0.5) * cellSz + 3,
          );
        }
      }
    }

    // Border
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, matSz, matSz);

    // Axes labels
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText('Query 토큰 위치 (i)', ox + matSz / 2, oy + matSz + 18);

    ctx.save();
    ctx.translate(ox - 14, oy + matSz / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Key 토큰 위치 (j)', 0, 0);
    ctx.restore();

    // ─── Right: Bias Table ───
    const tableX = ox + matSz + 50;
    const tableY = oy;
    const tableM = 2 * M - 1;
    const tCellSz = Math.min(24, (H - 120) / tableM);
    const tableSz = tableM * tCellSz;

    ctx.font = 'bold 12px "Noto Sans KR"';
    ctx.fillStyle = C.bias;
    ctx.textAlign = 'center';
    ctx.fillText(`바이어스 테이블 B̂`, tableX + tableSz / 2, tableY - 8);
    ctx.font = '9px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.fillText(
      `(${tableM}×${tableM}) = ${tableM * tableM}개 파라미터`,
      tableX + tableSz / 2,
      tableY + 6,
    );

    let tIdx = 0;
    for (let r = 0; r < tableM; r++) {
      for (let c = 0; c < tableM; c++) {
        const val = biasVals.has(tIdx) ? biasVals.get(tIdx) : 0;
        ctx.fillStyle = getColor(val, minV, maxV);
        ctx.fillRect(
          tableX + c * tCellSz,
          tableY + 18 + r * tCellSz,
          tCellSz,
          tCellSz,
        );
        tIdx++;
      }
    }
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, tableY + 18, tableSz, tableSz);

    // Axis labels for table
    ctx.font = '8px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'center';
    ctx.fillText('Δcol', tableX + tableSz / 2, tableY + 18 + tableSz + 14);
    ctx.save();
    ctx.translate(tableX - 8, tableY + 18 + tableSz / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Δrow', 0, 0);
    ctx.restore();

    // Color legend
    const lgX = tableX,
      lgY = tableY + 18 + tableSz + 30;
    const lgW = tableSz,
      lgH = 12;
    const grad = ctx.createLinearGradient(lgX, 0, lgX + lgW, 0);
    grad.addColorStop(0, '#EF535099');
    grad.addColorStop(0.5, '#a0a0b044');
    grad.addColorStop(1, '#66BB6A99');
    ctx.fillStyle = grad;
    ctx.fillRect(lgX, lgY, lgW, lgH);
    ctx.font = '8px monospace';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'left';
    ctx.fillText(minV.toFixed(1), lgX, lgY + lgH + 10);
    ctx.textAlign = 'right';
    ctx.fillText(maxV.toFixed(1), lgX + lgW, lgY + lgH + 10);
    ctx.textAlign = 'center';
    ctx.fillText('0', lgX + lgW / 2, lgY + lgH + 10);

    // Hover info
    if (state.hoverCell && state.hoverCell.i < n && state.hoverCell.j < n) {
      const { i, j } = state.hoverCell;
      const info = index[i][j];
      const val = biasVals.get(info.flatIdx);
      ctx.font = '11px "Noto Sans KR"';
      ctx.fillStyle = C.highlight;
      ctx.textAlign = 'left';
      const infoY = lgY + lgH + 30;
      ctx.fillText(
        `Query=(${Math.floor(i / M)},${i % M})  Key=(${Math.floor(j / M)},${j % M})`,
        lgX,
        infoY,
      );
      ctx.fillText(
        `Δ=(${info.dr},${info.dc})  index=${info.flatIdx}  B=${val.toFixed(3)}`,
        lgX,
        infoY + 18,
      );
    }

    // Note
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.bias;
    ctx.textAlign = 'left';
    ctx.fillText(
      '✦ 이 값은 시뮬레이션입니다. 실제로는 학습을 통해 결정됩니다',
      ox,
      H - 18,
    );
  }

  function drawCoordIndex() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const M = state.M;

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText(`상대 좌표 인덱스 계산 과정 (M=${M})`, W / 2, 24);

    // Show window grid with coordinates
    const gridSz = Math.min(300, H - 160);
    const cellSz = gridSz / M;
    const ox = 60,
      oy = 55;

    ctx.font = 'bold 11px "Noto Sans KR"';
    ctx.fillStyle = C.bias;
    ctx.textAlign = 'center';
    ctx.fillText(`${M}×${M} 윈도우 (절대 좌표)`, ox + gridSz / 2, oy - 8);

    for (let r = 0; r < M; r++) {
      for (let c = 0; c < M; c++) {
        ctx.fillStyle = C.bias + '22';
        ctx.strokeStyle = C.bias + '66';
        ctx.lineWidth = 1;
        ctx.fillRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);
        ctx.strokeRect(ox + c * cellSz, oy + r * cellSz, cellSz, cellSz);

        ctx.font = `${Math.min(12, cellSz * 0.3)}px monospace`;
        ctx.fillStyle = C.text;
        ctx.textAlign = 'center';
        ctx.fillText(
          `(${r},${c})`,
          ox + (c + 0.5) * cellSz,
          oy + (r + 0.5) * cellSz + 4,
        );
      }
    }

    // Show relative coords for a selected query position
    const qr = Math.floor(M / 2),
      qc = Math.floor(M / 2); // center token
    const relOx = ox + gridSz + 80,
      relOy = oy;

    ctx.font = 'bold 11px "Noto Sans KR"';
    ctx.fillStyle = C.highlight;
    ctx.textAlign = 'center';
    ctx.fillText(
      `Query=(${qr},${qc})에서의 상대 좌표 Δ`,
      relOx + gridSz / 2,
      relOy - 8,
    );

    for (let r = 0; r < M; r++) {
      for (let c = 0; c < M; c++) {
        const dr = r - qr;
        const dc = c - qc;
        const dist = Math.sqrt(dr * dr + dc * dc);
        const maxDist = Math.sqrt(2) * (M - 1);
        const t = 1 - dist / maxDist;

        ctx.fillStyle = `rgba(66,165,245,${0.1 + t * 0.5})`;
        ctx.strokeStyle = C.bias + '66';
        ctx.lineWidth = 1;
        ctx.fillRect(relOx + c * cellSz, relOy + r * cellSz, cellSz, cellSz);
        ctx.strokeRect(relOx + c * cellSz, relOy + r * cellSz, cellSz, cellSz);

        ctx.font = `${Math.min(11, cellSz * 0.28)}px monospace`;
        ctx.fillStyle = C.text;
        ctx.textAlign = 'center';
        const sign = (v) => (v >= 0 ? `+${v}` : `${v}`);
        ctx.fillText(
          `(${sign(dr)},${sign(dc)})`,
          relOx + (c + 0.5) * cellSz,
          relOy + (r + 0.5) * cellSz + 4,
        );
      }
    }

    // Highlight query cell
    ctx.strokeStyle = C.highlight;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(relOx + qc * cellSz, relOy + qr * cellSz, cellSz, cellSz);
    ctx.strokeRect(ox + qc * cellSz, oy + qr * cellSz, cellSz, cellSz);

    // Index mapping explanation
    const ey = oy + gridSz + 30;
    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.sub;
    ctx.textAlign = 'left';
    const lines = [
      `1. 상대 좌표: Δrow = row_q - row_k,  Δcol = col_q - col_k`,
      `2. 범위: Δrow, Δcol ∈ [-(M-1), +(M-1)] = [-${M - 1}, +${M - 1}]`,
      `3. 오프셋: Δrow += ${M - 1}, Δcol += ${M - 1}  →  [0, ${2 * (M - 1)}]`,
      `4. 1D 인덱스: idx = Δrow×(2M-1) + Δcol → 테이블 크기: (${2 * M - 1})² = ${(2 * M - 1) ** 2}`,
      `5. B[i][j] = bias_table[idx] → Attention = softmax(QK^T/√d + B)V`,
    ];
    lines.forEach((l, i) => ctx.fillText(l, 60, ey + i * 20));

    ctx.font = '10px "Noto Sans KR"';
    ctx.fillStyle = C.bias;
    ctx.fillText(
      '✦ 같은 상대 거리를 갖는 모든 쌍은 동일한 바이어스 값을 공유합니다',
      60,
      ey + lines.length * 20 + 14,
    );
  }

  function render() {
    switch (state.display) {
      case 'bias-matrix':
        drawBiasMatrix();
        break;
      case 'coord-index':
        drawCoordIndex();
        break;
    }
  }

  // Mouse hover on bias matrix
  canvas.addEventListener('mousemove', (e) => {
    if (state.display !== 'bias-matrix') return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    const M = state.M;
    const n = M * M;
    const matSz = Math.min(420, canvas.height - 110);
    const cellSz = matSz / n;
    const ox = 60,
      oy = 45;

    if (mx >= ox && mx < ox + matSz && my >= oy && my < oy + matSz) {
      const j = Math.floor((mx - ox) / cellSz);
      const i = Math.floor((my - oy) / cellSz);
      if (i >= 0 && i < n && j >= 0 && j < n) {
        state.hoverCell = { i, j };
        render();
        return;
      }
    }
    if (state.hoverCell) {
      state.hoverCell = null;
      render();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (state.hoverCell) {
      state.hoverCell = null;
      render();
    }
  });

  windowSlider.addEventListener('input', () => {
    state.M = parseInt(windowSlider.value);
    windowVal.textContent = state.M;
    state.hoverCell = null;
    render();
    if (window.__swinProgress)
      window.__swinProgress.save('section-position-bias');
  });

  displaySelect.addEventListener('change', () => {
    state.display = displaySelect.value;
    state.hoverCell = null;
    render();
    if (window.__swinProgress)
      window.__swinProgress.save('section-position-bias');
  });

  render();
}
