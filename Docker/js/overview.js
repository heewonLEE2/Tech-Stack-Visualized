// ===== Overview: Docker & K8s Pipeline Animation =====

export function initOverview() {
  const container = document.getElementById('overview-container');
  if (!container) return;

  const stages = [
    {
      id: 'dockerfile',
      label: 'Dockerfile',
      sub: '이미지 정의',
      color: '#7c4dff',
      section: 'section-image',
    },
    {
      id: 'build',
      label: 'Build',
      sub: 'docker build',
      color: '#9c27b0',
      section: 'section-image',
    },
    {
      id: 'image',
      label: 'Image',
      sub: '레이어 스택',
      color: '#7c4dff',
      section: 'section-image',
    },
    {
      id: 'run',
      label: 'Run',
      sub: 'docker run',
      color: '#2496ed',
      section: 'section-lifecycle',
    },
    {
      id: 'container',
      label: 'Container',
      sub: '격리 프로세스',
      color: '#26c6da',
      section: 'section-container',
    },
    {
      id: 'compose',
      label: 'Compose',
      sub: '다중 컨테이너',
      color: '#5c6bc0',
      section: 'section-compose',
    },
    {
      id: 'k8s',
      label: 'Kubernetes',
      sub: '오케스트레이션',
      color: '#326ce5',
      section: 'section-k8s-arch',
    },
    {
      id: 'deploy',
      label: 'Deploy',
      sub: '롤링 업데이트',
      color: '#66bb6a',
      section: 'section-deployment',
    },
  ];

  const arrows = [
    { from: 0, to: 1, label: 'build', color: '#9c27b0' },
    { from: 1, to: 2, label: '', color: '#7c4dff' },
    { from: 2, to: 3, label: 'run', color: '#2496ed' },
    { from: 3, to: 4, label: '', color: '#26c6da' },
    { from: 4, to: 5, label: 'compose up', color: '#5c6bc0' },
    { from: 5, to: 6, label: 'deploy', color: '#326ce5' },
    { from: 6, to: 7, label: 'rollout', color: '#66bb6a' },
  ];

  const svgNS = 'http://www.w3.org/2000/svg';
  const svgW = 960;
  const svgH = 260;
  const blockW = 95;
  const blockH = 72;
  const gapX = 24;
  const startX = 12;
  const mainY = 80;

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'pipeline-svg');

  // Defs
  const defs = document.createElementNS(svgNS, 'defs');
  arrows.forEach((a, i) => {
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', `ov-arrow-${i}`);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto-start-reverse');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('fill', a.color);
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  // Compute block positions
  const positions = stages.map((_, i) => ({
    x: startX + i * (blockW + gapX),
    y: mainY,
  }));

  // Draw arrows
  arrows.forEach((a, i) => {
    const from = positions[a.from];
    const to = positions[a.to];
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', from.x + blockW);
    line.setAttribute('y1', from.y + blockH / 2);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y + blockH / 2);
    line.setAttribute('stroke', a.color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', `url(#ov-arrow-${i})`);
    line.setAttribute('opacity', '0.6');
    svg.appendChild(line);
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
    label.setAttribute('y', y + 28);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '13');
    label.setAttribute('font-weight', '700');
    label.textContent = stage.label;
    g.appendChild(label);

    const sub = document.createElementNS(svgNS, 'text');
    sub.setAttribute('x', x + blockW / 2);
    sub.setAttribute('y', y + 48);
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

  // Title row
  const titleText = document.createElementNS(svgNS, 'text');
  titleText.setAttribute('x', svgW / 2);
  titleText.setAttribute('y', 30);
  titleText.setAttribute('text-anchor', 'middle');
  titleText.setAttribute('font-size', '16');
  titleText.setAttribute('font-weight', '700');
  titleText.setAttribute('fill', '#e0e0e0');
  titleText.setAttribute('font-family', "'Noto Sans KR', sans-serif");
  titleText.textContent =
    'Dockerfile → Build → Image → Run → Container → Compose → K8s → Deploy';
  svg.appendChild(titleText);

  // Phase labels
  const phases = [
    {
      x: positions[0].x,
      w: blockW * 3 + gapX * 2,
      label: '이미지 생성',
      color: '#7c4dff',
    },
    {
      x: positions[3].x,
      w: blockW * 2 + gapX,
      label: '컨테이너 실행',
      color: '#26c6da',
    },
    {
      x: positions[5].x,
      w: blockW * 3 + gapX * 2,
      label: '오케스트레이션',
      color: '#326ce5',
    },
  ];
  phases.forEach((p) => {
    const phRect = document.createElementNS(svgNS, 'rect');
    phRect.setAttribute('x', p.x - 4);
    phRect.setAttribute('y', mainY + blockH + 16);
    phRect.setAttribute('width', p.w + 8);
    phRect.setAttribute('height', 28);
    phRect.setAttribute('rx', '6');
    phRect.setAttribute('fill', p.color);
    phRect.setAttribute('opacity', '0.15');
    svg.appendChild(phRect);

    const phText = document.createElementNS(svgNS, 'text');
    phText.setAttribute('x', p.x + p.w / 2);
    phText.setAttribute('y', mainY + blockH + 35);
    phText.setAttribute('text-anchor', 'middle');
    phText.setAttribute('font-size', '12');
    phText.setAttribute('font-weight', '600');
    phText.setAttribute('fill', p.color);
    phText.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    phText.textContent = p.label;
    svg.appendChild(phText);
  });

  // Arrow labels (drawn last — on top of blocks for visibility)
  arrows.forEach((a) => {
    if (!a.label) return;
    const from = positions[a.from];
    const to = positions[a.to];
    const mx = (from.x + blockW + to.x) / 2;
    const my = mainY + blockH / 2 - 8;

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

    stages.forEach((_, i) => {
      const t = setTimeout(() => {
        state.step = i;
        highlightStep(i);
        if (i === stages.length - 1) {
          setTimeout(() => {
            state.playing = false;
            if (playBtn) playBtn.textContent = '▶ 흐름 재생';
            window.__dockerProgress?.save('section-overview');
          }, delay);
        }
      }, i * delay);
      state.timers.push(t);
    });
  }

  if (playBtn) playBtn.addEventListener('click', play);
  if (resetBtn) resetBtn.addEventListener('click', resetAnim);
}
