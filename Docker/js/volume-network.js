// ===== Volume & Network Visualization =====

export function initVolumeNetwork() {
  const container = document.getElementById('volume-network-container');
  if (!container) return;

  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  let currentTab = 'volume';

  // === Volume Tab ===
  function renderVolume() {
    container.innerHTML = '';

    // Volume Type Cards
    const typesRow = document.createElement('div');
    typesRow.className = 'volume-type-row';

    const types = [
      {
        id: 'named',
        title: 'Named Volume',
        icon: '📦',
        desc: 'Docker가 관리하는 영속 볼륨',
        cmd: 'docker run -v my-data:/app/data nginx',
        pros: [
          'Docker가 생명주기 관리',
          '백업·마이그레이션 용이',
          '컨테이너 삭제 후에도 보존',
        ],
        color: '#ff9800',
      },
      {
        id: 'bind',
        title: 'Bind Mount',
        icon: '📁',
        desc: '호스트 디렉토리를 직접 연결',
        cmd: 'docker run -v ./src:/app/src nginx',
        pros: [
          '호스트 파일 직접 접근',
          '개발 시 핫 리로드',
          '호스트 경로에 의존',
        ],
        color: '#26c6da',
      },
      {
        id: 'tmpfs',
        title: 'tmpfs',
        icon: '💾',
        desc: '메모리에만 존재하는 임시 저장소',
        cmd: 'docker run --tmpfs /tmp nginx',
        pros: [
          '초고속 I/O',
          '보안에 유리 (디스크 미저장)',
          '컨테이너 종료 시 삭제',
        ],
        color: '#66bb6a',
      },
    ];

    let selectedType = 'named';

    types.forEach((t) => {
      const card = document.createElement('div');
      card.className =
        'vol-type-card' + (t.id === selectedType ? ' active' : '');
      card.innerHTML = `
        <div style="font-size:1.5rem; margin-bottom:6px;">${t.icon}</div>
        <h4>${t.title}</h4>
        <p>${t.desc}</p>
      `;
      card.addEventListener('click', () => {
        typesRow
          .querySelectorAll('.vol-type-card')
          .forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        selectedType = t.id;
        renderVolumeDetail(t);
      });
      typesRow.appendChild(card);
    });
    container.appendChild(typesRow);

    // Detail area
    const detail = document.createElement('div');
    detail.id = 'vol-detail';
    container.appendChild(detail);

    renderVolumeDetail(types[0]);

    function renderVolumeDetail(type) {
      const d = document.getElementById('vol-detail');
      d.innerHTML = '';

      // SVG diagram
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 600 200');
      svg.style.cssText =
        'width:100%; max-width:600px; margin:0 auto; display:block;';

      // Host box
      const hostRect = document.createElementNS(svgNS, 'rect');
      hostRect.setAttribute('x', 20);
      hostRect.setAttribute('y', 20);
      hostRect.setAttribute('width', 180);
      hostRect.setAttribute('height', 160);
      hostRect.setAttribute('rx', 10);
      hostRect.setAttribute('fill', 'rgba(100,100,100,0.15)');
      hostRect.setAttribute('stroke', '#666');
      hostRect.setAttribute('stroke-width', '1.5');
      svg.appendChild(hostRect);

      const hostLabel = document.createElementNS(svgNS, 'text');
      hostLabel.setAttribute('x', 110);
      hostLabel.setAttribute('y', 42);
      hostLabel.setAttribute('text-anchor', 'middle');
      hostLabel.setAttribute('font-size', '13');
      hostLabel.setAttribute('font-weight', '700');
      hostLabel.setAttribute('fill', '#a0a0b0');
      hostLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      hostLabel.textContent = '🖥 호스트';
      svg.appendChild(hostLabel);

      // Volume representation
      const volRect = document.createElementNS(svgNS, 'rect');
      const volColor = type.color;
      if (type.id === 'tmpfs') {
        volRect.setAttribute('x', 420);
        volRect.setAttribute('y', 60);
      } else if (type.id === 'bind') {
        volRect.setAttribute('x', 50);
        volRect.setAttribute('y', 80);
      } else {
        volRect.setAttribute('x', 230);
        volRect.setAttribute('y', 80);
      }
      volRect.setAttribute('width', 140);
      volRect.setAttribute('height', 60);
      volRect.setAttribute('rx', 8);
      volRect.setAttribute('fill', volColor);
      volRect.setAttribute('opacity', '0.25');
      volRect.setAttribute('stroke', volColor);
      volRect.setAttribute('stroke-width', '2');
      svg.appendChild(volRect);

      const volLabel = document.createElementNS(svgNS, 'text');
      volLabel.setAttribute(
        'x',
        type.id === 'tmpfs' ? 490 : type.id === 'bind' ? 120 : 300,
      );
      volLabel.setAttribute('y', type.id === 'tmpfs' ? 95 : 115);
      volLabel.setAttribute('text-anchor', 'middle');
      volLabel.setAttribute('font-size', '12');
      volLabel.setAttribute('font-weight', '600');
      volLabel.setAttribute('fill', volColor);
      volLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      volLabel.textContent = type.title;
      svg.appendChild(volLabel);

      // Container box
      const ctRect = document.createElementNS(svgNS, 'rect');
      ctRect.setAttribute('x', 400);
      ctRect.setAttribute('y', 20);
      ctRect.setAttribute('width', 180);
      ctRect.setAttribute('height', 160);
      ctRect.setAttribute('rx', 10);
      ctRect.setAttribute('fill', 'rgba(36,150,237,0.1)');
      ctRect.setAttribute('stroke', '#2496ed');
      ctRect.setAttribute('stroke-width', '1.5');
      svg.appendChild(ctRect);

      const ctLabel = document.createElementNS(svgNS, 'text');
      ctLabel.setAttribute('x', 490);
      ctLabel.setAttribute('y', 42);
      ctLabel.setAttribute('text-anchor', 'middle');
      ctLabel.setAttribute('font-size', '13');
      ctLabel.setAttribute('font-weight', '700');
      ctLabel.setAttribute('fill', '#2496ed');
      ctLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      ctLabel.textContent = '🐳 컨테이너';
      svg.appendChild(ctLabel);

      // Arrow
      const arrow = document.createElementNS(svgNS, 'line');
      if (type.id === 'bind') {
        arrow.setAttribute('x1', 190);
        arrow.setAttribute('y1', 100);
        arrow.setAttribute('x2', 400);
        arrow.setAttribute('y2', 100);
      } else if (type.id === 'tmpfs') {
        // tmpfs is inside container (memory)
      } else {
        arrow.setAttribute('x1', 370);
        arrow.setAttribute('y1', 110);
        arrow.setAttribute('x2', 400);
        arrow.setAttribute('y2', 110);
      }
      arrow.setAttribute('stroke', volColor);
      arrow.setAttribute('stroke-width', '2');
      arrow.setAttribute('stroke-dasharray', '6 3');
      svg.appendChild(arrow);

      d.appendChild(svg);

      // Pros list
      const prosList = document.createElement('div');
      prosList.style.cssText =
        'margin-top:12px; padding:12px 16px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);';
      prosList.innerHTML = `
        <div style="font-weight:600; font-size:0.85rem; margin-bottom:6px; color:${volColor};">특징</div>
        ${type.pros.map((p) => `<div style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:3px;">• ${p}</div>`).join('')}
        <div style="margin-top:8px; font-family:'Courier New',monospace; font-size:0.8rem; color:var(--network-color); background:var(--bg-secondary); padding:6px 10px; border-radius:4px;">${type.cmd}</div>
      `;
      d.appendChild(prosList);
    }
  }

  // === Network Tab ===
  function renderNetwork() {
    container.innerHTML = '';

    const modes = [
      {
        id: 'bridge',
        title: 'Bridge (기본)',
        icon: '🌉',
        desc: '동일 호스트 내 컨테이너 간 격리된 통신',
        detail: '각 컨테이너에 가상 IP 할당. Docker DNS로 이름 기반 통신 가능.',
        containers: ['Web (:80)', 'API (:3000)', 'DB (:5432)'],
        color: '#26c6da',
      },
      {
        id: 'host',
        title: 'Host',
        icon: '🖥',
        desc: '호스트 네트워크 직접 사용 (격리 없음)',
        detail: '컨테이너가 호스트의 IP/포트를 직접 사용. 성능 최적화 시.',
        containers: ['App (호스트 IP:8080)'],
        color: '#ff9800',
      },
      {
        id: 'overlay',
        title: 'Overlay',
        icon: '☁',
        desc: '다중 호스트 간 컨테이너 통신 (Swarm/K8s)',
        detail:
          'VXLAN 터널링으로 여러 물리 호스트의 컨테이너를 하나의 네트워크로 연결.',
        containers: ['Host 1: Web', 'Host 2: API', 'Host 3: DB'],
        color: '#5c6bc0',
      },
    ];

    let selectedMode = 'bridge';

    // Mode selector
    const modeRow = document.createElement('div');
    modeRow.style.cssText =
      'display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;';
    modes.forEach((m) => {
      const btn = document.createElement('button');
      btn.className =
        'btn preset-btn' + (m.id === selectedMode ? ' active' : '');
      btn.textContent = `${m.icon} ${m.title}`;
      btn.addEventListener('click', () => {
        modeRow
          .querySelectorAll('.preset-btn')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = m.id;
        renderNetworkDetail(m);
      });
      modeRow.appendChild(btn);
    });
    container.appendChild(modeRow);

    const detail = document.createElement('div');
    detail.id = 'net-detail';
    container.appendChild(detail);

    renderNetworkDetail(modes[0]);

    function renderNetworkDetail(mode) {
      const d = document.getElementById('net-detail');
      d.innerHTML = '';

      // SVG Network Diagram
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 650 280');
      svg.style.cssText =
        'width:100%; max-width:650px; margin:0 auto; display:block;';

      if (mode.id === 'bridge') {
        // Docker network bridge
        const netRect = document.createElementNS(svgNS, 'rect');
        netRect.setAttribute('x', 50);
        netRect.setAttribute('y', 20);
        netRect.setAttribute('width', 550);
        netRect.setAttribute('height', 50);
        netRect.setAttribute('rx', 8);
        netRect.setAttribute('fill', 'rgba(38,198,218,0.12)');
        netRect.setAttribute('stroke', '#26c6da');
        netRect.setAttribute('stroke-width', '2');
        svg.appendChild(netRect);

        const netLabel = document.createElementNS(svgNS, 'text');
        netLabel.setAttribute('x', 325);
        netLabel.setAttribute('y', 50);
        netLabel.setAttribute('text-anchor', 'middle');
        netLabel.setAttribute('font-size', '14');
        netLabel.setAttribute('font-weight', '700');
        netLabel.setAttribute('fill', '#26c6da');
        netLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        netLabel.textContent = '🌉 Docker Bridge Network (docker0)';
        svg.appendChild(netLabel);

        // Containers
        const containers = [
          { label: 'Web', port: ':80', ip: '172.17.0.2', x: 100 },
          { label: 'API', port: ':3000', ip: '172.17.0.3', x: 300 },
          { label: 'DB', port: ':5432', ip: '172.17.0.4', x: 500 },
        ];

        containers.forEach((c) => {
          // Vertical line to bridge
          const line = document.createElementNS(svgNS, 'line');
          line.setAttribute('x1', c.x);
          line.setAttribute('y1', 70);
          line.setAttribute('x2', c.x);
          line.setAttribute('y2', 120);
          line.setAttribute('stroke', '#26c6da');
          line.setAttribute('stroke-width', '1.5');
          line.setAttribute('stroke-dasharray', '4 3');
          svg.appendChild(line);

          // Container box
          const rect = document.createElementNS(svgNS, 'rect');
          rect.setAttribute('x', c.x - 60);
          rect.setAttribute('y', 120);
          rect.setAttribute('width', 120);
          rect.setAttribute('height', 80);
          rect.setAttribute('rx', 8);
          rect.setAttribute('fill', 'rgba(36,150,237,0.12)');
          rect.setAttribute('stroke', '#2496ed');
          rect.setAttribute('stroke-width', '1.5');
          svg.appendChild(rect);

          const name = document.createElementNS(svgNS, 'text');
          name.setAttribute('x', c.x);
          name.setAttribute('y', 148);
          name.setAttribute('text-anchor', 'middle');
          name.setAttribute('font-size', '13');
          name.setAttribute('font-weight', '700');
          name.setAttribute('fill', '#2496ed');
          name.setAttribute('font-family', "'Noto Sans KR', sans-serif");
          name.textContent = `🐳 ${c.label}`;
          svg.appendChild(name);

          const ip = document.createElementNS(svgNS, 'text');
          ip.setAttribute('x', c.x);
          ip.setAttribute('y', 167);
          ip.setAttribute('text-anchor', 'middle');
          ip.setAttribute('font-size', '10');
          ip.setAttribute('fill', '#a0a0b0');
          ip.setAttribute('font-family', "'Courier New', monospace");
          ip.textContent = c.ip;
          svg.appendChild(ip);

          const port = document.createElementNS(svgNS, 'text');
          port.setAttribute('x', c.x);
          port.setAttribute('y', 185);
          port.setAttribute('text-anchor', 'middle');
          port.setAttribute('font-size', '10');
          port.setAttribute('fill', '#ff9800');
          port.setAttribute('font-family', "'Courier New', monospace");
          port.textContent = c.port;
          svg.appendChild(port);
        });

        // Port mapping from host
        const hostLine = document.createElementNS(svgNS, 'line');
        hostLine.setAttribute('x1', 325);
        hostLine.setAttribute('y1', 240);
        hostLine.setAttribute('x2', 325);
        hostLine.setAttribute('y2', 260);
        hostLine.setAttribute('stroke', '#666');
        hostLine.setAttribute('stroke-width', '1.5');
        svg.appendChild(hostLine);

        const hostText = document.createElementNS(svgNS, 'text');
        hostText.setAttribute('x', 325);
        hostText.setAttribute('y', 275);
        hostText.setAttribute('text-anchor', 'middle');
        hostText.setAttribute('font-size', '11');
        hostText.setAttribute('fill', '#a0a0b0');
        hostText.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        hostText.textContent = '호스트 포트 매핑: -p 8080:80';
        svg.appendChild(hostText);
      } else if (mode.id === 'host') {
        // Host network mode — no isolation
        const hostRect = document.createElementNS(svgNS, 'rect');
        hostRect.setAttribute('x', 100);
        hostRect.setAttribute('y', 30);
        hostRect.setAttribute('width', 450);
        hostRect.setAttribute('height', 200);
        hostRect.setAttribute('rx', 12);
        hostRect.setAttribute('fill', 'rgba(255,152,0,0.08)');
        hostRect.setAttribute('stroke', '#ff9800');
        hostRect.setAttribute('stroke-width', '2');
        svg.appendChild(hostRect);

        const hostLabel = document.createElementNS(svgNS, 'text');
        hostLabel.setAttribute('x', 325);
        hostLabel.setAttribute('y', 60);
        hostLabel.setAttribute('text-anchor', 'middle');
        hostLabel.setAttribute('font-size', '14');
        hostLabel.setAttribute('font-weight', '700');
        hostLabel.setAttribute('fill', '#ff9800');
        hostLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        hostLabel.textContent = '🖥 Host Network Namespace (동일 IP/포트)';
        svg.appendChild(hostLabel);

        const ctRect = document.createElementNS(svgNS, 'rect');
        ctRect.setAttribute('x', 225);
        ctRect.setAttribute('y', 90);
        ctRect.setAttribute('width', 200);
        ctRect.setAttribute('height', 80);
        ctRect.setAttribute('rx', 10);
        ctRect.setAttribute('fill', 'rgba(255,152,0,0.15)');
        ctRect.setAttribute('stroke', '#ff9800');
        ctRect.setAttribute('stroke-width', '1.5');
        svg.appendChild(ctRect);

        const ctLabel = document.createElementNS(svgNS, 'text');
        ctLabel.setAttribute('x', 325);
        ctLabel.setAttribute('y', 130);
        ctLabel.setAttribute('text-anchor', 'middle');
        ctLabel.setAttribute('font-size', '13');
        ctLabel.setAttribute('font-weight', '600');
        ctLabel.setAttribute('fill', '#ff9800');
        ctLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        ctLabel.textContent = '🐳 App (호스트 IP:8080)';
        svg.appendChild(ctLabel);

        const note = document.createElementNS(svgNS, 'text');
        note.setAttribute('x', 325);
        note.setAttribute('y', 155);
        note.setAttribute('text-anchor', 'middle');
        note.setAttribute('font-size', '10');
        note.setAttribute('fill', '#a0a0b0');
        note.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        note.textContent = '포트 매핑 불필요 — 호스트 포트 직접 사용';
        svg.appendChild(note);
      } else {
        // Overlay network
        const hosts = [
          { label: 'Host 1', x: 100, containers: ['Web'] },
          { label: 'Host 2', x: 325, containers: ['API'] },
          { label: 'Host 3', x: 550, containers: ['DB'] },
        ];

        // Overlay network bar
        const netRect = document.createElementNS(svgNS, 'rect');
        netRect.setAttribute('x', 30);
        netRect.setAttribute('y', 20);
        netRect.setAttribute('width', 590);
        netRect.setAttribute('height', 40);
        netRect.setAttribute('rx', 8);
        netRect.setAttribute('fill', 'rgba(92,107,192,0.12)');
        netRect.setAttribute('stroke', '#5c6bc0');
        netRect.setAttribute('stroke-width', '2');
        svg.appendChild(netRect);

        const netLabel = document.createElementNS(svgNS, 'text');
        netLabel.setAttribute('x', 325);
        netLabel.setAttribute('y', 46);
        netLabel.setAttribute('text-anchor', 'middle');
        netLabel.setAttribute('font-size', '13');
        netLabel.setAttribute('font-weight', '700');
        netLabel.setAttribute('fill', '#5c6bc0');
        netLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        netLabel.textContent = '☁ Overlay Network (VXLAN 터널)';
        svg.appendChild(netLabel);

        hosts.forEach((h) => {
          // Host box
          const rect = document.createElementNS(svgNS, 'rect');
          rect.setAttribute('x', h.x - 70);
          rect.setAttribute('y', 90);
          rect.setAttribute('width', 140);
          rect.setAttribute('height', 130);
          rect.setAttribute('rx', 8);
          rect.setAttribute('fill', 'rgba(100,100,100,0.1)');
          rect.setAttribute('stroke', '#666');
          rect.setAttribute('stroke-width', '1.5');
          svg.appendChild(rect);

          const hLabel = document.createElementNS(svgNS, 'text');
          hLabel.setAttribute('x', h.x);
          hLabel.setAttribute('y', 112);
          hLabel.setAttribute('text-anchor', 'middle');
          hLabel.setAttribute('font-size', '12');
          hLabel.setAttribute('font-weight', '600');
          hLabel.setAttribute('fill', '#a0a0b0');
          hLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
          hLabel.textContent = `🖥 ${h.label}`;
          svg.appendChild(hLabel);

          // Container
          const ctRect = document.createElementNS(svgNS, 'rect');
          ctRect.setAttribute('x', h.x - 50);
          ctRect.setAttribute('y', 130);
          ctRect.setAttribute('width', 100);
          ctRect.setAttribute('height', 50);
          ctRect.setAttribute('rx', 6);
          ctRect.setAttribute('fill', 'rgba(92,107,192,0.15)');
          ctRect.setAttribute('stroke', '#5c6bc0');
          ctRect.setAttribute('stroke-width', '1.5');
          svg.appendChild(ctRect);

          const ctName = document.createElementNS(svgNS, 'text');
          ctName.setAttribute('x', h.x);
          ctName.setAttribute('y', 160);
          ctName.setAttribute('text-anchor', 'middle');
          ctName.setAttribute('font-size', '12');
          ctName.setAttribute('font-weight', '600');
          ctName.setAttribute('fill', '#5c6bc0');
          ctName.setAttribute('font-family', "'Noto Sans KR', sans-serif");
          ctName.textContent = `🐳 ${h.containers[0]}`;
          svg.appendChild(ctName);

          // Line to overlay
          const line = document.createElementNS(svgNS, 'line');
          line.setAttribute('x1', h.x);
          line.setAttribute('y1', 60);
          line.setAttribute('x2', h.x);
          line.setAttribute('y2', 90);
          line.setAttribute('stroke', '#5c6bc0');
          line.setAttribute('stroke-width', '1.5');
          line.setAttribute('stroke-dasharray', '4 3');
          svg.appendChild(line);
        });
      }

      d.appendChild(svg);

      // Mode description
      const desc = document.createElement('div');
      desc.style.cssText =
        'margin-top:12px; padding:12px 16px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);';
      desc.innerHTML = `
        <div style="font-weight:600; font-size:0.9rem; margin-bottom:6px; color:${mode.color};">${mode.icon} ${mode.title}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">${mode.detail}</div>
      `;
      d.appendChild(desc);
    }
  }

  function render() {
    if (currentTab === 'volume') renderVolume();
    else renderNetwork();
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      render();
      window.__dockerProgress?.save('section-volume-network');
    });
  });

  render();
}
