// ===== RAG Pipeline: 3-Stage Interactive Animation =====
export function initPipeline() {
  const container = document.getElementById('pipeline-container');
  if (!container) return;

  const state = {
    step: -1,
    playing: false,
    speed: 1,
    timer: null,
  };

  const stages = [
    {
      id: 'query',
      stage: 'retrieve',
      icon: '❓',
      label: '사용자 질문',
      detail: '"RAG란 무엇인가?"',
      color: 'var(--text-heading)',
    },
    {
      id: 'vectorize',
      stage: 'retrieve',
      icon: '🧮',
      label: '쿼리 벡터화',
      detail: 'text → [0.12, -0.45, 0.78, ...]',
      color: 'var(--embed-color)',
    },
    {
      id: 'search',
      stage: 'retrieve',
      icon: '🔎',
      label: '유사 문서 검색',
      detail: 'Top-3 문서 선택 (cosine similarity)',
      color: 'var(--retrieve-color)',
    },
    {
      id: 'augment',
      stage: 'augment',
      icon: '📋',
      label: '프롬프트 구성',
      detail: 'Context: {docs}\\nQuestion: {query}',
      color: 'var(--augment-color)',
    },
    {
      id: 'generate',
      stage: 'generate',
      icon: '🧠',
      label: 'LLM 생성',
      detail: 'GPT-4가 맥락 기반 답변 생성',
      color: 'var(--generate-color)',
    },
    {
      id: 'answer',
      stage: 'generate',
      icon: '💬',
      label: '답변 출력',
      detail: '"RAG는 검색 증강 생성으로..."',
      color: 'var(--generate-color)',
    },
  ];

  function render() {
    let html = '<div class="pipeline-flow">';
    stages.forEach((s, i) => {
      if (i > 0) html += '<span class="pipe-arrow">→</span>';
      const isActive = i === state.step;
      const isPast = i < state.step;
      const cls = isActive ? 'active animating' : isPast ? 'active' : '';
      html += `
        <div class="pipe-step ${cls}" data-stage="${s.stage}">
          <span class="pipe-step-icon">${s.icon}</span>
          <span class="pipe-step-label">${s.label}</span>
          <span class="pipe-step-sub">${s.detail}</span>
        </div>`;
    });
    html += '</div>';

    // Stage indicator
    const stageNames = {
      retrieve: 'Retrieve (검색)',
      augment: 'Augment (증강)',
      generate: 'Generate (생성)',
    };
    if (state.step >= 0 && state.step < stages.length) {
      const cur = stages[state.step];
      html += `<div style="text-align:center; margin-top:16px; font-size:0.9rem; color:${cur.color}; font-weight:600;">
        📍 현재 단계: ${stageNames[cur.stage] || cur.stage}
      </div>`;
    }

    container.innerHTML = html;
  }

  function advance() {
    state.step++;
    if (state.step >= stages.length) {
      state.playing = false;
      updateButtons();
      if (window.__ragProgress)
        window.__ragProgress.save('section-rag-pipeline');
      return;
    }
    render();
    if (state.playing) {
      state.timer = setTimeout(advance, 1200 / state.speed);
    }
  }

  function play() {
    if (state.playing) return;
    state.playing = true;
    if (state.step >= stages.length - 1) state.step = -1;
    updateButtons();
    advance();
  }

  function pause() {
    state.playing = false;
    clearTimeout(state.timer);
    updateButtons();
  }

  function prevStep() {
    pause();
    if (state.step > 0) state.step--;
    else state.step = 0;
    render();
  }

  function nextStep() {
    pause();
    if (state.step < stages.length - 1) {
      state.step++;
      render();
    }
  }

  function reset() {
    pause();
    state.step = -1;
    render();
  }

  function updateButtons() {
    const playBtn = document.getElementById('pipeline-play');
    const pauseBtn = document.getElementById('pipeline-pause');
    if (playBtn) playBtn.disabled = state.playing;
    if (pauseBtn) pauseBtn.disabled = !state.playing;
  }

  // Controls
  document.getElementById('pipeline-play')?.addEventListener('click', play);
  document.getElementById('pipeline-pause')?.addEventListener('click', pause);
  document.getElementById('pipeline-prev')?.addEventListener('click', prevStep);
  document.getElementById('pipeline-next')?.addEventListener('click', nextStep);
  document.getElementById('pipeline-reset')?.addEventListener('click', reset);

  const speedSlider = document.getElementById('pipeline-speed');
  const speedVal = document.getElementById('pipeline-speed-val');
  speedSlider?.addEventListener('input', () => {
    state.speed = parseFloat(speedSlider.value);
    if (speedVal) speedVal.textContent = state.speed + 'x';
  });

  render();
}
