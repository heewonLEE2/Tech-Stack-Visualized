// ===== Full Data Flow Animation =====
import { fmt } from './matrix.js';

const STAGES = [
  {
    id: 'input',
    label: '입력 토큰',
    color: '#5C6BC0',
    desc: '소스 문장의 토큰을 입력합니다',
  },
  {
    id: 'embed',
    label: '임베딩 + PE',
    color: '#7986CB',
    desc: '토큰을 벡터로 변환하고 위치 인코딩을 더합니다',
  },
  {
    id: 'enc-self-attn',
    label: '인코더 Self-Attention',
    color: '#AB47BC',
    desc: 'Q=K=V, 셀프 어텐션으로 토큰 간 관계를 학습합니다',
  },
  {
    id: 'enc-addnorm1',
    label: 'Add & Norm',
    color: '#EF5350',
    desc: '잔차 연결 + LayerNorm',
  },
  {
    id: 'enc-ffn',
    label: '인코더 FFN',
    color: '#FFA726',
    desc: '각 위치별 2층 피드포워드 네트워크',
  },
  {
    id: 'enc-addnorm2',
    label: 'Add & Norm',
    color: '#EF5350',
    desc: '잔차 연결 + LayerNorm',
  },
  {
    id: 'enc-output',
    label: '인코더 출력',
    color: '#7E57C2',
    desc: '인코더의 최종 표현이 디코더로 전달됩니다',
  },
  {
    id: 'dec-input',
    label: '디코더 입력',
    color: '#5C6BC0',
    desc: '타겟 시퀀스(shifted right)를 입력합니다',
  },
  {
    id: 'dec-embed',
    label: '디코더 임베딩+PE',
    color: '#7986CB',
    desc: '타겟 토큰을 벡터로 변환하고 위치 인코딩을 더합니다',
  },
  {
    id: 'dec-masked-attn',
    label: '디코더 Masked Attn',
    color: '#80CBC4',
    desc: '미래 토큰을 차단하는 마스크드 셀프 어텐션',
  },
  {
    id: 'dec-addnorm1',
    label: 'Add & Norm',
    color: '#EF5350',
    desc: '잔차 연결 + LayerNorm',
  },
  {
    id: 'dec-cross-attn',
    label: 'Cross-Attention',
    color: '#4DB6AC',
    desc: 'Q=디코더, K/V=인코더 출력',
  },
  {
    id: 'dec-addnorm2',
    label: 'Add & Norm',
    color: '#EF5350',
    desc: '잔차 연결 + LayerNorm',
  },
  {
    id: 'dec-ffn',
    label: '디코더 FFN',
    color: '#FFA726',
    desc: '각 위치별 2층 피드포워드 네트워크',
  },
  {
    id: 'dec-addnorm3',
    label: 'Add & Norm',
    color: '#EF5350',
    desc: '잔차 연결 + LayerNorm',
  },
  {
    id: 'linear',
    label: 'Linear',
    color: '#FF7043',
    desc: '보캡 크기로 선형 변환',
  },
  {
    id: 'softmax',
    label: 'Softmax',
    color: '#FF5252',
    desc: '확률 분포로 변환',
  },
  {
    id: 'output',
    label: '출력 토큰',
    color: '#26A69A',
    desc: '가장 높은 확률의 토큰을 선택합니다',
  },
];

