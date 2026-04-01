// ===== Container Lifecycle State Machine =====

export function initLifecycle() {
  const container = document.getElementById('lifecycle-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svgW = 800;
  const svgH = 420;

  const states = [
    {
      id: 'created',
      label: 'Created',
      x: 120,
      y: 60,
      color: '#7c4dff',
      desc: '컨테이너 생성됨 (미실행)',
    },
    {
      id: 'running',
      label: 'Running',
      x: 360,
      y: 60,
      color: '#66bb6a',
      desc: '컨테이너 실행 중',
    },
    {
      id: 'paused',
      label: 'Paused',
      x: 600,
      y: 60,
      color: '#ff9800',
      desc: '프로세스 일시 중지',
    },
    {
      id: 'stopped',
      label: 'Stopped',
      x: 360,
      y: 240,
      color: '#ef5350',
      desc: '프로세스 종료됨 (데이터 보존)',
    },
    {
      id: 'removed',
      label: 'Removed',
      x: 360,
      y: 370,
      color: '#616161',
      desc: '컨테이너 삭제됨',
    },
  ];

  const transitions = [
    { from: 'created', to: 'running', label: 'docker start', color: '#66bb6a' },
    { from: 'running', to: 'paused', label: 'docker pause', color: '#ff9800' },
    {
      from: 'paused',
      to: 'running',
      label: 'docker unpause',
      color: '#66bb6a',
    },
    { from: 'running', to: 'stopped', label: 'docker stop', color: '#ef5350' },
    { from: 'stopped', to: 'running', label: 'docker start', color: '#66bb6a' },
    { from: 'created', to: 'removed', label: 'docker rm', color: '#616161' },
    { from: 'stopped', to: 'removed', label: 'docker rm', color: '#616161' },
  ];

  const stateMap = {};
  states.forEach((s) => {
    stateMap[s.id] = s;
  });

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'lifecycle-svg');

  // Defs
  const defs = document.createElementNS(svgNS, 'defs');
  transitions.forEach((t, i) => {
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', `lc-arrow-${i}`);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('fill', t.color);
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  const nodeW = 120;
  const nodeH = 50;

  // Draw transitions (arrows)
  transitions.forEach((t, i) => {
    const from = stateMap[t.from];
    const to = stateMap[t.to];

    let x1, y1, x2, y2;

    // Calc edge points
    if (from.y === to.y) {
      // Horizontal
      if (from.x < to.x) {
        x1 = from.x + nodeW / 2;
        y1 = from.y + nodeH / 2;
        x2 = to.x - nodeW / 2;
        y2 = to.y + nodeH / 2;
      } else {
        x1 = from.x - nodeW / 2;
        y1 = from.y + nodeH / 2;
        x2 = to.x + nodeW / 2;
        y2 = to.y + nodeH / 2;
      }
    } else if (from.x === to.x) {
      // Vertical
      if (from.y < to.y) {
        x1 = from.x;
        y1 = from.y + nodeH / 2 + 25;
        x2 = to.x;
        y2 = to.y - nodeH / 2 + 25;
      } else {
        x1 = from.x;
        y1 = from.y - nodeH / 2 + 25;
        x2 = to.x;
        y2 = to.y + nodeH / 2 + 25;
      }
    } else {
      // Diagonal
      x1 = from.x;
      y1 = from.y + nodeH;
      x2 = to.x;
      y2 = to.y;
    }

    // For reverse arrows (paused→running, stopped→running), offset
    const isReverse =
      (t.from === 'paused' && t.to === 'running') ||
      (t.from === 'stopped' && t.to === 'running');

    const line = document.createElementNS(svgNS, 'path');
    if (isReverse) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const offset = t.from === 'paused' ? 20 : -30;
      line.setAttribute(
        'd',
        `M ${x1} ${y1 + (t.from === 'paused' ? 8 : 0)} Q ${mx + (t.from === 'paused' ? 0 : offset)} ${my + offset} ${x2} ${y2 + (t.from === 'paused' ? 8 : 0)}`,
      );
    } else if (t.from === 'created' && t.to === 'removed') {
      // created → removed: curve left
      line.setAttribute(
        'd',
        `M ${from.x - nodeW / 2} ${from.y + nodeH / 2} Q ${40} ${(from.y + to.y + nodeH) / 2} ${to.x - nodeW / 2} ${to.y}`,
      );
    } else if (t.from === 'stopped' && t.to === 'removed') {
      x1 = from.x;
      y1 = from.y + nodeH;
      x2 = to.x;
      y2 = to.y - 2;
      line.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    } else {
      line.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    }

    line.setAttribute('stroke', t.color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('fill', 'none');
    line.setAttribute('marker-end', `url(#lc-arrow-${i})`);
    line.setAttribute('opacity', '0.7');
    line.setAttribute('data-transition', i);
    svg.appendChild(line);

    // Label
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const offsetY = isReverse ? (t.from === 'paused' ? 24 : -20) : -8;
    const offsetX = t.from === 'created' && t.to === 'removed' ? -30 : 0;
    const txt = document.createElementNS(svgNS, 'text');
    txt.setAttribute('x', mx + offsetX);
    txt.setAttribute('y', my + offsetY);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('class', 'transition-label');
    txt.setAttribute('fill', t.color);
    txt.textContent = t.label;
    svg.appendChild(txt);
  });

  // Draw state nodes
  const nodeElements = {};
  states.forEach((s) => {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'state-node');
    g.setAttribute('data-state', s.id);

    const rx = s.id === 'removed' ? 25 : 12;
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', s.x - nodeW / 2);
    rect.setAttribute('y', s.y);
    rect.setAttribute('width', nodeW);
    rect.setAttribute('height', nodeH);
    rect.setAttribute('rx', rx);
    rect.setAttribute('fill', s.color);
    rect.setAttribute('opacity', '0.85');
    g.appendChild(rect);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', s.x);
    label.setAttribute('y', s.y + 22);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', '700');
    label.textContent = s.label;
    g.appendChild(label);

    const desc = document.createElementNS(svgNS, 'text');
    desc.setAttribute('x', s.x);
    desc.setAttribute('y', s.y + 38);
    desc.setAttribute('text-anchor', 'middle');
    desc.setAttribute('font-size', '10');
    desc.setAttribute('opacity', '0.8');
    desc.textContent = s.desc;
    g.appendChild(desc);

    svg.appendChild(g);
    nodeElements[s.id] = { g, rect };
  });

  // docker run shortcut arrow (top)
  const dockerRunText = document.createElementNS(svgNS, 'text');
  dockerRunText.setAttribute('x', svgW / 2);
  dockerRunText.setAttribute('y', 20);
  dockerRunText.setAttribute('text-anchor', 'middle');
  dockerRunText.setAttribute('font-size', '12');
  dockerRunText.setAttribute('fill', '#a0a0b0');
  dockerRunText.setAttribute('font-family', "'Courier New', monospace");
  dockerRunText.textContent = 'docker run = docker create + docker start';
  svg.appendChild(dockerRunText);

  container.appendChild(svg);

  // === Animation State ===
  const animSequence = [
    'created',
    'running',
    'paused',
    'running',
    'stopped',
    'running',
    'stopped',
    'removed',
  ];
  const state = { playing: false, step: -1, timers: [] };

  const playBtn = document.getElementById('lifecycle-play');
  const stepBtn = document.getElementById('lifecycle-step');
  const resetBtn = document.getElementById('lifecycle-reset');
  const speedSlider = document.getElementById('lifecycle-speed');
  const speedVal = document.getElementById('lifecycle-speed-val');

  if (speedSlider)
    speedSlider.addEventListener('input', () => {
      speedVal.textContent = speedSlider.value + 'x';
    });

  function getDelay() {
    return 800 / parseFloat(speedSlider?.value || 1);
  }

  function highlightState(stateId) {
    Object.entries(nodeElements).forEach(([id, { rect }]) => {
      if (id === stateId) {
        rect.setAttribute('opacity', '1');
        rect.parentNode.classList.add('active-state');
      } else {
        rect.setAttribute('opacity', '0.5');
        rect.parentNode.classList.remove('active-state');
      }
    });
  }

  function resetAnim() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
    state.step = -1;
    Object.values(nodeElements).forEach(({ rect, g }) => {
      rect.setAttribute('opacity', '0.85');
      g.classList.remove('active-state');
    });
    if (playBtn) playBtn.textContent = '▶ 자동 재생';
  }

  function advanceStep() {
    state.step++;
    if (state.step >= animSequence.length) {
      state.step = animSequence.length - 1;
      window.__dockerProgress?.save('section-lifecycle');
      return;
    }
    highlightState(animSequence[state.step]);
  }

  function play() {
    if (state.playing) {
      resetAnim();
      return;
    }
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.step = -1;
    state.playing = true;
    if (playBtn) playBtn.textContent = '⏸ 일시정지';

    const delay = getDelay();
    animSequence.forEach((_, i) => {
      const t = setTimeout(() => {
        state.step = i;
        highlightState(animSequence[i]);
        if (i === animSequence.length - 1) {
          state.playing = false;
          if (playBtn) playBtn.textContent = '▶ 자동 재생';
          window.__dockerProgress?.save('section-lifecycle');
        }
      }, i * delay);
      state.timers.push(t);
    });
  }

  if (playBtn) playBtn.addEventListener('click', play);
  if (stepBtn) stepBtn.addEventListener('click', advanceStep);
  if (resetBtn) resetBtn.addEventListener('click', resetAnim);
}
