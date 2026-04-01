// ===== ML Pipeline Overview =====
import { createCanvas, clearCanvas, roundRect, drawArrow } from './utils.js';

export function initOverview() {
  const container = document.getElementById('overview-container');
  if (!container) return;
  container.innerHTML = '';

  const W = 960,
    H = 380;
  const { canvas, ctx } = createCanvas(container, W, H);

  const blocks = [
    { label: '📊 데이터\n수집', color: '#4fc3f7', section: null },
    { label: '🧹 전처리', color: '#29b6f6', section: 'section-regression' },
    { label: '🔧 특성 공학', color: '#26a69a', section: 'section-overfitting' },
    { label: '🤖 모델 선택', color: '#7c4dff', section: 'section-playground' },
    {
      label: '📉 학습\n(최적화)',
      color: '#ffb74d',
      section: 'section-gradient',
    },
    { label: '✅ 평가', color: '#81c784', section: 'section-classification' },
    { label: '🔄 튜닝', color: '#ce93d8', section: 'section-overfitting' },
    { label: '🚀 배포', color: '#ef5350', section: null },
  ];

  const blockW = 95,
    blockH = 70,
    gap = 16;
  const totalW = blocks.length * blockW + (blocks.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const startY = (H - blockH) / 2 - 30;

  function drawBlock(b, idx) {
    const x = startX + idx * (blockW + gap);
    const y = startY;

    // Shadow
    ctx.shadowColor = b.color + '40';
    ctx.shadowBlur = 12;
    roundRect(ctx, x, y, blockW, blockH, 10, b.color + '22', b.color);
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '700 12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    const lines = b.label.split('\n');
    const lineH = 16;
    const textY = y + blockH / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, li) => {
      ctx.fillText(line, x + blockW / 2, textY + li * lineH);
    });

    // Arrow to next
    if (idx < blocks.length - 1) {
      drawArrow(
        ctx,
        x + blockW + 2,
        y + blockH / 2,
        x + blockW + gap - 2,
        y + blockH / 2,
        '#a0a0b0',
        1.5,
      );
    }

    return { x, y, w: blockW, h: blockH, section: b.section };
  }

  function draw() {
    clearCanvas(ctx, W, H);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('머신러닝 파이프라인', W / 2, 30);

    const hitAreas = blocks.map((b, i) => drawBlock(b, i));

    // Feedback loop arrow (튜닝 → 모델 선택)
    const tuneBlock = hitAreas[6];
    const modelBlock = hitAreas[3];
    ctx.strokeStyle = '#ce93d8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const loopY = startY + blockH + 30;
    ctx.moveTo(tuneBlock.x + tuneBlock.w / 2, tuneBlock.y + tuneBlock.h);
    ctx.lineTo(tuneBlock.x + tuneBlock.w / 2, loopY);
    ctx.lineTo(modelBlock.x + modelBlock.w / 2, loopY);
    ctx.lineTo(modelBlock.x + modelBlock.w / 2, modelBlock.y + modelBlock.h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label for loop
    ctx.fillStyle = '#ce93d8';
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      '하이퍼파라미터 튜닝 루프',
      (tuneBlock.x + modelBlock.x + modelBlock.w) / 2,
      loopY + 16,
    );

    // Arrow head for loop
    const tipX = modelBlock.x + modelBlock.w / 2;
    const tipY = modelBlock.y + modelBlock.h;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 5, tipY + 8);
    ctx.lineTo(tipX + 5, tipY + 8);
    ctx.closePath();
    ctx.fillStyle = '#ce93d8';
    ctx.fill();

    // Legend
    const legendY = H - 50;
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText(
      '💡 각 블록을 클릭하면 관련 섹션으로 이동합니다',
      startX,
      legendY,
    );

    // Supervised / Unsupervised labels
    const supX = startX;
    const supY = startY - 16;
    ctx.font = '10px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#4fc3f770';
    ctx.textAlign = 'center';
    ctx.fillText('지도 학습 · 비지도 학습 공통 워크플로우', W / 2, supY);

    return hitAreas;
  }

  let areas = draw();

  // Click navigation
  canvas.style.cursor = 'pointer';
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const a of areas) {
      if (
        a.section &&
        mx >= a.x &&
        mx <= a.x + a.w &&
        my >= a.y &&
        my <= a.y + a.h
      ) {
        const target = document.getElementById(a.section);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        break;
      }
    }
  });

  // Hover cursor
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let hover = false;
    for (const a of areas) {
      if (
        a.section &&
        mx >= a.x &&
        mx <= a.x + a.w &&
        my >= a.y &&
        my <= a.y + a.h
      ) {
        hover = true;
        break;
      }
    }
    canvas.style.cursor = hover ? 'pointer' : 'default';
  });

  if (window.__mlProgress) window.__mlProgress.save('section-overview');
}
