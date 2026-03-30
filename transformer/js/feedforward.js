// ===== Add & Norm / FFN Visualization =====
import { renderMatrix, renderOp, fmt } from './matrix.js';

// ===== Add & Norm =====
export function initAddNorm() {
  const container = document.getElementById('addnorm-container');
  container.innerHTML = '';

  // ===== Help Panel =====
  const helpBtn = document.getElementById('addnorm-help-btn');
  const helpPanel = document.getElementById('addnorm-help-panel');

  helpBtn.addEventListener('click', () => {
    const isOpen = helpPanel.style.display !== 'none';
    helpPanel.style.display = isOpen ? 'none' : 'block';
    helpBtn.classList.toggle('active', !isOpen);

    if (!isOpen && !helpPanel.dataset.loaded) {
      helpPanel.dataset.loaded = 'true';
      helpPanel.innerHTML = `
        <h3>Add & Norm이란?</h3>

        <h4>한줄 요약</h4>
        <p>서브레이어(어텐션 또는 FFN)의 출력에 <strong>원래 입력을 더하고(Add)</strong>, 그 결과를 <strong>정규화(Norm)</strong>하는 단계입니다.</p>
        <div class="formula-block">LayerNorm(x + Sublayer(x))</div>

        <h4>왜 두 가지를 같이 하나?</h4>
        <p>Transformer의 인코더/디코더 블록 안에는 이 "Add & Norm"이 <strong>매 서브레이어 뒤마다</strong> 반복됩니다:</p>
        <div class="formula-block">
입력 → [Self-Attention] → <strong style="color:#FFA726">Add & Norm</strong> → [FFN] → <strong style="color:#FFA726">Add & Norm</strong> → 출력
        </div>
        <p>각각 하는 일이 다릅니다:</p>

        <h4>① Add (잔차 연결 / Skip Connection)</h4>
        <div class="analogy">
          <strong>비유:</strong> 시험 답안을 고칠 때, 원본 답안(x)은 그대로 두고 수정사항(Sublayer(x))만 위에 덧붙이는 것과 같습니다. 수정이 잘못되더라도 원본이 남아있죠.
        </div>
        <ul>
          <li><strong>수식:</strong> output = x + Sublayer(x)</li>
          <li>위 다이어그램에서 위쪽으로 휘어진 <strong style="color:var(--q-color)">파란 점선</strong>이 Skip Connection입니다</li>
          <li>입력(x)이 서브레이어를 <strong>건너뛰어서(skip)</strong> 바로 덧셈(⊕)으로 갑니다</li>
        </ul>

        <div class="key-point">
          <strong>왜 필요한가?</strong><br>
          딥러닝에서 레이어가 깊어지면 <strong>기울기 소실(Gradient Vanishing)</strong> 문제가 생깁니다.
          역전파할 때 기울기가 점점 작아져서 앞쪽 레이어가 학습이 안 되는 거죠.<br><br>
          잔차 연결이 있으면 기울기가 skip connection을 통해 <strong>직통 경로</strong>로 전달되어,
          레이어를 6개, 12개 쌓아도 안정적으로 학습할 수 있습니다.<br><br>
          이 아이디어는 <strong>ResNet(2015)</strong>에서 처음 제안되었고, Transformer도 이를 차용했습니다.
        </div>

        <h4>② Norm (레이어 정규화 / LayerNorm)</h4>
        <div class="analogy">
          <strong>비유:</strong> 학생들의 시험 점수를 평균 0, 표준편차 1로 "표준화"하는 것과 같습니다.
          80점이든 30점이든, 전체 분포 기준으로 어디에 있는지로 변환하는 거죠.
        </div>
        <ul>
          <li><strong>수식:</strong> LayerNorm(x) = (x − μ) / σ</li>
          <li>μ = 벡터의 평균, σ = 벡터의 표준편차</li>
          <li>하나의 벡터(하나의 토큰) 안에서 모든 차원의 값을 정규화합니다</li>
        </ul>

        <div class="key-point">
          <strong>왜 필요한가?</strong><br>
          레이어를 거칠 때마다 값의 범위가 들쑥날쑥해집니다. 어떤 차원은 100, 어떤 차원은 0.001이 되면
          학습이 불안정해지죠.<br><br>
          LayerNorm이 매 단계마다 값의 분포를 <strong>"평균=0, 분산=1"</strong> 근처로 맞춰줘서
          학습이 빠르고 안정적으로 진행됩니다.
        </div>

        <h4>위 시각화 읽는 법</h4>
        <ul>
          <li><strong>파란색 x (입력)</strong>: 서브레이어에 들어가기 전 원본 벡터</li>
          <li><strong>보라색 Sublayer(x)</strong>: 어텐션 또는 FFN의 출력</li>
          <li><strong>주황색 합산</strong>: x + Sublayer(x)의 결과</li>
          <li><strong>빨간색 LayerNorm 결과</strong>: 정규화 후 최종 출력</li>
        </ul>
        <p>아래 통계를 보면 LayerNorm 후 평균이 ≈0, 분산이 ≈1이 되는 것을 확인할 수 있습니다.</p>

        <h4>BatchNorm vs LayerNorm</h4>
        <p><strong>Q: 왜 BatchNorm이 아니라 LayerNorm인가요?</strong></p>
        <p>A: BatchNorm은 배치(여러 샘플) 단위로 정규화하는데, 시퀀스 길이가 다른 자연어 처리에서는 배치 통계가 불안정합니다. LayerNorm은 <strong>하나의 샘플 내</strong>에서 정규화하므로 시퀀스 길이나 배치 크기에 영향받지 않습니다.</p>
      `;
    }
  });

  // Example vectors
  const input = [0.5, -0.3, 1.2, 0.1];
  const sublayerOut = [0.2, 0.8, -0.4, 0.6];
  const added = input.map((v, i) => +(v + sublayerOut[i]).toFixed(2));

  // LayerNorm
  const mean = added.reduce((a, b) => a + b, 0) / added.length;
  const variance = added.reduce((a, b) => a + (b - mean) ** 2, 0) / added.length;
  const std = Math.sqrt(variance + 1e-6);
  const normed = added.map(v => +((v - mean) / std).toFixed(3));

  // ===== Skip Connection Diagram =====
  const svgW = 500, svgH = 280;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('width', '100%');
  svg.style.maxWidth = svgW + 'px';
  svg.style.marginBottom = '20px';

  svg.innerHTML = `
    <defs>
      <marker id="an-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#888"/>
      </marker>
    </defs>

    <!-- Input -->
    <rect x="30" y="120" width="80" height="40" rx="6" fill="#5C6BC0"/>
    <text x="70" y="144" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Noto Sans KR">입력 x</text>

    <!-- Sublayer path -->
    <line x1="110" y1="140" x2="170" y2="140" stroke="#888" stroke-width="1.5" marker-end="url(#an-arrow)"/>
    <rect x="170" y="120" width="100" height="40" rx="6" fill="#7E57C2"/>
    <text x="220" y="144" text-anchor="middle" fill="#fff" font-size="11" font-family="Noto Sans KR">Sublayer(x)</text>
    <line x1="270" y1="140" x2="330" y2="140" stroke="#888" stroke-width="1.5" marker-end="url(#an-arrow)"/>

    <!-- Skip connection (curved path above) -->
    <path d="M 70 120 Q 70 60 220 60 Q 370 60 370 120" stroke="var(--q-color, #4FC3F7)" stroke-width="2" fill="none" stroke-dasharray="5,3"/>
    <text x="220" y="50" text-anchor="middle" fill="var(--q-color, #4FC3F7)" font-size="11">Skip Connection</text>

    <!-- Add circle -->
    <circle cx="370" cy="140" r="18" fill="none" stroke="#FFA726" stroke-width="2"/>
    <text x="370" y="145" text-anchor="middle" fill="#FFA726" font-size="16" font-weight="bold">+</text>
    <line x1="370" y1="122" x2="370" y2="105" stroke="var(--q-color, #4FC3F7)" stroke-width="1.5" marker-end="url(#an-arrow)" stroke-dasharray="none"/>

    <!-- LayerNorm -->
    <line x1="388" y1="140" x2="410" y2="140" stroke="#888" stroke-width="1.5" marker-end="url(#an-arrow)"/>
    <rect x="410" y="120" width="80" height="40" rx="6" fill="#EF5350"/>
    <text x="450" y="144" text-anchor="middle" fill="#fff" font-size="11" font-family="Noto Sans KR">LayerNorm</text>

    <!-- Labels -->
    <text x="220" y="200" text-anchor="middle" fill="#888" font-size="11">LayerNorm(x + Sublayer(x))</text>
  `;
  container.appendChild(svg);

  // ===== Vector Addition =====
  const addTitle = document.createElement('h3');
  addTitle.style.color = 'var(--text-heading)';
  addTitle.textContent = '벡터 덧셈 & LayerNorm';
  container.appendChild(addTitle);

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;';

  renderMatrix(row, [input], 'x (입력)', 'var(--q-color)', { cellSize: 60 });
  renderOp(row, '+');
  renderMatrix(row, [sublayerOut], 'Sublayer(x)', 'var(--encoder-color)', { cellSize: 60 });
  renderOp(row, '=');
  renderMatrix(row, [added], '합산', '#FFA726', { cellSize: 60 });
  renderOp(row, '→ LN →');
  renderMatrix(row, [normed], 'LayerNorm 결과', '#EF5350', { cellSize: 60 });

  container.appendChild(row);

  // Stats display
  const stats = document.createElement('div');
  stats.style.cssText = 'margin-top:16px;padding:12px;background:var(--bg-card);border-radius:6px;color:var(--text-secondary);font-size:0.85rem;';
  stats.innerHTML = `
    <strong>LayerNorm 계산:</strong><br>
    평균(μ) = ${fmt(mean, 3)} &nbsp;|&nbsp; 분산(σ²) = ${fmt(variance, 3)} &nbsp;|&nbsp; 표준편차(σ) = ${fmt(std, 3)}<br>
    <em>각 값 → (x - μ) / σ 로 정규화 → 평균=0, 분산≈1</em>
  `;
  container.appendChild(stats);
}