export function initDataflow() {
  const container = document.getElementById('dataflow-container');
  const detailContainer = document.getElementById('dataflow-detail');
  const detailContent = document.getElementById('dataflow-detail-content');
  const playBtn = document.getElementById('df-play');
  const pauseBtn = document.getElementById('df-pause');
  const resetBtn = document.getElementById('df-reset');
  const speedSlider = document.getElementById('df-speed');
  const speedVal = document.getElementById('df-speed-val');

  let currentStage = -1;
  let animId = null;
  let lastTime = 0;
  let speed = 1;

  function render() {
    container.innerHTML = '';
    const svgW = 900,
      svgH = 100;
    const stageW = 50,
      gapX = 6;
    const totalW = STAGES.length * (stageW + gapX);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${totalW + 20} ${svgH}`);
    svg.setAttribute('width', '100%');
    svg.style.maxWidth = totalW + 20 + 'px';

    // Defs for arrow
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<marker id="df-arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <polygon points="0 0, 6 2, 0 4" fill="#666"/>
    </marker>`;
    svg.appendChild(defs);

    STAGES.forEach((stage, i) => {
      const x = 10 + i * (stageW + gapX);
      const isActive = i <= currentStage;
      const isCurrent = i === currentStage;

      // Block
      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      rect.setAttribute('x', x);
      rect.setAttribute('y', 20);
      rect.setAttribute('width', stageW);
      rect.setAttribute('height', 40);
      rect.setAttribute('rx', 4);
      rect.setAttribute('fill', isActive ? stage.color : '#333');
      rect.setAttribute('opacity', isActive ? 1 : 0.3);
      rect.setAttribute('stroke', isCurrent ? '#fff' : 'none');
      rect.setAttribute('stroke-width', isCurrent ? 2 : 0);
      rect.style.cursor = 'pointer';
      rect.setAttribute('data-tooltip', stage.desc);
      rect.addEventListener('click', () => showDetail(i));
      svg.appendChild(rect);

      // Label (rotated)
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
      text.setAttribute('x', x + stageW / 2);
      text.setAttribute('y', 80);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', isActive ? '#ddd' : '#555');
      text.setAttribute('font-size', '7');
      text.setAttribute('font-family', 'Noto Sans KR');
      text.textContent = stage.label;
      svg.appendChild(text);

      // Arrow
      if (i < STAGES.length - 1) {
        const arrow = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line',
        );
        arrow.setAttribute('x1', x + stageW);
        arrow.setAttribute('y1', 40);
        arrow.setAttribute('x2', x + stageW + gapX);
        arrow.setAttribute('y2', 40);
        arrow.setAttribute('stroke', isActive ? '#888' : '#444');
        arrow.setAttribute('stroke-width', 1);
        arrow.setAttribute('marker-end', 'url(#df-arrow)');
        svg.appendChild(arrow);
      }

      // Encoder/Decoder group indicator
      if (i === 0) {
        const g = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );
        g.setAttribute('x', x);
        g.setAttribute('y', 14);
        g.setAttribute('fill', '#7E57C2');
        g.setAttribute('font-size', '9');
        g.textContent = '◀ Encoder';
        svg.appendChild(g);
      }
      if (i === 9) {
        const g = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );
        g.setAttribute('x', x);
        g.setAttribute('y', 14);
        g.setAttribute('fill', '#26A69A');
        g.setAttribute('font-size', '9');
        g.textContent = '◀ Decoder';
        svg.appendChild(g);
      }
    });

    container.appendChild(svg);
  }

  function showDetail(idx) {
    const stage = STAGES[idx];
    detailContainer.style.display = 'block';
    detailContent.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:16px;height:16px;border-radius:3px;background:${stage.color};"></div>
        <strong style="color:var(--text-heading)">${stage.label}</strong>
      </div>
      <p style="color:var(--text-secondary);font-size:0.85rem;">${stage.desc}</p>
      <p style="color:#666;font-size:0.8rem;margin-top:8px;">단계: ${idx + 1} / ${STAGES.length}</p>
    `;
  }

  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;

    if (delta > 1000 / speed) {
      lastTime = timestamp;
      if (currentStage < STAGES.length - 1) {
        currentStage++;
        render();
        showDetail(currentStage);
        if (
          currentStage === STAGES.length - 1 &&
          window.__transformerProgress
        ) {
          window.__transformerProgress.save('section-dataflow');
        }
      } else {
        stop();
        return;
      }
    }

    animId = requestAnimationFrame(animate);
  }

  function play() {
    if (currentStage >= STAGES.length - 1) currentStage = -1;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    lastTime = 0;
    animId = requestAnimationFrame(animate);
  }

  function stop() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function reset() {
    stop();
    currentStage = -1;
    detailContainer.style.display = 'none';
    render();
  }

  playBtn.addEventListener('click', play);
  pauseBtn.addEventListener('click', stop);
  resetBtn.addEventListener('click', reset);
  speedSlider.addEventListener('input', () => {
    speed = parseFloat(speedSlider.value);
    speedVal.textContent = speed + 'x';
  });

  render();
}
