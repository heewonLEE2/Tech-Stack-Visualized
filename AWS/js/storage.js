// ===== S3 & Storage Visualization =====

export function initStorage() {
  const container = document.getElementById('storage-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const CLASSES = [
    {
      name: 'S3 Standard',
      cost: 0.025,
      retrieval: 0,
      durability: '99.999999999%',
      availability: '99.99%',
      use: '자주 접근하는 데이터',
      color: '#FF9900',
    },
    {
      name: 'S3 Standard-IA',
      cost: 0.0138,
      retrieval: 0.01,
      durability: '99.999999999%',
      availability: '99.9%',
      use: '비정기 접근 데이터',
      color: '#ED7100',
    },
    {
      name: 'S3 One Zone-IA',
      cost: 0.011,
      retrieval: 0.01,
      durability: '99.999999999%',
      availability: '99.5%',
      use: '재생성 가능 데이터',
      color: '#00A4A6',
    },
    {
      name: 'S3 Glacier Instant',
      cost: 0.005,
      retrieval: 0.03,
      durability: '99.999999999%',
      availability: '99.9%',
      use: '분기별 접근 아카이브',
      color: '#527FFF',
    },
    {
      name: 'S3 Glacier Flexible',
      cost: 0.0045,
      retrieval: 0.03,
      durability: '99.999999999%',
      availability: '99.99%',
      use: '연간 접근 아카이브',
      color: '#8C4FFF',
    },
    {
      name: 'S3 Glacier Deep',
      cost: 0.002,
      retrieval: 0.05,
      durability: '99.999999999%',
      availability: '99.99%',
      use: '장기 보관 (7~10년)',
      color: '#E7157B',
    },
  ];

  const state = {
    playing: false,
    step: 0, // lifecycle day index
    timers: [],
    maxDays: 365,
  };

  function render() {
    container.innerHTML = '';

    // Top: Storage class bar chart
    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = 'margin-bottom:24px;';

    const svgW = 780,
      svgH = 260;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.cssText = 'width:100%;max-width:780px;';

    // Title
    const title = document.createElementNS(svgNS, 'text');
    title.setAttribute('x', svgW / 2);
    title.setAttribute('y', 20);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '13');
    title.setAttribute('font-weight', '700');
    title.setAttribute('fill', '#e0e0e0');
    title.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    title.textContent = 'S3 스토리지 클래스별 비용 비교 ($/GB/월)';
    svg.appendChild(title);

    const barStartY = 40;
    const barMaxW = 400;
    const maxCost = 0.025;

    CLASSES.forEach((cls, i) => {
      const y = barStartY + i * 36;
      const barW = (cls.cost / maxCost) * barMaxW;

      // Label
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', 160);
      label.setAttribute('y', y + 16);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', cls.color);
      label.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      label.textContent = cls.name;
      svg.appendChild(label);

      // Bar
      const bar = document.createElementNS(svgNS, 'rect');
      bar.setAttribute('x', 170);
      bar.setAttribute('y', y + 4);
      bar.setAttribute('width', barW);
      bar.setAttribute('height', 18);
      bar.setAttribute('rx', '4');
      bar.setAttribute('fill', cls.color);
      bar.setAttribute('opacity', '0.7');
      svg.appendChild(bar);

      // Cost text
      const costTxt = document.createElementNS(svgNS, 'text');
      costTxt.setAttribute('x', 175 + barW);
      costTxt.setAttribute('y', y + 17);
      costTxt.setAttribute('font-size', '9');
      costTxt.setAttribute('fill', '#a0a0b0');
      costTxt.textContent = `$${cls.cost}`;
      svg.appendChild(costTxt);

      // Use case
      const use = document.createElementNS(svgNS, 'text');
      use.setAttribute('x', 620);
      use.setAttribute('y', y + 16);
      use.setAttribute('font-size', '9');
      use.setAttribute('fill', '#a0a0b0');
      use.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      use.textContent = cls.use;
      svg.appendChild(use);
    });

    chartDiv.appendChild(svg);
    container.appendChild(chartDiv);

    // Bottom: Lifecycle timeline
    const timeDiv = document.createElement('div');
    timeDiv.style.cssText = 'margin-top:10px;';

    const tSvgW = 780,
      tSvgH = 180;
    const tSvg = document.createElementNS(svgNS, 'svg');
    tSvg.setAttribute('viewBox', `0 0 ${tSvgW} ${tSvgH}`);
    tSvg.style.cssText = 'width:100%;max-width:780px;';

    const tTitle = document.createElementNS(svgNS, 'text');
    tTitle.setAttribute('x', tSvgW / 2);
    tTitle.setAttribute('y', 18);
    tTitle.setAttribute('text-anchor', 'middle');
    tTitle.setAttribute('font-size', '13');
    tTitle.setAttribute('font-weight', '700');
    tTitle.setAttribute('fill', '#e0e0e0');
    tTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    tTitle.textContent = `라이프사이클 정책 시뮬레이션 — Day ${state.step}`;
    tSvg.appendChild(tTitle);

    // Timeline track
    const trackX = 60,
      trackY = 60,
      trackW = 660;
    const track = document.createElementNS(svgNS, 'rect');
    track.setAttribute('x', trackX);
    track.setAttribute('y', trackY);
    track.setAttribute('width', trackW);
    track.setAttribute('height', 6);
    track.setAttribute('rx', '3');
    track.setAttribute('fill', '#2a2a3a');
    tSvg.appendChild(track);

    // Lifecycle milestones
    const milestones = [
      { day: 0, label: 'Standard', color: '#FF9900' },
      { day: 30, label: 'Standard-IA', color: '#ED7100' },
      { day: 90, label: 'Glacier Flexible', color: '#8C4FFF' },
      { day: 365, label: 'Glacier Deep', color: '#E7157B' },
    ];

    milestones.forEach((m) => {
      const x = trackX + (m.day / state.maxDays) * trackW;
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', trackY + 3);
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', state.step >= m.day ? m.color : '#3a3a4a');
      circle.setAttribute('stroke', m.color);
      circle.setAttribute('stroke-width', '1.5');
      tSvg.appendChild(circle);

      // Label below
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', trackY + 28);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', state.step >= m.day ? m.color : '#5a5a6a');
      label.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      label.textContent = m.label;
      tSvg.appendChild(label);

      // Day label
      const dayTxt = document.createElementNS(svgNS, 'text');
      dayTxt.setAttribute('x', x);
      dayTxt.setAttribute('y', trackY + 42);
      dayTxt.setAttribute('text-anchor', 'middle');
      dayTxt.setAttribute('font-size', '8');
      dayTxt.setAttribute('fill', '#5a5a6a');
      dayTxt.textContent = `Day ${m.day}`;
      tSvg.appendChild(dayTxt);
    });

    // Current position marker
    const curX = trackX + (state.step / state.maxDays) * trackW;
    const marker = document.createElementNS(svgNS, 'circle');
    marker.setAttribute('cx', curX);
    marker.setAttribute('cy', trackY + 3);
    marker.setAttribute('r', '4');
    marker.setAttribute('fill', '#fff');
    tSvg.appendChild(marker);

    // Data object visual
    const currentClass =
      state.step >= 365
        ? CLASSES[5]
        : state.step >= 90
          ? CLASSES[4]
          : state.step >= 30
            ? CLASSES[1]
            : CLASSES[0];
    const objY = 100;

    const objBox = document.createElementNS(svgNS, 'rect');
    objBox.setAttribute('x', tSvgW / 2 - 90);
    objBox.setAttribute('y', objY);
    objBox.setAttribute('width', 180);
    objBox.setAttribute('height', 60);
    objBox.setAttribute('rx', '8');
    objBox.setAttribute('fill', currentClass.color);
    objBox.setAttribute('opacity', '0.15');
    objBox.setAttribute('stroke', currentClass.color);
    objBox.setAttribute('stroke-width', '1.5');
    tSvg.appendChild(objBox);

    const objLabel = document.createElementNS(svgNS, 'text');
    objLabel.setAttribute('x', tSvgW / 2);
    objLabel.setAttribute('y', objY + 25);
    objLabel.setAttribute('text-anchor', 'middle');
    objLabel.setAttribute('font-size', '11');
    objLabel.setAttribute('font-weight', '700');
    objLabel.setAttribute('fill', currentClass.color);
    objLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    objLabel.textContent = `📦 reports.zip → ${currentClass.name}`;
    tSvg.appendChild(objLabel);

    const objCost = document.createElementNS(svgNS, 'text');
    objCost.setAttribute('x', tSvgW / 2);
    objCost.setAttribute('y', objY + 45);
    objCost.setAttribute('text-anchor', 'middle');
    objCost.setAttribute('font-size', '9');
    objCost.setAttribute('fill', '#a0a0b0');
    objCost.textContent = `비용: $${currentClass.cost}/GB/월`;
    tSvg.appendChild(objCost);

    timeDiv.appendChild(tSvg);
    container.appendChild(timeDiv);
  }

  /* ── Lifecycle Simulation ── */
  function playLifecycle() {
    if (state.playing) {
      resetStorage();
      return;
    }
    state.playing = true;
    const btn = document.getElementById('storage-play');
    if (btn) btn.textContent = '⏸ 일시정지';

    const speed = parseFloat(
      document.getElementById('storage-speed')?.value || 1,
    );
    const baseDelay = 40 / speed;

    const days = [
      0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 120, 180, 250, 300, 365,
    ];
    days.forEach((d, i) => {
      const t = setTimeout(
        () => {
          state.step = d;
          render();
          if (i === days.length - 1) {
            state.playing = false;
            if (btn) btn.textContent = '▶ 라이프사이클 시뮬레이션';
            window.__awsProgress?.save('section-storage');
          }
        },
        i * baseDelay * 8,
      );
      state.timers.push(t);
    });
  }

  function resetStorage() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
    state.step = 0;
    const btn = document.getElementById('storage-play');
    if (btn) btn.textContent = '▶ 라이프사이클 시뮬레이션';
    render();
  }

  /* ── Speed slider ── */
  const speedSlider = document.getElementById('storage-speed');
  const speedVal = document.getElementById('storage-speed-val');
  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      if (speedVal) speedVal.textContent = parseFloat(speedSlider.value) + 'x';
    });
  }

  /* ── Controls ── */
  const playBtn = document.getElementById('storage-play');
  const resetBtn = document.getElementById('storage-reset');
  if (playBtn) playBtn.addEventListener('click', playLifecycle);
  if (resetBtn) resetBtn.addEventListener('click', resetStorage);

  render();
}
