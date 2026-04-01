// ===== Kubernetes Architecture Visualization =====

export function initK8sArch() {
  const container = document.getElementById('k8s-arch-container');
  if (!container) return;

  const state = {
    animating: false,
    step: 0,
    timer: null,
    speed: 1,
  };

  // Cluster components
  const controlPlane = [
    {
      id: 'api-server',
      label: 'API Server',
      icon: '🔌',
      desc: '모든 요청의 게이트웨이',
      color: '#326ce5',
      x: 300,
      y: 60,
    },
    {
      id: 'etcd',
      label: 'etcd',
      icon: '💾',
      desc: '클러스터 상태 저장소',
      color: '#ff9800',
      x: 130,
      y: 60,
    },
    {
      id: 'scheduler',
      label: 'Scheduler',
      icon: '📋',
      desc: 'Pod를 노드에 배치',
      color: '#66bb6a',
      x: 470,
      y: 60,
    },
    {
      id: 'controller',
      label: 'Controller Manager',
      icon: '🔄',
      desc: '상태 일치 루프 (ReplicaSet 등)',
      color: '#ec407a',
      x: 470,
      y: 140,
    },
  ];

  const workerComponents = [
    {
      id: 'kubelet',
      label: 'Kubelet',
      icon: '🤖',
      desc: 'Pod 생명주기 관리',
      color: '#26c6da',
    },
    {
      id: 'kube-proxy',
      label: 'kube-proxy',
      icon: '🔀',
      desc: '네트워크 라우팅',
      color: '#5c6bc0',
    },
    {
      id: 'runtime',
      label: 'Container Runtime',
      icon: '🐳',
      desc: '컨테이너 실행 (containerd)',
      color: '#2496ed',
    },
  ];

  const requestFlow = [
    { from: 'kubectl', to: 'api-server', label: 'kubectl apply' },
    { from: 'api-server', to: 'etcd', label: '상태 저장' },
    { from: 'api-server', to: 'scheduler', label: '스케줄링 요청' },
    { from: 'scheduler', to: 'api-server', label: '노드 배정' },
    { from: 'api-server', to: 'kubelet', label: 'Pod 생성 지시' },
    { from: 'kubelet', to: 'runtime', label: '컨테이너 시작' },
  ];

  function render() {
    container.innerHTML = '';

    // SVG architecture diagram
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 600 480');
    svg.setAttribute('id', 'k8s-arch-svg');
    svg.style.cssText =
      'width:100%; max-width:650px; display:block; margin:0 auto;';

    // === Control Plane box ===
    const cpRect = document.createElementNS(svgNS, 'rect');
    cpRect.setAttribute('x', 20);
    cpRect.setAttribute('y', 15);
    cpRect.setAttribute('width', 560);
    cpRect.setAttribute('height', 180);
    cpRect.setAttribute('rx', 12);
    cpRect.setAttribute('fill', 'rgba(50,108,229,0.06)');
    cpRect.setAttribute('stroke', '#326ce5');
    cpRect.setAttribute('stroke-width', '2');
    svg.appendChild(cpRect);

    const cpLabel = document.createElementNS(svgNS, 'text');
    cpLabel.setAttribute('x', 35);
    cpLabel.setAttribute('y', 38);
    cpLabel.setAttribute('font-size', '12');
    cpLabel.setAttribute('font-weight', '700');
    cpLabel.setAttribute('fill', '#326ce5');
    cpLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    cpLabel.textContent = '🎛 Control Plane (Master)';
    svg.appendChild(cpLabel);

    // Control plane components
    controlPlane.forEach((comp) => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('data-comp', comp.id);
      g.style.opacity = '0.5';

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', comp.x - 55);
      rect.setAttribute('y', comp.y);
      rect.setAttribute('width', 110);
      rect.setAttribute('height', 50);
      rect.setAttribute('rx', 8);
      rect.setAttribute('fill', comp.color + '15');
      rect.setAttribute('stroke', comp.color);
      rect.setAttribute('stroke-width', '1.5');

      const icon = document.createElementNS(svgNS, 'text');
      icon.setAttribute('x', comp.x - 40);
      icon.setAttribute('y', comp.y + 32);
      icon.setAttribute('font-size', '16');
      icon.textContent = comp.icon;

      const name = document.createElementNS(svgNS, 'text');
      name.setAttribute('x', comp.x - 18);
      name.setAttribute('y', comp.y + 24);
      name.setAttribute('font-size', '11');
      name.setAttribute('font-weight', '700');
      name.setAttribute('fill', comp.color);
      name.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      name.textContent = comp.label;

      const desc = document.createElementNS(svgNS, 'text');
      desc.setAttribute('x', comp.x - 18);
      desc.setAttribute('y', comp.y + 40);
      desc.setAttribute('font-size', '8');
      desc.setAttribute('fill', '#a0a0b0');
      desc.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      desc.textContent = comp.desc;

      g.appendChild(rect);
      g.appendChild(icon);
      g.appendChild(name);
      g.appendChild(desc);
      svg.appendChild(g);
    });

    // Connection lines within control plane
    const cpLines = [
      { from: 'api-server', to: 'etcd' },
      { from: 'api-server', to: 'scheduler' },
      { from: 'api-server', to: 'controller' },
    ];
    cpLines.forEach((link) => {
      const f = controlPlane.find((c) => c.id === link.from);
      const t = controlPlane.find((c) => c.id === link.to);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', f.x);
      line.setAttribute('y1', f.y + 25);
      line.setAttribute('x2', t.x);
      line.setAttribute('y2', t.y + 25);
      line.setAttribute('stroke', '#444');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '3 3');
      svg.appendChild(line);
    });

    // === Worker Nodes ===
    const workers = [
      { label: 'Worker Node 1', x: 50, y: 230, pods: ['Pod A', 'Pod B'] },
      {
        label: 'Worker Node 2',
        x: 320,
        y: 230,
        pods: ['Pod C', 'Pod D', 'Pod E'],
      },
    ];

    workers.forEach((node, ni) => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('data-worker', `worker-${ni}`);

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', node.x);
      rect.setAttribute('y', node.y);
      rect.setAttribute('width', 230);
      rect.setAttribute('height', 220);
      rect.setAttribute('rx', 10);
      rect.setAttribute('fill', 'rgba(100,100,100,0.08)');
      rect.setAttribute('stroke', '#666');
      rect.setAttribute('stroke-width', '1.5');

      const nLabel = document.createElementNS(svgNS, 'text');
      nLabel.setAttribute('x', node.x + 15);
      nLabel.setAttribute('y', node.y + 22);
      nLabel.setAttribute('font-size', '12');
      nLabel.setAttribute('font-weight', '600');
      nLabel.setAttribute('fill', '#a0a0b0');
      nLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      nLabel.textContent = `🖥 ${node.label}`;

      g.appendChild(rect);
      g.appendChild(nLabel);

      // Worker sub-components
      workerComponents.forEach((wc, i) => {
        const wRect = document.createElementNS(svgNS, 'rect');
        const wy = node.y + 35 + i * 32;
        wRect.setAttribute('x', node.x + 10);
        wRect.setAttribute('y', wy);
        wRect.setAttribute('width', 100);
        wRect.setAttribute('height', 24);
        wRect.setAttribute('rx', 4);
        wRect.setAttribute('fill', wc.color + '15');
        wRect.setAttribute('stroke', wc.color);
        wRect.setAttribute('stroke-width', '1');

        const wLabel = document.createElementNS(svgNS, 'text');
        wLabel.setAttribute('x', node.x + 16);
        wLabel.setAttribute('y', wy + 16);
        wLabel.setAttribute('font-size', '9');
        wLabel.setAttribute('font-weight', '600');
        wLabel.setAttribute('fill', wc.color);
        wLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        wLabel.textContent = `${wc.icon} ${wc.label}`;

        g.appendChild(wRect);
        g.appendChild(wLabel);
      });

      // Pods
      node.pods.forEach((pod, pi) => {
        const px = node.x + 120 + (pi % 2) * 55;
        const py = node.y + 40 + Math.floor(pi / 2) * 55;

        const pRect = document.createElementNS(svgNS, 'rect');
        pRect.setAttribute('x', px);
        pRect.setAttribute('y', py);
        pRect.setAttribute('width', 48);
        pRect.setAttribute('height', 44);
        pRect.setAttribute('rx', 6);
        pRect.setAttribute('fill', 'rgba(50,108,229,0.12)');
        pRect.setAttribute('stroke', '#326ce5');
        pRect.setAttribute('stroke-width', '1');

        const pLabel = document.createElementNS(svgNS, 'text');
        pLabel.setAttribute('x', px + 24);
        pLabel.setAttribute('y', py + 18);
        pLabel.setAttribute('text-anchor', 'middle');
        pLabel.setAttribute('font-size', '9');
        pLabel.setAttribute('font-weight', '600');
        pLabel.setAttribute('fill', '#326ce5');
        pLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        pLabel.textContent = '⎈';

        const podName = document.createElementNS(svgNS, 'text');
        podName.setAttribute('x', px + 24);
        podName.setAttribute('y', py + 34);
        podName.setAttribute('text-anchor', 'middle');
        podName.setAttribute('font-size', '8');
        podName.setAttribute('fill', '#a0a0b0');
        podName.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        podName.textContent = pod;

        g.appendChild(pRect);
        g.appendChild(pLabel);
        g.appendChild(podName);
      });

      svg.appendChild(g);

      // Line from API Server to worker
      const apiComp = controlPlane.find((c) => c.id === 'api-server');
      const wLine = document.createElementNS(svgNS, 'line');
      wLine.setAttribute('x1', apiComp.x);
      wLine.setAttribute('y1', apiComp.y + 50);
      wLine.setAttribute('x2', node.x + 115);
      wLine.setAttribute('y2', node.y);
      wLine.setAttribute('stroke', '#326ce5');
      wLine.setAttribute('stroke-width', '1.5');
      wLine.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(wLine);
    });

    // kubectl
    const kubectlG = document.createElementNS(svgNS, 'g');
    kubectlG.setAttribute('data-comp', 'kubectl');

    const kRect = document.createElementNS(svgNS, 'rect');
    kRect.setAttribute('x', 240);
    kRect.setAttribute('y', 467);
    kRect.setAttribute('width', 120);
    kRect.setAttribute('height', 30);
    kRect.setAttribute('rx', 6);
    kRect.setAttribute('fill', 'rgba(50,108,229,0.1)');
    kRect.setAttribute('stroke', '#326ce5');
    kRect.setAttribute('stroke-width', '1.5');
    kubectlG.appendChild(kRect);

    const kLabel = document.createElementNS(svgNS, 'text');
    kLabel.setAttribute('x', 300);
    kLabel.setAttribute('y', 487);
    kLabel.setAttribute('text-anchor', 'middle');
    kLabel.setAttribute('font-size', '11');
    kLabel.setAttribute('font-weight', '600');
    kLabel.setAttribute('fill', '#326ce5');
    kLabel.setAttribute('font-family', "'Courier New', monospace");
    kLabel.textContent = '$ kubectl';
    kubectlG.appendChild(kLabel);
    svg.appendChild(kubectlG);

    // Arrow from kubectl to API Server
    const kArrow = document.createElementNS(svgNS, 'line');
    kArrow.setAttribute('x1', 300);
    kArrow.setAttribute('y1', 467);
    kArrow.setAttribute('x2', 300);
    kArrow.setAttribute('y2', 200);
    kArrow.setAttribute('stroke', '#326ce5');
    kArrow.setAttribute('stroke-width', '1');
    kArrow.setAttribute('stroke-dasharray', '6 3');
    kArrow.setAttribute('opacity', '0.3');
    kArrow.setAttribute('id', 'kubectl-arrow');
    svg.appendChild(kArrow);

    container.appendChild(svg);

    // Flow step indicator
    const indicator = document.createElement('div');
    indicator.id = 'flow-indicator';
    indicator.style.cssText =
      'text-align:center; margin-top:10px; font-size:0.85rem; color:var(--text-secondary); min-height:24px;';
    container.appendChild(indicator);
  }

  function startRequestFlow() {
    if (state.animating) return;
    state.animating = true;
    state.step = 0;

    const svg = document.getElementById('k8s-arch-svg');
    if (!svg) return;

    // Reset all opacities
    svg.querySelectorAll('g[data-comp]').forEach((g) => {
      g.style.transition = 'opacity 0.4s ease';
      g.style.opacity = '0.5';
    });

    function highlightStep() {
      if (state.step >= requestFlow.length) {
        state.animating = false;
        document.getElementById('flow-indicator').textContent =
          '✅ Pod 배포 완료!';
        // Highlight all
        svg.querySelectorAll('g[data-comp]').forEach((g) => {
          g.style.opacity = '1';
        });
        window.__dockerProgress?.save('section-k8s-arch');
        return;
      }

      const flow = requestFlow[state.step];

      // Highlight 'from' component
      const fromG = svg.querySelector(`g[data-comp="${flow.from}"]`);
      if (fromG) fromG.style.opacity = '1';

      const toG = svg.querySelector(`g[data-comp="${flow.to}"]`);
      if (toG) {
        setTimeout(() => {
          toG.style.opacity = '1';
        }, 300 / state.speed);
      }

      // Update indicator
      const indicator = document.getElementById('flow-indicator');
      if (indicator) {
        indicator.innerHTML = `<strong style="color:var(--k8s-color);">Step ${state.step + 1}/${requestFlow.length}</strong>: ${flow.from} → ${flow.to} — <em>${flow.label}</em>`;
      }

      state.step++;
      state.timer = setTimeout(highlightStep, 1200 / state.speed);
    }

    highlightStep();
  }

  function resetAnim() {
    clearTimeout(state.timer);
    state.animating = false;
    state.step = 0;
    render();
  }

  render();

  // Bind HTML controls
  const k8sTraceBtn = document.getElementById('k8s-trace');
  const k8sResetBtn = document.getElementById('k8s-reset');
  const k8sSpeedEl = document.getElementById('k8s-speed');
  const k8sSpeedValEl = document.getElementById('k8s-speed-val');

  if (k8sTraceBtn)
    k8sTraceBtn.addEventListener('click', () => startRequestFlow());
  if (k8sResetBtn) k8sResetBtn.addEventListener('click', () => resetAnim());
  if (k8sSpeedEl) {
    k8sSpeedEl.addEventListener('input', () => {
      state.speed = parseFloat(k8sSpeedEl.value);
      if (k8sSpeedValEl) k8sSpeedValEl.textContent = k8sSpeedEl.value + 'x';
    });
  }
}
