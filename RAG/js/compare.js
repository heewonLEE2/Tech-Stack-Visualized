// ===== Compare: RAG vs LangChain vs LangGraph =====
export function initCompare() {
  const container = document.getElementById('compare-container');
  if (!container) return;

  const concepts = [
    {
      name: 'RAG',
      color: 'var(--rag-color)',
      type: '아키텍처 패턴',
      purpose: '외부 지식을 검색하여 LLM 생성 품질 향상',
      when: '문서 기반 Q&A, 지식 검색 챗봇',
      complexity: '낮음',
      components: 'Embedding, Vector Store, Retriever, Prompt, LLM',
    },
    {
      name: 'LangChain',
      color: 'var(--lc-color)',
      type: '구현 프레임워크',
      purpose: 'LLM 앱 개발을 위한 표준 컴포넌트와 LCEL 체인 제공',
      when: '빠른 프로토타이핑, 여러 LLM/벡터 스토어 전환',
      complexity: '중간',
      components: 'ChatModels, Prompts, Parsers, Retrievers, LCEL',
    },
    {
      name: 'LangGraph',
      color: 'var(--lg-color)',
      type: '에이전트 프레임워크',
      purpose: '상태 그래프로 복잡한 AI 워크플로우(분기, 루프) 구현',
      when: '멀티턴 에이전트, 도구 호출, 조건부 워크플로우',
      complexity: '높음',
      components: 'StateGraph, Node, Edge, Conditional Edge, Cycle',
    },
  ];

  const rows = ['type', 'purpose', 'when', 'complexity', 'components'];
  const rowLabels = {
    type: '유형',
    purpose: '목적',
    when: '사용 시기',
    complexity: '복잡도',
    components: '핵심 구성요소',
  };

  // Comparison table
  let html = '<h3>개념 비교표</h3>';
  html += '<div style="overflow-x: auto;">';
  html +=
    '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">';

  // Header
  html += '<thead><tr>';
  html +=
    '<th style="padding:12px; border-bottom:2px solid var(--border-color); text-align:left; color:var(--text-secondary);"></th>';
  concepts.forEach((c) => {
    html += `<th style="padding:12px; border-bottom:2px solid var(--border-color); text-align:center; color:${c.color}; font-weight:700; font-size:1rem;">${c.name}</th>`;
  });
  html += '</tr></thead>';

  // Body
  html += '<tbody>';
  rows.forEach((row) => {
    html += '<tr>';
    html += `<td style="padding:10px 12px; border-bottom:1px solid var(--border-color); color:var(--text-secondary); font-weight:600; white-space:nowrap;">${rowLabels[row]}</td>`;
    concepts.forEach((c) => {
      html += `<td style="padding:10px 12px; border-bottom:1px solid var(--border-color); color:var(--text-primary); text-align:center;">${c[row]}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  // Decision flowchart
  html += '<h3 style="margin-top:32px;">의사결정 가이드</h3>';
  html += '<div class="decision-tree">';
  html += `
    <div class="decision-node" style="border-color:var(--text-secondary);">
      ❓ LLM 앱을 만들고 싶다
    </div>
    <div class="decision-arrow">↓</div>
    <div class="decision-node" style="border-color:var(--chunk-color); color:var(--chunk-color);">
      외부 문서/데이터 검색이 필요한가?
    </div>
    <div style="display:flex; gap:40px; align-items:flex-start; justify-content:center; flex-wrap:wrap;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="color:var(--embed-color); font-size:0.85rem; font-weight:600;">Yes</span>
        <div class="decision-arrow">↓</div>
        <div class="decision-node highlight-rag">
          📘 RAG 패턴 적용
        </div>
        <div class="decision-arrow">↓</div>
        <div class="decision-node" style="border-color:var(--chunk-color); color:var(--chunk-color);">
          조건 분기/루프가 필요한가?
        </div>
        <div style="display:flex; gap:24px; justify-content:center;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <span style="color:var(--embed-color); font-size:0.8rem;">No</span>
            <div class="decision-node highlight-lc">⛓ LangChain LCEL</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <span style="color:var(--accent); font-size:0.8rem;">Yes</span>
            <div class="decision-node highlight-lg">⬡ LangGraph</div>
          </div>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="color:var(--accent); font-size:0.85rem; font-weight:600;">No</span>
        <div class="decision-arrow">↓</div>
        <div class="decision-node" style="border-color:var(--chunk-color); color:var(--chunk-color);">
          복잡한 워크플로우가 필요한가?
        </div>
        <div style="display:flex; gap:24px; justify-content:center;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <span style="color:var(--embed-color); font-size:0.8rem;">No</span>
            <div class="decision-node highlight-lc">⛓ LangChain LCEL</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <span style="color:var(--accent); font-size:0.8rem;">Yes</span>
            <div class="decision-node highlight-lg">⬡ LangGraph</div>
          </div>
        </div>
      </div>
    </div>
  `;
  html += '</div>';

  container.innerHTML = html;

  if (window.__ragProgress) window.__ragProgress.save('section-compare');
}
