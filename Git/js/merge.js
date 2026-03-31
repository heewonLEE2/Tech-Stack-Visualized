// ===== Merge & Rebase Visualization =====

export function initMerge() {
  const container = document.getElementById('merge-container');
  const compareContainer = document.getElementById('merge-compare-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  // State
  const state = {
    mode: 'ff', // 'ff' | '3way' | 'rebase'
    step: 0,
    maxStep: 0,
    playing: false,
    speed: 1,
    timer: null,
  };

  // mode buttons
  const modeBtns = document.querySelectorAll('[data-merge-mode]');
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mergeMode;
      state.step = 0;
      render();
    });
  });

  // playback controls
  const playBtn = document.getElementById('merge-play');
  const stepBtn = document.getElementById('merge-step');
  const resetBtn = document.getElementById('merge-reset');
  const speedSlider = document.getElementById('merge-speed');
  const speedVal = document.getElementById('merge-speed-val');
  const compareBtn = document.getElementById('merge-compare-btn');

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

  compareBtn?.addEventListener('click', () => {
    compareBtn.classList.toggle('active');
    const isCompare = compareBtn.classList.contains('active');
    container.style.display = isCompare ? 'none' : '';
    compareContainer.style.display = isCompare ? 'grid' : 'none';
    if (isCompare) renderCompare();
  });

  function autoStep() {
    if (!state.playing || state.step >= state.maxStep) {
      state.playing = false;
      return;
    }
    state.step++;
    render();
    state.timer = setTimeout(autoStep, 1200 / state.speed);
  }

  // Scenario definitions
  function getScenario(mode) {
    if (mode === 'ff') {
      return {
        title: 'Fast-Forward Merge',
        steps: [
          {
            desc: '초기 상태: main에서 feature 분기',
            commits: [
              { id: 'C0', x: 0, y: 0, branch: 'main' },
              { id: 'C1', x: 1, y: 0, branch: 'main' },
              { id: 'C2', x: 2, y: 0, branch: 'feature' },
              { id: 'C3', x: 3, y: 0, branch: 'feature' },
            ],
            branches: {
              main: { head: 'C1', color: '#81c784' },
              feature: { head: 'C3', color: '#ffb74d' },
            },
            head: 'main',
          },
          {
            desc: 'git merge feature → main 포인터가 앞으로 이동',
            commits: [
              { id: 'C0', x: 0, y: 0, branch: 'main' },
              { id: 'C1', x: 1, y: 0, branch: 'main' },
              { id: 'C2', x: 2, y: 0, branch: 'main' },
              { id: 'C3', x: 3, y: 0, branch: 'main' },
            ],
            branches: {
              main: { head: 'C3', color: '#81c784' },
              feature: { head: 'C3', color: '#ffb74d' },
            },
            head: 'main',
            highlight: 'C3',
          },
          {
            desc: '완료! merge commit 없이 포인터만 이동 (Fast-Forward)',
            commits: [
              { id: 'C0', x: 0, y: 0, branch: 'main' },
              { id: 'C1', x: 1, y: 0, branch: 'main' },
              { id: 'C2', x: 2, y: 0, branch: 'main' },
              { id: 'C3', x: 3, y: 0, branch: 'main' },
            ],
            branches: { main: { head: 'C3', color: '#81c784' } },
            head: 'main',
          },
        ],
      };
    } else if (mode === '3way') {
      return {
        title: '3-Way Merge',
        steps: [
          {
            desc: '초기: main과 feature가 각각 커밋을 진행 (분기 발생)',
            commits: [
              { id: 'C0', x: 0, y: 0 },
              { id: 'C1', x: 1, y: 0 },
              { id: 'C2', x: 2, y: -1, branch: 'feature' },
              { id: 'C3', x: 2, y: 0, branch: 'main' },
              { id: 'C4', x: 3, y: -1, branch: 'feature' },
            ],
            branches: {
              main: { head: 'C3', color: '#81c784', y: 0 },
              feature: { head: 'C4', color: '#ffb74d', y: -1 },
            },
            head: 'main',
            edges: [
              ['C0', 'C1'],
              ['C1', 'C2'],
              ['C1', 'C3'],
              ['C2', 'C4'],
            ],
          },
          {
            desc: 'git merge feature → 공통 조상(C1) 기준으로 3-way 비교',
            commits: [
              { id: 'C0', x: 0, y: 0 },
              { id: 'C1', x: 1, y: 0, highlight: true },
              { id: 'C2', x: 2, y: -1, branch: 'feature' },
              { id: 'C3', x: 2, y: 0, branch: 'main' },
              { id: 'C4', x: 3, y: -1, branch: 'feature' },
            ],
            branches: {
              main: { head: 'C3', color: '#81c784', y: 0 },
              feature: { head: 'C4', color: '#ffb74d', y: -1 },
            },
            head: 'main',
            edges: [
              ['C0', 'C1'],
              ['C1', 'C2'],
              ['C1', 'C3'],
              ['C2', 'C4'],
            ],
            annotation: { id: 'C1', text: '공통 조상' },
          },
          {
            desc: 'Merge commit(M) 생성 → 두 부모를 가리킴',
            commits: [
              { id: 'C0', x: 0, y: 0 },
              { id: 'C1', x: 1, y: 0 },
              { id: 'C2', x: 2, y: -1, branch: 'feature' },
              { id: 'C3', x: 2, y: 0, branch: 'main' },
              { id: 'C4', x: 3, y: -1, branch: 'feature' },
              { id: 'M', x: 4, y: 0, branch: 'main', isMerge: true },
            ],
            branches: {
              main: { head: 'M', color: '#81c784', y: 0 },
              feature: { head: 'C4', color: '#ffb74d', y: -1 },
            },
            head: 'main',
            edges: [
              ['C0', 'C1'],
              ['C1', 'C2'],
              ['C1', 'C3'],
              ['C2', 'C4'],
              ['C3', 'M'],
              ['C4', 'M'],
            ],
            highlight: 'M',
          },
        ],
      };
    } else {
      // rebase
      return {
        title: 'Rebase',
        steps: [
          {
            desc: '초기: feature 브랜치에서 작업 진행',
            commits: [
              { id: 'C0', x: 0, y: 0 },
              { id: 'C1', x: 1, y: 0 },
              { id: 'C2', x: 2, y: -1, branch: 'feature' },
              { id: 'C3', x: 2, y: 0, branch: 'main' },
              { id: 'C4', x: 3, y: -1, branch: 'feature' },
            ],
            branches: {
              main: { head: 'C3', color: '#81c784', y: 0 },
              feature: { head: 'C4', color: '#ffb74d', y: -1 },
            },
            head: 'feature',
            edges: [
              ['C0', 'C1'],
              ['C1', 'C2'],
              ['C1', 'C3'],
              ['C2', 'C4'],
            ],
          },
          {
            desc: 'git rebase main → feature 커밋을 main 끝으로 재적용',
            commits: [
              { id: 'C0', x: 0, y: 0 },
              { id: 'C1', x: 1, y: 0 },
              { id: 'C2', x: 2, y: -1, branch: 'old', ghost: true },
              { id: 'C3', x: 2, y: 0, branch: 'main' },
              { id: 'C4', x: 3, y: -1, branch: 'old', ghost: true },
              { id: "C2'", x: 3, y: 0, branch: 'feature' },
              { id: "C4'", x: 4, y: 0, branch: 'feature' },
            ],
            branches: {
              main: { head: 'C3', color: '#81c784', y: 0 },
              feature: { head: "C4'", color: '#ffb74d', y: 0 },
            },
            head: 'feature',
            edges: [
              ['C0', 'C1'],
              ['C1', 'C3'],
              ['C3', "C2'"],
              ["C2'", "C4'"],
            ],
            ghostEdges: [
              ['C1', 'C2'],
              ['C2', 'C4'],
            ],
          },
          {
            desc: '완료! 히스토리가 일직선으로 깔끔하게 정리됨',
            commits: [
              { id: 'C0', x: 0, y: 0 },
              { id: 'C1', x: 1, y: 0 },
              { id: 'C3', x: 2, y: 0, branch: 'main' },
              { id: "C2'", x: 3, y: 0, branch: 'feature' },
              { id: "C4'", x: 4, y: 0, branch: 'feature' },
            ],
            branches: {
              main: { head: 'C3', color: '#81c784', y: 0 },
              feature: { head: "C4'", color: '#ffb74d', y: 0 },
            },
            head: 'feature',
            edges: [
              ['C0', 'C1'],
              ['C1', 'C3'],
              ['C3', "C2'"],
              ["C2'", "C4'"],
            ],
          },
        ],
      };
    }
  }

  function render() {
    const scenario = getScenario(state.mode);
    state.maxStep = scenario.steps.length - 1;
    const currentStep = scenario.steps[Math.min(state.step, state.maxStep)];

    container.innerHTML = '';

    // Title & description
    const header = document.createElement('div');
    header.style.cssText = 'text-align:center; margin-bottom:16px;';
    header.innerHTML = `
      <h3 style="color:#fff; margin-bottom:4px;">${scenario.title}</h3>
      <p style="color:#a0a0b0; font-size:0.85rem;">
        단계 ${Math.min(state.step, state.maxStep) + 1}/${scenario.steps.length}: ${currentStep.desc}
      </p>`;
    container.appendChild(header);

    // SVG
    const nodeR = 20;
    const gapX = 100;
    const gapY = 80;
    const padX = 80;
    const padY = 60;

    const allCommits = currentStep.commits;
    const maxX = Math.max(...allCommits.map((c) => c.x));
    const allYs = allCommits.map((c) => c.y || 0);
    const minY = Math.min(...allYs, 0);
    const maxY = Math.max(...allYs, 0);

    const svgW = padX * 2 + maxX * gapX + 160;
    const svgH = padY * 2 + (maxY - minY) * gapY + 80;
    const originY = padY + 30 + -minY * gapY;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.maxWidth = svgW + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    // Helper: get pixel position of commit
    function pos(id) {
      const c = allCommits.find((cc) => cc.id === id);
      if (!c) return { x: 0, y: 0 };
      return { x: padX + c.x * gapX, y: originY + (c.y || 0) * gapY };
    }

    // Draw edges
    const edges = currentStep.edges || [];
    if (edges.length === 0) {
      // Auto-compute linear edges
      for (let i = 1; i < allCommits.length; i++) {
        const p1 = pos(allCommits[i - 1].id);
        const p2 = pos(allCommits[i].id);
        drawEdge(svg, p1, p2, '#555', false);
      }
    } else {
      edges.forEach(([from, to]) => {
        const p1 = pos(from);
        const p2 = pos(to);
        drawEdge(svg, p1, p2, '#555', false);
      });
    }

    // Ghost edges (for rebase)
    if (currentStep.ghostEdges) {
      currentStep.ghostEdges.forEach(([from, to]) => {
        const p1 = pos(from);
        const p2 = pos(to);
        drawEdge(svg, p1, p2, '#555', true);
      });
    }

    // Draw commit nodes
    allCommits.forEach((c) => {
      const p = pos(c.id);
      const isGhost = c.ghost;
      const isHighlight = c.id === currentStep.highlight || c.highlight;
      const isMerge = c.isMerge;

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', isMerge ? 24 : nodeR);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');

      if (isGhost) {
        circle.setAttribute('fill', '#555');
        circle.setAttribute('opacity', '0.3');
        circle.setAttribute('stroke-dasharray', '4,3');
      } else if (isMerge) {
        circle.setAttribute('fill', '#e94560');
        circle.setAttribute('class', 'commit-node animating');
      } else if (isHighlight) {
        circle.setAttribute('fill', '#ffd54f');
        circle.setAttribute('class', 'commit-node animating');
      } else {
        const branchInfo = Object.values(currentStep.branches).find(
          (b) => b.y === (c.y || 0),
        );
        circle.setAttribute('fill', branchInfo ? branchInfo.color : '#4fc3f7');
      }
      svg.appendChild(circle);

      // ID label
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', p.x);
      text.setAttribute('y', p.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', isGhost ? '#777' : '#1a1a2e');
      text.textContent = c.id;
      svg.appendChild(text);
    });

    // Annotation
    if (currentStep.annotation) {
      const p = pos(currentStep.annotation.id);
      const annY = p.y + nodeR + 30;
      const annRect = document.createElementNS(svgNS, 'rect');
      annRect.setAttribute('x', p.x - 35);
      annRect.setAttribute('y', annY - 12);
      annRect.setAttribute('width', 70);
      annRect.setAttribute('height', 20);
      annRect.setAttribute('rx', '4');
      annRect.setAttribute('fill', '#ffd54f');
      annRect.setAttribute('opacity', '0.9');
      svg.appendChild(annRect);

      const annText = document.createElementNS(svgNS, 'text');
      annText.setAttribute('x', p.x);
      annText.setAttribute('y', annY + 3);
      annText.setAttribute('text-anchor', 'middle');
      annText.setAttribute('font-size', '10');
      annText.setAttribute('font-weight', '600');
      annText.setAttribute('fill', '#1a1a2e');
      annText.textContent = currentStep.annotation.text;
      svg.appendChild(annText);
    }

    // Branch labels
    Object.entries(currentStep.branches).forEach(([name, branch]) => {
      const p = pos(branch.head);
      const labelY = p.y - (branch.y === 0 ? nodeR + 14 : -(nodeR + 14));
      const aboveNode = branch.y <= 0;
      const ly = aboveNode ? p.y - nodeR - 14 : p.y + nodeR + 26;

      const labelW = name.length * 7 + 16;
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', p.x - labelW / 2);
      rect.setAttribute('y', ly - 10);
      rect.setAttribute('width', labelW);
      rect.setAttribute('height', 18);
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', branch.color);
      svg.appendChild(rect);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', p.x);
      label.setAttribute('y', ly + 3);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', '#1a1a2e');
      label.textContent = name;
      svg.appendChild(label);
    });

    // HEAD
    if (currentStep.head) {
      const headBranch = currentStep.branches[currentStep.head];
      if (headBranch) {
        const p = pos(headBranch.head);
        const hy = p.y - nodeR - 40;

        const hRect = document.createElementNS(svgNS, 'rect');
        hRect.setAttribute('x', p.x - 24);
        hRect.setAttribute('y', hy - 8);
        hRect.setAttribute('width', 48);
        hRect.setAttribute('height', 18);
        hRect.setAttribute('rx', '5');
        hRect.setAttribute('fill', '#e94560');
        svg.appendChild(hRect);

        const hText = document.createElementNS(svgNS, 'text');
        hText.setAttribute('x', p.x);
        hText.setAttribute('y', hy + 6);
        hText.setAttribute('text-anchor', 'middle');
        hText.setAttribute('font-size', '9');
        hText.setAttribute('font-weight', '700');
        hText.setAttribute('fill', '#fff');
        hText.textContent = 'HEAD';
        svg.appendChild(hText);
      }
    }

    container.appendChild(svg);
  }

  function drawEdge(svg, p1, p2, color, isDash) {
    if (Math.abs(p1.y - p2.y) < 2) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x);
      line.setAttribute('y2', p2.y);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '2');
      if (isDash) line.setAttribute('stroke-dasharray', '5,4');
      if (isDash) line.setAttribute('opacity', '0.3');
      svg.appendChild(line);
    } else {
      const midX = (p1.x + p2.x) / 2;
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute(
        'd',
        `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`,
      );
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      if (isDash) path.setAttribute('stroke-dasharray', '5,4');
      if (isDash) path.setAttribute('opacity', '0.3');
      svg.appendChild(path);
    }
  }

  function renderCompare() {
    if (!compareContainer) return;
    compareContainer.innerHTML = '';

    // Merge panel
    const panelA = document.createElement('div');
    panelA.className = 'compare-panel compare-panel-a';
    panelA.innerHTML =
      '<div class="compare-panel-title">Merge (히스토리 보존)</div>';
    const mergeViz = createMiniGraph('3way');
    panelA.appendChild(mergeViz);

    // Rebase panel
    const panelB = document.createElement('div');
    panelB.className = 'compare-panel compare-panel-b';
    panelB.innerHTML =
      '<div class="compare-panel-title">Rebase (히스토리 정리)</div>';
    const rebaseViz = createMiniGraph('rebase');
    panelB.appendChild(rebaseViz);

    compareContainer.appendChild(panelA);
    compareContainer.appendChild(panelB);
  }

  function createMiniGraph(mode) {
    const scenario = getScenario(mode);
    const lastStep = scenario.steps[scenario.steps.length - 1];
    const commits = lastStep.commits.filter((c) => !c.ghost);

    const svgW = 420;
    const svgH = 180;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';

    const gapX = 70;
    const gapY = 60;
    const padX = 50;
    const minY = Math.min(...commits.map((c) => c.y || 0));
    const originY = 80 + -minY * gapY;

    function pos(id) {
      const c = commits.find((cc) => cc.id === id);
      if (!c) return { x: 0, y: 0 };
      return { x: padX + c.x * gapX, y: originY + (c.y || 0) * gapY };
    }

    // Edges
    (lastStep.edges || []).forEach(([from, to]) => {
      const p1 = pos(from);
      const p2 = pos(to);
      if (p1.x === 0 && p1.y === 0) return;
      if (p2.x === 0 && p2.y === 0) return;
      drawEdge(svg, p1, p2, '#555', false);
    });

    // Nodes
    commits.forEach((c) => {
      const p = pos(c.id);
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', 16);
      circle.setAttribute('fill', c.isMerge ? '#e94560' : '#4fc3f7');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1.5');
      svg.appendChild(circle);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', p.x);
      text.setAttribute('y', p.y + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '9');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', '#1a1a2e');
      text.textContent = c.id;
      svg.appendChild(text);
    });

    return svg;
  }

  render();

  if (window.__gitProgress) {
    window.__gitProgress.save('section-merge');
  }
}
