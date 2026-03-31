// ===== Swin Transformer 전체 아키텍처 개요 =====

export function initOverview() {
  const canvas = document.getElementById('overview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const blockSections = [
    null, // 입력 이미지
    'section-patch', // 패치 파티션
    'section-patch', // Stage 1
    'section-patch', // Patch Merging 1
    'section-window-attention', // Stage 2
    'section-window-attention', // Patch Merging 2
    'section-window-attention', // Stage 3
    null, // Stage 4
    null, // Classification Head
  ];

  const colors = {
    image: '#4fc3f7',
    patch: '#FFA726',
    stage1: '#66BB6A',
    stage2: '#42A5F5',
    stage3: '#AB47BC',
    stage4: '#EF5350',
    merge: '#FF7043',
    head: '#26C6DA',
    arrow: '#a0a0b0',
    text: '#e0e0e0',
    sub: '#a0a0b0',
  };

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function drawArrow(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.strokeStyle = colors.arrow;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const hl = 9;
    ctx.beginPath();
    ctx.fillStyle = colors.arrow;
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - hl * Math.cos(angle - 0.4),
      y2 - hl * Math.sin(angle - 0.4),
    );
    ctx.lineTo(
      x2 - hl * Math.cos(angle + 0.4),
      y2 - hl * Math.sin(angle + 0.4),
    );
    ctx.fill();
  }

  function drawBlock(b) {
    ctx.fillStyle = b.color + '22';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    roundRect(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = b.color;
    ctx.fillText(b.icon, b.x + b.w / 2, b.y + 22);

    // Label
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = colors.text;
    b.label.split('\n').forEach((l, i) => {
      ctx.fillText(l, b.x + b.w / 2, b.y + 40 + i * 14);
    });

    // Sub
    ctx.font = '10px "Noto Sans KR", sans-serif';
    ctx.fillStyle = colors.sub;
    b.sub.split('\n').forEach((l, i) => {
      ctx.fillText(
        l,
        b.x + b.w / 2,
        b.y + b.h - 10 + (i - b.sub.split('\n').length + 1) * 13,
      );
    });
  }

  // small merge blocks between stages
  function drawMergeBlock(x, y) {
    const w = 30,
      h = 60;
    ctx.fillStyle = colors.merge + '33';
    ctx.strokeStyle = colors.merge;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.font = '8px "Noto Sans KR"';
    ctx.fillStyle = colors.merge;
    ctx.textAlign = 'center';
    ctx.fillText('Patch', x + w / 2, y + h / 2 - 4);
    ctx.fillText('Merge', x + w / 2, y + h / 2 + 8);
    return { x, y, w, h };
  }

  const blocks = [];

  function draw() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Title
    ctx.font = 'bold 15px "Noto Sans KR", sans-serif';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.fillText('Swin Transformer 아키텍처 (Swin-Tiny)', W / 2, 30);
    ctx.font = '11px "Noto Sans KR"';
    ctx.fillStyle = colors.sub;
    ctx.fillText(
      '이미지 → 패치 파티션 → Stage 1-4 (W-MSA ↔ SW-MSA 교대) → 분류',
      W / 2,
      50,
    );

    const topY = 80,
      midY = 230;

    // ─── Row 1: Input → Patch Partition → Stage1 → Merge → Stage2 ───
    blocks.length = 0;

    blocks.push({
      x: 20,
      y: topY,
      w: 80,
      h: 110,
      label: '입력\n이미지',
      sub: '224×224×3',
      color: colors.image,
      icon: '🖼️',
    });
    blocks.push({
      x: 120,
      y: topY,
      w: 90,
      h: 110,
      label: '패치\n파티션',
      sub: '4×4, C=96\n56×56 토큰',
      color: colors.patch,
      icon: '▦',
    });
    blocks.push({
      x: 240,
      y: topY,
      w: 110,
      h: 110,
      label: 'Stage 1',
      sub: '56×56, C=96\n×2 Swin Block',
      color: colors.stage1,
      icon: '🟢',
    });

    // Merge 1
    const m1 = { x: 370, y: topY + 25 };

    blocks.push({
      x: 420,
      y: topY,
      w: 110,
      h: 110,
      label: 'Stage 2',
      sub: '28×28, C=192\n×2 Swin Block',
      color: colors.stage2,
      icon: '🔵',
    });

    // Merge 2
    const m2 = { x: 550, y: topY + 25 };

    blocks.push({
      x: 600,
      y: topY,
      w: 110,
      h: 110,
      label: 'Stage 3',
      sub: '14×14, C=384\n×6 Swin Block',
      color: colors.stage3,
      icon: '🟣',
    });

    // Merge 3
    const m3 = { x: 730, y: topY + 25 };

    blocks.push({
      x: 780,
      y: topY,
      w: 110,
      h: 110,
      label: 'Stage 4',
      sub: '7×7, C=768\n×2 Swin Block',
      color: colors.stage4,
      icon: '🔴',
    });

    blocks.push({
      x: 910,
      y: topY + 10,
      w: 75,
      h: 90,
      label: 'GAP +\nHead',
      sub: '1000 cls',
      color: colors.head,
      icon: '🎯',
    });

    // Arrows (Row 1)
    drawArrow(100, topY + 55, 120, topY + 55);
    drawArrow(210, topY + 55, 240, topY + 55);
    drawArrow(350, topY + 55, 370, topY + 55);
    drawArrow(400, topY + 55, 420, topY + 55);
    drawArrow(530, topY + 55, 550, topY + 55);
    drawArrow(580, topY + 55, 600, topY + 55);
    drawArrow(710, topY + 55, 730, topY + 55);
    drawArrow(760, topY + 55, 780, topY + 55);
    drawArrow(890, topY + 55, 910, topY + 55);

    // Merge blocks
    drawMergeBlock(m1.x, m1.y);
    drawMergeBlock(m2.x, m2.y);
    drawMergeBlock(m3.x, m3.y);

    // Draw all blocks
    blocks.forEach(drawBlock);

    // ─── Row 2: Swin Block detail ───
    const detailX = 80,
      detailY = midY + 20;

    ctx.font = 'bold 13px "Noto Sans KR"';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    ctx.fillText('Swin Transformer Block (연속 2개가 한 쌍)', detailX, detailY);

    // Block pair
    const bw = 360,
      bh = 110;
    const bY = detailY + 12;

    // Block A: W-MSA
    ctx.fillStyle = colors.stage1 + '18';
    ctx.strokeStyle = colors.stage1;
    ctx.lineWidth = 1.5;
    roundRect(ctx, detailX, bY, bw / 2 - 5, bh, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "Noto Sans KR"';
    ctx.fillStyle = colors.stage1;
    ctx.textAlign = 'center';
    ctx.fillText('Swin Block (홀수)', detailX + bw / 4 - 2, bY + 18);
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = colors.sub;
    const wLines = ['LN → W-MSA → + (residual)', 'LN → MLP → + (residual)'];
    wLines.forEach((l, i) =>
      ctx.fillText(l, detailX + bw / 4 - 2, bY + 42 + i * 18),
    );

    // Block B: SW-MSA
    const bxR = detailX + bw / 2 + 5;
    ctx.fillStyle = colors.stage2 + '18';
    ctx.strokeStyle = colors.stage2;
    roundRect(ctx, bxR, bY, bw / 2 - 5, bh, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "Noto Sans KR"';
    ctx.fillStyle = colors.stage2;
    ctx.textAlign = 'center';
    ctx.fillText('Swin Block (짝수)', bxR + bw / 4 - 2, bY + 18);
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = colors.sub;
    const swLines = ['LN → SW-MSA → + (residual)', 'LN → MLP → + (residual)'];
    swLines.forEach((l, i) =>
      ctx.fillText(l, bxR + bw / 4 - 2, bY + 42 + i * 18),
    );

    // Arrow between blocks
    drawArrow(detailX + bw / 2 - 5, bY + bh / 2, bxR, bY + bh / 2);

    // ─── Row 2 right: Resolution pyramid ───
    const pyrX = 560,
      pyrY = midY + 20;
    ctx.font = 'bold 13px "Noto Sans KR"';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    ctx.fillText('계층적 특징 맵 (Feature Pyramid)', pyrX, pyrY);

    const stageInfo = [
      {
        label: 'Stage 1',
        res: '56×56',
        ch: 'C=96',
        color: colors.stage1,
        sz: 80,
      },
      {
        label: 'Stage 2',
        res: '28×28',
        ch: 'C=192',
        color: colors.stage2,
        sz: 60,
      },
      {
        label: 'Stage 3',
        res: '14×14',
        ch: 'C=384',
        color: colors.stage3,
        sz: 42,
      },
      {
        label: 'Stage 4',
        res: '7×7',
        ch: 'C=768',
        color: colors.stage4,
        sz: 26,
      },
    ];

    let pTotalW = 0;
    stageInfo.forEach((s) => (pTotalW += s.sz + 18));
    let px = pyrX + 10;
    const pBaseY = pyrY + 130;

    stageInfo.forEach((s) => {
      ctx.fillStyle = s.color + '30';
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.fillRect(px, pBaseY - s.sz, s.sz, s.sz);
      ctx.strokeRect(px, pBaseY - s.sz, s.sz, s.sz);

      ctx.font = '9px "Noto Sans KR"';
      ctx.fillStyle = s.color;
      ctx.textAlign = 'center';
      ctx.fillText(s.label, px + s.sz / 2, pBaseY + 14);
      ctx.fillText(s.res, px + s.sz / 2, pBaseY + 26);
      ctx.font = '8px monospace';
      ctx.fillText(s.ch, px + s.sz / 2, pBaseY + 38);

      px += s.sz + 18;
    });

    // ─── Swin vs ViT 비교 박스 ───
    const cmpX = 560,
      cmpY = pyrY + 185;
    ctx.fillStyle = '#ffffff08';
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    roundRect(ctx, cmpX, cmpY, 410, 50, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px "Noto Sans KR"';
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.stage1;
    ctx.fillText(
      '✓ Swin: O(n) 선형 복잡도, 계층적 특징 맵, 다양한 태스크',
      cmpX + 12,
      cmpY + 18,
    );
    ctx.fillStyle = colors.stage4;
    ctx.fillText(
      '✗ ViT:   O(n²) 이차 복잡도, 단일 해상도, 분류 특화',
      cmpX + 12,
      cmpY + 38,
    );

    // Legend
    const lY = H - 25;
    ctx.font = '10px "Noto Sans KR"';
    ctx.textAlign = 'left';
    const legend = [
      { c: colors.image, l: '입력' },
      { c: colors.patch, l: '패치 파티션' },
      { c: colors.stage1, l: 'Stage 1' },
      { c: colors.stage2, l: 'Stage 2' },
      { c: colors.stage3, l: 'Stage 3' },
      { c: colors.stage4, l: 'Stage 4' },
      { c: colors.merge, l: 'Patch Merge' },
      { c: colors.head, l: 'Head' },
    ];
    legend.forEach((item, i) => {
      const lx = 20 + i * 120;
      ctx.fillStyle = item.c;
      ctx.fillRect(lx, lY, 12, 12);
      ctx.fillStyle = colors.sub;
      ctx.fillText(item.l, lx + 16, lY + 10);
    });
  }

  draw();

  // Click navigation
  canvas.style.cursor = 'pointer';
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        const target = blockSections[i];
        if (target) {
          const el = document.getElementById(target);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      }
    }
  });

  // Mark progress on interaction
  canvas.addEventListener('click', () => {
    if (window.__swinProgress) window.__swinProgress.save('section-overview');
  });
}
