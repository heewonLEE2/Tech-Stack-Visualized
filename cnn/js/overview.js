// ===== Section 1: CNN 전체 구조 SVG 다이어그램 + 데이터 플로우 애니메이션 =====

export function initOverview() {
  const container = document.getElementById('overview-container');
  if (!container) return;

  const stages = [
    {
      id: 'section-convolution',
      label: 'Conv1',
      sub: '3x3, 6 filters',
      shape: '[1,6,26,26]',
      color: '#FFB74D',
      type: 'conv',
    },
    {
      id: 'section-activation',
      label: 'ReLU',
      sub: '',
      shape: '[1,6,26,26]',
      color: '#26A69A',
      type: 'relu',
    },
    {
      id: 'section-pooling',
      label: 'MaxPool',
      sub: '2x2',
      shape: '[1,6,13,13]',
      color: '#CE93D8',
      type: 'pool',
    },
    {
      id: 'section-convolution',
      label: 'Conv2',
      sub: '3x3, 16 filters',
      shape: '[1,16,11,11]',
      color: '#FFB74D',
      type: 'conv',
    },
    {
      id: 'section-activation',
      label: 'ReLU',
      sub: '',
      shape: '[1,16,11,11]',
      color: '#26A69A',
      type: 'relu',
    },
    {
      id: 'section-pooling',
      label: 'MaxPool',
      sub: '2x2',
      shape: '[1,16,5,5]',
      color: '#CE93D8',
      type: 'pool',
    },
    {
      id: 'section-flatten',
      label: 'Flatten',
      sub: '',
      shape: '[1,400]',
      color: '#EF5350',
      type: 'flatten',
    },
    {
      id: 'section-flatten',
      label: 'FC',
      sub: '400→120',
      shape: '[1,120]',
      color: '#EF5350',
      type: 'fc',
    },
    {
      id: 'section-flatten',
      label: 'Output',
      sub: '10 classes',
      shape: '[1,10]',
      color: '#81C784',
      type: 'output',
    },
  ];

  const blockW = 100,
    blockH = 76,
    arrowW = 28;
  const totalW = stages.length * (blockW + arrowW) - arrowW + 60;
  const svgH = 160;
  const cy = svgH / 2;

  // Build controls
  const controlsHTML = `<div class="control-row" style="margin-bottom:12px">
    <button id="overview-play" class="btn btn-primary">▶ 흐름 재생</button>
    <button id="overview-reset" class="btn">↻ 초기화</button>
    <label>속도: <input type="range" id="overview-speed" min="0.5" max="3" step="0.5" value="1" class="slider"><span id="overview-speed-val">1x</span></label>
  </div>`;

  // Build SVG
  let svg = `<svg id="overview-svg" class="overview-svg" viewBox="0 0 ${totalW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

  // Defs: arrowhead + glow filter
  svg += `<defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#555"/>
    </marker>
    <filter id="token-glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  // Input label
  svg += `<text x="10" y="${cy - 20}" fill="#4FC3F7" font-size="14" font-family="'Noto Sans KR', sans-serif" font-weight="700">Input</text>`;
  svg += `<text x="10" y="${cy + 2}" fill="#a0a0b0" font-size="11" font-family="Courier New, monospace">[1,1,28,28]</text>`;

  // Path for token animation (build waypoints)
  const waypoints = [];
  let x = 80;

  stages.forEach((stage, i) => {
    // Arrow
    if (i > 0) {
      svg += `<line x1="${x - arrowW}" y1="${cy}" x2="${x - 4}" y2="${cy}" stroke="#555" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }

    // Block
    svg += `<g class="overview-block" data-section="${stage.id}" data-index="${i}" style="cursor:pointer">`;
    svg += `<rect x="${x}" y="${cy - blockH / 2}" width="${blockW}" height="${blockH}" rx="6" fill="${stage.color}" opacity="0.85" class="overview-rect"/>`;
    svg += `<text x="${x + blockW / 2}" y="${cy - 8}" text-anchor="middle" font-size="14" font-weight="700" fill="#1a1a2e">${stage.label}</text>`;
    if (stage.sub) {
      svg += `<text x="${x + blockW / 2}" y="${cy + 10}" text-anchor="middle" font-size="10" fill="#1a1a2e" opacity="0.8">${stage.sub}</text>`;
    }
    svg += `</g>`;

    // Shape below
    svg += `<text x="${x + blockW / 2}" y="${cy + blockH / 2 + 18}" text-anchor="middle" fill="#a0a0b0" font-size="10" font-family="Courier New, monospace">${stage.shape}</text>`;

    waypoints.push({ x: x + blockW / 2, stage });
    x += blockW + arrowW;
  });

  // Data token (hidden initially)
  svg += `<circle id="data-token" cx="50" cy="${cy}" r="8" fill="#4FC3F7" filter="url(#token-glow)" opacity="0" />`;

  // Shape tooltip text (updates during animation)
  svg += `<text id="token-shape" x="50" y="${cy - 18}" text-anchor="middle" fill="#4FC3F7" font-size="11" font-weight="600" font-family="Courier New, monospace" opacity="0"></text>`;

  svg += `</svg>`;

  container.innerHTML = controlsHTML + svg;

  // ===== Click handlers =====
  let clicked = false;
  container.querySelectorAll('.overview-block').forEach((block) => {
    block.addEventListener('click', () => {
      const sectionId = block.dataset.section;
      const target = document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      if (!clicked) {
        clicked = true;
        if (window.__cnnProgress) window.__cnnProgress.save('section-overview');
      }
    });
  });

  // ===== Token flow animation =====
  const token = document.getElementById('data-token');
  const tokenShape = document.getElementById('token-shape');
  const playBtn = document.getElementById('overview-play');
  const resetBtn = document.getElementById('overview-reset');
  const speedSlider = document.getElementById('overview-speed');
  const speedVal = document.getElementById('overview-speed-val');
  const allBlocks = container.querySelectorAll('.overview-block');
  const shapes = ['[1,1,28,28]', ...stages.map((s) => s.shape)];

  let animating = false;
  let animId = null;

  speedSlider.addEventListener('input', () => {
    speedVal.textContent = speedSlider.value + 'x';
  });

  function highlightBlock(idx) {
    allBlocks.forEach((b, i) => {
      const rect = b.querySelector('.overview-rect');
      rect.setAttribute('opacity', i === idx ? '1' : '0.85');
      rect.setAttribute('stroke', i === idx ? '#fff' : 'none');
      rect.setAttribute('stroke-width', i === idx ? '2' : '0');
    });
  }

  function resetAnimation() {
    animating = false;
    if (animId) cancelAnimationFrame(animId);
    token.setAttribute('opacity', '0');
    tokenShape.setAttribute('opacity', '0');
    playBtn.disabled = false;
    playBtn.textContent = '▶ 흐름 재생';
    allBlocks.forEach((b) => {
      const rect = b.querySelector('.overview-rect');
      rect.setAttribute('opacity', '0.85');
      rect.setAttribute('stroke', 'none');
    });
  }

  async function playAnimation() {
    if (animating) return;
    animating = true;
    playBtn.disabled = true;
    playBtn.textContent = '⏵ 재생 중...';

    const speed = parseFloat(speedSlider.value);
    const stepDuration = 800 / speed;

    // Start position
    token.setAttribute('cx', '50');
    token.setAttribute('opacity', '1');
    tokenShape.setAttribute('opacity', '1');
    tokenShape.textContent = shapes[0];
    tokenShape.setAttribute('x', '50');

    await sleep(stepDuration / 2);

    for (let i = 0; i < waypoints.length; i++) {
      if (!animating) return;
      const wp = waypoints[i];

      // Animate token to waypoint
      await animateToken(token, tokenShape, wp.x, cy, stepDuration);
      if (!animating) return;

      // Update shape text and highlight block
      tokenShape.textContent = shapes[i + 1];
      tokenShape.setAttribute('x', wp.x);
      highlightBlock(i);

      // Brief pause at each block
      await sleep(stepDuration * 0.4);
    }

    // Finish
    await sleep(stepDuration);
    if (animating) {
      animating = false;
      playBtn.disabled = false;
      playBtn.textContent = '▶ 다시 재생';
    }
  }

  function animateToken(el, label, tx, ty, duration) {
    return new Promise((resolve) => {
      const startX = parseFloat(el.getAttribute('cx'));
      const startTime = performance.now();

      function step(now) {
        if (!animating) {
          resolve();
          return;
        }
        const t = Math.min((now - startTime) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const cx = startX + (tx - startX) * ease;
        el.setAttribute('cx', cx);
        label.setAttribute('x', cx);
        if (t < 1) {
          animId = requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      animId = requestAnimationFrame(step);
    });
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  playBtn.addEventListener('click', playAnimation);
  resetBtn.addEventListener('click', resetAnimation);
}
