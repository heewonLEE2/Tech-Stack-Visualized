// ===== Global Infrastructure: Regions, AZs, Edge Locations =====

export function initGlobalInfra() {
  const container = document.getElementById('global-infra-container');
  if (!container) return;

  const regions = [
    {
      id: 'us-east-1',
      name: 'US East (N. Virginia)',
      flag: '🇺🇸',
      azs: [
        'us-east-1a',
        'us-east-1b',
        'us-east-1c',
        'us-east-1d',
        'us-east-1e',
        'us-east-1f',
      ],
      services: 200,
      latencyKR: '180ms',
    },
    {
      id: 'ap-northeast-2',
      name: 'Asia Pacific (Seoul)',
      flag: '🇰🇷',
      azs: [
        'ap-northeast-2a',
        'ap-northeast-2b',
        'ap-northeast-2c',
        'ap-northeast-2d',
      ],
      services: 180,
      latencyKR: '2ms',
    },
    {
      id: 'eu-west-1',
      name: 'Europe (Ireland)',
      flag: '🇮🇪',
      azs: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
      services: 190,
      latencyKR: '250ms',
    },
    {
      id: 'ap-northeast-1',
      name: 'Asia Pacific (Tokyo)',
      flag: '🇯🇵',
      azs: ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
      services: 185,
      latencyKR: '30ms',
    },
    {
      id: 'ap-southeast-1',
      name: 'Asia Pacific (Singapore)',
      flag: '🇸🇬',
      azs: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
      services: 175,
      latencyKR: '70ms',
    },
    {
      id: 'us-west-2',
      name: 'US West (Oregon)',
      flag: '🇺🇸',
      azs: ['us-west-2a', 'us-west-2b', 'us-west-2c', 'us-west-2d'],
      services: 195,
      latencyKR: '150ms',
    },
  ];

  const state = {
    mode: 'single',
    selectedRegion: 'ap-northeast-2',
  };

  function render() {
    container.innerHTML = '';

    // Info bar
    const info = document.createElement('div');
    info.style.cssText =
      'text-align:center;margin-bottom:20px;font-size:0.9rem;color:var(--text-secondary)';
    if (state.mode === 'single') {
      info.innerHTML =
        '<strong style="color:var(--global-color)">단일 AZ 배포</strong> — 한 리전, 한 AZ에만 배포. 비용 최소화, 가용성 낮음';
    } else if (state.mode === 'multi') {
      info.innerHTML =
        '<strong style="color:var(--global-color)">다중 AZ 배포</strong> — 한 리전 내 여러 AZ에 분산 배포. 고가용성 확보';
    } else {
      info.innerHTML =
        '<strong style="color:var(--global-color)">다중 리전 배포</strong> — 여러 리전에 걸쳐 배포. 글로벌 서비스, 재해 복구(DR)';
    }
    container.appendChild(info);

    // SVG diagram
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgW = 880;
    const svgH = state.mode === 'multi-region' ? 380 : 320;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.cssText =
      'width:100%;max-width:880px;margin:0 auto;display:block';

    const selectedData = regions.find((r) => r.id === state.selectedRegion);
    if (!selectedData) return;

    if (state.mode === 'single') {
      drawSingleAZ(svg, svgNS, svgW, svgH, selectedData);
    } else if (state.mode === 'multi') {
      drawMultiAZ(svg, svgNS, svgW, svgH, selectedData);
    } else {
      drawMultiRegion(svg, svgNS, svgW, svgH);
    }

    container.appendChild(svg);

    // Region cards
    const grid = document.createElement('div');
    grid.className = 'region-grid';
    regions.forEach((r) => {
      const card = document.createElement('div');
      card.className =
        'region-card' + (r.id === state.selectedRegion ? ' active' : '');
      card.innerHTML = `
        <h4>${r.flag} ${r.name}</h4>
        <p>${r.azs.length} AZs · ${r.services}+ 서비스<br>
        <span style="color:var(--global-color)">한국→지연: ${r.latencyKR}</span></p>
      `;
      card.addEventListener('click', () => {
        state.selectedRegion = r.id;
        render();
      });
      grid.appendChild(card);
    });
    container.appendChild(grid);

    window.__awsProgress?.save('section-global-infra');
  }

  function drawSingleAZ(svg, ns, w, h, region) {
    // Region box
    drawBox(
      svg,
      ns,
      60,
      20,
      w - 120,
      h - 60,
      `Region: ${region.name}`,
      '#00a4a6',
      0.12,
    );

    // Single AZ box
    const azW = 240;
    const azH = 140;
    const azX = w / 2 - azW / 2;
    const azY = 80;
    drawBox(svg, ns, azX, azY, azW, azH, region.azs[0], '#ff9900', 0.2);

    // EC2 instance inside
    drawService(svg, ns, azX + 40, azY + 40, 70, 60, 'EC2', '#ED7100');
    drawService(svg, ns, azX + 130, azY + 40, 70, 60, 'RDS', '#527FFF');

    // Warning label
    const warn = document.createElementNS(ns, 'text');
    warn.setAttribute('x', w / 2);
    warn.setAttribute('y', azY + azH + 40);
    warn.setAttribute('text-anchor', 'middle');
    warn.setAttribute('font-size', '12');
    warn.setAttribute('fill', '#DD344C');
    warn.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    warn.textContent = '⚠ AZ 장애 시 서비스 완전 중단';
    svg.appendChild(warn);
  }

  function drawMultiAZ(svg, ns, w, h, region) {
    // Region box
    drawBox(
      svg,
      ns,
      30,
      20,
      w - 60,
      h - 60,
      `Region: ${region.name}`,
      '#00a4a6',
      0.12,
    );

    const azCount = Math.min(region.azs.length, 3);
    const azW = 200;
    const azH = 150;
    const gap = 30;
    const totalW = azCount * azW + (azCount - 1) * gap;
    const startX = (w - totalW) / 2;

    for (let i = 0; i < azCount; i++) {
      const azX = startX + i * (azW + gap);
      const azY = 70;
      drawBox(svg, ns, azX, azY, azW, azH, region.azs[i], '#ff9900', 0.18);

      // Services inside each AZ
      drawService(svg, ns, azX + 20, azY + 40, 70, 55, 'EC2', '#ED7100');
      drawService(
        svg,
        ns,
        azX + 110,
        azY + 40,
        70,
        55,
        i === 0 ? 'RDS 기본' : 'RDS 복제',
        '#527FFF',
      );

      // Replication arrows between AZs
      if (i > 0) {
        const arrowY = azY + azH / 2;
        const prevEndX = startX + (i - 1) * (azW + gap) + azW;
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', prevEndX + 4);
        line.setAttribute('y1', arrowY);
        line.setAttribute('x2', azX - 4);
        line.setAttribute('y2', arrowY);
        line.setAttribute('stroke', '#527FFF');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '6,4');
        line.setAttribute('opacity', '0.6');
        svg.appendChild(line);

        const repLabel = document.createElementNS(ns, 'text');
        repLabel.setAttribute('x', (prevEndX + azX) / 2);
        repLabel.setAttribute('y', arrowY - 6);
        repLabel.setAttribute('text-anchor', 'middle');
        repLabel.setAttribute('font-size', '9');
        repLabel.setAttribute('fill', '#527FFF');
        repLabel.textContent = '동기 복제';
        svg.appendChild(repLabel);
      }
    }

    // Success label
    const ok = document.createElementNS(ns, 'text');
    ok.setAttribute('x', w / 2);
    ok.setAttribute('y', h - 30);
    ok.setAttribute('text-anchor', 'middle');
    ok.setAttribute('font-size', '12');
    ok.setAttribute('fill', '#3F8624');
    ok.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    ok.textContent = '✓ 1개 AZ 장애에도 나머지 AZ에서 서비스 지속';
    svg.appendChild(ok);
  }

  function drawMultiRegion(svg, ns, w, h) {
    const regionList = [
      { name: 'Seoul (서울)', azCount: 4, color: '#00a4a6', x: 40, y: 40 },
      { name: 'Tokyo (도쿄)', azCount: 3, color: '#00a4a6', x: 470, y: 40 },
      { name: 'Virginia (미국)', azCount: 6, color: '#00a4a6', x: 250, y: 210 },
    ];

    regionList.forEach((r) => {
      drawBox(svg, ns, r.x, r.y, 340, 130, `Region: ${r.name}`, r.color, 0.12);

      // AZ boxes inside
      const azW = 90;
      const azGap = 10;
      const displayAz = Math.min(r.azCount, 3);
      for (let i = 0; i < displayAz; i++) {
        const azX = r.x + 20 + i * (azW + azGap);
        drawBox(
          svg,
          ns,
          azX,
          r.y + 40,
          azW,
          60,
          `AZ-${String.fromCharCode(97 + i)}`,
          '#ff9900',
          0.2,
        );
      }
      if (r.azCount > 3) {
        const moreText = document.createElementNS(ns, 'text');
        moreText.setAttribute('x', r.x + 20 + 3 * (azW + azGap) + 10);
        moreText.setAttribute('y', r.y + 75);
        moreText.setAttribute('font-size', '11');
        moreText.setAttribute('fill', '#a0a0b0');
        moreText.textContent = `+${r.azCount - 3} AZs`;
        svg.appendChild(moreText);
      }
    });

    // Cross-region replication arrows
    drawDashedArrow(svg, ns, 380, 105, 470, 105, '#E7157B');
    drawDashedArrow(svg, ns, 250, 210, 250, 170, '#E7157B');

    const crLabel = document.createElementNS(ns, 'text');
    crLabel.setAttribute('x', 425);
    crLabel.setAttribute('y', 95);
    crLabel.setAttribute('text-anchor', 'middle');
    crLabel.setAttribute('font-size', '9');
    crLabel.setAttribute('fill', '#E7157B');
    crLabel.textContent = '크로스 리전 복제';
    svg.appendChild(crLabel);

    const ok = document.createElementNS(ns, 'text');
    ok.setAttribute('x', w / 2);
    ok.setAttribute('y', h - 10);
    ok.setAttribute('text-anchor', 'middle');
    ok.setAttribute('font-size', '12');
    ok.setAttribute('fill', '#3F8624');
    ok.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    ok.textContent = '✓ 전체 리전 장애에도 다른 리전에서 서비스 지속 (DR)';
    svg.appendChild(ok);
  }

  function drawBox(svg, ns, x, y, w, h, label, color, opacity) {
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', opacity);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(rect);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', x + 12);
    text.setAttribute('y', y + 18);
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '600');
    text.setAttribute('fill', color);
    text.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    text.textContent = label;
    svg.appendChild(text);
  }

  function drawService(svg, ns, x, y, w, h, label, color) {
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', '0.8');
    svg.appendChild(rect);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', x + w / 2);
    text.setAttribute('y', y + h / 2 + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '700');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    text.textContent = label;
    svg.appendChild(text);
  }

  function drawDashedArrow(svg, ns, x1, y1, x2, y2, color) {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '6,4');
    line.setAttribute('opacity', '0.6');
    svg.appendChild(line);
  }

  // Controls
  document.querySelectorAll('[data-infra]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('[data-infra]')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.infra;
      render();
    });
  });

  render();
}
