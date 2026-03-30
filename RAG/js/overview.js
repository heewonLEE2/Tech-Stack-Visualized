// ===== Overview: Concentric Rings + Pipeline Flow =====
export function initOverview() {
  const container = document.getElementById('overview-container');
  if (!container) return;

  // --- Concentric Rings ---
  const ringsHTML = `
    <div class="rings-container">
      <div class="ring ring-ecosystem" data-target="section-overview">
        <span class="ring-label">AI / LLM 생태계</span>
      </div>
      <div class="ring ring-rag" data-target="section-rag-pipeline">
        <span class="ring-label">RAG</span>
      </div>
      <div class="ring ring-langchain" data-target="section-langchain">
        <span class="ring-label">LangChain</span>
      </div>
      <div class="ring ring-langgraph" data-target="section-langgraph">
        <span class="ring-label">LangGraph</span>
      </div>
    </div>
  `;

  // --- Pipeline Flow ---
  const stages = [
    {
      icon: '📄',
      label: '문서 로드',
      sub: 'Document Loader',
      section: 'section-chunking',
    },
    {
      icon: '✂️',
      label: '청킹',
      sub: 'Text Splitter',
      section: 'section-chunking',
    },
    {
      icon: '🧮',
      label: '임베딩',
      sub: 'Embedding Model',
      section: 'section-embedding',
    },
    {
      icon: '🗄️',
      label: '벡터 저장',
      sub: 'Vector Store',
      section: 'section-embedding',
    },
    {
      icon: '🔎',
      label: '검색',
      sub: 'Retriever',
      section: 'section-retrieval',
    },
    {
      icon: '📋',
      label: '프롬프트',
      sub: 'Prompt Template',
      section: 'section-langchain',
    },
    {
      icon: '🧠',
      label: 'LLM 생성',
      sub: 'Generate',
      section: 'section-rag-pipeline',
    },
  ];

  let pipelineHTML =
    '<h3>RAG 파이프라인 플로우</h3><div class="pipeline-flow">';
  stages.forEach((s, i) => {
    if (i > 0) pipelineHTML += '<span class="pipe-arrow">→</span>';
    pipelineHTML += `
      <div class="pipe-step" data-section="${s.section}">
        <span class="pipe-step-icon">${s.icon}</span>
        <span class="pipe-step-label">${s.label}</span>
        <span class="pipe-step-sub">${s.sub}</span>
      </div>`;
  });
  pipelineHTML += '</div>';

  // Controls
  const controlsHTML = `
    <div class="control-row" style="justify-content: center;">
      <button id="overview-play" class="btn btn-primary">▶ 파이프라인 애니메이션</button>
      <button id="overview-reset" class="btn">↻ 초기화</button>
    </div>
  `;

  container.innerHTML = ringsHTML + controlsHTML + pipelineHTML;

  // --- Ring click → scroll ---
  container.querySelectorAll('.ring[data-target]').forEach((ring) => {
    ring.addEventListener('click', () => {
      const target = document.getElementById(ring.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // --- Pipeline step click → scroll ---
  container.querySelectorAll('.pipe-step[data-section]').forEach((step) => {
    step.addEventListener('click', () => {
      const target = document.getElementById(step.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // --- Pipeline animation ---
  const state = { animating: false, timer: null, currentStep: -1 };
  const stepEls = () => container.querySelectorAll('.pipe-step');

  function highlightStep(index) {
    stepEls().forEach((el, i) => {
      el.classList.toggle('active', i === index);
      el.classList.toggle('animating', i === index);
    });
  }

  function clearSteps() {
    stepEls().forEach((el) => {
      el.classList.remove('active', 'animating');
    });
    state.currentStep = -1;
  }

  function playAnimation() {
    if (state.animating) return;
    state.animating = true;
    state.currentStep = -1;

    const advance = () => {
      state.currentStep++;
      if (state.currentStep >= stages.length) {
        state.animating = false;
        clearSteps();
        if (window.__ragProgress) window.__ragProgress.save('section-overview');
        return;
      }
      highlightStep(state.currentStep);
      state.timer = setTimeout(advance, 800);
    };
    advance();
  }

  function resetAnimation() {
    state.animating = false;
    clearTimeout(state.timer);
    clearSteps();
  }

  container.querySelector('#overview-play').addEventListener('click', () => {
    resetAnimation();
    playAnimation();
  });
  container
    .querySelector('#overview-reset')
    .addEventListener('click', resetAnimation);
}
