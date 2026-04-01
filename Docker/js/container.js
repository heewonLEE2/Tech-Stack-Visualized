// ===== Container vs VM Comparison =====

export function initContainer() {
  const container = document.getElementById('container-container');
  if (!container) return;

  const modeBtns = document.querySelectorAll('[data-compare]');
  let currentMode = 'stack';

  function renderStack() {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'stack-diagram';

    // VM Stack
    const vmCol = document.createElement('div');
    vmCol.className = 'stack-column';
    const vmTitle = document.createElement('div');
    vmTitle.className = 'stack-title';
    vmTitle.style.background = 'rgba(236, 64, 122, 0.15)';
    vmTitle.style.color = '#ec407a';
    vmTitle.textContent = '🖥 가상머신 (VM)';
    vmCol.appendChild(vmTitle);

    const vmLayers = [
      { label: 'App A', color: '#ec407a', opacity: 0.9 },
      { label: 'Bins/Libs', color: '#ad1457', opacity: 0.8 },
      { label: 'Guest OS (Ubuntu)', color: '#880e4f', opacity: 0.75 },
      { label: 'App B', color: '#ec407a', opacity: 0.9 },
      { label: 'Bins/Libs', color: '#ad1457', opacity: 0.8 },
      { label: 'Guest OS (CentOS)', color: '#880e4f', opacity: 0.75 },
      {
        label: 'Hypervisor (VMware / VirtualBox)',
        color: '#7b1fa2',
        opacity: 0.85,
      },
      { label: 'Host OS (Windows / Linux)', color: '#4a148c', opacity: 0.8 },
      { label: 'Infrastructure (Hardware)', color: '#311b92', opacity: 0.75 },
    ];

    vmLayers.forEach((l, i) => {
      const div = document.createElement('div');
      div.className = 'stack-layer';
      div.style.background = l.color;
      div.style.opacity = l.opacity;
      div.style.color = '#fff';
      div.style.animationDelay = i * 80 + 'ms';
      div.style.animation = 'slideUp 0.4s ease forwards';
      div.style.opacity = '0';
      div.textContent = l.label;
      vmCol.appendChild(div);
    });

    // Container Stack
    const ctCol = document.createElement('div');
    ctCol.className = 'stack-column';
    const ctTitle = document.createElement('div');
    ctTitle.className = 'stack-title';
    ctTitle.style.background = 'rgba(36, 150, 237, 0.15)';
    ctTitle.style.color = '#2496ed';
    ctTitle.textContent = '🐳 컨테이너 (Docker)';
    ctCol.appendChild(ctTitle);

    const ctLayers = [
      { label: 'App A', color: '#2496ed', opacity: 0.9 },
      { label: 'Bins/Libs', color: '#1976d2', opacity: 0.8 },
      { label: 'App B', color: '#26c6da', opacity: 0.9 },
      { label: 'Bins/Libs', color: '#00838f', opacity: 0.8 },
      { label: 'App C', color: '#66bb6a', opacity: 0.9 },
      { label: 'Bins/Libs', color: '#2e7d32', opacity: 0.8 },
      { label: 'Docker Engine', color: '#0d47a1', opacity: 0.85 },
      { label: 'Host OS (커널 공유)', color: '#4a148c', opacity: 0.8 },
      { label: 'Infrastructure (Hardware)', color: '#311b92', opacity: 0.75 },
    ];

    ctLayers.forEach((l, i) => {
      const div = document.createElement('div');
      div.className = 'stack-layer';
      div.style.background = l.color;
      div.style.color = '#fff';
      div.style.animationDelay = i * 80 + 'ms';
      div.style.animation = 'slideUp 0.4s ease forwards';
      div.style.opacity = '0';
      div.textContent = l.label;
      ctCol.appendChild(div);
    });

    wrapper.appendChild(vmCol);
    wrapper.appendChild(ctCol);
    container.appendChild(wrapper);

    // Key difference callout
    const callout = document.createElement('div');
    callout.style.cssText =
      'text-align:center; margin-top:20px; padding:12px; border-radius:8px; background:rgba(36,150,237,0.08); border:1px solid rgba(36,150,237,0.2); font-size:0.9rem; color:#a0a0b0;';
    callout.innerHTML =
      '핵심 차이: VM은 각각 <strong style="color:#ec407a">Guest OS</strong>를 포함하지만, 컨테이너는 <strong style="color:#2496ed">Host OS 커널을 공유</strong>합니다.';
    container.appendChild(callout);
  }

  function renderResource() {
    container.innerHTML = '';
    const chart = document.createElement('div');
    chart.className = 'resource-chart';

    const resources = [
      {
        label: '메모리',
        vm: { val: 80, text: '1~2 GB' },
        ct: { val: 15, text: '수 MB~수십 MB' },
      },
      {
        label: '디스크',
        vm: { val: 90, text: '수 GB~수십 GB' },
        ct: { val: 20, text: '수 MB~수백 MB' },
      },
      {
        label: '부팅 시간',
        vm: { val: 85, text: '수십 초~수 분' },
        ct: { val: 8, text: '밀리초~수 초' },
      },
      {
        label: '밀도',
        vm: { val: 25, text: '수 개~수십 개' },
        ct: { val: 90, text: '수십~수백 개' },
      },
    ];

    // Header
    const header = document.createElement('div');
    header.className = 'resource-row';
    header.style.marginBottom = '8px';
    header.innerHTML = `
      <div style="font-size:0.8rem; color:var(--text-secondary);"></div>
      <div style="text-align:center; font-size:0.85rem; font-weight:600; color:#ec407a;">🖥 VM</div>
      <div style="text-align:center; font-size:0.85rem; font-weight:600; color:#2496ed;">🐳 Container</div>
    `;
    chart.appendChild(header);

    resources.forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'resource-row';

      row.innerHTML = `
        <div class="resource-label">${r.label}</div>
        <div class="resource-bar-wrap">
          <div class="resource-bar bar-animated" style="width:${r.vm.val}%; background:#ec407a; animation-delay:${idx * 150}ms;">${r.vm.text}</div>
        </div>
        <div class="resource-bar-wrap">
          <div class="resource-bar bar-animated" style="width:${r.ct.val}%; background:#2496ed; animation-delay:${idx * 150 + 75}ms;">${r.ct.text}</div>
        </div>
      `;
      chart.appendChild(row);
    });

    container.appendChild(chart);

    // Summary
    const summary = document.createElement('div');
    summary.style.cssText =
      'text-align:center; margin-top:20px; padding:12px; border-radius:8px; background:rgba(36,150,237,0.08); border:1px solid rgba(36,150,237,0.2); font-size:0.9rem; color:#a0a0b0;';
    summary.innerHTML =
      '컨테이너는 VM 대비 <strong style="color:#26c6da">메모리 ~90% 절약</strong>, <strong style="color:#66bb6a">시작 시간 ~100배 빠름</strong>, <strong style="color:#ff9800">밀도 ~10배 향상</strong>';
    container.appendChild(summary);
  }

  function render() {
    if (currentMode === 'stack') renderStack();
    else renderResource();
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.compare;
      render();
    });
  });

  render();

  // Progress: interacted with both modes
  let modesVisited = new Set(['stack']);
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modesVisited.add(btn.dataset.compare);
      if (modesVisited.size >= 2) {
        window.__dockerProgress?.save('section-container');
      }
    });
  });
}
