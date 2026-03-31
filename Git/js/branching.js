// ===== Branching: Commit Graph + Branch/HEAD Pointer Visualization =====

export function initBranching() {
  const container = document.getElementById('branching-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  // State
  const state = {
    commits: [
      { id: 'C0', message: 'Initial commit', x: 0, y: 0, branch: 'main' },
      { id: 'C1', message: 'Add README', x: 1, y: 0, branch: 'main' },
      { id: 'C2', message: 'Add index.js', x: 2, y: 0, branch: 'main' },
    ],
    branches: {
      main: { head: 'C2', color: '#81c784', y: 0 },
    },
    head: 'main',
    nextId: 3,
    branchCount: 0,
    speed: 1,
  };

  const branchNames = [
    'feature/login',
    'feature/api',
    'fix/bug-42',
    'develop',
    'release/v2',
  ];
  const commitMsgs = [
    'Add login form',
    'Fix null check',
    'Update styles',
    'Refactor API',
    'Add tests',
    'Update docs',
    'Fix typo',
    'Add validation',
  ];

  // Controls
  const addCommitBtn = document.getElementById('branch-add-commit');
  const createBranchBtn = document.getElementById('branch-create');
  const switchBranchBtn = document.getElementById('branch-switch');
  const resetBtn = document.getElementById('branch-reset');
  const speedSlider = document.getElementById('branch-speed');
  const speedVal = document.getElementById('branch-speed-val');

  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      state.speed = parseFloat(speedSlider.value);
      speedVal.textContent = state.speed + 'x';
    });
  }

  addCommitBtn?.addEventListener('click', () => {
    const branch = state.branches[state.head];
    if (!branch) return;

    const parentCommit = state.commits.find((c) => c.id === branch.head);
    const maxX = Math.max(...state.commits.map((c) => c.x));

    const newCommit = {
      id: `C${state.nextId++}`,
      message: commitMsgs[Math.floor(Math.random() * commitMsgs.length)],
      x: maxX + 1,
      y: branch.y,
      branch: state.head,
      parent: parentCommit?.id,
    };

    state.commits.push(newCommit);
    branch.head = newCommit.id;
    render();
  });

  createBranchBtn?.addEventListener('click', () => {
    if (state.branchCount >= branchNames.length) return;

    const name = branchNames[state.branchCount];
    const branchColors = [
      '#ffb74d',
      '#ce93d8',
      '#ef5350',
      '#4fc3f7',
      '#ffd54f',
    ];
    const yOffset =
      (state.branchCount + 1) * (state.branchCount % 2 === 0 ? 1 : -1);

    const currentBranch = state.branches[state.head];
    state.branches[name] = {
      head: currentBranch.head,
      color: branchColors[state.branchCount % branchColors.length],
      y: yOffset,
    };

    state.branchCount++;
    state.head = name;
    render();
  });

  switchBranchBtn?.addEventListener('click', () => {
    const names = Object.keys(state.branches);
    const idx = names.indexOf(state.head);
    state.head = names[(idx + 1) % names.length];
    render();
  });

  resetBtn?.addEventListener('click', () => {
    state.commits = [
      { id: 'C0', message: 'Initial commit', x: 0, y: 0, branch: 'main' },
      { id: 'C1', message: 'Add README', x: 1, y: 0, branch: 'main' },
      { id: 'C2', message: 'Add index.js', x: 2, y: 0, branch: 'main' },
    ];
    state.branches = { main: { head: 'C2', color: '#81c784', y: 0 } };
    state.head = 'main';
    state.nextId = 3;
    state.branchCount = 0;
    render();
  });

  function render() {
    container.innerHTML = '';

    const nodeR = 20;
    const gapX = 100;
    const gapY = 80;
    const padX = 80;
    const padY = 50;

    // Compute positions
    const maxX = Math.max(...state.commits.map((c) => c.x));
    const allYs = state.commits.map((c) => c.y);
    const minY = Math.min(...allYs, 0);
    const maxY = Math.max(...allYs, 0);

    const svgW = padX * 2 + maxX * gapX + 200;
    const svgH = padY * 2 + (maxY - minY) * gapY + 120;
    const originY = padY + 50 + -minY * gapY;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.maxWidth = svgW + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    // Draw edges
    state.commits.forEach((c) => {
      if (!c.parent) return;
      const parent = state.commits.find((p) => p.id === c.parent);
      if (!parent) return;

      const x1 = padX + parent.x * gapX;
      const y1 = originY + parent.y * gapY;
      const x2 = padX + c.x * gapX;
      const y2 = originY + c.y * gapY;

      if (y1 === y2) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#555');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      } else {
        const path = document.createElementNS(svgNS, 'path');
        const midX = (x1 + x2) / 2;
        path.setAttribute(
          'd',
          `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
        );
        path.setAttribute('stroke', '#555');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('class', 'branch-line animating');
        svg.appendChild(path);
      }
    });

    // Draw commit nodes
    state.commits.forEach((c) => {
      const x = padX + c.x * gapX;
      const y = originY + c.y * gapY;

      const branchInfo = Object.values(state.branches).find(
        (b) => b.y === c.y,
      ) || { color: '#4fc3f7' };

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', nodeR);
      circle.setAttribute('fill', branchInfo.color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', 'commit-node');
      svg.appendChild(circle);

      // Commit ID
      const idText = document.createElementNS(svgNS, 'text');
      idText.setAttribute('x', x);
      idText.setAttribute('y', y + 5);
      idText.setAttribute('text-anchor', 'middle');
      idText.setAttribute('font-size', '11');
      idText.setAttribute('font-weight', '700');
      idText.setAttribute('fill', '#1a1a2e');
      idText.textContent = c.id;
      svg.appendChild(idText);

      // Commit message (below)
      const msgText = document.createElementNS(svgNS, 'text');
      msgText.setAttribute('x', x);
      msgText.setAttribute('y', y + nodeR + 18);
      msgText.setAttribute('text-anchor', 'middle');
      msgText.setAttribute('font-size', '10');
      msgText.setAttribute('fill', '#a0a0b0');
      const shortMsg =
        c.message.length > 16 ? c.message.substring(0, 16) + '...' : c.message;
      msgText.textContent = shortMsg;
      svg.appendChild(msgText);
    });

    // Draw branch labels & HEAD
    Object.entries(state.branches).forEach(([name, branch]) => {
      const headCommit = state.commits.find((c) => c.id === branch.head);
      if (!headCommit) return;

      const x = padX + headCommit.x * gapX;
      const y = originY + headCommit.y * gapY;
      const labelY = y - nodeR - 14;

      // Branch label box
      const labelWidth = name.length * 7 + 16;
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', x - labelWidth / 2);
      rect.setAttribute('y', labelY - 12);
      rect.setAttribute('width', labelWidth);
      rect.setAttribute('height', 20);
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', branch.color);
      rect.setAttribute('opacity', '0.9');
      svg.appendChild(rect);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', labelY + 3);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', '#1a1a2e');
      label.setAttribute('class', 'branch-label');
      label.textContent = name;
      svg.appendChild(label);

      // HEAD pointer
      if (name === state.head) {
        const headY2 = labelY - 24;
        const headRect = document.createElementNS(svgNS, 'rect');
        headRect.setAttribute('x', x - 24);
        headRect.setAttribute('y', headY2 - 10);
        headRect.setAttribute('width', 48);
        headRect.setAttribute('height', 20);
        headRect.setAttribute('rx', '6');
        headRect.setAttribute('fill', '#e94560');
        headRect.setAttribute('class', 'head-pointer animating');
        svg.appendChild(headRect);

        const headText = document.createElementNS(svgNS, 'text');
        headText.setAttribute('x', x);
        headText.setAttribute('y', headY2 + 5);
        headText.setAttribute('text-anchor', 'middle');
        headText.setAttribute('font-size', '10');
        headText.setAttribute('font-weight', '700');
        headText.setAttribute('fill', '#fff');
        headText.textContent = 'HEAD';
        svg.appendChild(headText);

        // Arrow from HEAD to branch label
        const arrow = document.createElementNS(svgNS, 'line');
        arrow.setAttribute('x1', x);
        arrow.setAttribute('y1', headY2 + 10);
        arrow.setAttribute('x2', x);
        arrow.setAttribute('y2', labelY - 12);
        arrow.setAttribute('stroke', '#e94560');
        arrow.setAttribute('stroke-width', '1.5');
        svg.appendChild(arrow);
      }
    });

    // Info text
    const info = document.createElement('div');
    info.style.cssText =
      'text-align:center; margin-top:12px; font-size:0.85rem; color:#a0a0b0;';
    info.innerHTML = `현재 브랜치: <strong style="color:#e94560">${state.head}</strong> · 
      커밋 수: <strong>${state.commits.length}</strong> · 
      브랜치 수: <strong>${Object.keys(state.branches).length}</strong>`;
    container.appendChild(svg);
    container.appendChild(info);
  }

  render();

  if (window.__gitProgress) {
    window.__gitProgress.save('section-branching');
  }
}
