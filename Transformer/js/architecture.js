// ===== Full Encoder-Decoder Architecture SVG Diagram =====

export function initArchitecture() {
  const container = document.getElementById('architecture-container');
  const slider = document.getElementById('layer-count-slider');
  const valSpan = document.getElementById('layer-count-val');

  function render(N) {
    container.innerHTML = '';
    const svgW = 740,
      blockW = 130,
      blockH = 36,
      gap = 12;

    // 각 레이어 높이: Encoder 4블록, Decoder 6블록
    const encLayerH = 4 * blockH + 3 * gap; // 블록 4개 + 사이 간격 3개
    const decLayerH = 6 * blockH + 5 * gap; // 블록 6개 + 사이 간격 5개
    const maxLayerH = Math.max(encLayerH, decLayerH);
    const layerSpacing = 28; // 레이어 간 화살표 공간

    // SVG 좌표계: y=0 이 상단, 위로 쌓이므로 totalH를 충분히 확보
    // 하단 영역: 입력라벨(20) + embedding(blockH) + pe(blockH) + 라벨(30) + gap
    const bottomPad = 20 + 2 * (blockH + gap) + 30 + 16;
    // 상단 영역: 레이어 스택 + Linear + Softmax + 라벨
    const topPad = 3 * blockH + 3 * gap + 30;
    const totalH = bottomPad + N * maxLayerH + (N - 1) * layerSpacing + topPad;

    const encX = 120,
      decX = 440;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${totalH}`);
    svg.setAttribute('width', '100%');
    svg.style.maxWidth = svgW + 'px';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#888"/>
      </marker>
      <marker id="arrowhead-enc" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#7E57C2"/>
      </marker>
    `;
    svg.appendChild(defs);

    function addBlock(x, y, w, h, color, text, section, tooltip) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'arch-block');
      if (tooltip) g.setAttribute('data-tooltip', tooltip);

      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', w);
      rect.setAttribute('height', h);
      rect.setAttribute('rx', 6);
      rect.setAttribute('fill', color);

      const txt = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
      txt.setAttribute('x', x + w / 2);
      txt.setAttribute('y', y + h / 2 + 4);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', '#fff');
      txt.setAttribute('font-size', '11');
      txt.textContent = text;

      g.appendChild(rect);
      g.appendChild(txt);
      svg.appendChild(g);

      if (section) {
        g.style.cursor = 'pointer';
        g.addEventListener('click', () => {
          document
            .getElementById(section)
            ?.scrollIntoView({ behavior: 'smooth' });
        });
      }
      return { top: y, bottom: y + h, midX: x + w / 2, midY: y + h / 2 };
    }

    function addArrow(x1, y1, x2, y2, color = '#666', dashed = false) {
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', 1.5);
      line.setAttribute(
        'marker-end',
        color === '#666' ? 'url(#arrowhead)' : 'url(#arrowhead-enc)',
      );
      if (dashed) line.setAttribute('stroke-dasharray', '5,3');
      svg.appendChild(line);
    }

    function addLabel(x, y, text, color, size = 13, weight = 'bold') {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', color);
      t.setAttribute('font-size', size);
      t.setAttribute('font-weight', weight);
      t.textContent = text;
      svg.appendChild(t);
    }

    function addBracket(x, yTop, yBottom, color, labelText, side = 'left') {
      const dir = side === 'left' ? -1 : 1;
      const bx = x + dir * 14;
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      path.setAttribute(
        'd',
        `M${x},${yTop} L${bx},${yTop} L${bx},${yBottom} L${x},${yBottom}`,
      );
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', 2);
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
      addLabel(x + dir * 30, (yTop + yBottom) / 2 + 4, labelText, color, 11);
    }

    const encColor = '#7E57C2';
    const decColor = '#26A69A';

    // ========================================================
    // 좌표 계산: 아래(bottom) → 위(top) 방향으로 쌓음
    // y값이 클수록 아래. 블록 top-left를 (x, y)로 지정.
    // ========================================================

    // ----- 맨 아래: 입력 라벨 -----
    const encCX = encX + blockW / 2;
    const decCX = decX + blockW / 2;

    let ey = totalH - 20; // Encoder 현재 그리기 y (라벨)
    let dy = totalH - 20; // Decoder 현재 그리기 y (라벨)

    addLabel(encCX, ey, '입력 (Inputs)', '#aaa', 12, 'normal');
    addLabel(decCX, dy, '출력 (Outputs, shifted right)', '#aaa', 12, 'normal');

    // ----- Input Embedding -----
    ey -= 22;
    dy -= 22;
    const encEmbed = addBlock(
      encX,
      ey - blockH,
      blockW,
      blockH,
      '#5C6BC0',
      'Input Embedding',
      'section-positional',
      '토큰을 벡터로 변환합니다',
    );
    addArrow(encCX, ey, encCX, encEmbed.bottom); // 라벨 → 블록 하단
    ey = encEmbed.top;

    const decEmbed = addBlock(
      decX,
      dy - blockH,
      blockW,
      blockH,
      '#5C6BC0',
      'Output Embedding',
      'section-positional',
      '출력 토큰을 벡터로 변환합니다',
    );
    addArrow(decCX, dy, decCX, decEmbed.bottom);
    dy = decEmbed.top;

    // ----- Positional Encoding -----
    ey -= gap;
    dy -= gap;
    const encPE = addBlock(
      encX,
      ey - blockH,
      blockW,
      blockH,
      '#7986CB',
      'Positional Enc.',
      'section-positional',
      '위치 정보를 더합니다 (sin/cos)',
    );
    addArrow(encCX, ey, encCX, encEmbed.top + 2); // Embed 상단 → PE 하단
    ey = encPE.top;

    const decPE = addBlock(
      decX,
      dy - blockH,
      blockW,
      blockH,
      '#7986CB',
      'Positional Enc.',
      'section-positional',
      '위치 정보를 더합니다 (sin/cos)',
    );
    addArrow(decCX, dy, decCX, decEmbed.top + 2);
    dy = decPE.top;

    // ----- Encoder / Decoder 라벨 -----
    ey -= 16;
    dy -= 16;
    addLabel(encCX, ey, 'Encoder', encColor, 14);
    addLabel(decCX, dy, 'Decoder', decColor, 14);
    ey -= 6;
    dy -= 6;

    // 각 레이어 top y(블록 최상단)를 저장
    const encLayerTops = []; // n번 레이어의 최상단 블록 top y
    const encLayerMidXs = []; // 크로스어텐션 화살표용 x
    const crossAttnYs = []; // 디코더 각 레이어의 Cross-Attn 블록 중간 y

    // ===== Encoder Layers (아래→위로 쌓음) =====
    // n=0이 최하단 레이어, n=N-1이 최상단
    let encLayerBottomY = ey; // 현재 레이어 시작점(하단)
    for (let n = 0; n < N; n++) {
      let cy = encLayerBottomY;

      // 블록 1: Multi-Head Attn (최하단)
      const b1 = addBlock(
        encX,
        cy - blockH,
        blockW,
        blockH,
        '#AB47BC',
        'Multi-Head Attn',
        'section-multihead',
        '멀티-헤드 셀프 어텐션',
      );
      addArrow(encCX, cy, encCX, b1.bottom);
      cy = b1.top;

      // 블록 2: Add & Norm
      cy -= gap;
      const b2 = addBlock(
        encX,
        cy - blockH,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(encCX, cy, encCX, b2.bottom);
      cy = b2.top;

      // 블록 3: Feed Forward
      cy -= gap;
      const b3 = addBlock(
        encX,
        cy - blockH,
        blockW,
        blockH,
        '#FFA726',
        'Feed Forward',
        'section-ffn',
        '2층 완전연결 네트워크',
      );
      addArrow(encCX, cy, encCX, b3.bottom);
      cy = b3.top;

      // 블록 4: Add & Norm (최상단)
      cy -= gap;
      const b4 = addBlock(
        encX,
        cy - blockH,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(encCX, cy, encCX, b4.bottom);
      cy = b4.top;

      encLayerTops.push(cy); // 이 레이어 최상단 y

      // 레이어 간 화살표 공간 확보
      encLayerBottomY = cy - layerSpacing;
    }

    // ===== Decoder Layers (아래→위로 쌓음) =====
    let decLayerBottomY = dy;
    for (let n = 0; n < N; n++) {
      let cy = decLayerBottomY;

      // 블록 1: Masked Attn
      const d1 = addBlock(
        decX,
        cy - blockH,
        blockW,
        blockH,
        '#80CBC4',
        'Masked Attn',
        'section-decoder',
        '마스크드 셀프 어텐션 (미래 토큰 차단)',
      );
      addArrow(decCX, cy, decCX, d1.bottom);
      cy = d1.top;

      // 블록 2: Add & Norm
      cy -= gap;
      const d2 = addBlock(
        decX,
        cy - blockH,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(decCX, cy, decCX, d2.bottom);
      cy = d2.top;

      // 블록 3: Cross Attention — 인코더 출력 수신
      cy -= gap;
      const d3 = addBlock(
        decX,
        cy - blockH,
        blockW,
        blockH,
        '#4DB6AC',
        'Cross Attention',
        'section-decoder',
        '인코더 출력을 K, V로 사용하는 어텐션',
      );
      addArrow(decCX, cy, decCX, d3.bottom);
      crossAttnYs.push(d3.midY); // Cross-Attn 블록 중간 y 저장
      cy = d3.top;

      // 블록 4: Add & Norm
      cy -= gap;
      const d4 = addBlock(
        decX,
        cy - blockH,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(decCX, cy, decCX, d4.bottom);
      cy = d4.top;

      // 블록 5: Feed Forward
      cy -= gap;
      const d5 = addBlock(
        decX,
        cy - blockH,
        blockW,
        blockH,
        '#FFA726',
        'Feed Forward',
        'section-ffn',
        '2층 완전연결 네트워크',
      );
      addArrow(decCX, cy, decCX, d5.bottom);
      cy = d5.top;

      // 블록 6: Add & Norm (최상단)
      cy -= gap;
      const d6 = addBlock(
        decX,
        cy - blockH,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(decCX, cy, decCX, d6.bottom);
      cy = d6.top;

      decLayerBottomY = cy - layerSpacing;
    }

    // 실제 최상단 레이어 top y
    const encFinalTopY = encLayerTops[N - 1];
    const decFinalTopY = decLayerBottomY + layerSpacing; // 마지막 레이어 top

    // ===== 레이어 간 화살표 (Encoder) =====
    for (let n = 0; n < N - 1; n++) {
      const fromY = encLayerTops[n];
      const toY = encLayerTops[n] - layerSpacing + blockH; // 다음 레이어 첫 블록 하단
      addArrow(encCX, fromY, encCX, toY);
    }

    // ===== 크로스 어텐션 화살표: 인코더 최상단 → 각 디코더 레이어의 Cross-Attn =====
    // 원 논문 다이어그램처럼 인코더 출력이 모든 디코더 레이어의 Cross-Attn으로 연결
    // 단, n번째 인코더 레이어 → n번째 디코더 레이어 (같은 층끼리)
    for (let n = 0; n < N; n++) {
      const srcY = encLayerTops[n] + blockH / 2; // 인코더 Add&Norm 상단 부근
      const tgtY = crossAttnYs[n];
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line.setAttribute('x1', encX + blockW + 4);
      line.setAttribute('y1', srcY);
      line.setAttribute('x2', decX - 4);
      line.setAttribute('y2', tgtY);
      line.setAttribute('stroke', encColor);
      line.setAttribute('stroke-width', 1.5);
      line.setAttribute('stroke-dasharray', '5,3');
      line.setAttribute('marker-end', 'url(#arrowhead-enc)');
      svg.appendChild(line);
    }

    // ===== Brackets =====
    addBracket(encX - 2, encFinalTopY, ey, encColor, `×${N}`, 'left');
    addBracket(decX + blockW + 2, decFinalTopY, dy, decColor, `×${N}`, 'right');

    // ===== Encoder 최상단 → (그냥 위로 끝냄, 인코더는 K/V로 내보냄) =====
    // Decoder 최상단 레이어 위에 Linear, Softmax 추가
    let outY = decFinalTopY - gap;
    const linBlk = addBlock(
      decX,
      outY - blockH,
      blockW,
      blockH,
      '#FF7043',
      'Linear',
      null,
      '선형 변환 (보캡 크기)',
    );
    addArrow(decCX, outY, decCX, linBlk.bottom);

    const smY = linBlk.top - gap;
    const smBlk = addBlock(
      decX,
      smY - blockH,
      blockW,
      blockH,
      '#FF5252',
      'Softmax',
      null,
      '확률 분포로 변환',
    );
    addArrow(decCX, smY, decCX, smBlk.bottom);

    addLabel(decCX, smBlk.top - 10, '출력 확률', '#aaa', 12, 'normal');

    container.appendChild(svg);
  }

  render(parseInt(slider.value));
  slider.addEventListener('input', () => {
    const n = parseInt(slider.value);
    valSpan.textContent = n;
    render(n);
    // Code panel sync
    const code = document.getElementById('arch-code');
    if (code) {
      code.textContent = `import torch.nn as nn\n\ntransformer = nn.Transformer(\n    d_model=512, nhead=8,\n    num_encoder_layers=${n},\n    num_decoder_layers=${n},\n    dim_feedforward=2048\n)\n# src: [seq_len, batch, 512]\n# tgt: [seq_len, batch, 512]\nout = transformer(src, tgt)`;
    }
    if (window.__transformerProgress)
      window.__transformerProgress.save('section-architecture');
  });
}
