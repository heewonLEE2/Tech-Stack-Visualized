// ===== ViT 전체 아키텍처 개요 시각화 =====

export function initOverview() {
  const canvas = document.getElementById('overview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 색상
    const colors = {
      image: '#4fc3f7',
      patch: '#ffb74d',
      embed: '#81c784',
      encoder: '#7e57c2',
      cls: '#e94560',
      mlp: '#26a69a',
      arrow: '#a0a0b0',
      text: '#e0e0e0',
      textSub: '#a0a0b0',
      bg: '#16213e',
    };

    // 블록 정의
    const blocks = [
      {
        x: 30,
        y: 140,
        w: 100,
        h: 120,
        label: '입력\n이미지',
        sub: '224×224×3',
        color: colors.image,
        icon: '🖼️',
      },
      {
        x: 170,
        y: 140,
        w: 100,
        h: 120,
        label: '패치\n분할',
        sub: '14×14 패치',
        color: colors.patch,
        icon: '▦',
      },
      {
        x: 310,
        y: 140,
        w: 100,
        h: 120,
        label: '패치\n임베딩',
        sub: 'Linear\nProjection',
        color: colors.embed,
        icon: '⊠',
      },
      {
        x: 450,
        y: 90,
        w: 100,
        h: 95,
        label: 'CLS\n토큰',
        sub: '1×D',
        color: colors.cls,
        icon: '★',
      },
      {
        x: 450,
        y: 215,
        w: 100,
        h: 95,
        label: '위치\n임베딩',
        sub: '(N+1)×D',
        color: colors.embed,
        icon: '∿',
      },
      {
        x: 600,
        y: 140,
        w: 120,
        h: 120,
        label: 'Transformer\nEncoder',
        sub: '×L layers',
        color: colors.encoder,
        icon: '⊞',
      },
      {
        x: 770,
        y: 140,
        w: 100,
        h: 120,
        label: 'MLP\nHead',
        sub: '분류',
        color: colors.mlp,
        icon: '◎',
      },
      {
        x: 910,
        y: 153,
        w: 70,
        h: 94,
        label: '출력',
        sub: 'Class',
        color: colors.cls,
        icon: '🏷️',
      },
    ];

    // 화살표 그리기
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
      const headLen = 10;
      ctx.beginPath();
      ctx.fillStyle = colors.arrow;
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLen * Math.cos(angle - 0.4),
        y2 - headLen * Math.sin(angle - 0.4),
      );
      ctx.lineTo(
        x2 - headLen * Math.cos(angle + 0.4),
        y2 - headLen * Math.sin(angle + 0.4),
      );
      ctx.fill();
    }

    // 연결선
    drawArrow(130, 200, 170, 200);
    drawArrow(270, 200, 310, 200);
    drawArrow(410, 200, 450, 137); // → CLS 중심 (90 + 95/2)
    drawArrow(410, 200, 450, 262); // → 위치임베딩 중심 (215 + 95/2)
    drawArrow(550, 137, 600, 185); // CLS → Encoder
    drawArrow(550, 262, 600, 215); // 위치임베딩 → Encoder
    drawArrow(720, 200, 770, 200);
    drawArrow(870, 200, 910, 200);

    // 블록 그리기
    blocks.forEach((b) => {
      // 배경
      ctx.fillStyle = b.color + '22';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      roundRect(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fill();
      ctx.stroke();

      // 아이콘
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = b.color;
      ctx.fillText(b.icon, b.x + b.w / 2, b.y + 24);

      // 라벨
      ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
      ctx.fillStyle = colors.text;
      const lines = b.label.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, b.x + b.w / 2, b.y + 44 + i * 16);
      });

      // 서브텍스트
      ctx.font = '11px "Noto Sans KR", sans-serif';
      ctx.fillStyle = colors.textSub;
      const subLines = b.sub.split('\n');
      subLines.forEach((line, i) => {
        ctx.fillText(
          line,
          b.x + b.w / 2,
          b.y + b.h - 12 + (i - subLines.length + 1) * 14,
        );
      });
    });

    // 제목
    ctx.font = 'bold 16px "Noto Sans KR", sans-serif';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.fillText('Vision Transformer (ViT) 아키텍처', W / 2, 40);

    ctx.font = '12px "Noto Sans KR", sans-serif';
    ctx.fillStyle = colors.textSub;
    ctx.fillText(
      '이미지 → 패치 → 임베딩 → Transformer Encoder → 분류',
      W / 2,
      65,
    );

    // Encoder 내부 구조 보조 텍스트
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = colors.encoder;
    ctx.textAlign = 'center';
    ctx.fillText('LN → MSA → +', 660, 310);
    ctx.fillText('LN → MLP → +', 660, 326);

    // 범례
    const legendY = H - 50;
    ctx.font = '11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    const legend = [
      { color: colors.image, label: '입력' },
      { color: colors.patch, label: '패치' },
      { color: colors.embed, label: '임베딩' },
      { color: colors.encoder, label: '인코더' },
      { color: colors.cls, label: 'CLS/출력' },
      { color: colors.mlp, label: 'MLP Head' },
    ];
    legend.forEach((item, i) => {
      const lx = 30 + i * 130;
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, legendY, 14, 14);
      ctx.fillStyle = colors.textSub;
      ctx.fillText(item.label, lx + 20, legendY + 12);
    });
  }

  draw();
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
