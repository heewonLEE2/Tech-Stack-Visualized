// ===== Docker Image Layer Visualization =====

export function initImage() {
  const container = document.getElementById('image-container');
  if (!container) return;

  const dockerfiles = {
    node: {
      label: 'Node.js',
      layers: [
        {
          cmd: 'FROM node:18-alpine',
          size: '175 MB',
          type: 'base',
          desc: '베이스 이미지 (Alpine Linux + Node.js)',
        },
        {
          cmd: 'WORKDIR /app',
          size: '0 B',
          type: 'meta',
          desc: '작업 디렉토리 설정 (레이어 없음)',
        },
        {
          cmd: 'COPY package*.json ./',
          size: '52 KB',
          type: 'copy',
          desc: '의존성 정의 파일만 먼저 복사',
        },
        {
          cmd: 'RUN npm ci --production',
          size: '48 MB',
          type: 'run',
          desc: '의존성 설치 (캐싱 핵심)',
        },
        {
          cmd: 'COPY . .',
          size: '2.1 MB',
          type: 'copy',
          desc: '소스 코드 복사 (자주 변경)',
        },
        {
          cmd: 'EXPOSE 3000',
          size: '0 B',
          type: 'meta',
          desc: '포트 메타데이터 (레이어 없음)',
        },
        {
          cmd: 'CMD ["node", "server.js"]',
          size: '0 B',
          type: 'meta',
          desc: '실행 명령 (레이어 없음)',
        },
      ],
      badLayers: [
        {
          cmd: 'FROM node:18',
          size: '350 MB',
          type: 'base',
          desc: '풀 이미지 (Alpine 대비 2배 크기)',
        },
        {
          cmd: 'WORKDIR /app',
          size: '0 B',
          type: 'meta',
          desc: '작업 디렉토리 설정',
        },
        {
          cmd: 'COPY . .',
          size: '2.2 MB',
          type: 'copy',
          desc: '전체 복사 (의존성 변경 시 캐시 무효화)',
        },
        {
          cmd: 'RUN npm install',
          size: '85 MB',
          type: 'run',
          desc: 'devDependencies 포함 설치',
        },
        {
          cmd: 'EXPOSE 3000',
          size: '0 B',
          type: 'meta',
          desc: '포트 메타데이터',
        },
        {
          cmd: 'CMD ["node", "server.js"]',
          size: '0 B',
          type: 'meta',
          desc: '실행 명령',
        },
      ],
    },
    python: {
      label: 'Python',
      layers: [
        {
          cmd: 'FROM python:3.11-slim',
          size: '120 MB',
          type: 'base',
          desc: 'Slim 베이스 (불필요 패키지 제거)',
        },
        {
          cmd: 'WORKDIR /app',
          size: '0 B',
          type: 'meta',
          desc: '작업 디렉토리 설정',
        },
        {
          cmd: 'COPY requirements.txt .',
          size: '1.2 KB',
          type: 'copy',
          desc: '의존성 파일만 먼저 복사',
        },
        {
          cmd: 'RUN pip install --no-cache-dir -r requirements.txt',
          size: '65 MB',
          type: 'run',
          desc: '의존성 설치 (캐시 미저장)',
        },
        {
          cmd: 'COPY . .',
          size: '1.8 MB',
          type: 'copy',
          desc: '소스 코드 복사',
        },
        {
          cmd: 'CMD ["python", "app.py"]',
          size: '0 B',
          type: 'meta',
          desc: '실행 명령',
        },
      ],
      badLayers: [
        {
          cmd: 'FROM python:3.11',
          size: '350 MB',
          type: 'base',
          desc: '풀 이미지 (Slim 대비 3배)',
        },
        {
          cmd: 'COPY . .',
          size: '1.9 MB',
          type: 'copy',
          desc: '전체 복사 (캐시 무효화 원인)',
        },
        {
          cmd: 'RUN pip install -r requirements.txt',
          size: '120 MB',
          type: 'run',
          desc: '캐시 포함 설치 (용량 비효율)',
        },
        {
          cmd: 'CMD ["python", "app.py"]',
          size: '0 B',
          type: 'meta',
          desc: '실행 명령',
        },
      ],
    },
  };

  const typeColors = {
    base: '#7c4dff',
    copy: '#26c6da',
    run: '#ff9800',
    meta: '#616161',
  };

  let selectedFile = 'node';
  let compareMode = false;

  const selectEl = document.getElementById('image-dockerfile');
  const buildBtn = document.getElementById('image-build');
  const resetBtn = document.getElementById('image-reset');
  const compareBtn = document.getElementById('image-compare-btn');
  const compareContainer = document.getElementById('image-compare-container');

  function buildLayerStack(layers, parentEl, cacheFrom) {
    parentEl.innerHTML = '';
    const stack = document.createElement('div');
    stack.className = 'layer-stack';

    // Build bottom-up visually (first layer = bottom)
    layers.forEach((layer, i) => {
      const div = document.createElement('div');
      div.className = 'image-layer';
      div.style.animationDelay = i * 200 + 'ms';

      const isCached = cacheFrom !== undefined && i < cacheFrom;
      if (layer.type !== 'meta') {
        div.classList.add(isCached ? 'cached' : 'rebuilt');
      }

      const numSpan = document.createElement('span');
      numSpan.style.cssText = `min-width:24px; height:24px; border-radius:50%; background:${typeColors[layer.type]}; color:#fff; font-size:0.7rem; font-weight:700; display:flex; align-items:center; justify-content:center;`;
      numSpan.textContent = i + 1;
      div.appendChild(numSpan);

      const cmdSpan = document.createElement('span');
      cmdSpan.className = 'layer-cmd';
      cmdSpan.textContent = layer.cmd;
      cmdSpan.title = layer.desc;
      div.appendChild(cmdSpan);

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'layer-size';
      sizeSpan.textContent = layer.size;
      div.appendChild(sizeSpan);

      if (layer.type !== 'meta') {
        const statusSpan = document.createElement('span');
        statusSpan.className =
          'layer-status ' + (isCached ? 'cached' : 'rebuilt');
        statusSpan.textContent = isCached ? 'CACHED' : 'BUILD';
        div.appendChild(statusSpan);
      }

      stack.appendChild(div);
    });

    parentEl.appendChild(stack);

    // Total size
    const totalSize = layers.reduce((sum, l) => {
      const match = l.size.match(/([\d.]+)\s*(MB|KB|B)/);
      if (!match) return sum;
      const val = parseFloat(match[1]);
      if (match[2] === 'MB') return sum + val;
      if (match[2] === 'KB') return sum + val / 1024;
      return sum;
    }, 0);

    const totalEl = document.createElement('div');
    totalEl.style.cssText =
      'text-align:center; margin-top:12px; font-size:0.85rem; color:var(--text-secondary);';
    totalEl.innerHTML = `총 이미지 크기: <strong style="color:var(--image-color);">${totalSize.toFixed(1)} MB</strong>`;
    parentEl.appendChild(totalEl);
  }

  function animateLayers(parentEl) {
    const layers = parentEl.querySelectorAll('.image-layer');
    layers.forEach((l, i) => {
      setTimeout(() => {
        l.classList.add('visible');
      }, i * 200);
    });
  }

  function renderNormal() {
    const df = dockerfiles[selectedFile];
    buildLayerStack(df.layers, container, 4); // assume first 4 cached on rebuild
    animateLayers(container);
    if (compareContainer) compareContainer.style.display = 'none';
  }

  function renderCompare() {
    container.innerHTML =
      '<div style="text-align:center; color:var(--text-secondary); font-size:0.9rem; padding:20px;">비교 모드가 활성화되었습니다. 아래에서 비효율적 vs 최적화된 Dockerfile을 확인하세요.</div>';
    if (!compareContainer) return;
    compareContainer.style.display = 'grid';
    compareContainer.innerHTML = '';

    const df = dockerfiles[selectedFile];

    // Bad panel
    const badPanel = document.createElement('div');
    badPanel.className = 'compare-panel compare-panel-b';
    const badTitle = document.createElement('div');
    badTitle.className = 'compare-panel-title';
    badTitle.textContent = '❌ 비효율적 Dockerfile';
    badPanel.appendChild(badTitle);
    buildLayerStack(df.badLayers, badPanel);
    compareContainer.appendChild(badPanel);

    // Good panel
    const goodPanel = document.createElement('div');
    goodPanel.className = 'compare-panel compare-panel-a';
    const goodTitle = document.createElement('div');
    goodTitle.className = 'compare-panel-title';
    goodTitle.textContent = '✅ 최적화된 Dockerfile';
    goodPanel.appendChild(goodTitle);
    buildLayerStack(df.layers, goodPanel, 4);
    compareContainer.appendChild(goodPanel);

    // Animate both
    setTimeout(() => {
      [badPanel, goodPanel].forEach((panel) => {
        panel.querySelectorAll('.image-layer').forEach((l, i) => {
          setTimeout(() => l.classList.add('visible'), i * 150);
        });
      });
    }, 100);
  }

  function render() {
    if (compareMode) renderCompare();
    else renderNormal();
  }

  if (buildBtn) {
    buildBtn.addEventListener('click', () => {
      renderNormal();
      window.__dockerProgress?.save('section-image');
    });
  }
  if (resetBtn)
    resetBtn.addEventListener('click', () => {
      compareMode = false;
      compareBtn?.classList.remove('active');
      render();
    });
  if (selectEl)
    selectEl.addEventListener('change', () => {
      selectedFile = selectEl.value;
      render();
    });
  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      compareMode = !compareMode;
      compareBtn.classList.toggle('active', compareMode);
      render();
    });
  }

  render();
}
