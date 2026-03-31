// ===== GitHub Flow Cycle Visualization =====

export function initGithubFlow() {
  const container = document.getElementById('github-flow-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const stages = [
    {
      id: 'fork',
      label: 'Fork',
      desc: '원본 저장소를 내 계정에 복사',
      icon: '🍴',
      color: '#4fc3f7',
      detail:
        'GitHub에서 Fork 버튼 클릭 → 내 계정에 독립적인 복사본 생성. 원본에 직접 push 권한이 없어도 기여 가능.',
    },
    {
      id: 'branch',
      label: 'Branch',
      desc: '기능 브랜치 생성',
      icon: '⑂',
      color: '#81c784',
      detail:
        'main 브랜치를 보호하고, feature/fix 브랜치에서 독립적으로 작업. 브랜치 이름은 목적을 명확히 (feature/login, fix/typo).',
    },
    {
      id: 'commit',
      label: 'Commit',
      desc: '변경사항 커밋',
      icon: '●',
      color: '#ffb74d',
      detail:
        '작은 단위로 자주 커밋. 커밋 메시지는 Conventional Commits 형식 권장: feat:, fix:, docs:, refactor: 등.',
    },
    {
      id: 'push',
      label: 'Push',
      desc: '원격에 업로드',
      icon: '⤒',
      color: '#ce93d8',
      detail:
        'git push origin feature/branch → 원격 저장소에 브랜치 업로드. PR 생성 전 필수 단계.',
    },
    {
      id: 'pr',
      label: 'Pull Request',
      desc: 'PR 생성 & 논의',
      icon: '⇄',
      color: '#e94560',
      detail:
        'GitHub에서 PR 생성 → 변경 내용 설명, 리뷰어 지정. CI/CD 파이프라인 자동 실행. 토론과 수정 반복.',
    },
    {
      id: 'review',
      label: 'Review',
      desc: '코드 리뷰 & 승인',
      icon: '✓',
      color: '#ffd54f',
      detail:
        '리뷰어가 코드 검토: Approve / Request Changes / Comment. 최소 1명 승인 후 머지 가능 (Branch Protection Rules).',
    },
    {
      id: 'merge',
      label: 'Merge',
      desc: 'main에 병합',
      icon: '⊕',
      color: '#26a69a',
      detail:
        'Squash and Merge / Rebase and Merge / Create a Merge Commit 중 선택. 머지 후 feature 브랜치 삭제.',
    },
  ];

  const state = {
    activeStage: 0,
    playing: false,
    speed: 1,
    timer: null,
  };

  // Controls
  const playBtn = document.getElementById('ghflow-play');
  const stepBtn = document.getElementById('ghflow-step');
  const resetBtn = document.getElementById('ghflow-reset');
  const speedSlider = document.getElementById('ghflow-speed');
  const speedVal = document.getElementById('ghflow-speed-val');

  speedSlider?.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    speedVal.textContent = state.speed + 'x';
  });

  playBtn?.addEventListener('click', () => {
    if (state.playing) return;
    state.playing = true;
    autoStep();
  });

  stepBtn?.addEventListener('click', () => {
    state.activeStage = (state.activeStage + 1) % stages.length;
    render();
  });

  resetBtn?.addEventListener('click', () => {
    state.activeStage = 0;
    state.playing = false;
    clearTimeout(state.timer);
    render();
  });

  function autoStep() {
    if (!state.playing) return;
    state.activeStage = (state.activeStage + 1) % stages.length;
    render();
    if (state.activeStage === 0) {
      state.playing = false;
      return;
    }
    state.timer = setTimeout(autoStep, 1500 / state.speed);
  }

  function render() {
    container.innerHTML = '';

    // SVG Cycle Diagram
    const svgW = 700;
    const svgH = 420;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.maxWidth = svgW + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    const cx = svgW / 2;
    const cy = svgH / 2 - 10;
    const rx = 240;
    const ry = 150;

    // Draw connecting arrows between stages
    stages.forEach((stage, i) => {
      const angle1 = (2 * Math.PI * i) / stages.length - Math.PI / 2;
      const angle2 =
        (2 * Math.PI * ((i + 1) % stages.length)) / stages.length - Math.PI / 2;

      const x1 = cx + rx * Math.cos(angle1);
      const y1 = cy + ry * Math.sin(angle1);
      const x2 = cx + rx * Math.cos(angle2);
      const y2 = cy + ry * Math.sin(angle2);

      // Curved arrow path
      const midAngle = (angle1 + angle2) / 2;
      const bulge = 0.15;
      const mx = cx + rx * (1 + bulge) * Math.cos(midAngle);
      const my = cy + ry * (1 + bulge) * Math.sin(midAngle);

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
      path.setAttribute(
        'stroke',
        i <= state.activeStage ? stage.color : '#333',
      );
      path.setAttribute('stroke-width', i <= state.activeStage ? '2.5' : '1.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', i <= state.activeStage ? '0.8' : '0.3');
      svg.appendChild(path);
    });

    // Draw stage nodes
    stages.forEach((stage, i) => {
      const angle = (2 * Math.PI * i) / stages.length - Math.PI / 2;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      const isActive = i === state.activeStage;
      const isPast = i < state.activeStage;

      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', `ghflow-stage ${isActive ? 'active-stage' : ''}`);
      g.style.cursor = 'pointer';

      // Background circle
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', isActive ? 36 : 30);
      circle.setAttribute('fill', isPast || isActive ? stage.color : '#1a1a2e');
      circle.setAttribute('stroke', stage.color);
      circle.setAttribute('stroke-width', isActive ? '3' : '1.5');
      circle.setAttribute('opacity', isPast || isActive ? '0.9' : '0.5');
      g.appendChild(circle);

      // Step number
      const num = document.createElementNS(svgNS, 'text');
      num.setAttribute('x', x);
      num.setAttribute('y', y - 4);
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('font-size', isActive ? '16' : '14');
      num.setAttribute('fill', isPast || isActive ? '#1a1a2e' : stage.color);
      num.setAttribute('font-weight', '700');
      num.textContent = stage.icon;
      g.appendChild(num);

      // Label
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', y + 14);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', isPast || isActive ? '#1a1a2e' : '#a0a0b0');
      label.textContent = stage.label;
      g.appendChild(label);

      // Description below node
      const desc = document.createElementNS(svgNS, 'text');
      const descY = y > cy ? y + 50 : y - 46;
      desc.setAttribute('x', x);
      desc.setAttribute('y', descY);
      desc.setAttribute('text-anchor', 'middle');
      desc.setAttribute('font-size', '11');
      desc.setAttribute('fill', '#a0a0b0');
      desc.textContent = stage.desc;
      g.appendChild(desc);

      g.addEventListener('click', () => {
        state.activeStage = i;
        render();
      });

      svg.appendChild(g);
    });

    // Center title
    const title = document.createElementNS(svgNS, 'text');
    title.setAttribute('x', cx);
    title.setAttribute('y', cy - 5);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '14');
    title.setAttribute('fill', '#fff');
    title.setAttribute('font-weight', '600');
    title.textContent = 'GitHub Flow';
    svg.appendChild(title);

    const subtitle = document.createElementNS(svgNS, 'text');
    subtitle.setAttribute('x', cx);
    subtitle.setAttribute('y', cy + 14);
    subtitle.setAttribute('text-anchor', 'middle');
    subtitle.setAttribute('font-size', '10');
    subtitle.setAttribute('fill', '#a0a0b0');
    subtitle.textContent = '협업 사이클';
    svg.appendChild(subtitle);

    container.appendChild(svg);

    // Detail card for active stage
    const activeStage = stages[state.activeStage];
    const detailCard = document.createElement('div');
    detailCard.className = 'obj-detail-card';
    detailCard.innerHTML = `
      <h4 style="color:${activeStage.color};">
        ${activeStage.icon} ${activeStage.label}: ${activeStage.desc}
      </h4>
      <p style="color:#a0a0b0; font-size:0.85rem; line-height:1.6;">${activeStage.detail}</p>
    `;
    container.appendChild(detailCard);

    // Step indicator
    const indicator = document.createElement('div');
    indicator.style.cssText =
      'display:flex; justify-content:center; gap:8px; margin-top:12px;';
    stages.forEach((s, i) => {
      const dot = document.createElement('div');
      dot.style.cssText = `width:10px; height:10px; border-radius:50%; cursor:pointer; transition: all 0.2s;
        background: ${i === state.activeStage ? s.color : i < state.activeStage ? s.color : '#333'};
        ${i <= state.activeStage ? 'opacity:1;' : 'opacity:0.4;'}`;
      dot.addEventListener('click', () => {
        state.activeStage = i;
        render();
      });
      indicator.appendChild(dot);
    });
    container.appendChild(indicator);
  }

  render();

  if (window.__gitProgress) {
    window.__gitProgress.save('section-github-flow');
  }
}
