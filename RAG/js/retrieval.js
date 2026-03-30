// ===== Retrieval: Similarity Search & Ranking Visualization =====
export function initRetrieval() {
  const container = document.getElementById('retrieval-container');
  if (!container) return;

  const documents = [
    {
      id: 1,
      title: 'RAG는 검색 증강 생성의 약자로...',
      scores: { vector: 0.92, bm25: 0.85, hybrid: 0.95 },
    },
    {
      id: 2,
      title: 'LLM은 대규모 언어 모델을 의미...',
      scores: { vector: 0.78, bm25: 0.45, hybrid: 0.68 },
    },
    {
      id: 3,
      title: '벡터 데이터베이스는 임베딩을 저장...',
      scores: { vector: 0.85, bm25: 0.3, hybrid: 0.72 },
    },
    {
      id: 4,
      title: '프롬프트 엔지니어링이란 LLM에...',
      scores: { vector: 0.65, bm25: 0.72, hybrid: 0.7 },
    },
    {
      id: 5,
      title: 'Retrieval은 정보 검색을 뜻하며...',
      scores: { vector: 0.88, bm25: 0.9, hybrid: 0.93 },
    },
    {
      id: 6,
      title: '파인튜닝은 모델을 특정 태스크에...',
      scores: { vector: 0.42, bm25: 0.55, hybrid: 0.48 },
    },
    {
      id: 7,
      title: '토큰은 텍스트의 최소 처리 단위...',
      scores: { vector: 0.35, bm25: 0.65, hybrid: 0.45 },
    },
    {
      id: 8,
      title: '청킹은 문서를 작은 조각으로 나...',
      scores: { vector: 0.72, bm25: 0.38, hybrid: 0.62 },
    },
    {
      id: 9,
      title: '코사인 유사도는 벡터 간 각도를...',
      scores: { vector: 0.81, bm25: 0.25, hybrid: 0.65 },
    },
    {
      id: 10,
      title: '오늘 날씨가 매우 좋습니다. 기...',
      scores: { vector: 0.15, bm25: 0.05, hybrid: 0.08 },
    },
  ];

  const state = {
    k: 3,
    method: 'vector',
    compareMode: false,
    interacted: false,
  };

  function getSorted() {
    return [...documents].sort(
      (a, b) => b.scores[state.method] - a.scores[state.method],
    );
  }

  function renderBars(targetEl, sorted, k, method) {
    let html = '<div class="retrieval-bars">';
    sorted.forEach((doc, i) => {
      const score = doc.scores[method];
      const isTopK = i < k;
      const pct = Math.round(score * 100);
      html += `
        <div class="retrieval-bar-row ${isTopK ? 'top-k' : ''}">
          <span class="retrieval-bar-label" title="${doc.title}">${doc.title}</span>
          <div class="retrieval-bar-track">
            <div class="retrieval-bar-fill" style="width:${pct}%; animation: barGrow 0.5s ease;">
              ${score.toFixed(2)}
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
    html += `<div class="chunk-stats" style="margin-top:16px;">
      <span>검색 방식: <span class="chunk-stat-val">${method.toUpperCase()}</span></span>
      <span>Top-K: <span class="chunk-stat-val">${k}</span></span>
      <span>선택된 문서: <span class="chunk-stat-val">${sorted
        .slice(0, k)
        .map((d) => '#' + d.id)
        .join(', ')}</span></span>
    </div>`;
    targetEl.innerHTML = html;
  }

  function render() {
    const sorted = getSorted();
    renderBars(container, sorted, state.k, state.method);
  }

  function renderCompare() {
    const compareContainer = document.getElementById(
      'retrieval-compare-container',
    );
    if (!compareContainer) return;

    const methods = ['vector', 'bm25'];
    compareContainer.innerHTML = methods
      .map((m, i) => {
        const panel = document.createElement('div');
        const sorted = [...documents].sort((a, b) => b.scores[m] - a.scores[m]);
        let html = `<div class="compare-panel compare-panel-${i === 0 ? 'a' : 'b'}">
        <div class="compare-panel-title">${m.toUpperCase()}</div>
        <div class="retrieval-bars">`;
        sorted.forEach((doc, j) => {
          const score = doc.scores[m];
          const pct = Math.round(score * 100);
          html += `
          <div class="retrieval-bar-row ${j < state.k ? 'top-k' : ''}">
            <span class="retrieval-bar-label" title="${doc.title}">${doc.title}</span>
            <div class="retrieval-bar-track">
              <div class="retrieval-bar-fill" style="width:${pct}%;">${score.toFixed(2)}</div>
            </div>
          </div>`;
        });
        html += '</div></div>';
        return html;
      })
      .join('');
  }

  // Controls: K slider
  const kSlider = document.getElementById('retrieval-k');
  const kVal = document.getElementById('retrieval-k-val');
  kSlider?.addEventListener('input', () => {
    state.k = parseInt(kSlider.value);
    if (kVal) kVal.textContent = state.k;
    markInteracted();
    render();
    if (state.compareMode) renderCompare();
    updateCode();
  });

  // Controls: Search method buttons
  document.querySelectorAll('[data-search]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('[data-search]')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.method = btn.dataset.search;
      markInteracted();
      render();
      updateCode();
    });
  });

  // Compare toggle
  const compareBtn = document.getElementById('retrieval-compare-btn');
  compareBtn?.addEventListener('click', () => {
    state.compareMode = !state.compareMode;
    compareBtn.classList.toggle('active', state.compareMode);
    const compareEl = document.getElementById('retrieval-compare-container');
    if (compareEl) {
      compareEl.style.display = state.compareMode ? 'grid' : 'none';
      if (state.compareMode) renderCompare();
    }
    container.style.display = state.compareMode ? 'none' : '';
  });

  function markInteracted() {
    if (!state.interacted) {
      state.interacted = true;
      if (window.__ragProgress) window.__ragProgress.save('section-retrieval');
    }
  }

  function updateCode() {
    const codeEl = document.getElementById('retrieval-code');
    if (!codeEl) return;
    const methodMap = {
      vector: `# Vector Search
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": ${state.k}}
)`,
      bm25: `# BM25 Keyword Search
from langchain_community.retrievers import BM25Retriever

retriever = BM25Retriever.from_documents(docs, k=${state.k})`,
      hybrid: `# Hybrid Search (Vector + BM25 RRF)
from langchain.retrievers import EnsembleRetriever

vector_retriever = vectorstore.as_retriever(search_kwargs={"k": ${state.k}})
bm25_retriever = BM25Retriever.from_documents(docs, k=${state.k})

retriever = EnsembleRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    weights=[0.5, 0.5],
)`,
    };
    codeEl.textContent =
      methodMap[state.method] +
      `

results = retriever.invoke("RAG의 장점은?")
for doc in results:
    print(doc.page_content[:100])`;
  }

  render();
}
