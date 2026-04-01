// ===== Database Services Visualization =====

export function initDatabase() {
  const container = document.getElementById('database-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const state = {
    tab: 'rds',
    playing: false,
    timers: [],
    showCompare: false,
  };

  /* ── helpers ── */
  function box(svg, x, y, w, h, color, label, sub = '') {
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', '0.18');
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '1.2');
    svg.appendChild(rect);

    const t = document.createElementNS(svgNS, 'text');
    t.setAttribute('x', x + w / 2);
    t.setAttribute('y', y + (sub ? h / 2 - 4 : h / 2 + 4));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', '11');
    t.setAttribute('font-weight', '700');
    t.setAttribute('fill', color);
    t.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    t.textContent = label;
    svg.appendChild(t);

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

  function arrow(svg, x1, y1, x2, y2, color = '#4a4a6a', label = '') {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '4,3');
    svg.appendChild(line);

    if (label) {
      const mx = (x1 + x2) / 2,
        my = (y1 + y2) / 2 - 6;
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', mx);
      t.setAttribute('y', my);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '8');
      t.setAttribute('fill', '#a0a0b0');
      t.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      t.textContent = label;
      svg.appendChild(t);
    }
    return line;
  }

  /* ── RDS Tab ── */
  function renderRDS() {
    container.innerHTML = '';
    const svgW = 780,
      svgH = 360;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.cssText = 'width:100%;';

    // Title
    const title = document.createElementNS(svgNS, 'text');
    title.setAttribute('x', svgW / 2);
    title.setAttribute('y', 24);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', '700');
    title.setAttribute('fill', '#527FFF');
    title.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    title.textContent = 'RDS Multi-AZ + Read Replica 아키텍처';
    svg.appendChild(title);

    // App
    box(svg, 30, 120, 100, 60, '#ED7100', '🖥 App Server', '쓰기/읽기');

    // Primary
    box(svg, 220, 50, 140, 70, '#527FFF', '🗃 RDS Primary', 'AZ-a (읽기+쓰기)');
    // Standby
    box(
      svg,
      220,
      180,
      140,
      70,
      '#527FFF',
      '🗃 RDS Standby',
      'AZ-b (Failover 전용)',
    );
    // Read Replicas
    box(svg, 460, 50, 130, 60, '#3F8624', '📖 Read Replica 1', '읽기 분산');
    box(svg, 460, 140, 130, 60, '#3F8624', '📖 Read Replica 2', '읽기 분산');
    box(svg, 460, 230, 130, 60, '#00A4A6', '🌍 Cross-Region', '다른 리전 복제');

    // Arrows
    arrow(svg, 130, 140, 220, 85, '#ED7100', '쓰기');
    arrow(svg, 130, 160, 460, 80, '#3F8624', '읽기');
    arrow(svg, 290, 120, 290, 180, '#527FFF', '동기 복제');
    arrow(svg, 360, 80, 460, 80, '#3F8624', '비동기');
    arrow(svg, 360, 85, 460, 170, '#3F8624', '비동기');
    arrow(svg, 360, 120, 460, 260, '#00A4A6', '비동기');

    // Failover note
    const note = document.createElementNS(svgNS, 'text');
    note.setAttribute('x', svgW / 2);
    note.setAttribute('y', 330);
    note.setAttribute('text-anchor', 'middle');
    note.setAttribute('font-size', '10');
    note.setAttribute('fill', '#FF9900');
    note.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    note.textContent =
      '⚡ Primary 장애 시 Standby가 자동으로 승격 (Automatic Failover)';
    svg.appendChild(note);

    container.appendChild(svg);
    state._flowElements = null;
  }

  /* ── DynamoDB Tab ── */
  function renderDynamoDB() {
    container.innerHTML = '';
    const svgW = 780,
      svgH = 340;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.cssText = 'width:100%;';

    const title = document.createElementNS(svgNS, 'text');
    title.setAttribute('x', svgW / 2);
    title.setAttribute('y', 24);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', '700');
    title.setAttribute('fill', '#FF9900');
    title.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    title.textContent = 'DynamoDB 파티션 구조';
    svg.appendChild(title);

    // Table
    const tableX = 40,
      tableY = 50;
    box(
      svg,
      tableX,
      tableY,
      120,
      50,
      '#FF9900',
      '📋 Users Table',
      'PK: userId',
    );

    // Partitions
    const partitions = [
      {
        label: 'Partition 1',
        items: ['user-001', 'user-002', 'user-003'],
        color: '#ED7100',
      },
      {
        label: 'Partition 2',
        items: ['user-101', 'user-102'],
        color: '#527FFF',
      },
      {
        label: 'Partition 3',
        items: ['user-201', 'user-202', 'user-203'],
        color: '#8C4FFF',
      },
    ];

    partitions.forEach((p, i) => {
      const px = 250 + i * 180;
      const py = 50;

      box(svg, px, py, 140, 40, p.color, p.label);
      arrow(svg, 160, 75, px, 70, p.color);

      p.items.forEach((item, j) => {
        const iy = py + 56 + j * 30;
        const bg = document.createElementNS(svgNS, 'rect');
        bg.setAttribute('x', px + 10);
        bg.setAttribute('y', iy);
        bg.setAttribute('width', 120);
        bg.setAttribute('height', 22);
        bg.setAttribute('rx', '4');
        bg.setAttribute('fill', p.color);
        bg.setAttribute('opacity', '0.1');
        svg.appendChild(bg);

        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', px + 70);
        t.setAttribute('y', iy + 15);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-size', '9');
        t.setAttribute('fill', p.color);
        t.textContent = item;
        svg.appendChild(t);
      });
    });

    // Features
    const feats = [
      { label: '자동 파티셔닝', desc: '해시 키 기반 자동 분산', icon: '⚡' },
      {
        label: 'On-Demand 과금',
        desc: '요청 단위 과금 (PAY_PER_REQUEST)',
        icon: '💰',
      },
      {
        label: '한 자릿수 ms 지연',
        desc: 'SSD 기반 일관된 응답 시간',
        icon: '🚀',
      },
    ];

    feats.forEach((f, i) => {
      const fy = 250 + i * 0; // all on same line
      const fx = 100 + i * 230;
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', fx);
      t.setAttribute('y', 290);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '10');
      t.setAttribute('fill', '#FF9900');
      t.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      t.textContent = `${f.icon} ${f.label}`;
      svg.appendChild(t);

      const d = document.createElementNS(svgNS, 'text');
      d.setAttribute('x', fx);
      d.setAttribute('y', 308);
      d.setAttribute('text-anchor', 'middle');
      d.setAttribute('font-size', '9');
      d.setAttribute('fill', '#a0a0b0');
      d.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      d.textContent = f.desc;
      svg.appendChild(d);
    });

    container.appendChild(svg);
  }

  /* ── ElastiCache Tab ── */
  function renderElastiCache() {
    container.innerHTML = '';
    const svgW = 780,
      svgH = 320;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.cssText = 'width:100%;';

    const title = document.createElementNS(svgNS, 'text');
    title.setAttribute('x', svgW / 2);
    title.setAttribute('y', 24);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', '700');
    title.setAttribute('fill', '#00A4A6');
    title.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    title.textContent = 'ElastiCache — 캐싱 패턴';
    svg.appendChild(title);

    // Cache-Aside pattern
    box(svg, 40, 80, 100, 50, '#ED7100', '🖥 App', '');
    box(
      svg,
      250,
      50,
      130,
      50,
      '#00A4A6',
      '💨 ElastiCache',
      'Redis / Memcached',
    );
    box(svg, 250, 170, 130, 50, '#527FFF', '🗃 RDS', '원본 데이터');

    // Flow arrows with labels
    arrow(svg, 140, 90, 250, 66, '#00A4A6', '① 캐시 확인');
    arrow(svg, 140, 118, 250, 195, '#527FFF', '② 캐시 미스 → DB 조회');
    arrow(svg, 250, 195, 140, 118, '#3F8624', '③ 결과 → App');
    arrow(svg, 140, 102, 250, 88, '#FF9900', '④ 캐시에 저장');

    // Cache hit path
    const hitLabel = document.createElementNS(svgNS, 'text');
    hitLabel.setAttribute('x', 510);
    hitLabel.setAttribute('y', 60);
    hitLabel.setAttribute('font-size', '11');
    hitLabel.setAttribute('font-weight', '700');
    hitLabel.setAttribute('fill', '#3F8624');
    hitLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    hitLabel.textContent = '✅ Cache Hit';
    svg.appendChild(hitLabel);

    const hitDesc = document.createElementNS(svgNS, 'text');
    hitDesc.setAttribute('x', 510);
    hitDesc.setAttribute('y', 78);
    hitDesc.setAttribute('font-size', '9');
    hitDesc.setAttribute('fill', '#a0a0b0');
    hitDesc.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    hitDesc.textContent = '캐시에서 즉시 응답 (~1ms)';
    svg.appendChild(hitDesc);

    // Cache miss path
    const missLabel = document.createElementNS(svgNS, 'text');
    missLabel.setAttribute('x', 510);
    missLabel.setAttribute('y', 180);
    missLabel.setAttribute('font-size', '11');
    missLabel.setAttribute('font-weight', '700');
    missLabel.setAttribute('fill', '#DD344C');
    missLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    missLabel.textContent = '❌ Cache Miss';
    svg.appendChild(missLabel);

    const missDesc = document.createElementNS(svgNS, 'text');
    missDesc.setAttribute('x', 510);
    missDesc.setAttribute('y', 198);
    missDesc.setAttribute('font-size', '9');
    missDesc.setAttribute('fill', '#a0a0b0');
    missDesc.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    missDesc.textContent = 'DB 조회 후 캐시에 저장 (~50ms)';
    svg.appendChild(missDesc);

    // Comparison: Redis vs Memcached
    const cmpY = 240;
    const cmpTitle = document.createElementNS(svgNS, 'text');
    cmpTitle.setAttribute('x', svgW / 2);
    cmpTitle.setAttribute('y', cmpY);
    cmpTitle.setAttribute('text-anchor', 'middle');
    cmpTitle.setAttribute('font-size', '11');
    cmpTitle.setAttribute('font-weight', '700');
    cmpTitle.setAttribute('fill', '#e0e0e0');
    cmpTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    cmpTitle.textContent = 'Redis vs Memcached';
    svg.appendChild(cmpTitle);

    const redisFeats = [
      '데이터 영속성',
      '복제 지원',
      '다양한 자료구조',
      'Pub/Sub',
    ];
    const mcFeats = [
      '멀티스레드',
      '단순 K-V만',
      '영속성 없음',
      '수평 확장 용이',
    ];

    [
      { feats: redisFeats, color: '#00A4A6', label: 'Redis', x: 150 },
      { feats: mcFeats, color: '#ED7100', label: 'Memcached', x: 500 },
    ].forEach(({ feats, color, label, x }) => {
      const ly = cmpY + 16;
      const lt = document.createElementNS(svgNS, 'text');
      lt.setAttribute('x', x);
      lt.setAttribute('y', ly);
      lt.setAttribute('text-anchor', 'middle');
      lt.setAttribute('font-size', '10');
      lt.setAttribute('font-weight', '700');
      lt.setAttribute('fill', color);
      lt.textContent = label;
      svg.appendChild(lt);

      feats.forEach((f, i) => {
        const ft = document.createElementNS(svgNS, 'text');
        ft.setAttribute('x', x);
        ft.setAttribute('y', ly + 16 + i * 14);
        ft.setAttribute('text-anchor', 'middle');
        ft.setAttribute('font-size', '9');
        ft.setAttribute('fill', '#a0a0b0');
        ft.textContent = `• ${f}`;
        svg.appendChild(ft);
      });
    });

    container.appendChild(svg);
  }

  /* ── Request Flow Animation ── */
  function playFlow() {
    if (state.playing) {
      resetDB();
      return;
    }
    state.playing = true;
    const btn = document.getElementById('db-play');
    if (btn) btn.textContent = '⏸ 일시정지';

    setTimeout(() => {
      state.playing = false;
      if (btn) btn.textContent = '▶ 요청 흐름 시뮬레이션';
      window.__awsProgress?.save('section-database');
    }, 2000);
  }

  function resetDB() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
    const btn = document.getElementById('db-play');
    if (btn) btn.textContent = '▶ 요청 흐름 시뮬레이션';
    renderCurrentTab();
  }

  function renderCurrentTab() {
    if (state.tab === 'rds') renderRDS();
    else if (state.tab === 'dynamodb') renderDynamoDB();
    else renderElastiCache();
  }

  /* ── Compare Mode ── */
  const compareBtn = document.getElementById('db-compare-btn');
  const compareCtr = document.getElementById('db-compare-container');

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
        <div class="compare-panel-title">⚠ 단일 DB 인스턴스</div>
        <ul style="font-size:0.85rem;color:var(--text-secondary);padding-left:16px;line-height:1.8">
          <li>장애 시 <strong style="color:var(--security-color)">수동 복구 필요</strong></li>
          <li>읽기/쓰기 모두 <strong>같은 인스턴스</strong>에서 처리</li>
          <li>트래픽 증가 시 <strong style="color:var(--security-color)">병목 발생</strong></li>
          <li>백업 중 성능 저하 가능</li>
        </ul>
      </div>
      <div class="compare-panel compare-panel-b">
        <div class="compare-panel-title">✅ Multi-AZ + Read Replica</div>
        <ul style="font-size:0.85rem;color:var(--text-secondary);padding-left:16px;line-height:1.8">
          <li>장애 시 <strong style="color:var(--storage-color)">자동 Failover</strong> (60초 이내)</li>
          <li>읽기 트래픽을 <strong>Read Replica로 분산</strong></li>
          <li>최대 <strong style="color:var(--storage-color)">5개 Replica</strong>로 수평 확장</li>
          <li>Cross-Region Replica로 <strong>재해 복구</strong> 가능</li>
        </ul>
      </div>
    `;
  }

  /* ── Tab switching ── */
  document.querySelectorAll('[data-db-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('[data-db-tab]')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.tab = btn.dataset.dbTab;
      resetDB();
    });
  });

  /* ── Controls ── */
  const playBtn = document.getElementById('db-play');
  const resetBtn = document.getElementById('db-reset');
  if (playBtn) playBtn.addEventListener('click', playFlow);
  if (resetBtn) resetBtn.addEventListener('click', resetDB);

  renderRDS();
}
