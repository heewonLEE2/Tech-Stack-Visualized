// ===== Overview: Git Workflow Pipeline Animation =====

export function initOverview() {
  const container = document.getElementById('overview-container');
  if (!container) return;

  const stages = [
    {
      id: 'working',
      label: 'Working\nDirectory',
      sub: '파일 수정',
      color: '#4fc3f7',
      section: null,
      commands: ['edit files'],
    },
    {
      id: 'staging',
      label: 'Staging\nArea',
      sub: 'git add',
      color: '#26a69a',
      section: 'section-objects',
      commands: ['git add'],
    },
    {
      id: 'local',
      label: 'Local\nRepository',
      sub: 'git commit',
      color: '#81c784',
      section: 'section-branching',
      commands: ['git commit'],
    },
    {
      id: 'remote',
      label: 'Remote\nRepository',
      sub: 'git push',
      color: '#ce93d8',
      section: 'section-remote',
      commands: ['git push'],
    },
  ];

  const arrows = [
    { from: 0, to: 1, label: 'git add', color: '#26a69a' },
    { from: 1, to: 2, label: 'git commit', color: '#81c784' },
    { from: 2, to: 3, label: 'git push', color: '#ce93d8' },
    {
      from: 3,
      to: 0,
      label: 'git pull / clone',
      color: '#ffb74d',
      reverse: true,
    },
  ];

  const svgNS = 'http://www.w3.org/2000/svg';
  const svgW = 860;
  const svgH = 420;
  const blockW = 140;
  const blockH = 90;
  const gapX = 60;
  const startX = 40;
  const mainY = 100;
  const returnY = 320;

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'pipeline-svg');
  svg.style.maxWidth = '100%';

  // Defs for arrow markers & gradients
  const defs = document.createElementNS(svgNS, 'defs');

  arrows.forEach((a, i) => {
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', `arrow-${i}`);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('orient', 'auto-start-reverse');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('fill', a.color);
    marker.appendChild(path);
    defs.appendChild(marker);
  });

  svg.appendChild(defs);

  // Draw blocks
  const blockPositions = stages.map((stage, i) => {
    const x = startX + i * (blockW + gapX);
    const y = mainY;

    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'pipeline-block');

    // Block rectangle
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', blockW);
    rect.setAttribute('height', blockH);
    rect.setAttribute('rx', '10');
    rect.setAttribute('fill', stage.color);
    rect.setAttribute('opacity', '0.9');
    g.appendChild(rect);

    // Label text (multiline)
    const lines = stage.label.split('\n');
    lines.forEach((line, li) => {
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', x + blockW / 2);
      text.setAttribute('y', y + 30 + li * 20);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', '#1a1a2e');
      text.textContent = line;
      g.appendChild(text);
    });

    // Sub label
    const sub = document.createElementNS(svgNS, 'text');
    sub.setAttribute('x', x + blockW / 2);
    sub.setAttribute('y', y + blockH + 20);
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('font-size', '11');
    sub.setAttribute('fill', '#a0a0b0');
    sub.textContent = stage.sub;
    g.appendChild(sub);

    // Click navigation
    if (stage.section) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => {
        document
          .getElementById(stage.section)
          ?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    svg.appendChild(g);

    return {
      x,
      y,
      cx: x + blockW / 2,
      cy: y + blockH / 2,
      right: x + blockW,
      bottom: y + blockH,
    };
  });

  // Draw forward arrows (top row)
  for (let i = 0; i < 3; i++) {
    const a = arrows[i];
    const fromPos = blockPositions[a.from];
    const toPos = blockPositions[a.to];

    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', fromPos.right + 4);
    line.setAttribute('y1', fromPos.cy);
    line.setAttribute('x2', toPos.x - 4);
    line.setAttribute('y2', toPos.cy);
    line.setAttribute('stroke', a.color);
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('marker-end', `url(#arrow-${i})`);
    svg.appendChild(line);

    // Arrow label
    const midX = (fromPos.right + toPos.x) / 2;
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', midX);
    label.setAttribute('y', fromPos.cy - 12);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '11');
    label.setAttribute('fill', a.color);
    label.setAttribute('font-weight', '600');
    label.textContent = a.label;
    svg.appendChild(label);
  }

  // Draw return arrow (bottom curve: remote → working)
  {
    const a = arrows[3];
    const fromPos = blockPositions[3];
    const toPos = blockPositions[0];

    const pathD = `M ${fromPos.cx} ${fromPos.bottom + 4}
                   C ${fromPos.cx} ${returnY}, ${toPos.cx} ${returnY}, ${toPos.cx} ${toPos.bottom + 4}`;

    const curvePath = document.createElementNS(svgNS, 'path');
    curvePath.setAttribute('d', pathD);
    curvePath.setAttribute('stroke', a.color);
    curvePath.setAttribute('stroke-width', '2.5');
    curvePath.setAttribute('fill', 'none');
    curvePath.setAttribute('marker-end', `url(#arrow-3)`);
    svg.appendChild(curvePath);

    // Return label
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', svgW / 2);
    label.setAttribute('y', returnY + 10);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '11');
    label.setAttribute('fill', a.color);
    label.setAttribute('font-weight', '600');
    label.textContent = a.label;
    svg.appendChild(label);
  }

  // Additional labels for reverse operations
  const reverseOps = [
    { from: 2, to: 1, label: 'git reset', color: '#ef5350', yOff: 50 },
    { from: 1, to: 0, label: 'git restore', color: '#ef5350', yOff: 50 },
  ];

  reverseOps.forEach((rop) => {
    const fromPos = blockPositions[rop.from];
    const toPos = blockPositions[rop.to];

    const midY = fromPos.bottom + rop.yOff;
    const pathD = `M ${fromPos.cx} ${fromPos.bottom + 4}
                   C ${fromPos.cx} ${midY}, ${toPos.cx} ${midY}, ${toPos.cx} ${toPos.bottom + 4}`;

    const dashMarker = document.createElementNS(svgNS, 'marker');
    dashMarker.setAttribute('id', `rev-arrow-${rop.label}`);
    dashMarker.setAttribute('viewBox', '0 0 10 10');
    dashMarker.setAttribute('refX', '8');
    dashMarker.setAttribute('refY', '5');
    dashMarker.setAttribute('markerWidth', '7');
    dashMarker.setAttribute('markerHeight', '7');
    dashMarker.setAttribute('orient', 'auto-start-reverse');
    const mPath = document.createElementNS(svgNS, 'path');
    mPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    mPath.setAttribute('fill', rop.color);
    dashMarker.appendChild(mPath);
    defs.appendChild(dashMarker);

    const curve = document.createElementNS(svgNS, 'path');
    curve.setAttribute('d', pathD);
    curve.setAttribute('stroke', rop.color);
    curve.setAttribute('stroke-width', '1.5');
    curve.setAttribute('stroke-dasharray', '6,4');
    curve.setAttribute('fill', 'none');
    curve.setAttribute('marker-end', `url(#rev-arrow-${rop.label})`);
    curve.setAttribute('opacity', '0.7');
    svg.appendChild(curve);

    // Label
    const lx = (fromPos.cx + toPos.cx) / 2;
    const ly = midY + 8;
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', lx);
    label.setAttribute('y', ly);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', rop.color);
    label.setAttribute('opacity', '0.8');
    label.textContent = rop.label;
    svg.appendChild(label);
  });

  // Data token animation
  function createToken(pathIndex) {
    const token = document.createElementNS(svgNS, 'circle');
    token.setAttribute('r', '5');
    token.setAttribute('fill', arrows[pathIndex].color);
    token.setAttribute('opacity', '0');
    svg.appendChild(token);

    const fromPos = blockPositions[arrows[pathIndex].from];
    const toPos = blockPositions[arrows[pathIndex].to];

    let startX, startY, endX, endY;
    if (pathIndex < 3) {
      startX = fromPos.right;
      startY = fromPos.cy;
      endX = toPos.x;
      endY = toPos.cy;
    } else {
      // Return path (just animate along bottom)
      startX = fromPos.cx;
      startY = fromPos.bottom;
      endX = toPos.cx;
      endY = toPos.bottom;
    }

    let progress = 0;
    const speed = 0.015;

    function animate() {
      progress += speed;
      if (progress > 1) {
        token.remove();
        return;
      }

      const t = progress;
      let x, y;

      if (pathIndex < 3) {
        x = startX + (endX - startX) * t;
        y = startY + (endY - startY) * t;
      } else {
        // Curve along bottom
        const ctrlY = returnY;
        x =
          (1 - t) * (1 - t) * startX +
          2 * (1 - t) * t * ((startX + endX) / 2) +
          t * t * endX;
        y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
      }

      token.setAttribute('cx', x);
      token.setAttribute('cy', y);
      token.setAttribute('opacity', t > 0.05 && t < 0.95 ? '1' : '0');

      requestAnimationFrame(animate);
    }

    animate();
  }

  // Periodically spawn tokens
  let tokenInterval;
  function startTokens() {
    let idx = 0;
    tokenInterval = setInterval(() => {
      createToken(idx % 4);
      idx++;
    }, 1200);
  }

  startTokens();
  container.appendChild(svg);

  // Navigation links below pipeline
  const navRow = document.createElement('div');
  navRow.style.cssText =
    'display:flex; justify-content:center; gap:16px; margin-top:16px; flex-wrap:wrap;';

  const navItems = [
    { label: '⬡ Git 객체', section: 'section-objects' },
    { label: '⑂ 브랜치', section: 'section-branching' },
    { label: '⊕ Merge', section: 'section-merge' },
    { label: '☁ 원격', section: 'section-remote' },
    { label: '⟳ GitHub Flow', section: 'section-github-flow' },
    { label: '⚙ 고급', section: 'section-advanced' },
    { label: '▷ 시뮬레이터', section: 'section-playground' },
  ];

  navItems.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = item.label;
    btn.addEventListener('click', () => {
      document
        .getElementById(item.section)
        ?.scrollIntoView({ behavior: 'smooth' });
    });
    navRow.appendChild(btn);
  });

  container.appendChild(navRow);

  if (window.__gitProgress) {
    window.__gitProgress.save('section-overview');
  }
}
