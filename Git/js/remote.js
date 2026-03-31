// ===== Remote Repository Visualization =====

export function initRemote() {
  const container = document.getElementById('remote-container');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  // State
  const state = {
    localCommits: ['C0', 'C1', 'C2'],
    remoteCommits: ['C0', 'C1', 'C2'],
    localBranch: 'main',
    remoteBranch: 'origin/main',
    trackingRef: 'C2',
    animating: null,
    localNext: 3,
    remoteNext: 3,
  };

  // Controls
  const cloneBtn = document.getElementById('remote-clone');
  const fetchBtn = document.getElementById('remote-fetch');
  const pullBtn = document.getElementById('remote-pull');
  const pushBtn = document.getElementById('remote-push');
  const resetBtn = document.getElementById('remote-reset');

  cloneBtn?.addEventListener('click', () => {
    // Reset to show clone action
    state.localCommits = [];
    state.remoteCommits = ['C0', 'C1', 'C2'];
    state.trackingRef = '';
    render();
    setTimeout(() => {
      state.localCommits = [...state.remoteCommits];
      state.trackingRef = 'C2';
      state.animating = 'clone';
      render();
      setTimeout(() => {
        state.animating = null;
        render();
      }, 1500);
    }, 600);
  });

  fetchBtn?.addEventListener('click', () => {
    if (state.remoteCommits.length <= state.localCommits.length) {
      // Add a remote commit first to show fetch
      state.remoteCommits.push(`R${state.remoteNext++}`);
      render();
    }
    setTimeout(() => {
      state.trackingRef = state.remoteCommits[state.remoteCommits.length - 1];
      state.animating = 'fetch';
      render();
      setTimeout(() => {
        state.animating = null;
        render();
      }, 1200);
    }, 400);
  });

  pullBtn?.addEventListener('click', () => {
    if (state.remoteCommits.length <= state.localCommits.length) {
      state.remoteCommits.push(`R${state.remoteNext++}`);
      render();
    }
    setTimeout(() => {
      const newCommits = state.remoteCommits.filter(
        (c) => !state.localCommits.includes(c),
      );
      state.localCommits.push(...newCommits);
      state.trackingRef = state.remoteCommits[state.remoteCommits.length - 1];
      state.animating = 'pull';
      render();
      setTimeout(() => {
        state.animating = null;
        render();
      }, 1200);
    }, 400);
  });

  pushBtn?.addEventListener('click', () => {
    if (state.localCommits.length <= state.remoteCommits.length) {
      state.localCommits.push(`L${state.localNext++}`);
      render();
    }
    setTimeout(() => {
      const newCommits = state.localCommits.filter(
        (c) => !state.remoteCommits.includes(c),
      );
      state.remoteCommits.push(...newCommits);
      state.trackingRef = state.localCommits[state.localCommits.length - 1];
      state.animating = 'push';
      render();
      setTimeout(() => {
        state.animating = null;
        render();
      }, 1200);
    }, 400);
  });

  resetBtn?.addEventListener('click', () => {
    state.localCommits = ['C0', 'C1', 'C2'];
    state.remoteCommits = ['C0', 'C1', 'C2'];
    state.trackingRef = 'C2';
    state.animating = null;
    state.localNext = 3;
    state.remoteNext = 3;
    render();
  });

  function render() {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'remote-layout';

    // Local panel
    const localPanel = document.createElement('div');
    localPanel.className = 'remote-panel remote-local';
    localPanel.innerHTML = `<div class="remote-panel-title">🖥 Local Repository</div>`;
    localPanel.appendChild(
      createCommitList(state.localCommits, state.localBranch, '#4fc3f7'),
    );
    wrapper.appendChild(localPanel);

    // Arrows panel
    const arrowPanel = document.createElement('div');
    arrowPanel.className = 'remote-arrows';
    arrowPanel.innerHTML = `
      <div>
        <div class="remote-arrow-label" style="color:${state.animating === 'push' ? '#81c784' : '#a0a0b0'}">
          push →
        </div>
        <svg width="80" height="30" viewBox="0 0 80 30">
          <line x1="5" y1="15" x2="70" y2="15" stroke="${state.animating === 'push' ? '#81c784' : '#555'}" stroke-width="2"/>
          <polygon points="70,10 80,15 70,20" fill="${state.animating === 'push' ? '#81c784' : '#555'}"/>
          ${state.animating === 'push' ? '<circle r="4" fill="#81c784" cx="5" cy="15"><animate attributeName="cx" from="5" to="70" dur="0.8s" repeatCount="indefinite"/></circle>' : ''}
        </svg>
      </div>
      <div>
        <div class="remote-arrow-label" style="color:${state.animating === 'fetch' ? '#ffb74d' : state.animating === 'pull' ? '#ce93d8' : '#a0a0b0'}">
          ← ${state.animating === 'pull' ? 'pull' : 'fetch'}
        </div>
        <svg width="80" height="30" viewBox="0 0 80 30">
          <line x1="10" y1="15" x2="75" y2="15" stroke="${state.animating === 'fetch' || state.animating === 'pull' ? '#ce93d8' : '#555'}" stroke-width="2"/>
          <polygon points="10,10 0,15 10,20" fill="${state.animating === 'fetch' || state.animating === 'pull' ? '#ce93d8' : '#555'}"/>
          ${state.animating === 'fetch' || state.animating === 'pull' ? '<circle r="4" fill="#ce93d8" cx="75" cy="15"><animate attributeName="cx" from="75" to="10" dur="0.8s" repeatCount="indefinite"/></circle>' : ''}
        </svg>
      </div>
      <div>
        <div class="remote-arrow-label" style="color:${state.animating === 'clone' ? '#4fc3f7' : '#a0a0b0'}">
          ← clone
        </div>
        <svg width="80" height="30" viewBox="0 0 80 30">
          <line x1="10" y1="15" x2="75" y2="15" stroke="${state.animating === 'clone' ? '#4fc3f7' : '#555'}" stroke-width="2" stroke-dasharray="5,3"/>
          <polygon points="10,10 0,15 10,20" fill="${state.animating === 'clone' ? '#4fc3f7' : '#555'}"/>
        </svg>
      </div>
    `;
    wrapper.appendChild(arrowPanel);

    // Remote panel
    const remotePanel = document.createElement('div');
    remotePanel.className = 'remote-panel remote-origin';
    remotePanel.innerHTML = `<div class="remote-panel-title">☁ Remote (origin)</div>`;
    remotePanel.appendChild(
      createCommitList(state.remoteCommits, state.remoteBranch, '#ce93d8'),
    );
    wrapper.appendChild(remotePanel);

    container.appendChild(wrapper);

    // Status info
    const info = document.createElement('div');
    info.style.cssText =
      'text-align:center; margin-top:16px; font-size:0.85rem; color:#a0a0b0;';

    const localOnly = state.localCommits.filter(
      (c) => !state.remoteCommits.includes(c),
    );
    const remoteOnly = state.remoteCommits.filter(
      (c) => !state.localCommits.includes(c),
    );

    let statusText = '✓ 동기화 완료';
    let statusColor = '#81c784';
    if (localOnly.length > 0) {
      statusText = `↑ push 필요: ${localOnly.length}개 커밋이 로컬에만 존재`;
      statusColor = '#ffb74d';
    } else if (remoteOnly.length > 0) {
      statusText = `↓ pull 필요: ${remoteOnly.length}개 커밋이 원격에만 존재`;
      statusColor = '#ce93d8';
    }

    info.innerHTML = `<span style="color:${statusColor}; font-weight:600;">${statusText}</span>
      <br>Tracking: <code style="color:#26a69a; background:#0f3460; padding:2px 6px; border-radius:3px;">${state.trackingRef || '—'}</code>`;
    container.appendChild(info);
  }

  function createCommitList(commits, branchName, color) {
    const svgW = 260;
    const svgH = Math.max(commits.length * 40 + 60, 120);

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.maxWidth = svgW + 'px';

    const startX = 40;
    const startY = 40;
    const gap = 40;

    commits.forEach((id, i) => {
      const y = startY + i * gap;

      // Edge (line to next)
      if (i < commits.length - 1) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', y + 12);
        line.setAttribute('x2', startX);
        line.setAttribute('y2', y + gap - 12);
        line.setAttribute('stroke', '#555');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }

      // Node
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', startX);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 12);
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1.5');
      if (i === commits.length - 1) circle.setAttribute('class', 'commit-node');
      svg.appendChild(circle);

      // ID text
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', startX + 24);
      text.setAttribute('y', y + 4);
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#e0e0e0');
      text.textContent = id;
      svg.appendChild(text);
    });

    // Branch label at last commit
    if (commits.length > 0) {
      const lastY = startY + (commits.length - 1) * gap;
      const lw = branchName.length * 6 + 14;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', startX + 60);
      rect.setAttribute('y', lastY - 10);
      rect.setAttribute('width', lw);
      rect.setAttribute('height', 20);
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', color);
      rect.setAttribute('opacity', '0.8');
      svg.appendChild(rect);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', startX + 60 + lw / 2);
      label.setAttribute('y', lastY + 4);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', '#1a1a2e');
      label.textContent = branchName;
      svg.appendChild(label);
    }

    return svg;
  }

  render();

  if (window.__gitProgress) {
    window.__gitProgress.save('section-remote');
  }
}
