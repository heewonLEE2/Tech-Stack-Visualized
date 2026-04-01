// ===== Kubernetes Deployment & Scaling Visualization =====

export function initDeployment() {
  const container = document.getElementById('deployment-container');
  if (!container) return;

  const state = {
    replicas: 3,
    maxReplicas: 10,
    version: 1,
    strategy: 'rolling', // 'rolling' | 'bluegreen'
    animating: false,
    timer: null,
    speed: 1,
    pods: [], // {id, version, status} — status: 'running' | 'terminating' | 'creating'
  };

  function initPods() {
    state.pods = [];
    for (let i = 0; i < state.replicas; i++) {
      state.pods.push({ id: i, version: state.version, status: 'running' });
    }
  }

  initPods();

  function render() {
    container.innerHTML = '';

    // Compare mode: Rolling vs Blue-Green
    if (state.strategy === 'rolling') {
      renderRollingView();
    } else {
      renderBlueGreenView();
    }

    // Status indicator
    const status = document.createElement('div');
    status.id = 'deploy-status';
    status.style.cssText =
      'text-align:center; margin-top:10px; font-size:0.85rem; color:var(--text-secondary); min-height:24px;';
    container.appendChild(status);
  }

  function renderRollingView() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center; margin-bottom:8px;';
    wrapper.innerHTML = `<div style="font-size:0.8rem; font-weight:600; color:var(--k8s-color); margin-bottom:8px;">Rolling Update — 하나씩 교체</div>`;

    const grid = document.createElement('div');
    grid.className = 'pod-grid';
    grid.id = 'pod-grid';

    state.pods.forEach((pod) => {
      const cell = createPodCell(pod);
      grid.appendChild(cell);
    });

    wrapper.appendChild(grid);
    container.appendChild(wrapper);
  }

  function renderBlueGreenView() {
    const wrapper = document.createElement('div');
    wrapper.className = 'compare-container';
    wrapper.style.cssText =
      'display:grid; grid-template-columns:1fr 1fr; gap:16px;';

    // Blue (current)
    const bluePanel = document.createElement('div');
    bluePanel.style.cssText =
      'padding:12px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);';
    bluePanel.innerHTML = `<div style="font-size:0.8rem; font-weight:600; color:#326ce5; margin-bottom:8px; text-align:center;">🔵 Blue (현재 v${state.version})</div>`;

    const blueGrid = document.createElement('div');
    blueGrid.className = 'pod-grid';
    blueGrid.id = 'blue-grid';
    state.pods
      .filter((p) => p.version === state.version)
      .forEach((pod) => {
        blueGrid.appendChild(createPodCell(pod));
      });
    bluePanel.appendChild(blueGrid);

    // Green (new)
    const greenPanel = document.createElement('div');
    greenPanel.style.cssText =
      'padding:12px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);';
    greenPanel.innerHTML = `<div style="font-size:0.8rem; font-weight:600; color:#66bb6a; margin-bottom:8px; text-align:center;">🟢 Green (v${state.version + 1})</div>`;

    const greenGrid = document.createElement('div');
    greenGrid.className = 'pod-grid';
    greenGrid.id = 'green-grid';
    state.pods
      .filter((p) => p.version === state.version + 1)
      .forEach((pod) => {
        greenGrid.appendChild(createPodCell(pod));
      });
    greenPanel.appendChild(greenGrid);

    wrapper.appendChild(bluePanel);
    wrapper.appendChild(greenPanel);
    container.appendChild(wrapper);
  }

  function createPodCell(pod) {
    const cell = document.createElement('div');
    let className = 'pod-cell';
    if (pod.version % 2 === 1) className += ' v1';
    else className += ' v2';
    if (pod.status === 'terminating') className += ' terminating';
    if (pod.status === 'creating') className += ' creating';
    cell.className = className;
    cell.innerHTML = `
      <div style="font-size:1rem;">⎈</div>
      <div style="font-size:0.7rem; font-weight:600;">v${pod.version}</div>
      <div style="font-size:0.6rem; opacity:0.7;">${pod.status === 'running' ? '●' : pod.status === 'creating' ? '◌' : '✕'}</div>
    `;
    return cell;
  }

  function renderPodGrid() {
    if (state.strategy === 'rolling') {
      const grid = document.getElementById('pod-grid');
      if (!grid) return;
      grid.innerHTML = '';
      state.pods.forEach((pod) => grid.appendChild(createPodCell(pod)));
    } else {
      const blueGrid = document.getElementById('blue-grid');
      const greenGrid = document.getElementById('green-grid');
      if (blueGrid) {
        blueGrid.innerHTML = '';
        state.pods
          .filter((p) => p.version === state.version)
          .forEach((pod) => {
            blueGrid.appendChild(createPodCell(pod));
          });
      }
      if (greenGrid) {
        greenGrid.innerHTML = '';
        state.pods
          .filter((p) => p.version === state.version + 1)
          .forEach((pod) => {
            greenGrid.appendChild(createPodCell(pod));
          });
      }
    }
  }

  function deploy() {
    if (state.animating) return;
    state.animating = true;
    const newVersion = state.version + 1;

    if (state.strategy === 'rolling') {
      rollingUpdate(newVersion);
    } else {
      blueGreenDeploy(newVersion);
    }
  }

  function rollingUpdate(newVersion) {
    let idx = 0;

    function replaceNext() {
      if (idx >= state.pods.length) {
        state.version = newVersion;
        state.animating = false;
        updateStatus('✅ Rolling Update 완료!');
        window.__dockerProgress?.save('section-deployment');
        return;
      }

      // Mark current as terminating
      state.pods[idx].status = 'terminating';
      renderPodGrid();
      updateStatus(`Pod ${idx + 1}/${state.pods.length} 교체 중...`);

      setTimeout(() => {
        // Replace with new version
        state.pods[idx] = { id: idx, version: newVersion, status: 'creating' };
        renderPodGrid();

        setTimeout(() => {
          state.pods[idx].status = 'running';
          renderPodGrid();
          idx++;
          state.timer = setTimeout(replaceNext, 600 / state.speed);
        }, 400 / state.speed);
      }, 500 / state.speed);
    }

    replaceNext();
  }

  function blueGreenDeploy(newVersion) {
    // Phase 1: Create all green pods
    let greenPods = [];
    let idx = 0;

    updateStatus('🟢 Green 환경 생성 중...');

    function createGreenPod() {
      if (idx >= state.replicas) {
        // Phase 2: Switch traffic
        setTimeout(() => {
          updateStatus('🔄 트래픽 전환 중...');

          setTimeout(() => {
            // Mark blue as terminating
            state.pods.forEach((p) => {
              if (p.version === state.version) p.status = 'terminating';
            });
            renderPodGrid();

            setTimeout(() => {
              // Remove blue, keep green
              state.pods = greenPods;
              state.version = newVersion;
              state.animating = false;
              renderPodGrid();
              updateStatus(
                '✅ Blue-Green 배포 완료! 트래픽이 Green으로 전환됨',
              );
              window.__dockerProgress?.save('section-deployment');
            }, 800 / state.speed);
          }, 600 / state.speed);
        }, 400 / state.speed);
        return;
      }

      const pod = {
        id: state.replicas + idx,
        version: newVersion,
        status: 'creating',
      };
      greenPods.push(pod);
      state.pods.push(pod);
      renderPodGrid();

      setTimeout(() => {
        pod.status = 'running';
        renderPodGrid();
        idx++;
        state.timer = setTimeout(createGreenPod, 400 / state.speed);
      }, 300 / state.speed);
    }

    createGreenPod();
  }

  function rollback() {
    if (state.animating || state.version <= 1) return;
    state.animating = true;
    const prevVersion = state.version - 1;

    updateStatus(`↩ v${state.version} → v${prevVersion} 롤백 중...`);

    let idx = 0;
    function rollbackNext() {
      if (idx >= state.pods.length) {
        state.version = prevVersion;
        state.animating = false;
        updateStatus(`✅ v${prevVersion}으로 롤백 완료!`);
        render();
        return;
      }

      state.pods[idx].status = 'terminating';
      renderPodGrid();

      setTimeout(() => {
        state.pods[idx] = { id: idx, version: prevVersion, status: 'creating' };
        renderPodGrid();

        setTimeout(() => {
          state.pods[idx].status = 'running';
          renderPodGrid();
          idx++;
          state.timer = setTimeout(rollbackNext, 400 / state.speed);
        }, 300 / state.speed);
      }, 400 / state.speed);
    }

    rollbackNext();
  }

  function resetState() {
    clearTimeout(state.timer);
    state.animating = false;
    state.version = 1;
    const repEl = document.getElementById('deploy-replicas');
    state.replicas = repEl ? parseInt(repEl.value) : 3;
    initPods();
  }

  function updateStatus(msg) {
    const el = document.getElementById('deploy-status');
    if (el) el.innerHTML = msg;
  }

  render();

  // Bind HTML controls
  const deployRollingBtn = document.getElementById('deploy-rolling');
  const deployRollbackBtn = document.getElementById('deploy-rollback');
  const deployResetBtn = document.getElementById('deploy-reset');
  const deployReplicasEl = document.getElementById('deploy-replicas');
  const deployReplicasValEl = document.getElementById('deploy-replicas-val');
  const deploySpeedEl = document.getElementById('deploy-speed');
  const deploySpeedValEl = document.getElementById('deploy-speed-val');
  const deployCompareBtn = document.getElementById('deploy-compare-btn');

  if (deployRollingBtn)
    deployRollingBtn.addEventListener('click', () => deploy());
  if (deployRollbackBtn)
    deployRollbackBtn.addEventListener('click', () => rollback());
  if (deployResetBtn)
    deployResetBtn.addEventListener('click', () => {
      resetState();
      render();
    });
  if (deployReplicasEl) {
    deployReplicasEl.addEventListener('input', () => {
      state.replicas = parseInt(deployReplicasEl.value);
      if (deployReplicasValEl)
        deployReplicasValEl.textContent = deployReplicasEl.value;
      initPods();
      renderPodGrid();
    });
  }
  if (deploySpeedEl) {
    deploySpeedEl.addEventListener('input', () => {
      state.speed = parseFloat(deploySpeedEl.value);
      if (deploySpeedValEl)
        deploySpeedValEl.textContent = deploySpeedEl.value + 'x';
    });
  }
  if (deployCompareBtn) {
    deployCompareBtn.addEventListener('click', () => {
      state.strategy = state.strategy === 'rolling' ? 'bluegreen' : 'rolling';
      deployCompareBtn.textContent =
        state.strategy === 'rolling'
          ? '⚖ 비교 모드: Rolling vs Blue-Green'
          : '⚖ 현재: Blue-Green (클릭하여 Rolling으로)';
      resetState();
      render();
    });
  }
}
