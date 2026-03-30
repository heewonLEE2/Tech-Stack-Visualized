// ===== LangGraph: State Graph Visualization =====
export function initLangGraph() {
  const canvas = document.getElementById('langgraph-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stateDisplay = document.getElementById('graph-state-display');

  const graphPresets = {
    simple: {
      label: '단순 체인',
      nodes: [
        { id: 'start', x: 80, y: 200, label: 'START', color: '#94a3b8', r: 25 },
        {
          id: 'retrieve',
          x: 250,
          y: 200,
          label: 'retrieve',
          color: '#38bdf8',
          r: 30,
        },
        {
          id: 'generate',
          x: 450,
          y: 200,
          label: 'generate',
          color: '#c084fc',
          r: 30,
        },
        { id: 'end', x: 620, y: 200, label: 'END', color: '#94a3b8', r: 25 },
      ],
      edges: [
        { from: 'start', to: 'retrieve' },
        { from: 'retrieve', to: 'generate' },
        { from: 'generate', to: 'end' },
      ],
      stateSteps: [
        '{ question: "RAG란?" }',
        '{ question: "RAG란?", docs: [Doc1, Doc2] }',
        '{ question: "RAG란?", docs: [...], answer: "RAG는..." }',
        '{ answer: "RAG는 검색 증강 생성으로..." } → 완료',
      ],
      code: `graph = StateGraph(State)
graph.add_node("retrieve", retrieve)
graph.add_node("generate", generate)
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", END)
graph.set_entry_point("retrieve")`,
    },
    branch: {
      label: '조건 분기',
      nodes: [
        { id: 'start', x: 80, y: 200, label: 'START', color: '#94a3b8', r: 25 },
        {
          id: 'classify',
          x: 230,
          y: 200,
          label: 'classify',
          color: '#fbbf24',
          r: 30,
        },
        {
          id: 'retrieve',
          x: 420,
          y: 110,
          label: 'retrieve',
          color: '#38bdf8',
          r: 30,
        },
        {
          id: 'web_search',
          x: 420,
          y: 290,
          label: 'web_search',
          color: '#fb923c',
          r: 30,
        },
        {
          id: 'generate',
          x: 560,
          y: 200,
          label: 'generate',
          color: '#c084fc',
          r: 30,
        },
        { id: 'end', x: 670, y: 200, label: 'END', color: '#94a3b8', r: 25 },
      ],
      edges: [
        { from: 'start', to: 'classify' },
        {
          from: 'classify',
          to: 'retrieve',
          label: 'DB 문서',
          conditional: true,
        },
        {
          from: 'classify',
          to: 'web_search',
          label: '웹 검색',
          conditional: true,
        },
        { from: 'retrieve', to: 'generate' },
        { from: 'web_search', to: 'generate' },
        { from: 'generate', to: 'end' },
      ],
      stateSteps: [
        '{ question: "최신 AI 트렌드?" }',
        '{ question: "...", route: "web_search" }',
        '{ question: "...", docs: [WebResult1, ...] }',
        '{ question: "...", docs: [...], answer: "2024년 AI..." }',
        '{ answer: "2024년 AI 트렌드는..." } → 완료',
      ],
      code: `def route(state):
    if state["route"] == "vectorstore":
        return "retrieve"
    return "web_search"

graph.add_conditional_edges(
    "classify",
    route,
    {"retrieve": "retrieve", "web_search": "web_search"},
)`,
    },
    agent: {
      label: 'Agent 루프',
      nodes: [
        { id: 'start', x: 80, y: 200, label: 'START', color: '#94a3b8', r: 25 },
        {
          id: 'agent',
          x: 270,
          y: 200,
          label: 'agent',
          color: '#a78bfa',
          r: 35,
        },
        {
          id: 'tools',
          x: 470,
          y: 200,
          label: 'tools',
          color: '#f472b6',
          r: 30,
        },
        { id: 'end', x: 620, y: 200, label: 'END', color: '#94a3b8', r: 25 },
      ],
      edges: [
        { from: 'start', to: 'agent' },
        { from: 'agent', to: 'tools', label: '도구 호출', conditional: true },
        { from: 'agent', to: 'end', label: '최종 답변', conditional: true },
        { from: 'tools', to: 'agent', loop: true },
      ],
      stateSteps: [
        '{ messages: [HumanMessage("날씨 알려줘")] }',
        '{ messages: [..., AIMessage(tool_calls: [weather()])] }',
        '{ messages: [..., ToolMessage("서울 15°C")] }',
        '{ messages: [..., AIMessage("서울 날씨는 15°C...")] } → 완료',
      ],
      code: `def should_continue(state):
    last = state["messages"][-1]
    if last.tool_calls:
        return "tools"
    return END

graph.add_conditional_edges(
    "agent", should_continue, {"tools": "tools", END: END}
)
graph.add_edge("tools", "agent")  # 루프!`,
    },
  };

  const state = {
    preset: 'simple',
    stepIndex: -1,
    playing: false,
    timer: null,
    interacted: false,
  };

  function getGraph() {
    return graphPresets[state.preset];
  }

  function getNode(id) {
    return getGraph().nodes.find((n) => n.id === id);
  }

  function render() {
    const graph = getGraph();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Determine active path for current step
    const activeNodes = new Set();
    if (state.stepIndex >= 0) {
      const nodeIds = graph.nodes.map((n) => n.id);
      for (let i = 0; i <= Math.min(state.stepIndex, nodeIds.length - 1); i++) {
        activeNodes.add(nodeIds[i]);
      }
    }

    // Draw edges
    graph.edges.forEach((edge) => {
      const from = getNode(edge.from);
      const to = getNode(edge.to);
      if (!from || !to) return;

      ctx.beginPath();
      if (edge.loop) {
        // Draw curved loop edge
        const midY = Math.min(from.y, to.y) - 60;
        ctx.moveTo(from.x + from.r, from.y);
        ctx.bezierCurveTo(
          from.x + 60,
          midY,
          to.x - 60,
          midY,
          to.x - to.r,
          to.y,
        );
      } else {
        ctx.moveTo(from.x + from.r, from.y);
        ctx.lineTo(to.x - to.r, to.y);
      }

      const isEdgeActive = activeNodes.has(from.id) && activeNodes.has(to.id);
      ctx.strokeStyle = isEdgeActive
        ? 'rgba(96, 165, 250, 0.8)'
        : 'rgba(160, 160, 176, 0.3)';
      ctx.lineWidth = isEdgeActive ? 2.5 : 1.5;

      if (edge.conditional) {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const ax = to.x - to.r * Math.cos(angle);
      const ay = to.y - to.r * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - 10 * Math.cos(angle - 0.3),
        ay - 10 * Math.sin(angle - 0.3),
      );
      ctx.lineTo(
        ax - 10 * Math.cos(angle + 0.3),
        ay - 10 * Math.sin(angle + 0.3),
      );
      ctx.closePath();
      ctx.fillStyle = isEdgeActive
        ? 'rgba(96, 165, 250, 0.8)'
        : 'rgba(160, 160, 176, 0.3)';
      ctx.fill();

      // Edge label
      if (edge.label) {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 10;
        ctx.font = '11px "Noto Sans KR"';
        ctx.fillStyle = edge.conditional
          ? 'var(--chunk-color)'
          : 'rgba(160, 160, 176, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillStyle = isEdgeActive ? '#fbbf24' : 'rgba(160, 160, 176, 0.5)';
        ctx.fillText(edge.label, mx, my);
      }
    });

    // Draw nodes
    graph.nodes.forEach((node) => {
      const isActive = activeNodes.has(node.id);
      const isCurrent =
        state.stepIndex >= 0 &&
        graph.nodes[Math.min(state.stepIndex, graph.nodes.length - 1)]?.id ===
          node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);

      if (isCurrent) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 16;
      }

      ctx.fillStyle = isActive ? node.color + '33' : 'rgba(15, 52, 96, 0.6)';
      ctx.fill();

      ctx.strokeStyle = isActive ? node.color : 'rgba(160, 160, 176, 0.3)';
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Node label
      ctx.font = `${isCurrent ? '13' : '12'}px "Noto Sans KR"`;
      ctx.fillStyle = isActive ? node.color : 'rgba(160, 160, 176, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });

    // Update state display
    if (stateDisplay) {
      const graph = getGraph();
      if (state.stepIndex >= 0 && graph.stateSteps[state.stepIndex]) {
        stateDisplay.innerHTML = `<span style="color:var(--text-secondary);">Step ${state.stepIndex + 1}:</span> ${graph.stateSteps[state.stepIndex]}`;
      } else {
        stateDisplay.innerHTML =
          '<span style="color:var(--text-secondary);">▶ 재생 버튼을 눌러 상태 변화를 관찰하세요.</span>';
      }
    }
  }

  function play() {
    if (state.playing) return;
    state.playing = true;
    state.stepIndex = -1;
    const graph = getGraph();

    const advance = () => {
      state.stepIndex++;
      if (state.stepIndex >= graph.stateSteps.length) {
        state.playing = false;
        if (!state.interacted) {
          state.interacted = true;
          if (window.__ragProgress)
            window.__ragProgress.save('section-langgraph');
        }
        render();
        return;
      }
      render();
      state.timer = setTimeout(advance, 1000);
    };
    advance();
  }

  function step() {
    if (state.playing) {
      state.playing = false;
      clearTimeout(state.timer);
    }
    const graph = getGraph();
    if (state.stepIndex < graph.stateSteps.length - 1) {
      state.stepIndex++;
      render();
    }
  }

  function reset() {
    state.playing = false;
    clearTimeout(state.timer);
    state.stepIndex = -1;
    render();
  }

  // Preset buttons
  document.querySelectorAll('[data-graph]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('[data-graph]')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.preset = btn.dataset.graph;
      reset();
      updateCode();
    });
  });

  document.getElementById('lg-play')?.addEventListener('click', play);
  document.getElementById('lg-step')?.addEventListener('click', step);
  document.getElementById('lg-reset')?.addEventListener('click', reset);

  function updateCode() {
    const codeEl = document.getElementById('langgraph-code');
    if (!codeEl) return;
    const graph = getGraph();
    codeEl.textContent = `from langgraph.graph import StateGraph, END
from typing import TypedDict

class State(TypedDict):
    question: str
    answer: str

${graph.code}

app = graph.compile()
result = app.invoke({"question": "RAG란?"})`;
  }

  render();
}
