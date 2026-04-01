// ===== Overview: AWS Cloud Pipeline Animation =====

export function initOverview() {
  const container = document.getElementById('overview-container');
  if (!container) return;

  const stages = [
    {
      id: 'route53',
      label: 'Route 53',
      sub: 'DNS 라우팅',
      color: '#8C4FFF',
      section: 'section-global-infra',
    },
    {
      id: 'cloudfront',
      label: 'CloudFront',
      sub: 'CDN 캐싱',
      color: '#8C4FFF',
      section: 'section-global-infra',
    },
    {
      id: 'alb',
      label: 'ALB',
      sub: '로드 밸런서',
      color: '#8C4FFF',
      section: 'section-vpc',
    },
    {
      id: 'ec2',
      label: 'EC2',
      sub: '컴퓨팅',
      color: '#ED7100',
      section: 'section-compute',
    },
    {
      id: 'lambda',
      label: 'Lambda',
      sub: '서버리스',
      color: '#E7157B',
      section: 'section-serverless',
    },
    {
      id: 'rds',
      label: 'RDS',
      sub: '관계형 DB',
      color: '#527FFF',
      section: 'section-database',
    },
    {
      id: 'dynamodb',
      label: 'DynamoDB',
      sub: 'NoSQL DB',
      color: '#527FFF',
      section: 'section-database',
    },
    {
      id: 's3',
      label: 'S3',
      sub: '객체 스토리지',
      color: '#3F8624',
      section: 'section-storage',
    },
  ];

  const arrows = [
    { from: 0, to: 1, label: 'resolve', color: '#8C4FFF' },
    { from: 1, to: 2, label: 'forward', color: '#8C4FFF' },
    { from: 2, to: 3, label: 'route', color: '#ED7100' },
    { from: 2, to: 4, label: 'route', color: '#E7157B' },
    { from: 3, to: 5, label: 'query', color: '#527FFF' },
    { from: 4, to: 6, label: 'query', color: '#527FFF' },
    { from: 3, to: 7, label: 'store', color: '#3F8624' },
  ];

  const svgNS = 'http://www.w3.org/2000/svg';
  const svgW = 960;
  const svgH = 340;
  const blockW = 100;
  const blockH = 64;

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'pipeline-svg');

  // Defs — arrow markers
  const defs = document.createElementNS(svgNS, 'defs');
  const markerColors = new Set(arrows.map((a) => a.color));
  markerColors.forEach((c) => {
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', `ov-m-${c.replace('#', '')}`);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto-start-reverse');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('fill', c);
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  // Layout: two-row architecture
  //   Row 1 (top):    Route53 → CloudFront → ALB
  //   Row 2a (mid-upper): EC2 → RDS
  //   Row 2b (mid-lower): Lambda → DynamoDB
  //   Row 3 (bottom):  S3 (connected to EC2)
  const positions = [
    { x: 40, y: 30 }, // Route 53
    { x: 220, y: 30 }, // CloudFront
    { x: 400, y: 30 }, // ALB
    { x: 580, y: 30 }, // EC2
    { x: 580, y: 160 }, // Lambda
    { x: 780, y: 30 }, // RDS
    { x: 780, y: 160 }, // DynamoDB
    { x: 780, y: 260 }, // S3
  ];

  // Title
  const titleText = document.createElementNS(svgNS, 'text');
  titleText.setAttribute('x', svgW / 2);
  titleText.setAttribute('y', svgH - 8);
  titleText.setAttribute('text-anchor', 'middle');
  titleText.setAttribute('font-size', '13');
  titleText.setAttribute('font-weight', '600');
  titleText.setAttribute('fill', '#a0a0b0');
  titleText.setAttribute('font-family', "'Noto Sans KR', sans-serif");
  titleText.textContent =
    'Client → Route 53 → CloudFront → ALB → EC2 / Lambda → RDS / DynamoDB / S3';
  svg.appendChild(titleText);

  // Draw arrow lines
  arrows.forEach((a) => {
    const from = positions[a.from];
    const to = positions[a.to];
    const x1 = from.x + blockW;
    const y1 = from.y + blockH / 2;
    const x2 = to.x;
    const y2 = to.y + blockH / 2;

    // Use path for non-straight arrows
    const path = document.createElementNS(svgNS, 'path');
    if (Math.abs(y1 - y2) < 5) {
      // Straight horizontal
      path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    } else {
      // Curved path
      const midX = (x1 + x2) / 2;
      path.setAttribute(
        'd',
        `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
      );
    }
    path.setAttribute('stroke', a.color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', `url(#ov-m-${a.color.replace('#', '')})`);
    path.setAttribute('opacity', '0.5');
    svg.appendChild(path);
  });

  // Draw blocks
  const blockGroups = [];
  stages.forEach((stage, i) => {
    const { x, y } = positions[i];
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'pipeline-block');

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', blockW);
    rect.setAttribute('height', blockH);
    rect.setAttribute('rx', '10');
    rect.setAttribute('fill', stage.color);
    rect.setAttribute('opacity', '0.85');
    g.appendChild(rect);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', x + blockW / 2);
    label.setAttribute('y', y + 25);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '13');
    label.setAttribute('font-weight', '700');
    label.textContent = stage.label;
    g.appendChild(label);

    const sub = document.createElementNS(svgNS, 'text');
    sub.setAttribute('x', x + blockW / 2);
    sub.setAttribute('y', y + 44);
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('font-size', '10');
    sub.setAttribute('opacity', '0.8');
    sub.textContent = stage.sub;
    g.appendChild(sub);

    if (stage.section) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => {
        document
          .getElementById(stage.section)
          ?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    svg.appendChild(g);
    blockGroups.push({ g, rect });
  });

  // Phase labels
  const phases = [
    {
      x: positions[0].x,
      w: blockW * 3 + (positions[2].x - positions[0].x - blockW * 2),
      y: positions[0].y + blockH + 14,
      label: '네트워킹 & CDN',
      color: '#8C4FFF',
    },
    {
      x: positions[3].x,
      w: blockW,
      y: positions[3].y + blockH + 14,
      label: '컴퓨팅',
      color: '#ED7100',
    },
    {
      x: positions[4].x,
      w: blockW,
      y: positions[4].y + blockH + 14,
      label: '서버리스',
      color: '#E7157B',
    },
    {
      x: positions[5].x,
      w: blockW,
      y: positions[5].y + blockH + 14,
      label: '데이터베이스',
      color: '#527FFF',
    },
    {
      x: positions[7].x,
      w: blockW,
      y: positions[7].y + blockH + 14,
      label: '스토리지',
      color: '#3F8624',
    },
  ];

  phases.forEach((p) => {
    const phRect = document.createElementNS(svgNS, 'rect');
    phRect.setAttribute('x', p.x - 4);
    phRect.setAttribute('y', p.y);
    phRect.setAttribute('width', p.w + 8);
    phRect.setAttribute('height', 24);
    phRect.setAttribute('rx', '6');
    phRect.setAttribute('fill', p.color);
    phRect.setAttribute('opacity', '0.15');
    svg.appendChild(phRect);

    const phText = document.createElementNS(svgNS, 'text');
    phText.setAttribute('x', p.x + p.w / 2);
    phText.setAttribute('y', p.y + 16);
    phText.setAttribute('text-anchor', 'middle');
    phText.setAttribute('font-size', '11');
    phText.setAttribute('font-weight', '600');
    phText.setAttribute('fill', p.color);
    phText.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    phText.textContent = p.label;
    svg.appendChild(phText);
  });

  // Arrow labels — drawn last on top
  arrows.forEach((a) => {
    if (!a.label) return;
    const from = positions[a.from];
    const to = positions[a.to];
    const mx = (from.x + blockW + to.x) / 2;
    const my = (from.y + blockH / 2 + to.y + blockH / 2) / 2 - 6;

    const labelW = a.label.length * 6.5 + 10;
    const labelH = 15;
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('x', mx - labelW / 2);
    bg.setAttribute('y', my - labelH + 4);
    bg.setAttribute('width', labelW);
    bg.setAttribute('height', labelH);
    bg.setAttribute('rx', '3');
    bg.style.fill = 'var(--bg-primary, #1a1a2e)';
    bg.setAttribute('opacity', '0.9');
    svg.appendChild(bg);

    const txt = document.createElementNS(svgNS, 'text');
    txt.setAttribute('x', mx);
    txt.setAttribute('y', my);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-size', '9');
    txt.setAttribute('font-weight', '600');
    txt.setAttribute('fill', a.color);
    txt.setAttribute('font-family', "'Courier New', monospace");
    txt.textContent = a.label;
    svg.appendChild(txt);
  });

  container.appendChild(svg);

  // === Animation ===
  const state = { playing: false, step: -1, timers: [] };

  const speedSlider = document.getElementById('overview-speed');
  const speedVal = document.getElementById('overview-speed-val');
  const playBtn = document.getElementById('overview-play');
  const resetBtn = document.getElementById('overview-reset');

  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      speedVal.textContent = speedSlider.value + 'x';
    });
  }

  function getDelay() {
    return 600 / parseFloat(speedSlider?.value || 1);
  }

  function resetAnim() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
    state.step = -1;
    blockGroups.forEach(({ rect }) => {
      rect.setAttribute('opacity', '0.85');
      rect.removeAttribute('filter');
    });
    if (playBtn) playBtn.textContent = '▶ 흐름 재생';
  }

  function highlightStep(idx) {
    blockGroups.forEach(({ rect }, i) => {
      if (i === idx) {
        rect.setAttribute('opacity', '1');
        rect.setAttribute(
          'filter',
          'drop-shadow(0 0 10px ' + stages[i].color + ')',
        );
      } else if (i < idx) {
        rect.setAttribute('opacity', '0.5');
        rect.removeAttribute('filter');
      } else {
        rect.setAttribute('opacity', '0.85');
        rect.removeAttribute('filter');
      }
    });
  }

  function play() {
    if (state.playing) {
      resetAnim();
      return;
    }
    state.playing = true;
    if (playBtn) playBtn.textContent = '⏸ 일시정지';
    const delay = getDelay();

    // Animation order: follows request flow
    const order = [0, 1, 2, 3, 5, 4, 6, 7];
    order.forEach((stageIdx, i) => {
      const t = setTimeout(() => {
        state.step = stageIdx;
        highlightStep(stageIdx);
        if (i === order.length - 1) {
          setTimeout(() => {
            state.playing = false;
            if (playBtn) playBtn.textContent = '▶ 흐름 재생';
            window.__awsProgress?.save('section-overview');
          }, delay);
        }
      }, i * delay);
      state.timers.push(t);
    });
  }

  if (playBtn) playBtn.addEventListener('click', play);
  if (resetBtn) resetBtn.addEventListener('click', resetAnim);
}
