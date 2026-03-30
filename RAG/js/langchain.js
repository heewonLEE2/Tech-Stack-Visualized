// ===== LangChain: LCEL Chain Visualization =====
export function initLangChain() {
  const container = document.getElementById('langchain-container');
  if (!container) return;

  const presets = {
    basic: {
      label: '기본 체인',
      blocks: [
        {
          type: 'prompt',
          label: 'PromptTemplate',
          sub: '프롬프트 구성',
          icon: '📋',
        },
        { type: 'llm', label: 'ChatOpenAI', sub: 'GPT-4', icon: '🧠' },
        {
          type: 'parser',
          label: 'StrOutputParser',
          sub: '텍스트 추출',
          icon: '📤',
        },
      ],
      code: `# 기본 체인: Prompt → LLM → Parser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template(
    "{topic}에 대해 설명해줘."
)
llm = ChatOpenAI(model="gpt-4")
parser = StrOutputParser()

chain = prompt | llm | parser
result = chain.invoke({"topic": "RAG"})`,
    },
    rag: {
      label: 'RAG 체인',
      blocks: [
        { type: 'retriever', label: 'Retriever', sub: '문서 검색', icon: '🔎' },
        {
          type: 'prompt',
          label: 'PromptTemplate',
          sub: 'context + question',
          icon: '📋',
        },
        { type: 'llm', label: 'ChatOpenAI', sub: 'GPT-4', icon: '🧠' },
        {
          type: 'parser',
          label: 'StrOutputParser',
          sub: '텍스트 추출',
          icon: '📤',
        },
      ],
      code: `# RAG 체인: Retriever → Prompt → LLM → Parser
from langchain_core.runnables import RunnablePassthrough

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | ChatOpenAI(model="gpt-4")
    | StrOutputParser()
)

result = chain.invoke("RAG란 무엇인가?")`,
    },
    agent: {
      label: 'Agent 체인',
      blocks: [
        {
          type: 'prompt',
          label: 'AgentPrompt',
          sub: '시스템 + 도구 지시',
          icon: '📋',
        },
        {
          type: 'llm',
          label: 'ChatOpenAI',
          sub: 'function calling',
          icon: '🧠',
        },
        {
          type: 'parser',
          label: 'ToolsParser',
          sub: '도구 호출 파싱',
          icon: '🔧',
        },
        {
          type: 'retriever',
          label: 'ToolExecutor',
          sub: '도구 실행',
          icon: '⚡',
        },
      ],
      code: `# Agent 체인: Prompt → LLM → Tools → Execute
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_community.tools import TavilySearchResults

tools = [TavilySearchResults(max_results=3)]
agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

result = executor.invoke({"input": "최신 AI 뉴스 검색해줘"})`,
    },
  };

  const state = {
    preset: 'basic',
    flowIndex: -1,
    animating: false,
    timer: null,
    interacted: false,
  };

  function render() {
    const preset = presets[state.preset];
    let html = `<h3>${preset.label}: LCEL 데이터 흐름</h3>`;
    html += '<div class="chain-flow">';
    preset.blocks.forEach((block, i) => {
      if (i > 0) html += '<span class="chain-pipe">|</span>';
      const isActive = i === state.flowIndex;
      const isPast = i < state.flowIndex;
      const cls = `chain-block ${block.type} ${isActive ? 'active-flow' : ''} ${isPast ? '' : ''}`;
      html += `
        <div class="${cls}" style="${isPast ? 'opacity: 0.5;' : ''}">
          <span style="font-size:1.2rem;">${block.icon}</span>
          <span>${block.label}</span>
          <span class="chain-block-sub">${block.sub}</span>
        </div>`;
    });
    html += '</div>';

    // Data state visualization
    if (state.flowIndex >= 0) {
      const dataStates = {
        basic: [
          '{ topic: "RAG" }',
          '"RAG에 대해 설명해줘."',
          'AIMessage(content="RAG는...")',
          '"RAG는 검색 증강 생성으로..."',
        ],
        rag: [
          '"RAG란 무엇인가?"',
          '[Doc1, Doc2, Doc3] + "RAG란 무엇인가?"',
          '"Context: ...\\nQuestion: RAG란?"',
          'AIMessage(content="RAG는...")',
          '"RAG는 검색 증강 생성으로..."',
        ],
        agent: [
          '{ input: "최신 AI 뉴스" }',
          '"시스템: 당신은 도구를 사용하는 AI..."',
          'function_call: search("AI news")',
          '{ tool: "search", result: [...] }',
          '"최신 AI 뉴스: 1. ..."',
        ],
      };
      const ds = dataStates[state.preset];
      if (ds && ds[state.flowIndex]) {
        html += `<div style="text-align:center; margin-top:12px; padding:10px; background:var(--bg-card); border-radius:8px; font-family: 'Courier New', monospace; font-size:0.8rem; color:var(--embed-color);">
          📦 ${ds[state.flowIndex]}
        </div>`;
      }
    }

    container.innerHTML = html;
  }

  function playFlow() {
    if (state.animating) return;
    state.animating = true;
    state.flowIndex = -1;
    const blocks = presets[state.preset].blocks;

    const advance = () => {
      state.flowIndex++;
      if (state.flowIndex >= blocks.length) {
        state.animating = false;
        state.flowIndex = blocks.length - 1;
        render();
        return;
      }
      render();
      state.timer = setTimeout(advance, 900);
    };
    advance();
  }

  function resetFlow() {
    state.animating = false;
    clearTimeout(state.timer);
    state.flowIndex = -1;
    render();
  }

  // Preset buttons
  document.querySelectorAll('[data-chain]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('[data-chain]')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.preset = btn.dataset.chain;
      state.flowIndex = -1;
      state.animating = false;
      clearTimeout(state.timer);
      if (!state.interacted) {
        state.interacted = true;
        if (window.__ragProgress)
          window.__ragProgress.save('section-langchain');
      }
      render();
      updateCode();
    });
  });

  document.getElementById('lc-play')?.addEventListener('click', playFlow);
  document.getElementById('lc-reset')?.addEventListener('click', resetFlow);

  function updateCode() {
    const codeEl = document.getElementById('langchain-code');
    if (codeEl) codeEl.textContent = presets[state.preset].code;
  }

  render();
}