// ===== Feed-Forward Network =====
export function initFFN() {
  const container = document.getElementById('ffn-container');
  const slider = document.getElementById('ffn-input-slider');
  const valSpan = document.getElementById('ffn-input-val');

  // ===== Help Panel =====
  const helpBtn = document.getElementById('ffn-help-btn');
  const helpPanel = document.getElementById('ffn-help-panel');

  helpBtn.addEventListener('click', () => {
    const isOpen = helpPanel.style.display !== 'none';
    helpPanel.style.display = isOpen ? 'none' : 'block';
    helpBtn.classList.toggle('active', !isOpen);

    if (!isOpen && !helpPanel.dataset.loaded) {
      helpPanel.dataset.loaded = 'true';
      helpPanel.innerHTML = `
        <h3>피드 포워드 네트워크(FFN)란?</h3>

        <h4>한줄 요약</h4>
        <p>어텐션이 <strong>"토큰 간 관계"</strong>를 학습한다면, FFN은 <strong>"각 토큰의 의미를 더 깊이 변환"</strong>하는 단계입니다.</p>

        <div class="analogy">
          <strong>비유:</strong> 어텐션 = 회의에서 다른 사람 의견 듣기 → FFN = 혼자 앉아서 들은 내용을 정리하고 내 생각 만들기
        </div>

        <h4>수식 분해</h4>
        <div class="formula-block">FFN(x) = max(0, x·W₁ + b₁) · W₂ + b₂</div>
        <p>이걸 단계별로 풀어보면:</p>
        <ul>
          <li><strong>① x·W₁ + b₁</strong> — 입력 벡터(d_model 차원)를 더 넓은 공간(d_ff 차원)으로 확장합니다.
            <br><span style="color:var(--text-secondary)">논문 기준: d_model=512 → d_ff=2048 (4배 확장)</span></li>
          <li><strong>② max(0, ...)</strong> — <strong>ReLU 활성화 함수</strong>. 0보다 작은 값을 모두 0으로 만듭니다.
            <br><span style="color:var(--text-secondary)">이게 비선형성을 만들어서 네트워크가 복잡한 패턴을 학습할 수 있게 합니다</span></li>
          <li><strong>③ ...·W₂ + b₂</strong> — 확장된 벡터를 다시 원래 차원(d_model)으로 줄입니다.</li>
        </ul>

        <h4>왜 "확장했다가 줄이는" 구조인가?</h4>
        <div class="key-point">
          <strong>핵심 아이디어:</strong> 좁은 공간(512차원)에서는 표현력이 제한적이므로, 넓은 공간(2048차원)에서 잠시 계산한 뒤 다시 압축합니다.
          <br><br>
          마치 메모를 정리할 때 큰 종이에 마구 펼쳐 놓고 → 핵심만 추려서 작은 카드에 적는 것과 같습니다.
        </div>

        <h4>위 다이어그램 읽는 법</h4>
        <ul>
          <li><strong>왼쪽 원(파란색)</strong> = 입력 레이어 (d_model=4개 노드). 모두 같은 입력값을 받습니다.</li>
          <li><strong>가운데 원(주황색)</strong> = Hidden 레이어 (d_ff=8개 노드). 밝으면 활성화(값>0), 어두우면 ReLU가 0으로 만든 것입니다.</li>
          <li><strong>오른쪽 원(초록색)</strong> = 출력 레이어 (d_model=4개 노드). 최종 변환 결과입니다.</li>
          <li><strong>연결선 굵기</strong> = 가중치(W)의 절대값. 굵을수록 해당 연결이 강합니다.</li>
        </ul>
        <p>슬라이더로 입력값을 바꿔보면 어떤 노드가 켜지고 꺼지는지 관찰할 수 있습니다. 음수 입력에서는 ReLU 때문에 꺼지는 노드가 많아지는 것을 확인해 보세요!</p>

        <h4>Transformer에서의 역할</h4>
        <p>Transformer의 각 레이어(인코더/디코더)에서 FFN은 <strong>어텐션 직후</strong>에 위치합니다:</p>
        <div class="formula-block">Input → Self-Attention → Add&Norm → <strong style="color:#FFA726;">FFN</strong> → Add&Norm → Output</div>
        <ul>
          <li>어텐션은 "다른 토큰과의 관계"를 반영한 정보를 만듭니다</li>
          <li>FFN은 그 정보를 각 위치(토큰)별로 <strong>독립적으로</strong> 변환합니다 (position-wise)</li>
          <li>같은 FFN이 모든 위치에 동일하게 적용됩니다 (가중치 공유)</li>
        </ul>

        <h4>자주 하는 질문</h4>
        <p><strong>Q: 왜 어텐션만으로는 안 되나요?</strong></p>
        <p>A: 어텐션은 본질적으로 "가중 평균"이라 선형 연산에 가깝습니다. FFN의 ReLU가 비선형성을 추가해야 복잡한 함수를 학습할 수 있습니다. FFN이 없으면 레이어를 아무리 쌓아도 하나의 어텐션 레이어와 같은 효과밖에 못 냅니다.</p>

        <p><strong>Q: d_ff는 왜 d_model의 4배인가요?</strong></p>
        <p>A: 논문 저자들이 실험적으로 찾은 값입니다. 2배~8배까지 실험했는데, 4배가 성능과 계산량의 균형이 가장 좋았습니다.</p>

        <p><strong>Q: "position-wise"가 무슨 뜻인가요?</strong></p>
        <p>A: 시퀀스의 각 위치(토큰)에 <strong>동일한 FFN을 독립적으로</strong> 적용한다는 뜻입니다. 위치 1의 FFN 결과는 위치 2에 영향을 주지 않습니다. 토큰 간 정보 교환은 오직 어텐션에서만 일어납니다.</p>
      `;
    }
  });

  // Network params (small for visualization)
  const d_model = 4;
  const d_ff = 8;

  // Random weights (fixed seed for consistency)
  const W1 = Array.from({ length: d_model }, () =>
    Array.from({ length: d_ff }, () => +(Math.random() * 2 - 1).toFixed(2))
  );
  const b1 = Array.from({ length: d_ff }, () => +(Math.random() * 0.5).toFixed(2));
  const W2 = Array.from({ length: d_ff }, () =>
    Array.from({ length: d_model }, () => +(Math.random() * 2 - 1).toFixed(2))
  );
  const b2 = Array.from({ length: d_model }, () => +(Math.random() * 0.5).toFixed(2));

  function render() {
    container.innerHTML = '';
    const inputVal = parseFloat(slider.value);
    valSpan.textContent = inputVal.toFixed(1);

    // Input vector (all same value for simplicity)
    const x = Array.from({ length: d_model }, () => inputVal);

    // Layer 1: xW1 + b1
    const hidden = Array.from({ length: d_ff }, (_, j) => {
      let sum = b1[j];
      for (let i = 0; i < d_model; i++) sum += x[i] * W1[i][j];
      return sum;
    });

    // ReLU
    const relu = hidden.map(v => Math.max(0, v));

    // Layer 2: relu * W2 + b2
    const output = Array.from({ length: d_model }, (_, j) => {
      let sum = b2[j];
      for (let i = 0; i < d_ff; i++) sum += relu[i] * W2[i][j];
      return +sum.toFixed(3);
    });

    // ===== MLP Diagram =====
    const svgW = 600, svgH = 320;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('width', '100%');
    svg.style.maxWidth = svgW + 'px';

    const layers = [
      { nodes: d_model, x: 60, label: '입력', values: x.map(v => +v.toFixed(2)), color: 'var(--q-color, #4FC3F7)' },
      { nodes: d_ff, x: 250, label: 'Hidden (ReLU)', values: relu.map(v => +v.toFixed(2)), color: '#FFA726' },
      { nodes: d_model, x: 440, label: '출력', values: output, color: '#81C784' },
    ];

    // Draw connections
    for (let l = 0; l < layers.length - 1; l++) {
      const from = layers[l], to = layers[l + 1];
      for (let i = 0; i < from.nodes; i++) {
        for (let j = 0; j < to.nodes; j++) {
          const fy = 40 + i * ((svgH - 80) / (from.nodes - 1 || 1));
          const ty = 40 + j * ((svgH - 80) / (to.nodes - 1 || 1));
          const alpha = l === 0 ? Math.abs(W1[i]?.[j] || 0) / 2 : Math.abs(W2[i]?.[j] || 0) / 2;

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', from.x + 20); line.setAttribute('y1', fy);
          line.setAttribute('x2', to.x - 20); line.setAttribute('y2', ty);
          line.setAttribute('stroke', `rgba(150,150,150,${Math.min(alpha, 0.6)})`);
          line.setAttribute('stroke-width', Math.max(0.3, alpha * 2));
          svg.appendChild(line);
        }
      }
    }

    // Draw nodes
    for (const layer of layers) {
      for (let i = 0; i < layer.nodes; i++) {
        const y = 40 + i * ((svgH - 80) / (layer.nodes - 1 || 1));
        const val = layer.values[i];
        const isActive = val > 0;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', layer.x); circle.setAttribute('cy', y);
        circle.setAttribute('r', 16);
        circle.setAttribute('fill', isActive ? layer.color : '#444');
        circle.setAttribute('stroke', layer.color);
        circle.setAttribute('stroke-width', isActive ? 2 : 1);
        circle.setAttribute('opacity', isActive ? 1 : 0.4);
        svg.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', layer.x); text.setAttribute('y', y + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#fff'); text.setAttribute('font-size', '9');
        text.textContent = fmt(val, 1);
        svg.appendChild(text);
      }

      // Layer label
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', layer.x); lbl.setAttribute('y', svgH - 5);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', '#888'); lbl.setAttribute('font-size', '11');
      lbl.textContent = layer.label;
      svg.appendChild(lbl);
    }

    // ReLU label
    const reluLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    reluLabel.setAttribute('x', 155); reluLabel.setAttribute('y', 20);
    reluLabel.setAttribute('fill', '#FFA726'); reluLabel.setAttribute('font-size', '11');
    reluLabel.textContent = 'W₁x + b₁ → ReLU';
    svg.appendChild(reluLabel);

    const w2Label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    w2Label.setAttribute('x', 345); w2Label.setAttribute('y', 20);
    w2Label.setAttribute('fill', '#81C784'); w2Label.setAttribute('font-size', '11');
    w2Label.textContent = 'W₂·ReLU + b₂';
    svg.appendChild(w2Label);

    container.appendChild(svg);

    // Explanation
    const note = document.createElement('div');
    note.style.cssText = 'margin-top:16px;padding:12px;background:var(--bg-card);border-radius:6px;color:var(--text-secondary);font-size:0.85rem;';
    note.innerHTML = `
      <strong>FFN(x) = max(0, xW₁ + b₁)W₂ + b₂</strong><br>
      입력값 ${fmt(inputVal, 1)} → Hidden 레이어 (d_ff=${d_ff}) → ReLU → 출력 (d_model=${d_model})<br>
      <em>밝은 노드 = 활성화 (값 > 0), 어두운 노드 = 비활성 (ReLU에 의해 0)</em>
    `;
    container.appendChild(note);
  }

  slider.addEventListener('input', render);
  render();
}
