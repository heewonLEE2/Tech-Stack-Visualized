// ===== VPC & Networking Visualization =====

export function initVPC() {
  const container = document.getElementById('vpc-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const state = {
    tab: 'architecture',
    tracing: false,
    step: -1,
    timers: [],
  };

  /* ── helpers ── */
  function drawBox(
    svg,
    x,
    y,
    w,
    h,
    {
      fill = 'none',
      stroke = '#4a4a6a',
      dash = '',
      rx = 8,
      opacity = 1,
      label = '',
      labelColor = '#e0e0e0',
      labelSize = 11,
      labelY = null,
      sub = '',
      subColor = '#a0a0b0',
    } = {},
  ) {
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', rx);
    rect.setAttribute('fill', fill);
    rect.setAttribute('opacity', opacity);
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', '1.5');
    if (dash) rect.setAttribute('stroke-dasharray', dash);
    svg.appendChild(rect);

    if (label) {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', x + w / 2);
      t.setAttribute('y', labelY ?? y + 18);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', labelSize);
      t.setAttribute('font-weight', '700');
      t.setAttribute('fill', labelColor);
      t.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      t.textContent = label;
      svg.appendChild(t);
    }
    if (sub) {
      const s = document.createElementNS(svgNS, 'text');
      s.setAttribute('x', x + w / 2);
      s.setAttribute('y', (labelY ?? y + 18) + 16);
      s.setAttribute('text-anchor', 'middle');
      s.setAttribute('font-size', '9');
      s.setAttribute('fill', subColor);
      s.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      s.textContent = sub;
      svg.appendChild(s);
    }
    return rect;
  }

  function drawArrow(svg, x1, y1, x2, y2, color = '#4a4a6a', id = '') {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowMarker)');
    if (id) line.setAttribute('class', id);
    svg.appendChild(line);
    return line;
  }

  function addArrowDef(svg) {
    const defs = document.createElementNS(svgNS, 'defs');
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'arrowMarker');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M0,0 L8,3 L0,6 Z');
    path.setAttribute('fill', '#8C4FFF');
    marker.appendChild(path);
    defs.appendChild(marker);
    svg.appendChild(defs);
  }

  /* ── Architecture Tab ── */
  function renderArchitecture() {
    container.innerHTML = '';
    const svgW = 800,
      svgH = 480;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('class', 'vpc-diagram-svg');
    addArrowDef(svg);

    // Internet (outside VPC)
    drawBox(svg, 340, 8, 120, 36, {
      fill: '#00A4A6',
      opacity: 0.2,
      stroke: '#00A4A6',
      label: '☁ Internet',
      labelColor: '#00A4A6',
      labelY: 32,
    });

    // VPC outer boundary (starts below Internet)
    drawBox(svg, 20, 56, 760, 416, {
      stroke: '#8C4FFF',
      dash: '6,4',
      label: 'VPC — 10.0.0.0/16',
      labelColor: '#8C4FFF',
      labelSize: 13,
      labelY: 74,
    });

    // IGW (at VPC border — connects Internet to VPC)
    drawBox(svg, 355, 90, 90, 36, {
      fill: '#3F8624',
      opacity: 0.25,
      stroke: '#3F8624',
      label: 'IGW',
      labelColor: '#3F8624',
      labelY: 113,
    });

    // AZ-a
    drawBox(svg, 40, 160, 350, 290, {
      stroke: '#ED7100',
      dash: '4,3',
      label: 'AZ-a (ap-northeast-2a)',
      labelColor: '#ED7100',
      labelSize: 11,
      labelY: 178,
    });

    // AZ-b
    drawBox(svg, 410, 160, 350, 290, {
      stroke: '#527FFF',
      dash: '4,3',
      label: 'AZ-b (ap-northeast-2b)',
      labelColor: '#527FFF',
      labelSize: 11,
      labelY: 178,
    });

    // Public Subnet A
    drawBox(svg, 60, 200, 310, 100, {
      fill: '#3F8624',
      opacity: 0.08,
      stroke: '#3F8624',
      label: 'Public Subnet 10.0.1.0/24',
      labelColor: '#3F8624',
      labelY: 218,
    });

    // Web + NAT in public A
    const webA = drawBox(svg, 80, 238, 100, 48, {
      fill: '#ED7100',
      opacity: 0.22,
      stroke: '#ED7100',
      label: '🖥 Web (EC2)',
      labelColor: '#ED7100',
      labelY: 260,
      sub: 'Nginx',
      subColor: '#a0a0b0',
    });
    const natA = drawBox(svg, 240, 238, 110, 48, {
      fill: '#00A4A6',
      opacity: 0.22,
      stroke: '#00A4A6',
      label: 'NAT Gateway',
      labelColor: '#00A4A6',
      labelY: 260,
    });

    // Private Subnet A
    drawBox(svg, 60, 320, 310, 110, {
      fill: '#DD344C',
      opacity: 0.06,
      stroke: '#DD344C',
      label: 'Private Subnet 10.0.2.0/24',
      labelColor: '#DD344C',
      labelY: 338,
    });
    drawBox(svg, 80, 358, 120, 48, {
      fill: '#527FFF',
      opacity: 0.22,
      stroke: '#527FFF',
      label: '🗃 RDS Primary',
      labelColor: '#527FFF',
      labelY: 380,
    });
    drawBox(svg, 230, 358, 120, 48, {
      fill: '#E7157B',
      opacity: 0.22,
      stroke: '#E7157B',
      label: 'λ Lambda',
      labelColor: '#E7157B',
      labelY: 380,
    });

    // Public Subnet B
    drawBox(svg, 430, 200, 310, 100, {
      fill: '#3F8624',
      opacity: 0.08,
      stroke: '#3F8624',
      label: 'Public Subnet 10.0.3.0/24',
      labelColor: '#3F8624',
      labelY: 218,
    });
    drawBox(svg, 470, 238, 100, 48, {
      fill: '#ED7100',
      opacity: 0.22,
      stroke: '#ED7100',
      label: '🖥 Web (EC2)',
      labelColor: '#ED7100',
      labelY: 260,
      sub: 'Nginx',
      subColor: '#a0a0b0',
    });
    drawBox(svg, 610, 238, 110, 48, {
      fill: '#FF9900',
      opacity: 0.22,
      stroke: '#FF9900',
      label: 'ALB',
      labelColor: '#FF9900',
      labelY: 260,
    });

    // Private Subnet B
    drawBox(svg, 430, 320, 310, 110, {
      fill: '#DD344C',
      opacity: 0.06,
      stroke: '#DD344C',
      label: 'Private Subnet 10.0.4.0/24',
      labelColor: '#DD344C',
      labelY: 338,
    });
    drawBox(svg, 470, 358, 120, 48, {
      fill: '#527FFF',
      opacity: 0.22,
      stroke: '#527FFF',
      label: '🗃 RDS Standby',
      labelColor: '#527FFF',
      labelY: 380,
    });
    drawBox(svg, 620, 358, 100, 48, {
      fill: '#00A4A6',
      opacity: 0.22,
      stroke: '#00A4A6',
      label: '💨 ElastiCache',
      labelColor: '#00A4A6',
      labelY: 380,
    });

    // Traffic arrows
    state._arrows = [];
    state._arrows.push(drawArrow(svg, 400, 44, 400, 90, '#00A4A6', 'flow-0')); // internet → IGW
    state._arrows.push(drawArrow(svg, 380, 126, 130, 238, '#3F8624', 'flow-1')); // IGW → web A
    state._arrows.push(drawArrow(svg, 420, 126, 520, 238, '#3F8624', 'flow-2')); // IGW → web B
    state._arrows.push(drawArrow(svg, 130, 286, 140, 358, '#ED7100', 'flow-3')); // web A → RDS A
    state._arrows.push(drawArrow(svg, 520, 286, 530, 358, '#527FFF', 'flow-4')); // web B → RDS B
    state._arrows.push(drawArrow(svg, 295, 286, 290, 358, '#E7157B', 'flow-5')); // NAT→Lambda

    container.appendChild(svg);
    state._svg = svg;
  }

  /* ── SG vs NACL Tab ── */
  function renderSecurity() {
    container.innerHTML = '';
    const svgW = 800,
      svgH = 380;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('class', 'vpc-diagram-svg');

    // Title
    const titles = [
      { label: '🛡 Security Group (SG)', x: 200, color: '#3F8624' },
      { label: '🛡 NACL', x: 600, color: '#DD344C' },
    ];
    titles.forEach(({ label, x, color }) => {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', x);
      t.setAttribute('y', 30);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '14');
      t.setAttribute('font-weight', '700');
      t.setAttribute('fill', color);
      t.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      t.textContent = label;
      svg.appendChild(t);
    });

    // Divider
    const divider = document.createElementNS(svgNS, 'line');
    divider.setAttribute('x1', 400);
    divider.setAttribute('y1', 10);
    divider.setAttribute('x2', 400);
    divider.setAttribute('y2', 370);
    divider.setAttribute('stroke', '#4a4a6a');
    divider.setAttribute('stroke-width', '1');
    divider.setAttribute('stroke-dasharray', '4,4');
    svg.appendChild(divider);

    const sgFeatures = [
      {
        label: '인스턴스 수준',
        desc: 'ENI(네트워크 인터페이스)에 적용',
        icon: '🖥',
      },
      {
        label: '상태 저장 (Stateful)',
        desc: '인바운드 허용 시 아웃바운드 자동 허용',
        icon: '🔄',
      },
      {
        label: '허용 규칙만',
        desc: '거부 규칙 설정 불가 (허용만 설정)',
        icon: '✅',
      },
      {
        label: '모든 규칙 평가',
        desc: '규칙 순서 없이 모두 평가 후 결정',
        icon: '📋',
      },
    ];

    const naclFeatures = [
      { label: '서브넷 수준', desc: '서브넷 전체에 적용', icon: '🔗' },
      {
        label: '상태 비저장 (Stateless)',
        desc: '인/아웃바운드 별도 규칙 필요',
        icon: '↔',
      },
      {
        label: '허용 + 거부',
        desc: '허용과 거부 규칙 모두 설정 가능',
        icon: '⛔',
      },
      {
        label: '번호 순서대로 평가',
        desc: '낮은 번호 규칙 먼저 적용',
        icon: '🔢',
      },
    ];

    function drawFeatureList(features, startX, color) {
      features.forEach((feat, i) => {
        const y = 60 + i * 78;

        const bg = document.createElementNS(svgNS, 'rect');
        bg.setAttribute('x', startX);
        bg.setAttribute('y', y);
        bg.setAttribute('width', 340);
        bg.setAttribute('height', 62);
        bg.setAttribute('rx', '8');
        bg.setAttribute('fill', color);
        bg.setAttribute('opacity', '0.08');
        bg.setAttribute('stroke', color);
        bg.setAttribute('stroke-width', '1');
        bg.setAttribute('stroke-opacity', '0.3');
        svg.appendChild(bg);

        const icon = document.createElementNS(svgNS, 'text');
        icon.setAttribute('x', startX + 26);
        icon.setAttribute('y', y + 36);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('font-size', '20');
        icon.textContent = feat.icon;
        svg.appendChild(icon);

        const title = document.createElementNS(svgNS, 'text');
        title.setAttribute('x', startX + 50);
        title.setAttribute('y', y + 26);
        title.setAttribute('font-size', '12');
        title.setAttribute('font-weight', '700');
        title.setAttribute('fill', color);
        title.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        title.textContent = feat.label;
        svg.appendChild(title);

        const desc = document.createElementNS(svgNS, 'text');
        desc.setAttribute('x', startX + 50);
        desc.setAttribute('y', y + 46);
        desc.setAttribute('font-size', '10');
        desc.setAttribute('fill', '#a0a0b0');
        desc.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        desc.textContent = feat.desc;
        svg.appendChild(desc);
      });
    }

    drawFeatureList(sgFeatures, 30, '#3F8624');
    drawFeatureList(naclFeatures, 430, '#DD344C');

    container.appendChild(svg);
  }

  /* ── Traffic Trace Animation ── */
  function traceTraffic() {
    if (state.tracing) {
      resetVPC();
      return;
    }
    state.tracing = true;
    const btn = document.getElementById('vpc-trace');
    if (btn) btn.textContent = '⏸ 일시정지';

    const arrows = state._arrows;
    if (!arrows) return;

    arrows.forEach((a) => {
      a.setAttribute('stroke-opacity', '0.15');
    });

    const order = [0, 1, 2, 3, 4, 5];
    order.forEach((idx, i) => {
      const t = setTimeout(() => {
        arrows[idx].setAttribute('stroke-opacity', '1');
        arrows[idx].setAttribute('stroke-width', '3');
        arrows[idx].setAttribute('stroke', '#FF9900');
        if (i > 0) {
          arrows[order[i - 1]].setAttribute('stroke-width', '2');
          arrows[order[i - 1]].setAttribute('stroke', '#8C4FFF');
          arrows[order[i - 1]].setAttribute('stroke-opacity', '0.5');
        }
        if (i === order.length - 1) {
          setTimeout(() => {
            state.tracing = false;
            if (btn) btn.textContent = '▶ 트래픽 흐름 추적';
            window.__awsProgress?.save('section-vpc');
          }, 600);
        }
      }, i * 600);
      state.timers.push(t);
    });
  }

  function resetVPC() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.tracing = false;
    state.step = -1;
    const btn = document.getElementById('vpc-trace');
    if (btn) btn.textContent = '▶ 트래픽 흐름 추적';
    if (state.tab === 'architecture') renderArchitecture();
    else renderSecurity();
  }

  /* ── Tab switching ── */
  document.querySelectorAll('[data-vpc-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('[data-vpc-tab]')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.tab = btn.dataset.vpcTab;
      resetVPC();
    });
  });

  /* ── Controls ── */
  const traceBtn = document.getElementById('vpc-trace');
  const resetBtn = document.getElementById('vpc-reset');
  if (traceBtn) traceBtn.addEventListener('click', traceTraffic);
  if (resetBtn) resetBtn.addEventListener('click', resetVPC);

  renderArchitecture();
}
