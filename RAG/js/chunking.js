// ===== Chunking: Text Splitting Interactive Demo =====
export function initChunking() {
  const container = document.getElementById('chunking-container');
  if (!container) return;

  const sampleText = `RAG(Retrieval-Augmented Generation)는 대규모 언어 모델의 한계를 극복하기 위해 등장한 아키텍처 패턴이다. LLM은 학습 데이터에 포함된 정보만 활용할 수 있으므로, 학습 이후에 발생한 사건이나 특정 도메인의 전문 지식에 대해서는 정확한 답변을 제공하기 어렵다.

RAG는 이 문제를 해결하기 위해 외부 지식 소스에서 관련 정보를 검색(Retrieve)한 후, 이를 프롬프트에 포함(Augment)하여 LLM이 답변을 생성(Generate)하게 한다. 이 과정은 세 단계로 나뉜다.

첫 번째 단계인 Retrieve에서는 사용자의 질문을 벡터로 변환하고, 벡터 데이터베이스에서 의미적으로 유사한 문서를 검색한다. 이때 코사인 유사도가 주로 사용된다.

두 번째 단계인 Augment에서는 검색된 문서를 프롬프트 템플릿에 삽입한다. "다음 문맥을 참고하여 질문에 답하세요: {context}" 같은 형태의 프롬프트를 구성한다.

세 번째 단계인 Generate에서는 증강된 프롬프트를 LLM에 전달하여 최종 답변을 생성한다. 검색된 문서가 맥락으로 제공되므로 할루시네이션이 크게 줄어든다.

RAG의 핵심 장점은 모델을 재학습하지 않고도 최신 정보를 활용할 수 있다는 것이다. 문서 데이터베이스만 업데이트하면 되므로 비용과 시간이 크게 절약된다.`;

  const CHUNK_COLORS = [
    'rgba(96, 165, 250, 0.2)',
    'rgba(74, 222, 128, 0.2)',
    'rgba(251, 191, 36, 0.2)',
    'rgba(244, 114, 182, 0.2)',
    'rgba(167, 139, 250, 0.2)',
    'rgba(56, 189, 248, 0.2)',
    'rgba(251, 146, 60, 0.2)',
    'rgba(192, 132, 252, 0.2)',
  ];

  const state = {
    chunkSize: 300,
    overlap: 50,
    compareMode: false,
    interacted: false,
  };

  function splitText(text, chunkSize, overlap) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push({ start, end, text: text.slice(start, end) });
      start += chunkSize - overlap;
      if (start >= text.length) break;
    }
    return chunks;
  }

  function renderChunked(targetEl, chunkSize, overlap) {
    const chunks = splitText(sampleText, chunkSize, overlap);

    // Build character-to-chunk mapping
    const charChunks = new Array(sampleText.length).fill(-1);
    const charOverlap = new Array(sampleText.length).fill(false);

    chunks.forEach((chunk, ci) => {
      for (let i = chunk.start; i < chunk.end; i++) {
        if (charChunks[i] >= 0) {
          charOverlap[i] = true;
        }
        charChunks[i] = ci;
      }
    });

    // Build HTML spans
    let html = '<div class="chunk-text-display">';
    let currentChunk = -1;
    let inOverlap = false;

    for (let i = 0; i < sampleText.length; i++) {
      const ci = charChunks[i];
      const isOv = charOverlap[i];
      const char = sampleText[i];

      if (ci !== currentChunk || isOv !== inOverlap) {
        if (currentChunk >= 0) html += '</span>';
        const bg =
          ci >= 0 ? CHUNK_COLORS[ci % CHUNK_COLORS.length] : 'transparent';
        const cls = isOv ? 'chunk-span chunk-overlap' : 'chunk-span';
        html += `<span class="${cls}" style="background:${bg}" title="청크 #${ci + 1}${isOv ? ' (오버랩)' : ''}">`;
        currentChunk = ci;
        inOverlap = isOv;
      }

      if (char === '\n') html += '<br>';
      else html += char;
    }
    if (currentChunk >= 0) html += '</span>';
    html += '</div>';

    // Stats
    html += `<div class="chunk-stats">
      <span>총 청크 수: <span class="chunk-stat-val">${chunks.length}</span></span>
      <span>chunk_size: <span class="chunk-stat-val">${chunkSize}</span></span>
      <span>overlap: <span class="chunk-stat-val">${overlap}</span></span>
      <span>평균 청크 길이: <span class="chunk-stat-val">${Math.round(chunks.reduce((s, c) => s + c.text.length, 0) / chunks.length)}</span></span>
    </div>`;

    targetEl.innerHTML = html;
  }

  function render() {
    renderChunked(container, state.chunkSize, state.overlap);
  }

  function renderCompare() {
    const compareEl = document.getElementById('chunk-compare-container');
    if (!compareEl) return;
    const sizeA = 200;
    const sizeB = 500;
    compareEl.innerHTML = `
      <div class="compare-panel compare-panel-a">
        <div class="compare-panel-title">chunk_size = ${sizeA}</div>
        <div id="chunk-compare-a"></div>
      </div>
      <div class="compare-panel compare-panel-b">
        <div class="compare-panel-title">chunk_size = ${sizeB}</div>
        <div id="chunk-compare-b"></div>
      </div>`;
    renderChunked(
      document.getElementById('chunk-compare-a'),
      sizeA,
      state.overlap,
    );
    renderChunked(
      document.getElementById('chunk-compare-b'),
      sizeB,
      state.overlap,
    );
  }

  // Controls
  const sizeSlider = document.getElementById('chunk-size');
  const sizeVal = document.getElementById('chunk-size-val');
  const overlapSlider = document.getElementById('chunk-overlap');
  const overlapVal = document.getElementById('chunk-overlap-val');

  sizeSlider?.addEventListener('input', () => {
    state.chunkSize = parseInt(sizeSlider.value);
    if (sizeVal) sizeVal.textContent = state.chunkSize;
    markInteracted();
    render();
    updateCode();
  });

  overlapSlider?.addEventListener('input', () => {
    state.overlap = parseInt(overlapSlider.value);
    if (state.overlap >= state.chunkSize) {
      state.overlap = state.chunkSize - 10;
      overlapSlider.value = state.overlap;
    }
    if (overlapVal) overlapVal.textContent = state.overlap;
    markInteracted();
    render();
    updateCode();
  });

  // Compare toggle
  const compareBtn = document.getElementById('chunk-compare-btn');
  compareBtn?.addEventListener('click', () => {
    state.compareMode = !state.compareMode;
    compareBtn.classList.toggle('active', state.compareMode);
    const compareEl = document.getElementById('chunk-compare-container');
    if (compareEl) {
      compareEl.style.display = state.compareMode ? 'grid' : 'none';
      if (state.compareMode) renderCompare();
    }
    container.style.display = state.compareMode ? 'none' : '';
  });

  function markInteracted() {
    if (!state.interacted) {
      state.interacted = true;
      if (window.__ragProgress) window.__ragProgress.save('section-chunking');
    }
  }

  function updateCode() {
    const codeEl = document.getElementById('chunking-code');
    if (!codeEl) return;
    codeEl.textContent = `from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=${state.chunkSize},
    chunk_overlap=${state.overlap},
    separators=["\\n\\n", "\\n", ". ", " ", ""],
)

chunks = splitter.split_text(document_text)
print(f"총 {len(chunks)}개 청크 생성")`;
  }

  render();
}
