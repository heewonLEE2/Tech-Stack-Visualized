// ===== EC2 & Compute Visualization =====

export function initCompute() {
  const container = document.getElementById('compute-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const state = {
    traffic: 3,
    playing: false,
    timers: [],
    instances: 2,
    showCompare: false,
  };

  const INSTANCE_TYPES = [
    { name: 't3.micro', cpu: 2, mem: 1, use: '개발/테스트', color: '#00A4A6' },
    { name: 't3.medium', cpu: 2, mem: 4, use: '경량 웹서버', color: '#3F8624' },
    { name: 'c5.large', cpu: 2, mem: 4, use: '컴퓨팅 집약', color: '#ED7100' },
    { name: 'r5.large', cpu: 2, mem: 16, use: '메모리 집약', color: '#527FFF' },
    { name: 'g4dn.xlarge', cpu: 4, mem: 16, use: 'GPU (ML)', color: '#E7157B' },
  ];

  function render() {
    container.innerHTML = '';

    const svgW = 800,
      svgH = 430;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('class', 'compute-svg');

    // ELB block
    const elbX = 50,
      elbY = 140,
      elbW = 120,
      elbH = 80;
    const elbRect = document.createElementNS(svgNS, 'rect');
    elbRect.setAttribute('x', elbX);
    elbRect.setAttribute('y', elbY);
    elbRect.setAttribute('width', elbW);
    elbRect.setAttribute('height', elbH);
    elbRect.setAttribute('rx', '10');
    elbRect.setAttribute('fill', '#FF9900');
    elbRect.setAttribute('opacity', '0.2');
    elbRect.setAttribute('stroke', '#FF9900');
    elbRect.setAttribute('stroke-width', '1.5');
    svg.appendChild(elbRect);

    const elbLabel = document.createElementNS(svgNS, 'text');
    elbLabel.setAttribute('x', elbX + elbW / 2);
    elbLabel.setAttribute('y', elbY + 35);
    elbLabel.setAttribute('text-anchor', 'middle');
    elbLabel.setAttribute('font-size', '13');
    elbLabel.setAttribute('font-weight', '700');
    elbLabel.setAttribute('fill', '#FF9900');
    elbLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    elbLabel.textContent = '⚖ ALB';
    svg.appendChild(elbLabel);

    const elbSub = document.createElementNS(svgNS, 'text');
    elbSub.setAttribute('x', elbX + elbW / 2);
    elbSub.setAttribute('y', elbY + 55);
    elbSub.setAttribute('text-anchor', 'middle');
    elbSub.setAttribute('font-size', '9');
    elbSub.setAttribute('fill', '#a0a0b0');
    elbSub.textContent = `트래픽: ${state.traffic}`;
    svg.appendChild(elbSub);

    // Traffic lines (incoming)
    for (let i = 0; i < Math.min(state.traffic, 5); i++) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', 130 + i * 20);
      line.setAttribute('x2', elbX);
      line.setAttribute('y2', elbY + elbH / 2);
      line.setAttribute('stroke', '#FF9900');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-opacity', '0.3');
      line.setAttribute('stroke-dasharray', '3,3');
      svg.appendChild(line);
    }

    // ASG boundary
    const asgX = 220,
      asgY = 30,
      asgW = 340,
      asgH = 340;
    const asgRect = document.createElementNS(svgNS, 'rect');
    asgRect.setAttribute('x', asgX);
    asgRect.setAttribute('y', asgY);
    asgRect.setAttribute('width', asgW);
    asgRect.setAttribute('height', asgH);
    asgRect.setAttribute('rx', '12');
    asgRect.setAttribute('fill', 'none');
    asgRect.setAttribute('stroke', '#ED7100');
    asgRect.setAttribute('stroke-width', '1.5');
    asgRect.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(asgRect);

    const asgLabel = document.createElementNS(svgNS, 'text');
    asgLabel.setAttribute('x', asgX + asgW / 2);
    asgLabel.setAttribute('y', asgY + 20);
    asgLabel.setAttribute('text-anchor', 'middle');
    asgLabel.setAttribute('font-size', '12');
    asgLabel.setAttribute('font-weight', '700');
    asgLabel.setAttribute('fill', '#ED7100');
    asgLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    asgLabel.textContent = `Auto Scaling Group (인스턴스: ${state.instances})`;
    svg.appendChild(asgLabel);

    // Scaling policy bar
    const policyY = asgY + asgH + 10;
    const scaleTxt = document.createElementNS(svgNS, 'text');
    scaleTxt.setAttribute('x', asgX);
    scaleTxt.setAttribute('y', policyY + 14);
    scaleTxt.setAttribute('font-size', '10');
    scaleTxt.setAttribute('fill', '#a0a0b0');
    scaleTxt.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    scaleTxt.textContent = `스케일링 정책: CPU > 50% → Scale Out | CPU < 25% → Scale In`;
    svg.appendChild(scaleTxt);

    // EC2 instances inside ASG
    const cols = 3;
    const cardW = 90,
      cardH = 70,
      gap = 16;
    const startX = asgX + 30,
      startY = asgY + 40;

    for (let i = 0; i < state.instances; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gap);
      const cy = startY + row * (cardH + gap);

      const card = document.createElementNS(svgNS, 'rect');
      card.setAttribute('x', cx);
      card.setAttribute('y', cy);
      card.setAttribute('width', cardW);
      card.setAttribute('height', cardH);
      card.setAttribute('rx', '6');
      card.setAttribute('fill', '#ED7100');
      card.setAttribute('opacity', '0.18');
      card.setAttribute('stroke', '#ED7100');
      card.setAttribute('stroke-width', '1');
      svg.appendChild(card);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', cx + cardW / 2);
      label.setAttribute('y', cy + 28);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', '#ED7100');
      label.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      label.textContent = `🖥 EC2-${i + 1}`;
      svg.appendChild(label);

      const cpu = Math.min(
        95,
        Math.round((state.traffic / state.instances) * 18),
      );
      const cpuBar = document.createElementNS(svgNS, 'rect');
      cpuBar.setAttribute('x', cx + 10);
      cpuBar.setAttribute('y', cy + 42);
      cpuBar.setAttribute('width', (cardW - 20) * (cpu / 100));
      cpuBar.setAttribute('height', 6);
      cpuBar.setAttribute('rx', '3');
      cpuBar.setAttribute(
        'fill',
        cpu > 70 ? '#DD344C' : cpu > 40 ? '#FF9900' : '#3F8624',
      );
      svg.appendChild(cpuBar);

      const cpuTxt = document.createElementNS(svgNS, 'text');
      cpuTxt.setAttribute('x', cx + cardW / 2);
      cpuTxt.setAttribute('y', cy + 62);
      cpuTxt.setAttribute('text-anchor', 'middle');
      cpuTxt.setAttribute('font-size', '8');
      cpuTxt.setAttribute('fill', '#a0a0b0');
      cpuTxt.textContent = `CPU ${cpu}%`;
      svg.appendChild(cpuTxt);

      // Arrow from ELB to instance
      const arrow = document.createElementNS(svgNS, 'line');
      arrow.setAttribute('x1', elbX + elbW);
      arrow.setAttribute('y1', elbY + elbH / 2);
      arrow.setAttribute('x2', cx);
      arrow.setAttribute('y2', cy + cardH / 2);
      arrow.setAttribute('stroke', '#FF9900');
      arrow.setAttribute('stroke-width', '1');
      arrow.setAttribute('stroke-opacity', '0.3');
      svg.appendChild(arrow);
    }

    // Instance types panel (right side)
    const panelX = 600,
      panelY = 30;
    const panelTitle = document.createElementNS(svgNS, 'text');
    panelTitle.setAttribute('x', panelX);
    panelTitle.setAttribute('y', panelY + 14);
    panelTitle.setAttribute('font-size', '11');
    panelTitle.setAttribute('font-weight', '700');
    panelTitle.setAttribute('fill', '#e0e0e0');
    panelTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    panelTitle.textContent = '인스턴스 타입';
    svg.appendChild(panelTitle);

    INSTANCE_TYPES.forEach((type, i) => {
      const ty = panelY + 30 + i * 48;
      const bg = document.createElementNS(svgNS, 'rect');
      bg.setAttribute('x', panelX);
      bg.setAttribute('y', ty);
      bg.setAttribute('width', 180);
      bg.setAttribute('height', 38);
      bg.setAttribute('rx', '6');
      bg.setAttribute('fill', type.color);
      bg.setAttribute('opacity', '0.1');
      bg.setAttribute('stroke', type.color);
      bg.setAttribute('stroke-width', '0.8');
      svg.appendChild(bg);

      const name = document.createElementNS(svgNS, 'text');
      name.setAttribute('x', panelX + 8);
      name.setAttribute('y', ty + 16);
      name.setAttribute('font-size', '10');
      name.setAttribute('font-weight', '700');
      name.setAttribute('fill', type.color);
      name.textContent = type.name;
      svg.appendChild(name);

      const spec = document.createElementNS(svgNS, 'text');
      spec.setAttribute('x', panelX + 8);
      spec.setAttribute('y', ty + 30);
      spec.setAttribute('font-size', '8');
      spec.setAttribute('fill', '#a0a0b0');
      spec.textContent = `${type.cpu} vCPU · ${type.mem}GB · ${type.use}`;
      svg.appendChild(spec);
    });

    container.appendChild(svg);
  }

  /* ── Auto Scaling Simulation ── */
  function playScaling() {
    if (state.playing) {
      resetCompute();
      return;
    }
    state.playing = true;
    const btn = document.getElementById('compute-play');
    if (btn) btn.textContent = '⏸ 일시정지';

    const speed = parseFloat(
      document.getElementById('compute-speed')?.value || 1,
    );
    const baseDelay = 800 / speed;

    // Simulate traffic increasing → scale out → traffic decreasing → scale in
    const scenario = [
      { traffic: 4, instances: 2 },
      { traffic: 6, instances: 3 },
      { traffic: 8, instances: 4 },
      { traffic: 10, instances: 6 },
      { traffic: 7, instances: 4 },
      { traffic: 4, instances: 3 },
      { traffic: 2, instances: 2 },
    ];

    scenario.forEach((s, i) => {
      const t = setTimeout(() => {
        state.traffic = s.traffic;
        state.instances = s.instances;
        const slider = document.getElementById('compute-traffic');
        const valEl = document.getElementById('compute-traffic-val');
        if (slider) slider.value = s.traffic;
        if (valEl) valEl.textContent = s.traffic;
        render();

        if (i === scenario.length - 1) {
          state.playing = false;
          if (btn) btn.textContent = '▶ Auto Scaling 시뮬레이션';
          window.__awsProgress?.save('section-compute');
        }
      }, i * baseDelay);
      state.timers.push(t);
    });
  }

  function resetCompute() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
    state.traffic = parseInt(
      document.getElementById('compute-traffic')?.value || 3,
    );
    state.instances = Math.max(2, Math.ceil(state.traffic / 3));
    const btn = document.getElementById('compute-play');
    if (btn) btn.textContent = '▶ Auto Scaling 시뮬레이션';
    render();
  }

  /* ── Compare Mode ── */
  const compareBtn = document.getElementById('compute-compare-btn');
  const compareContainer = document.getElementById('compute-compare-container');

  if (compareBtn && compareContainer) {
    compareBtn.addEventListener('click', () => {
      state.showCompare = !state.showCompare;
      compareBtn.classList.toggle('active', state.showCompare);
      compareContainer.style.display = state.showCompare ? 'grid' : 'none';
      if (state.showCompare) renderCompare();
    });
  }

  function renderCompare() {
    if (!compareContainer) return;
    compareContainer.innerHTML = `
      <div class="compare-panel compare-panel-a">
        <div class="compare-panel-title">⚠ 단일 인스턴스</div>
        <svg viewBox="0 0 300 200" class="compare-svg" style="width:100%;height:200px">
          <rect x="100" y="60" width="100" height="80" rx="8" fill="#ED7100" opacity="0.2" stroke="#ED7100"/>
          <text x="150" y="95" text-anchor="middle" font-size="11" font-weight="700" fill="#ED7100">🖥 EC2 1대</text>
          <text x="150" y="115" text-anchor="middle" font-size="9" fill="#a0a0b0">CPU 90%</text>
          <text x="150" y="170" text-anchor="middle" font-size="10" fill="#DD344C" font-family="'Noto Sans KR', sans-serif">☠ 장애 시 전체 서비스 중단</text>
          <text x="150" y="30" text-anchor="middle" font-size="10" fill="#a0a0b0" font-family="'Noto Sans KR', sans-serif">트래픽 → 단일 서버</text>
        </svg>
      </div>
      <div class="compare-panel compare-panel-b">
        <div class="compare-panel-title">✅ ASG + ELB</div>
        <svg viewBox="0 0 300 200" class="compare-svg" style="width:100%;height:200px">
          <rect x="20" y="10" width="60" height="40" rx="6" fill="#FF9900" opacity="0.2" stroke="#FF9900"/>
          <text x="50" y="35" text-anchor="middle" font-size="9" font-weight="700" fill="#FF9900">ALB</text>
          <rect x="30" y="70" width="50" height="40" rx="6" fill="#ED7100" opacity="0.2" stroke="#ED7100"/>
          <text x="55" y="95" text-anchor="middle" font-size="8" fill="#ED7100">EC2-1</text>
          <rect x="100" y="70" width="50" height="40" rx="6" fill="#ED7100" opacity="0.2" stroke="#ED7100"/>
          <text x="125" y="95" text-anchor="middle" font-size="8" fill="#ED7100">EC2-2</text>
          <rect x="170" y="70" width="50" height="40" rx="6" fill="#3F8624" opacity="0.2" stroke="#3F8624"/>
          <text x="195" y="95" text-anchor="middle" font-size="8" fill="#3F8624">EC2-3 ↑</text>
          <text x="150" y="140" text-anchor="middle" font-size="10" fill="#3F8624" font-family="'Noto Sans KR', sans-serif">✅ 트래픽 증가 → 자동 확장</text>
          <text x="150" y="170" text-anchor="middle" font-size="10" fill="#3F8624" font-family="'Noto Sans KR', sans-serif">✅ 장애 시 나머지 인스턴스가 처리</text>
        </svg>
      </div>
    `;
  }

  /* ── Slider Binding ── */
  const trafficSlider = document.getElementById('compute-traffic');
  const trafficVal = document.getElementById('compute-traffic-val');
  if (trafficSlider) {
    trafficSlider.addEventListener('input', () => {
      state.traffic = parseInt(trafficSlider.value);
      state.instances = Math.max(2, Math.ceil(state.traffic / 3));
      if (trafficVal) trafficVal.textContent = state.traffic;
      if (!state.playing) render();
    });
  }

  const speedSlider = document.getElementById('compute-speed');
  const speedVal = document.getElementById('compute-speed-val');
  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      if (speedVal) speedVal.textContent = parseFloat(speedSlider.value) + 'x';
    });
  }

  /* ── Controls ── */
  const playBtn = document.getElementById('compute-play');
  const resetBtn = document.getElementById('compute-reset');
  if (playBtn) playBtn.addEventListener('click', playScaling);
  if (resetBtn) resetBtn.addEventListener('click', resetCompute);

  render();
}
