// ===== Serverless Architecture Visualization =====

export function initServerless() {
  const container = document.getElementById('serverless-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const state = {
    playing: false,
    concurrency: 1,
    timers: [],
    showCompare: false,
  };

  /* ── helpers ── */
  function makeBox(svg, x, y, w, h, color, label, sub = '', opacity = 0.18) {
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', String(opacity));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '1.2');
    svg.appendChild(rect);

    if (label) {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', x + w / 2);
      t.setAttribute('y', y + (sub ? h / 2 - 3 : h / 2 + 4));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '11');
      t.setAttribute('font-weight', '700');
      t.setAttribute('fill', color);
      t.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      t.textContent = label;
      svg.appendChild(t);
    }
    if (sub) {
      const s = document.createElementNS(svgNS, 'text');
      s.setAttribute('x', x + w / 2);
      s.setAttribute('y', y + h / 2 + 14);
      s.setAttribute('text-anchor', 'middle');
      s.setAttribute('font-size', '9');
      s.setAttribute('fill', '#a0a0b0');
      s.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      s.textContent = sub;
      svg.appendChild(s);
    }
    return rect;
  }

  function makeArrow(svg, x1, y1, x2, y2, color = '#4a4a6a') {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '4,3');
    svg.appendChild(line);
    return line;
  }

  function render() {
    container.innerHTML = '';

    const svgW = 800,
      svgH = 440;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.cssText = 'width:100%;';

    // ── Event-driven flow ──
    const flowTitle = document.createElementNS(svgNS, 'text');
    flowTitle.setAttribute('x', svgW / 2);
    flowTitle.setAttribute('y', 22);
    flowTitle.setAttribute('text-anchor', 'middle');
    flowTitle.setAttribute('font-size', '14');
    flowTitle.setAttribute('font-weight', '700');
    flowTitle.setAttribute('fill', '#E7157B');
    flowTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    flowTitle.textContent = '서버리스 요청 흐름';
    svg.appendChild(flowTitle);

    // Flow blocks
    const blocks = [
      {
        label: '👤 Client',
        sub: 'HTTP 요청',
        x: 30,
        y: 50,
        w: 90,
        h: 50,
        color: '#a0a0b0',
      },
      {
        label: '🌐 API Gateway',
        sub: 'REST/HTTP API',
        x: 180,
        y: 50,
        w: 120,
        h: 50,
        color: '#FF9900',
      },
      {
        label: 'λ Lambda',
        sub: 'Python 3.12',
        x: 360,
        y: 50,
        w: 110,
        h: 50,
        color: '#E7157B',
      },
      {
        label: '⚡ DynamoDB',
        sub: 'NoSQL 저장',
        x: 530,
        y: 50,
        w: 110,
        h: 50,
        color: '#527FFF',
      },
      {
        label: '📨 S3 / SNS',
        sub: '비동기 이벤트',
        x: 680,
        y: 50,
        w: 100,
        h: 50,
        color: '#3F8624',
      },
    ];

    const flowBoxes = [];
    blocks.forEach((b, i) => {
      const r = makeBox(svg, b.x, b.y, b.w, b.h, b.color, b.label, b.sub, 0.15);
      flowBoxes.push(r);
      if (i < blocks.length - 1) {
        makeArrow(
          svg,
          b.x + b.w,
          b.y + b.h / 2,
          blocks[i + 1].x,
          blocks[i + 1].y + blocks[i + 1].h / 2,
          b.color,
        );
      }
    });

    state._flowBoxes = flowBoxes;
    state._blocks = blocks;

    // ── Cold vs Warm Start ──
    const csY = 140;
    const csTitle = document.createElementNS(svgNS, 'text');
    csTitle.setAttribute('x', svgW / 2);
    csTitle.setAttribute('y', csY);
    csTitle.setAttribute('text-anchor', 'middle');
    csTitle.setAttribute('font-size', '13');
    csTitle.setAttribute('font-weight', '700');
    csTitle.setAttribute('fill', '#e0e0e0');
    csTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    csTitle.textContent = 'Cold Start vs Warm Start';
    svg.appendChild(csTitle);

    // Cold start timeline
    const coldY = csY + 20;
    makeBox(svg, 40, coldY, 90, 35, '#DD344C', '❄ 컨테이너 생성', '', 0.12);
    makeBox(svg, 140, coldY, 90, 35, '#ED7100', '📦 코드 로딩', '', 0.12);
    makeBox(svg, 240, coldY, 80, 35, '#8C4FFF', '🔧 초기화', '', 0.12);
    makeBox(svg, 330, coldY, 90, 35, '#3F8624', '⚡ 함수 실행', '', 0.12);

    const coldLabel = document.createElementNS(svgNS, 'text');
    coldLabel.setAttribute('x', 470);
    coldLabel.setAttribute('y', coldY + 22);
    coldLabel.setAttribute('font-size', '10');
    coldLabel.setAttribute('fill', '#DD344C');
    coldLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    coldLabel.textContent = 'Cold Start: ~200-500ms 추가 지연';
    svg.appendChild(coldLabel);

    // Warm start timeline
    const warmY = coldY + 50;
    makeBox(svg, 40, warmY, 90, 35, '#3F8624', '⚡ 함수 실행', '', 0.2);

    const warmLabel = document.createElementNS(svgNS, 'text');
    warmLabel.setAttribute('x', 180);
    warmLabel.setAttribute('y', warmY + 22);
    warmLabel.setAttribute('font-size', '10');
    warmLabel.setAttribute('fill', '#3F8624');
    warmLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    warmLabel.textContent = 'Warm Start: 기존 컨테이너 재사용 (~10ms)';
    svg.appendChild(warmLabel);

    // ── Concurrency visualization ──
    const conY = 280;
    const conTitle = document.createElementNS(svgNS, 'text');
    conTitle.setAttribute('x', svgW / 2);
    conTitle.setAttribute('y', conY);
    conTitle.setAttribute('text-anchor', 'middle');
    conTitle.setAttribute('font-size', '13');
    conTitle.setAttribute('font-weight', '700');
    conTitle.setAttribute('fill', '#e0e0e0');
    conTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    conTitle.textContent = `동시 실행 (Concurrency: ${state.concurrency})`;
    svg.appendChild(conTitle);

    const lambdaInstances = [];
    for (let i = 0; i < state.concurrency; i++) {
      const lx = 60 + (i % 5) * 150;
      const ly = conY + 16 + Math.floor(i / 5) * 66;
      const isWarm = i === 0;

      const r = makeBox(
        svg,
        lx,
        ly,
        130,
        52,
        isWarm ? '#3F8624' : '#E7157B',
        `λ Instance ${i + 1}`,
        isWarm ? '♨ Warm' : '❄ Cold Start',
        isWarm ? 0.25 : 0.12,
      );
      lambdaInstances.push(r);
    }

    // Step Functions state machine (simple)
    const sfY = conY + 16 + Math.ceil(state.concurrency / 5) * 66 + 10;
    if (sfY < svgH - 30) {
      const sfTitle = document.createElementNS(svgNS, 'text');
      sfTitle.setAttribute('x', svgW / 2);
      sfTitle.setAttribute('y', sfY);
      sfTitle.setAttribute('text-anchor', 'middle');
      sfTitle.setAttribute('font-size', '11');
      sfTitle.setAttribute('font-weight', '700');
      sfTitle.setAttribute('fill', '#8C4FFF');
      sfTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      sfTitle.textContent = 'Step Functions: 워크플로우 오케스트레이션';
      svg.appendChild(sfTitle);
    }

    container.appendChild(svg);
  }

  /* ── Animation ── */
  function playFlow() {
    if (state.playing) {
      resetServerless();
      return;
    }
    state.playing = true;
    const btn = document.getElementById('serverless-play');
    if (btn) btn.textContent = '⏸ 일시정지';

    const boxes = state._flowBoxes;
    const blocks = state._blocks;
    if (!boxes || !blocks) return;

    boxes.forEach((b) => {
      b.setAttribute('opacity', '0.05');
    });

    blocks.forEach((_, i) => {
      const t = setTimeout(() => {
        boxes[i].setAttribute('opacity', '0.6');
        boxes[i].setAttribute(
          'filter',
          `drop-shadow(0 0 8px ${blocks[i].color})`,
        );
        if (i > 0) {
          boxes[i - 1].removeAttribute('filter');
          boxes[i - 1].setAttribute('opacity', '0.35');
        }
        if (i === blocks.length - 1) {
          setTimeout(() => {
            state.playing = false;
            if (btn) btn.textContent = '▶ 요청 흐름 재생';
            window.__awsProgress?.save('section-serverless');
          }, 600);
        }
      }, i * 500);
      state.timers.push(t);
    });
  }

  function resetServerless() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
    const btn = document.getElementById('serverless-play');
    if (btn) btn.textContent = '▶ 요청 흐름 재생';
    render();
  }

  /* ── Compare Mode ── */
  const compareBtn = document.getElementById('serverless-compare-btn');
  const compareCtr = document.getElementById('serverless-compare-container');

  if (compareBtn && compareCtr) {
    compareBtn.addEventListener('click', () => {
      state.showCompare = !state.showCompare;
      compareBtn.classList.toggle('active', state.showCompare);
      compareCtr.style.display = state.showCompare ? 'grid' : 'none';
      if (state.showCompare) renderCompare();
    });
  }

  function renderCompare() {
    if (!compareCtr) return;
    compareCtr.innerHTML = `
      <div class="compare-panel compare-panel-a">
        <div class="compare-panel-title">🖥 전통 서버 (EC2)</div>
        <ul style="font-size:0.85rem;color:var(--text-secondary);padding-left:16px;line-height:1.8">
          <li><strong style="color:var(--security-color)">유휴 시에도 비용 발생</strong> (24/7 가동)</li>
          <li>OS 패치, 보안 업데이트 <strong>직접 관리</strong></li>
          <li>트래픽 급증 시 <strong>수동 스케일링</strong> 필요</li>
          <li>서버 장애 시 <strong>직접 복구</strong></li>
          <li>초기 용량 계획 필요</li>
        </ul>
      </div>
      <div class="compare-panel compare-panel-b">
        <div class="compare-panel-title">λ 서버리스 (Lambda)</div>
        <ul style="font-size:0.85rem;color:var(--text-secondary);padding-left:16px;line-height:1.8">
          <li><strong style="color:var(--storage-color)">실행 시간만 과금</strong> (ms 단위)</li>
          <li>인프라 관리 <strong style="color:var(--storage-color)">100% AWS 위임</strong></li>
          <li>트래픽 증가 시 <strong style="color:var(--storage-color)">자동 확장</strong> (수천 동시 실행)</li>
          <li>내장 <strong>고가용성</strong> (다중 AZ)</li>
          <li>Cold Start 지연 주의 필요</li>
        </ul>
      </div>
    `;
  }

  /* ── Concurrency slider ── */
  const conSlider = document.getElementById('serverless-concurrency');
  const conVal = document.getElementById('serverless-concurrency-val');
  if (conSlider) {
    conSlider.addEventListener('input', () => {
      state.concurrency = parseInt(conSlider.value);
      if (conVal) conVal.textContent = state.concurrency;
      if (!state.playing) render();
    });
  }

  /* ── Controls ── */
  const playBtn = document.getElementById('serverless-play');
  const resetBtn = document.getElementById('serverless-reset');
  if (playBtn) playBtn.addEventListener('click', playFlow);
  if (resetBtn) resetBtn.addEventListener('click', resetServerless);

  render();
}
