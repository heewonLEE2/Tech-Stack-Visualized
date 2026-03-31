// ===== 실전 파이프라인 (7-Step Walkthrough) =====

export function initPlayground() {
  const canvas = document.getElementById('playground-canvas');
  const prevBtn = document.getElementById('pg-prev-btn');
  const nextBtn = document.getElementById('pg-next-btn');
  const resetBtn = document.getElementById('pg-reset-btn');
  const stepLabel = document.getElementById('pg-step-label');
  const stepsDiv = document.getElementById('playground-steps');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const TOTAL_STEPS = 7;
  const state = { step: 0 };

  const C = {
    text: '#e0e0e0',
    sub: '#a0a0b0',
    stages: ['#66BB6A', '#42A5F5', '#AB47BC', '#EF5350'],
    image: '#4fc3f7',
    patch: '#FFA726',
    head: '#26C6DA',
    merge: '#FF7043',
    arrow: '#a0a0b0',
  };

  const pipeline_colors = [
    C.image,
    C.patch,
    C.stages[0],
    C.stages[1],
    C.stages[2],
    C.stages[3],
    C.head,
  ];

  const steps = [
    {
      title: '① 입력 이미지',
      desc: '224×224 RGB 이미지가 Swin-Tiny 모델에 입력됩니다.',
      detail: '배치 크기 B=1 기준, 입력 텐서 shape: [1, 3, 224, 224]',
    },
    {
      title: '② 패치 파티션 + Linear Embedding',
      desc: '4×4 패치로 분할 후 Linear Projection으로 C=96차원 임베딩.',
      detail:
        '[1, 3, 224, 224] → Conv2d(3, 96, kernel=4, stride=4) → [1, 96, 56, 56] → [1, 3136, 96]',
    },
    {
      title: '③ Stage 1: Swin Block ×2',
      desc: '56×56 해상도에서 W-MSA → SW-MSA 교대 수행. 윈도우 크기 M=7.',
      detail:
        '[1, 3136, 96] → (LN→W-MSA→+→LN→MLP→+) → (LN→SW-MSA→+→LN→MLP→+) → [1, 3136, 96]',
    },
    {
      title: '④ Patch Merging → Stage 2: Swin Block ×2',
      desc: '패치 머징으로 28×28, C=192로 축소 후 Swin Block 2개 수행.',
      detail:
        '[1, 3136, 96] → PatchMerge → [1, 784, 192] → 2× Swin Block → [1, 784, 192]',
    },
    {
      title: '⑤ Patch Merging → Stage 3: Swin Block ×6',
      desc: '14×14, C=384로 축소. 6개 블록으로 가장 깊은 특징 추출.',
      detail:
        '[1, 784, 192] → PatchMerge → [1, 196, 384] → 6× Swin Block → [1, 196, 384]',
    },
    {
      title: '⑥ Patch Merging → Stage 4: Swin Block ×2',
      desc: '7×7, C=768로 최종 축소. 최고 수준의 추상적 특징.',
      detail:
        '[1, 196, 384] → PatchMerge → [1, 49, 768] → 2× Swin Block → [1, 49, 768]',
    },
    {
      title: '⑦ Global Average Pooling + Classification Head',
      desc: 'GAP로 공간 차원을 제거하고 Linear 헤드로 1000 클래스 분류.',
      detail:
        '[1, 49, 768] → AdaptiveAvgPool → [1, 768] → Linear(768, 1000) → [1, 1000]',
    },
  ];

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
    ctx.strokeStyle = C.arrow;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.fillStyle = C.arrow;
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * Math.cos(a - 0.4), y2 - 7 * Math.sin(a - 0.4));
    ctx.lineTo(x2 - 7 * Math.cos(a + 0.4), y2 - 7 * Math.sin(a + 0.4));
    ctx.fill();
  }

  function drawBlock(x, y, w, h, label, sub, color, active) {
    ctx.fillStyle = active ? color + '44' : color + '15';
    ctx.strokeStyle = active ? color : color + '55';
    ctx.lineWidth = active ? 2.5 : 1;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    if (active) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      roundRect(ctx, x, y, w, h, 6);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.font = `bold ${active ? 11 : 10}px "Noto Sans KR"`;
    ctx.fillStyle = active ? color : color + '88';
    ctx.textAlign = 'center';
    label.split('\n').forEach((l, i) => {
      ctx.fillText(l, x + w / 2, y + 18 + i * 14);
    });

    ctx.font = '9px "Noto Sans KR"';
    ctx.fillStyle = active ? C.sub : C.sub + '55';
    sub.split('\n').forEach((l, i) => {
      ctx.fillText(
        l,
        x + w / 2,
        y + h - 12 + (i - sub.split('\n').length + 1) * 12,
      );
    });
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const s = state.step;

    // Title
    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText('Swin-Tiny 추론 파이프라인', W / 2, 24);

    // Pipeline blocks
    const pipeline = [
      { label: '입력\n이미지', sub: '224²×3', color: C.image, step: 0 },
      { label: '패치\n파티션', sub: '56²×96', color: C.patch, step: 1 },
      {
        label: 'Stage 1',
        sub: '56²×96\n×2 block',
        color: C.stages[0],
        step: 2,
      },
      {
        label: 'Stage 2',
        sub: '28²×192\n×2 block',
        color: C.stages[1],
        step: 3,
      },
      {
        label: 'Stage 3',
        sub: '14²×384\n×6 block',
        color: C.stages[2],
        step: 4,
      },
      {
        label: 'Stage 4',
        sub: '7²×768\n×2 block',
        color: C.stages[3],
        step: 5,
      },
      { label: 'GAP +\nHead', sub: '1000 cls', color: C.head, step: 6 },
    ];

    const bw = 105,
      bh = 75,
      gap = 23;
    const totalW = pipeline.length * bw + (pipeline.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const bY = 50;

    pipeline.forEach((p, i) => {
      const bx = startX + i * (bw + gap);
      const active = i <= s;
      drawBlock(bx, bY, bw, bh, p.label, p.sub, p.color, active);

      if (i < pipeline.length - 1) {
        // Merge indicator between stages 2-5
        if (i >= 2 && i <= 4) {
          const mx = bx + bw + 2;
          const my = bY + bh / 2 - 8;
          ctx.font = '8px "Noto Sans KR"';
          ctx.fillStyle = i <= s ? C.merge : C.merge + '44';
          ctx.textAlign = 'center';
          ctx.fillText('M', mx + gap / 2, my + 4);
        }
        drawArrow(bx + bw, bY + bh / 2, bx + bw + gap, bY + bh / 2);
      }
    });

    // Current step info box
    const infoY = bY + bh + 40;
    const infoW = 800,
      infoH = 130;
    const infoX = (W - infoW) / 2;

    const curStep = steps[s];
    const curColor = pipeline[s].color;

    ctx.fillStyle = curColor + '15';
    ctx.strokeStyle = curColor + '55';
    ctx.lineWidth = 1.5;
    roundRect(ctx, infoX, infoY, infoW, infoH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.fillStyle = curColor;
    ctx.textAlign = 'left';
    ctx.fillText(curStep.title, infoX + 20, infoY + 28);

    ctx.font = '12px "Noto Sans KR"';
    ctx.fillStyle = C.text;
    ctx.fillText(curStep.desc, infoX + 20, infoY + 54);

    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = C.sub;
    // Word-wrap detail
    const maxW = infoW - 40;
    const detailLines = [];
    let line = '';
    curStep.detail.split('').forEach((ch) => {
      line += ch;
      if (ctx.measureText(line).width > maxW) {
        detailLines.push(line.slice(0, -1));
        line = ch;
      }
    });
    if (line) detailLines.push(line);
    detailLines.forEach((l, i) => {
      ctx.fillText(l, infoX + 20, infoY + 80 + i * 16);
    });

    // Data flow visualization below
    const flowY = infoY + infoH + 30;
    drawDataFlow(s, (W - 900) / 2, flowY, 900);

    // Progress bar
    const pbW = 600,
      pbH = 6;
    const pbX = (W - pbW) / 2,
      pbY = H - 20;
    ctx.fillStyle = '#ffffff11';
    ctx.fillRect(pbX, pbY, pbW, pbH);
    ctx.fillStyle = curColor + '88';
    ctx.fillRect(pbX, pbY, pbW * ((s + 1) / TOTAL_STEPS), pbH);
  }

  function drawDataFlow(step, ox, oy, width) {
    // Show tensor shape transformation
    const shapes = [
      '[1, 3, 224, 224]',
      '[1, 3136, 96]',
      '[1, 3136, 96]',
      '[1, 784, 192]',
      '[1, 196, 384]',
      '[1, 49, 768]',
      '[1, 1000]',
    ];

    const ops = [
      'Conv2d(4×4)',
      '×2 Swin Block',
      'Merge + ×2 Block',
      'Merge + ×6 Block',
      'Merge + ×2 Block',
      'GAP + Linear',
    ];

    const numShapes = Math.min(step + 2, shapes.length);
    const shapeW = 80,
      shapeH = 26;
    const gapX = (width - numShapes * shapeW) / Math.max(numShapes - 1, 1);

    for (let i = 0; i < numShapes; i++) {
      const sx = ox + i * (shapeW + gapX);
      const active = i <= step;
      const color = i < pipeline_colors.length ? pipeline_colors[i] : C.sub;

      ctx.fillStyle = active ? color + '33' : '#ffffff08';
      ctx.strokeStyle = active ? color : '#ffffff22';
      ctx.lineWidth = 1;
      roundRect(ctx, sx, oy, shapeW, shapeH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = '8px monospace';
      ctx.fillStyle = active ? C.text : C.sub + '55';
      ctx.textAlign = 'center';
      ctx.fillText(shapes[i], sx + shapeW / 2, oy + shapeH / 2 + 3);

      if (i < numShapes - 1 && i < ops.length) {
        // Arrow
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff22';
        ctx.moveTo(sx + shapeW + 2, oy + shapeH / 2);
        ctx.lineTo(sx + shapeW + gapX - 2, oy + shapeH / 2);
        ctx.stroke();

        // Operation label below the arrow
        ctx.font = '7px "Noto Sans KR"';
        ctx.fillStyle = C.sub;
        ctx.textAlign = 'center';
        ctx.fillText(ops[i], sx + shapeW + gapX / 2, oy + shapeH + 12);
      }
    }
  }

  function updateUI() {
    stepLabel.textContent = `Step ${state.step + 1} / ${TOTAL_STEPS}`;
    prevBtn.disabled = state.step === 0;
    nextBtn.disabled = state.step === TOTAL_STEPS - 1;
    render();

    // Update step descriptions
    stepsDiv.innerHTML = '';
    steps.forEach((s, i) => {
      const div = document.createElement('div');
      div.style.cssText = `
        padding: 8px 14px; margin: 4px 0; border-radius: 6px;
        border-left: 3px solid ${i <= state.step ? pipeline_colors[i] : '#333'};
        background: ${i === state.step ? pipeline_colors[i] + '15' : 'transparent'};
        opacity: ${i <= state.step ? 1 : 0.4};
        font-size: 12px; color: #ccc; transition: all 0.3s;
      `;
      div.innerHTML = `<strong style="color:${pipeline_colors[i]}">${s.title}</strong>`;
      if (i === state.step) {
        div.innerHTML += `<br><span style="font-size:11px">${s.desc}</span>`;
      }
      stepsDiv.appendChild(div);
    });
  }

  prevBtn.addEventListener('click', () => {
    if (state.step > 0) {
      state.step--;
      updateUI();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (state.step < TOTAL_STEPS - 1) {
      state.step++;
      updateUI();
      if (state.step === TOTAL_STEPS - 1 && window.__swinProgress) {
        window.__swinProgress.save('section-playground');
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    state.step = 0;
    updateUI();
  });

  updateUI();
}
