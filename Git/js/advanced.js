// ===== Advanced Git Commands Visualization =====

export function initAdvanced() {
  const container = document.getElementById('advanced-container');
  if (!container) return;

  // State
  const state = {
    mode: 'reset', // 'reset' | 'revert' | 'cherry-pick' | 'stash'
    resetMode: 'soft', // 'soft' | 'mixed' | 'hard'
    step: 0,
    maxStep: 0,
    playing: false,
    timer: null,
  };

  // Mode buttons
  const advBtns = document.querySelectorAll('[data-adv-mode]');
  advBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      advBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.advMode;
      state.step = 0;
      updateResetModeVisibility();
      render();
    });
  });

  // Reset mode buttons
  const resetModeBtns = document.querySelectorAll('[data-reset-mode]');
  resetModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      resetModeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.resetMode = btn.dataset.resetMode;
      state.step = 0;
      render();
    });
  });

  function updateResetModeVisibility() {
    const row = document.getElementById('reset-mode-row');
    if (row) row.style.display = state.mode === 'reset' ? 'flex' : 'none';
  }

  // Playback
  const playBtn = document.getElementById('adv-play');
  const stepBtn = document.getElementById('adv-step');
  const resetBtn = document.getElementById('adv-reset');

  playBtn?.addEventListener('click', () => {
    if (state.playing) return;
    state.playing = true;
    autoStep();
  });

  stepBtn?.addEventListener('click', () => {
    if (state.step < state.maxStep) {
      state.step++;
      render();
    }
  });

  resetBtn?.addEventListener('click', () => {
    state.step = 0;
    state.playing = false;
    clearTimeout(state.timer);
    render();
  });

  function autoStep() {
    if (!state.playing || state.step >= state.maxStep) {
      state.playing = false;
      return;
    }
    state.step++;
    render();
    state.timer = setTimeout(autoStep, 1500);
  }

  function render() {
    container.innerHTML = '';

    if (state.mode === 'reset') renderReset();
    else if (state.mode === 'revert') renderRevert();
    else if (state.mode === 'cherry-pick') renderCherryPick();
    else if (state.mode === 'stash') renderStash();
  }

  function renderReset() {
    state.maxStep = 1;

    const layers = [
      { name: 'Working Directory', icon: '📂', key: 'wd' },
      { name: 'Staging Area (Index)', icon: '📋', key: 'staging' },
      { name: 'Repository (HEAD)', icon: '📦', key: 'repo' },
    ];

    const before = {
      wd: 'app.js (수정됨), style.css (수정됨)',
      staging: 'app.js (staged), style.css (staged)',
      repo: 'C3: "Add feature" ← HEAD',
    };

    const after = {
      soft: {
        wd: 'app.js (수정됨), style.css (수정됨)',
        staging: 'app.js (staged), style.css (staged)',
        repo: 'C2: "Update" ← HEAD  (C3 커밋만 취소)',
      },
      mixed: {
        wd: 'app.js (수정됨), style.css (수정됨)',
        staging: '(비어있음 — unstaged)',
        repo: 'C2: "Update" ← HEAD  (C3 취소 + unstage)',
      },
      hard: {
        wd: '(원래 상태로 복원 — 변경사항 삭제!)',
        staging: '(비어있음)',
        repo: 'C2: "Update" ← HEAD  (완전 초기화)',
      },
    };

    const resetEffects = {
      soft: { wd: 'safe', staging: 'safe', repo: 'affected' },
      mixed: { wd: 'safe', staging: 'affected', repo: 'affected' },
      hard: { wd: 'affected', staging: 'affected', repo: 'affected' },
    };

    const current = state.step === 0 ? before : after[state.resetMode];
    const effects = state.step === 0 ? null : resetEffects[state.resetMode];

    // Title
    const title = document.createElement('div');
    title.style.cssText = 'text-align:center; margin-bottom:16px;';
    title.innerHTML = `<h3 style="color:#fff;">git reset --${state.resetMode} HEAD~1</h3>
      <p style="color:#a0a0b0; font-size:0.85rem;">${state.step === 0 ? '실행 전' : '실행 후'}</p>`;
    container.appendChild(title);

    // 3-Layer diagram
    const diagram = document.createElement('div');
    diagram.className = 'layer-diagram';

    layers.forEach((layer) => {
      const row = document.createElement('div');
      row.className = `layer-row ${effects ? effects[layer.key] : ''} ${state.step > 0 ? 'shifting' : ''}`;

      const label = document.createElement('div');
      label.className = 'layer-label';
      label.innerHTML = `${layer.icon} ${layer.name}`;

      const content = document.createElement('div');
      content.className = 'layer-content';
      content.textContent = current[layer.key];

      const badge = document.createElement('span');
      if (effects) {
        if (effects[layer.key] === 'affected') {
          badge.textContent = '변경됨';
          badge.style.cssText =
            'color:#ef5350; font-size:0.75rem; font-weight:600; margin-left:8px;';
        } else {
          badge.textContent = '유지';
          badge.style.cssText =
            'color:#81c784; font-size:0.75rem; font-weight:600; margin-left:8px;';
        }
      }

      row.appendChild(label);
      row.appendChild(content);
      row.appendChild(badge);
      diagram.appendChild(row);
    });

    container.appendChild(diagram);

    // Comparison summary
    if (state.step > 0) {
      const summary = document.createElement('div');
      summary.className = 'obj-detail-card';
      const summaries = {
        soft: '<strong>--soft:</strong> 커밋만 취소하고, 변경사항은 staging에 그대로 유지됩니다. 커밋 메시지를 수정하고 싶을 때 유용합니다.',
        mixed:
          '<strong>--mixed (기본값):</strong> 커밋 취소 + staging 초기화. 파일은 Working Directory에 남아있어 다시 선택적으로 add할 수 있습니다.',
        hard: '<strong>--hard:</strong> ⚠️ 모든 변경사항 완전 삭제! 복구하려면 reflog을 사용해야 합니다. 신중하게 사용하세요.',
      };
      summary.innerHTML = `<p style="color:#a0a0b0; font-size:0.85rem;">${summaries[state.resetMode]}</p>`;
      container.appendChild(summary);
    }
  }

  function renderRevert() {
    state.maxStep = 1;

    const title = document.createElement('div');
    title.style.cssText = 'text-align:center; margin-bottom:16px;';
    title.innerHTML = `<h3 style="color:#fff;">git revert HEAD</h3>
      <p style="color:#a0a0b0; font-size:0.85rem;">${state.step === 0 ? '실행 전' : '실행 후'}: 취소하는 새 커밋 생성</p>`;
    container.appendChild(title);

    const svgNS = 'http://www.w3.org/2000/svg';
    const svgW = 600;
    const svgH = 140;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.maxWidth = svgW + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    const commits =
      state.step === 0
        ? [
            { id: 'C1', x: 80 },
            { id: 'C2', x: 220 },
            { id: 'C3', x: 360 },
          ]
        : [
            { id: 'C1', x: 60 },
            { id: 'C2', x: 170 },
            { id: 'C3', x: 280 },
            { id: "C3'", x: 420, isRevert: true },
          ];

    const y = 70;

    commits.forEach((c, i) => {
      if (i > 0) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', commits[i - 1].x + 20);
        line.setAttribute('y1', y);
        line.setAttribute('x2', c.x - 20);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#555');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', c.x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 20);
      circle.setAttribute('fill', c.isRevert ? '#26a69a' : '#ffb74d');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      if (c.isRevert) circle.setAttribute('class', 'commit-node animating');
      svg.appendChild(circle);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', c.x);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', '#1a1a2e');
      text.textContent = c.id;
      svg.appendChild(text);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', c.x);
      label.setAttribute('y', y + 38);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', c.isRevert ? '#26a69a' : '#a0a0b0');
      label.textContent = c.isRevert ? 'Revert "C3"' : '';
      svg.appendChild(label);
    });

    // HEAD label on last commit
    const lastC = commits[commits.length - 1];
    const headRect = document.createElementNS(svgNS, 'rect');
    headRect.setAttribute('x', lastC.x - 24);
    headRect.setAttribute('y', y - 48);
    headRect.setAttribute('width', 48);
    headRect.setAttribute('height', 18);
    headRect.setAttribute('rx', '5');
    headRect.setAttribute('fill', '#e94560');
    svg.appendChild(headRect);

    const headText = document.createElementNS(svgNS, 'text');
    headText.setAttribute('x', lastC.x);
    headText.setAttribute('y', y - 35);
    headText.setAttribute('text-anchor', 'middle');
    headText.setAttribute('font-size', '9');
    headText.setAttribute('font-weight', '700');
    headText.setAttribute('fill', '#fff');
    headText.textContent = 'HEAD';
    svg.appendChild(headText);

    container.appendChild(svg);

    const info = document.createElement('div');
    info.className = 'obj-detail-card';
    info.innerHTML = `<p style="color:#a0a0b0; font-size:0.85rem;">
      <strong>revert</strong>는 히스토리를 변경하지 않고, C3의 변경을 되돌리는 <em>새 커밋</em>을 만듭니다.
      공유 브랜치에서 안전하게 사용할 수 있습니다.
    </p>`;
    container.appendChild(info);
  }

  function renderCherryPick() {
    state.maxStep = 1;

    const title = document.createElement('div');
    title.style.cssText = 'text-align:center; margin-bottom:16px;';
    title.innerHTML = `<h3 style="color:#fff;">git cherry-pick C5</h3>
      <p style="color:#a0a0b0; font-size:0.85rem;">${state.step === 0 ? '실행 전' : '실행 후'}: 다른 브랜치의 특정 커밋만 가져오기</p>`;
    container.appendChild(title);

    const svgNS = 'http://www.w3.org/2000/svg';
    const svgW = 680;
    const svgH = 240;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.maxWidth = svgW + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    // Main branch
    const mainY = 80;
    const featureY = 180;
    const mainCommits =
      state.step === 0
        ? [
            { id: 'C1', x: 80 },
            { id: 'C2', x: 200 },
            { id: 'C3', x: 320 },
          ]
        : [
            { id: 'C1', x: 80 },
            { id: 'C2', x: 180 },
            { id: 'C3', x: 280 },
            { id: "C5'", x: 420, isCherryPick: true },
          ];

    // Feature branch
    const featureCommits = [
      { id: 'C4', x: 320 },
      { id: 'C5', x: 440, isTarget: state.step === 0 },
      { id: 'C6', x: 560 },
    ];

    // Draw main branch line
    mainCommits.forEach((c, i) => {
      if (i > 0) drawLine(svg, mainCommits[i - 1].x, mainY, c.x, mainY, '#555');
      drawCommitNode(
        svg,
        c.x,
        mainY,
        c.id,
        c.isCherryPick ? '#26a69a' : '#81c784',
        c.isCherryPick,
      );
    });

    // Branch line from C2 to C4
    const branchPath = document.createElementNS(svgNS, 'path');
    branchPath.setAttribute(
      'd',
      `M 200 ${mainY} C 250 ${mainY}, 280 ${featureY}, 320 ${featureY}`,
    );
    branchPath.setAttribute('stroke', '#555');
    branchPath.setAttribute('stroke-width', '2');
    branchPath.setAttribute('fill', 'none');
    svg.appendChild(branchPath);

    // Feature branch
    featureCommits.forEach((c, i) => {
      if (i > 0)
        drawLine(svg, featureCommits[i - 1].x, featureY, c.x, featureY, '#555');
      drawCommitNode(
        svg,
        c.x,
        featureY,
        c.id,
        c.isTarget ? '#ffd54f' : '#ffb74d',
        c.isTarget,
      );
    });

    // Cherry-pick arrow
    if (state.step > 0) {
      const dashPath = document.createElementNS(svgNS, 'path');
      dashPath.setAttribute(
        'd',
        `M 440 ${featureY - 20} C 440 ${(mainY + featureY) / 2}, 420 ${(mainY + featureY) / 2}, 420 ${mainY + 20}`,
      );
      dashPath.setAttribute('stroke', '#26a69a');
      dashPath.setAttribute('stroke-width', '2');
      dashPath.setAttribute('stroke-dasharray', '6,3');
      dashPath.setAttribute('fill', 'none');
      svg.appendChild(dashPath);

      const cpLabel = document.createElementNS(svgNS, 'text');
      cpLabel.setAttribute('x', 450);
      cpLabel.setAttribute('y', (mainY + featureY) / 2 + 4);
      cpLabel.setAttribute('font-size', '10');
      cpLabel.setAttribute('fill', '#26a69a');
      cpLabel.setAttribute('font-weight', '600');
      cpLabel.textContent = 'cherry-pick';
      svg.appendChild(cpLabel);
    }

    // Branch labels
    addBranchLabel(
      svg,
      mainCommits[mainCommits.length - 1].x,
      mainY - 34,
      'main',
      '#81c784',
    );
    addBranchLabel(
      svg,
      featureCommits[featureCommits.length - 1].x,
      featureY - 34,
      'feature',
      '#ffb74d',
    );

    container.appendChild(svg);

    function drawLine(svg, x1, y1, x2, y2, color) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
    }

    function drawCommitNode(svg, x, y, id, color, highlight) {
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 18);
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      if (highlight) circle.setAttribute('class', 'commit-node animating');
      svg.appendChild(circle);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', '#1a1a2e');
      text.textContent = id;
      svg.appendChild(text);
    }

    function addBranchLabel(svg, x, y, name, color) {
      const w = name.length * 7 + 14;
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', x - w / 2);
      rect.setAttribute('y', y - 8);
      rect.setAttribute('width', w);
      rect.setAttribute('height', 18);
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', color);
      svg.appendChild(rect);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y + 6);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', '#1a1a2e');
      text.textContent = name;
      svg.appendChild(text);
    }
  }

  function renderStash() {
    state.maxStep = 2;

    const steps = [
      {
        title: 'git stash 전: 작업 중인 변경사항 존재',
        wd: ['app.js (수정됨)', 'style.css (수정됨)'],
        staging: ['utils.js (staged)'],
        stashList: [],
      },
      {
        title: 'git stash 실행: 변경사항을 stash 스택에 임시 저장',
        wd: ['(깨끗함 — HEAD와 동일)'],
        staging: ['(비어있음)'],
        stashList: ['stash@{0}: WIP on main: abc1234 Add feature'],
      },
      {
        title: 'git stash pop: stash에서 복원',
        wd: ['app.js (수정됨)', 'style.css (수정됨)'],
        staging: ['utils.js (staged)'],
        stashList: [],
      },
    ];

    const current = steps[Math.min(state.step, steps.length - 1)];

    const title = document.createElement('div');
    title.style.cssText = 'text-align:center; margin-bottom:16px;';
    title.innerHTML = `<h3 style="color:#fff;">${current.title}</h3>`;
    container.appendChild(title);

    const diagram = document.createElement('div');
    diagram.className = 'layer-diagram';

    // Working Directory
    const wdRow = createLayerRow(
      '📂 Working Directory',
      current.wd,
      state.step === 0 ? 'affected' : state.step === 1 ? 'safe' : 'affected',
    );
    diagram.appendChild(wdRow);

    // Staging Area
    const stgRow = createLayerRow(
      '📋 Staging Area',
      current.staging,
      state.step === 0 ? 'affected' : state.step === 1 ? 'safe' : 'affected',
    );
    diagram.appendChild(stgRow);

    // Stash stack
    const stashRow = createLayerRow(
      '📥 Stash Stack',
      current.stashList.length > 0 ? current.stashList : ['(비어있음)'],
      current.stashList.length > 0 ? 'affected' : 'safe',
    );
    diagram.appendChild(stashRow);

    container.appendChild(diagram);

    function createLayerRow(label, items, status) {
      const row = document.createElement('div');
      row.className = `layer-row ${status}`;

      const labelEl = document.createElement('div');
      labelEl.className = 'layer-label';
      labelEl.textContent = label;

      const content = document.createElement('div');
      content.className = 'layer-content';
      content.textContent = items.join('\n');

      row.appendChild(labelEl);
      row.appendChild(content);
      return row;
    }
  }

  updateResetModeVisibility();
  render();

  if (window.__gitProgress) {
    window.__gitProgress.save('section-advanced');
  }
}
