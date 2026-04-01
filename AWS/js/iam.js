// ===== IAM: Identity & Access Management Visualization =====

export function initIAM() {
  const container = document.getElementById('iam-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const state = {
    playing: false,
    step: -1,
    timers: [],
    showCompare: false,
  };

  function render() {
    container.innerHTML = '';

    const svgW = 800;
    const svgH = 480;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.className = 'iam-tree-svg';

    // === IAM Hierarchy Tree ===
    const treeData = [
      {
        id: 'root',
        label: 'Root Account',
        sub: '전체 관리자',
        x: 350,
        y: 20,
        w: 120,
        h: 50,
        color: '#DD344C',
      },
      {
        id: 'users',
        label: 'IAM Users',
        sub: '개발자, 운영자',
        x: 80,
        y: 120,
        w: 110,
        h: 50,
        color: '#ED7100',
      },
      {
        id: 'groups',
        label: 'IAM Groups',
        sub: 'dev-team, ops',
        x: 260,
        y: 120,
        w: 110,
        h: 50,
        color: '#FF9900',
      },
      {
        id: 'roles',
        label: 'IAM Roles',
        sub: 'EC2, Lambda용',
        x: 440,
        y: 120,
        w: 110,
        h: 50,
        color: '#00A4A6',
      },
      {
        id: 'policies',
        label: 'IAM Policies',
        sub: 'JSON 권한 문서',
        x: 620,
        y: 120,
        w: 120,
        h: 50,
        color: '#8C4FFF',
      },
    ];

    const treeLinks = [
      { from: 'root', to: 'users' },
      { from: 'root', to: 'groups' },
      { from: 'root', to: 'roles' },
      { from: 'root', to: 'policies' },
    ];

    // Draw links
    treeLinks.forEach((link) => {
      const from = treeData.find((n) => n.id === link.from);
      const to = treeData.find((n) => n.id === link.to);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', from.x + from.w / 2);
      line.setAttribute('y1', from.y + from.h);
      line.setAttribute('x2', to.x + to.w / 2);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', '#4a4a6a');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '4,3');
      svg.appendChild(line);
    });

    // Draw nodes
    treeData.forEach((node) => {
      const g = document.createElementNS(svgNS, 'g');
      g.className = 'iam-node';

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', node.x);
      rect.setAttribute('y', node.y);
      rect.setAttribute('width', node.w);
      rect.setAttribute('height', node.h);
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', node.color);
      rect.setAttribute('opacity', '0.85');
      g.appendChild(rect);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', node.x + node.w / 2);
      label.setAttribute('y', node.y + 20);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '11');
      label.setAttribute('font-weight', '700');
      label.textContent = node.label;
      g.appendChild(label);

      const sub = document.createElementNS(svgNS, 'text');
      sub.setAttribute('x', node.x + node.w / 2);
      sub.setAttribute('y', node.y + 38);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('font-size', '9');
      sub.setAttribute('opacity', '0.8');
      sub.textContent = node.sub;
      g.appendChild(sub);

      svg.appendChild(g);
    });

    // === Policy Evaluation Flow ===
    const flowY = 220;
    const flowTitle = document.createElementNS(svgNS, 'text');
    flowTitle.setAttribute('x', svgW / 2);
    flowTitle.setAttribute('y', flowY);
    flowTitle.setAttribute('text-anchor', 'middle');
    flowTitle.setAttribute('font-size', '14');
    flowTitle.setAttribute('font-weight', '700');
    flowTitle.setAttribute('fill', '#e0e0e0');
    flowTitle.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    flowTitle.textContent = '정책 평가 흐름 (Policy Evaluation)';
    svg.appendChild(flowTitle);

    const flowSteps = [
      {
        label: '요청',
        sub: 'API Call',
        color: '#a0a0b0',
        x: 40,
        y: flowY + 30,
      },
      {
        label: '인증',
        sub: 'Authentication',
        color: '#ED7100',
        x: 190,
        y: flowY + 30,
      },
      {
        label: '정책 수집',
        sub: 'Gather Policies',
        color: '#8C4FFF',
        x: 340,
        y: flowY + 30,
      },
      {
        label: '평가',
        sub: 'Evaluate',
        color: '#FF9900',
        x: 490,
        y: flowY + 30,
      },
      {
        label: '허용/거부',
        sub: 'Allow or Deny',
        color: '#3F8624',
        x: 640,
        y: flowY + 30,
      },
    ];

    const stepW = 120;
    const stepH = 60;

    // Flow arrows
    for (let i = 0; i < flowSteps.length - 1; i++) {
      const from = flowSteps[i];
      const to = flowSteps[i + 1];
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', from.x + stepW);
      line.setAttribute('y1', from.y + stepH / 2);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y + stepH / 2);
      line.setAttribute('stroke', '#4a4a6a');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('class', `flow-step-${i}`);
      svg.appendChild(line);
    }

    // Flow step nodes
    const flowNodes = [];
    flowSteps.forEach((step, i) => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', `flow-node flow-node-${i}`);

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', step.x);
      rect.setAttribute('y', step.y);
      rect.setAttribute('width', stepW);
      rect.setAttribute('height', stepH);
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', step.color);
      rect.setAttribute('opacity', '0.3');
      g.appendChild(rect);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', step.x + stepW / 2);
      label.setAttribute('y', step.y + 24);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '12');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', step.color);
      label.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      label.textContent = step.label;
      g.appendChild(label);

      const sub = document.createElementNS(svgNS, 'text');
      sub.setAttribute('x', step.x + stepW / 2);
      sub.setAttribute('y', step.y + 44);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('font-size', '9');
      sub.setAttribute('fill', '#a0a0b0');
      sub.textContent = step.sub;
      g.appendChild(sub);

      svg.appendChild(g);
      flowNodes.push({ g, rect });
    });

    // Evaluation rules summary
    const rulesY = flowY + 120;
    const rules = [
      {
        label: '기본 거부 (Implicit Deny)',
        desc: '명시적 허용이 없으면 거부',
        color: '#DD344C',
      },
      {
        label: '명시적 허용 (Explicit Allow)',
        desc: 'Policy에 Allow가 있으면 허용',
        color: '#3F8624',
      },
      {
        label: '명시적 거부 (Explicit Deny)',
        desc: 'Deny는 Allow보다 항상 우선',
        color: '#DD344C',
      },
    ];

    rules.forEach((rule, i) => {
      const ruleG = document.createElementNS(svgNS, 'g');
      const rX = 80 + i * 240;
      const rY = rulesY;

      const bg = document.createElementNS(svgNS, 'rect');
      bg.setAttribute('x', rX);
      bg.setAttribute('y', rY);
      bg.setAttribute('width', 210);
      bg.setAttribute('height', 60);
      bg.setAttribute('rx', '6');
      bg.setAttribute('fill', rule.color);
      bg.setAttribute('opacity', '0.12');
      bg.setAttribute('stroke', rule.color);
      bg.setAttribute('stroke-width', '1');
      bg.setAttribute('stroke-opacity', '0.4');
      ruleG.appendChild(bg);

      const title = document.createElementNS(svgNS, 'text');
      title.setAttribute('x', rX + 105);
      title.setAttribute('y', rY + 22);
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('font-size', '11');
      title.setAttribute('font-weight', '700');
      title.setAttribute('fill', rule.color);
      title.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      title.textContent = rule.label;
      ruleG.appendChild(title);

      const desc = document.createElementNS(svgNS, 'text');
      desc.setAttribute('x', rX + 105);
      desc.setAttribute('y', rY + 44);
      desc.setAttribute('text-anchor', 'middle');
      desc.setAttribute('font-size', '9');
      desc.setAttribute('fill', '#a0a0b0');
      desc.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      desc.textContent = rule.desc;
      ruleG.appendChild(desc);

      svg.appendChild(ruleG);
    });

    container.appendChild(svg);

    // Store flow nodes for animation
    state._flowNodes = flowNodes;
    state._flowSteps = flowSteps;
  }

  function resetAnim() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
    state.step = -1;
    render();
    const playBtn = document.getElementById('iam-play');
    if (playBtn) playBtn.textContent = '▶ 정책 평가 흐름';
  }

  function playAnimation() {
    if (state.playing) {
      resetAnim();
      return;
    }
    state.playing = true;
    const playBtn = document.getElementById('iam-play');
    if (playBtn) playBtn.textContent = '⏸ 일시정지';

    const nodes = state._flowNodes;
    const steps = state._flowSteps;
    if (!nodes || !steps) return;

    nodes.forEach((n) => {
      n.rect.setAttribute('opacity', '0.15');
    });

    steps.forEach((_, i) => {
      const t = setTimeout(() => {
        nodes[i].rect.setAttribute('opacity', '0.8');
        nodes[i].rect.setAttribute(
          'filter',
          `drop-shadow(0 0 8px ${steps[i].color})`,
        );
        if (i > 0) {
          nodes[i - 1].rect.removeAttribute('filter');
          nodes[i - 1].rect.setAttribute('opacity', '0.5');
        }
        if (i === steps.length - 1) {
          setTimeout(() => {
            state.playing = false;
            if (playBtn) playBtn.textContent = '▶ 정책 평가 흐름';
            window.__awsProgress?.save('section-iam');
          }, 600);
        }
      }, i * 700);
      state.timers.push(t);
    });
  }

  // Compare mode
  const compareBtn = document.getElementById('iam-compare-btn');
  const compareContainer = document.getElementById('iam-compare-container');

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
        <div class="compare-panel-title">✅ 최소 권한 원칙</div>
        <pre style="background:var(--bg-card);padding:12px;border-radius:6px;font-size:0.8rem;color:var(--storage-color);overflow-x:auto;white-space:pre">{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject"
  ],
  "Resource": "arn:aws:s3:::my-bucket/reports/*"
}</pre>
        <p style="margin-top:10px;font-size:0.85rem;color:var(--text-secondary)">
          <strong style="color:var(--storage-color)">특정 버킷의 특정 경로</strong>에만 읽기 권한을 부여.<br>
          피해 범위가 최소화되어 보안 사고 시 영향 제한적.
        </p>
      </div>
      <div class="compare-panel compare-panel-b">
        <div class="compare-panel-title">⚠ 과도한 권한</div>
        <pre style="background:var(--bg-card);padding:12px;border-radius:6px;font-size:0.8rem;color:var(--security-color);overflow-x:auto;white-space:pre">{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}</pre>
        <p style="margin-top:10px;font-size:0.85rem;color:var(--text-secondary)">
          <strong style="color:var(--security-color)">모든 S3 버킷에 모든 작업</strong> 허용.<br>
          자격 증명 유출 시 전체 데이터 삭제/유출 위험.
        </p>
      </div>
    `;
  }

  // Controls
  const playBtn = document.getElementById('iam-play');
  const resetBtn = document.getElementById('iam-reset');
  if (playBtn) playBtn.addEventListener('click', playAnimation);
  if (resetBtn) resetBtn.addEventListener('click', resetAnim);

  render();
}
