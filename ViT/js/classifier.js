// ===== 분류 헤드(MLP Head) 시각화 =====

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

export function initClassifier() {
  const canvas = document.getElementById('mlp-head-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;

  const colors = {
    cls: '#e94560',
    ln: '#ffb74d',
    linear: '#7e57c2',
    tanh: '#81c784',
    output: '#4fc3f7',
    text: '#e0e0e0',
    textSub: '#a0a0b0',
    arrow: '#a0a0b0',
    bg: '#16213e',
    softmax: '#26a69a',
  };

  function drawArrow(x1, y1, x2, y2, color) {
    ctx.beginPath();
    ctx.strokeStyle = color || colors.arrow;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.fillStyle = color || colors.arrow;
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(angle - 0.4), y2 - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 8 * Math.cos(angle + 0.4), y2 - 8 * Math.sin(angle + 0.4));
    ctx.fill();
  }

  function drawBlock(x, y, w, h, label, sub, color) {
    ctx.fillStyle = color + '22';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 - (sub ? 4 : 0) + 5);

    if (sub) {
      ctx.font = '10px monospace';
      ctx.fillStyle = colors.textSub;
      ctx.fillText(sub, x + w / 2, y + h / 2 + 16);
    }
  }

  ctx.clearRect(0, 0, W, H);

  // 제목
  ctx.font = 'bold 15px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText('CLS 토큰 → MLP Head → 분류', W / 2, 30);

  // 인코더 출력
  const seqY = 60;
  const tokenW = 50,
    tokenH = 80,
    gap = 6;
  const numTokens = 8;
  const seqStartX = 40;

  ctx.font = '11px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';
  ctx.fillText(
    '인코더 출력',
    seqStartX + (numTokens * (tokenW + gap)) / 2,
    seqY - 5,
  );

  for (let i = 0; i < numTokens; i++) {
    const x = seqStartX + i * (tokenW + gap);
    const isCls = i === 0;
    const color = isCls ? colors.cls : '#555580';
    ctx.fillStyle = color + (isCls ? '33' : '15');
    ctx.strokeStyle = color;
    ctx.lineWidth = isCls ? 2.5 : 1;
    roundRect(ctx, x, seqY, tokenW, tokenH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `${isCls ? 'bold ' : ''}10px sans-serif`;
    ctx.fillStyle = isCls ? colors.cls : '#777';
    ctx.textAlign = 'center';
    ctx.fillText(
      isCls ? 'CLS' : `P${i}`,
      x + tokenW / 2,
      seqY + tokenH / 2 + 4,
    );

    // X 표시 (CLS 외 토큰은 분류에 미사용)
    if (!isCls) {
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#ffffff15';
      ctx.fillText('×', x + tokenW / 2, seqY + tokenH - 10);
    }
  }

  // CLS 추출 화살표
  const clsCX = seqStartX + tokenW / 2;
  const clsCY = seqY + tokenH;
  drawArrow(clsCX, clsCY + 5, clsCX, clsCY + 40, colors.cls);

  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.cls;
  ctx.textAlign = 'left';
  ctx.fillText('CLS 토큰만 추출', clsCX + 10, clsCY + 28);

  // MLP Head 파이프라인 (우측으로 진행)
  const pipeY = seqY + tokenH + 50;
  const blockW = 130,
    blockH = 55;
  let px = 50;

  // CLS 벡터 블록
  drawBlock(px, pipeY, blockW, blockH, 'CLS 벡터', 'D = 768', colors.cls);
  px += blockW;
  drawArrow(px + 5, pipeY + blockH / 2, px + 35, pipeY + blockH / 2);
  px += 40;

  // Layer Norm
  drawBlock(px, pipeY, blockW, blockH, 'Layer Norm', '정규화', colors.ln);
  px += blockW;
  drawArrow(px + 5, pipeY + blockH / 2, px + 35, pipeY + blockH / 2);
  px += 40;

  // Pre-training: Linear → tanh → Linear
  const ptY = pipeY - 10;
  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = 'center';
  ctx.fillText('Pre-training', px + 200, ptY - 8);

  drawBlock(px, pipeY, 100, blockH, 'Linear', 'D → D', colors.linear);
  px += 105;
  drawArrow(px, pipeY + blockH / 2, px + 20, pipeY + blockH / 2);
  px += 25;

  drawBlock(px, pipeY, 80, blockH, 'tanh', '활성화', colors.tanh);
  px += 85;
  drawArrow(px, pipeY + blockH / 2, px + 20, pipeY + blockH / 2);
  px += 25;

  drawBlock(px, pipeY, 100, blockH, 'Linear', 'D → K', colors.linear);
  px += 105;
  drawArrow(px, pipeY + blockH / 2, px + 20, pipeY + blockH / 2);
  px += 25;

  // Softmax + 출력
  drawBlock(px, pipeY, 100, blockH, 'Softmax', '확률 분포', colors.softmax);

  // 출력 클래스 확률
  const outX = 50,
    outY = pipeY + blockH + 50;
  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'left';
  ctx.fillText('출력 예시 (ImageNet 1000 클래스 중 Top-5):', outX, outY);

  const classes = [
    { name: '고양이 (tabby cat)', prob: 0.72 },
    { name: '호랑이 고양이 (tiger cat)', prob: 0.15 },
    { name: '이집트 고양이 (Egyptian cat)', prob: 0.06 },
    { name: '린크스 (lynx)', prob: 0.03 },
    { name: '페르시안 (Persian cat)', prob: 0.02 },
  ];

  classes.forEach((cls, i) => {
    const y = outY + 20 + i * 28;
    const barMaxW = 300;
    const barW = cls.prob * barMaxW;
    const barH = 20;

    // 바
    ctx.fillStyle = colors.output + '22';
    roundRect(ctx, outX, y, barMaxW, barH, 4);
    ctx.fill();

    ctx.fillStyle = colors.output + (i === 0 ? 'cc' : '66');
    roundRect(ctx, outX, y, barW, barH, 4);
    ctx.fill();

    // 텍스트
    ctx.font = `${i === 0 ? 'bold ' : ''}11px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = i === 0 ? colors.text : colors.textSub;
    ctx.textAlign = 'left';
    ctx.fillText(`${cls.name}`, outX + barMaxW + 10, y + 14);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = colors.output;
    ctx.fillText(`${(cls.prob * 100).toFixed(1)}%`, outX + barW + 6, y + 14);
  });
}
