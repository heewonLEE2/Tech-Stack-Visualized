// ===== Full Encoder-Decoder Architecture SVG Diagram =====

export function initArchitecture() {
  const container = document.getElementById('architecture-container');
  const slider = document.getElementById('layer-count-slider');
  const valSpan = document.getElementById('layer-count-val');

  function render(N) {
    container.innerHTML = '';
    const svgW = 740,
      blockW = 120,
      blockH = 36,
      gap = 10;
    // Encoder: 4 blocks per layer, Decoder: 6 blocks per layer
    const encLayerH = blockH * 4 + gap * 5;
    const decLayerH = blockH * 6 + gap * 7;
    const maxLayerH = Math.max(encLayerH, decLayerH);
    const totalH = 220 + N * (maxLayerH + 20) + 120;
    const encX = 160,
      decX = 440;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${totalH}`);
    svg.setAttribute('width', '100%');
    svg.style.maxWidth = svgW + 'px';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#888"/>
      </marker>
    `;
    svg.appendChild(defs);

    // Helper functions
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
      return g;
    }

    function addArrow(x1, y1, x2, y2) {
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#666');
      line.setAttribute('stroke-width', 1.5);
      line.setAttribute('marker-end', 'url(#arrowhead)');
      svg.appendChild(line);
    }

    function addLabel(x, y, text, color, size = 13) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', color);
      t.setAttribute('font-size', size);
      t.setAttribute('font-weight', 'bold');
      t.textContent = text;
      svg.appendChild(t);
    }

    function addBracket(x, y, h, color, labelText, side = 'left') {
      const dir = side === 'left' ? -1 : 1;
      const bx = x + dir * 12;
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      const d = `M${x},${y} L${bx},${y} L${bx},${y + h} L${x},${y + h}`;
      path.setAttribute('d', d);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', 2);
      path.setAttribute('fill', 'none');
      svg.appendChild(path);

      addLabel(x + dir * 28, y + h / 2 + 4, labelText, color, 11);
    }

    // ===== Draw Architecture =====
    let baseY = totalH - 60;

    // Input / Output labels
    addLabel(encX + blockW / 2, baseY, '입력 (Inputs)', '#aaa', 12);
    addLabel(
      decX + blockW / 2,
      baseY,
      '출력 (Outputs, shifted right)',
      '#aaa',
      12,
    );

    baseY -= 40;

    // Input Embedding
    addBlock(
      encX,
      baseY - blockH,
      blockW,
      blockH,
      '#5C6BC0',
      'Input Embedding',
      'section-positional',
      '토큰을 벡터로 변환합니다',
    );
    addArrow(encX + blockW / 2, baseY, encX + blockW / 2, baseY + 8);

    // Output Embedding
    addBlock(
      decX,
      baseY - blockH,
      blockW,
      blockH,
      '#5C6BC0',
      'Output Embedding',
      'section-positional',
      '출력 토큰을 벡터로 변환합니다',
    );
    addArrow(decX + blockW / 2, baseY, decX + blockW / 2, baseY + 8);

    baseY -= blockH + 8;

    // Positional Encoding
    addBlock(
      encX,
      baseY - blockH,
      blockW,
      blockH,
      '#7986CB',
      'Positional Enc.',
      'section-positional',
      '위치 정보를 더합니다 (sin/cos)',
    );
    addArrow(
      encX + blockW / 2,
      baseY,
      encX + blockW / 2,
      baseY - blockH + blockH,
    );

    addBlock(
      decX,
      baseY - blockH,
      blockW,
      blockH,
      '#7986CB',
      'Positional Enc.',
      'section-positional',
      '위치 정보를 더합니다 (sin/cos)',
    );
    addArrow(
      decX + blockW / 2,
      baseY,
      decX + blockW / 2,
      baseY - blockH + blockH,
    );

    baseY -= blockH + 20;
    const layerBaseY = baseY;

    // Section group labels
    const encColor = '#7E57C2';
    const decColor = '#26A69A';
    addLabel(encX + blockW / 2, baseY + 12, 'Encoder', encColor, 14);
    addLabel(decX + blockW / 2, baseY + 12, 'Decoder', decColor, 14);

    baseY -= 16;

    // Track top positions for encoder/decoder
    let encTopY = baseY;
    let decTopY = baseY;

    // ===== Encoder Layers =====
    for (let n = 0; n < N; n++) {
      const ly = baseY - n * (maxLayerH + 16);
      let ey = ly;

      // 1. Multi-Head Self-Attention
      ey -= blockH;
      addBlock(
        encX,
        ey,
        blockW,
        blockH,
        '#AB47BC',
        'Multi-Head Attn',
        'section-multihead',
        '멀티-헤드 셀프 어텐션',
      );
      if (n === 0)
        addArrow(encX + blockW / 2, ly, encX + blockW / 2, ey + blockH);
      // 2. Add & Norm
      ey -= blockH + gap;
      addBlock(
        encX,
        ey,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(
        encX + blockW / 2,
        ey + blockH + gap,
        encX + blockW / 2,
        ey + blockH,
      );
      // 3. Feed Forward
      ey -= blockH + gap;
      addBlock(
        encX,
        ey,
        blockW,
        blockH,
        '#FFA726',
        'Feed Forward',
        'section-ffn',
        '2층 완전연결 네트워크',
      );
      addArrow(
        encX + blockW / 2,
        ey + blockH + gap,
        encX + blockW / 2,
        ey + blockH,
      );
      // 4. Add & Norm
      ey -= blockH + gap;
      addBlock(
        encX,
        ey,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(
        encX + blockW / 2,
        ey + blockH + gap,
        encX + blockW / 2,
        ey + blockH,
      );

      encTopY = ey;

      // Inter-layer arrow
      if (n < N - 1) {
        const nextLy = baseY - (n + 1) * (maxLayerH + 16);
        addArrow(encX + blockW / 2, ey, encX + blockW / 2, nextLy + 2);
      }
    }

    // ===== Decoder Layers =====
    for (let n = 0; n < N; n++) {
      const ly = baseY - n * (maxLayerH + 16);
      let dy = ly;

      // 1. Masked Multi-Head Self-Attention
      dy -= blockH;
      addBlock(
        decX,
        dy,
        blockW,
        blockH,
        '#80CBC4',
        'Masked Attn',
        'section-decoder',
        '마스크드 셀프 어텐션 (미래 토큰 차단)',
      );
      if (n === 0)
        addArrow(decX + blockW / 2, ly, decX + blockW / 2, dy + blockH);
      // 2. Add & Norm
      dy -= blockH + gap;
      addBlock(
        decX,
        dy,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(
        decX + blockW / 2,
        dy + blockH + gap,
        decX + blockW / 2,
        dy + blockH,
      );
      // 3. Cross-Attention
      dy -= blockH + gap;
      addBlock(
        decX,
        dy,
        blockW,
        blockH,
        '#4DB6AC',
        'Cross Attention',
        'section-decoder',
        '인코더 출력을 K, V로 사용하는 어텐션',
      );
      addArrow(
        decX + blockW / 2,
        dy + blockH + gap,
        decX + blockW / 2,
        dy + blockH,
      );
      // 4. Add & Norm
      dy -= blockH + gap;
      addBlock(
        decX,
        dy,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(
        decX + blockW / 2,
        dy + blockH + gap,
        decX + blockW / 2,
        dy + blockH,
      );
      // 5. Feed Forward
      dy -= blockH + gap;
      addBlock(
        decX,
        dy,
        blockW,
        blockH,
        '#FFA726',
        'Feed Forward',
        'section-ffn',
        '2층 완전연결 네트워크',
      );
      addArrow(
        decX + blockW / 2,
        dy + blockH + gap,
        decX + blockW / 2,
        dy + blockH,
      );
      // 6. Add & Norm
      dy -= blockH + gap;
      addBlock(
        decX,
        dy,
        blockW,
        blockH,
        '#EF5350',
        'Add & Norm',
        'section-addnorm',
        '잔차 연결 + 레이어 정규화',
      );
      addArrow(
        decX + blockW / 2,
        dy + blockH + gap,
        decX + blockW / 2,
        dy + blockH,
      );

      decTopY = dy;

      // Inter-layer arrow
      if (n < N - 1) {
        const nextLy = baseY - (n + 1) * (maxLayerH + 16);
        addArrow(decX + blockW / 2, dy, decX + blockW / 2, nextLy + 2);
      }
    }

    // ===== Cross-attention arrow from encoder TOP to each decoder cross-attn =====
    for (let n = 0; n < N; n++) {
      const ly = baseY - n * (maxLayerH + 16);
      // Cross-attn block is the 3rd block: ly - blockH - (blockH+gap) - (blockH+gap)
      const crossAttnY =
        ly - blockH - (blockH + gap) - (blockH + gap) + blockH / 2;
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line.setAttribute('x1', encX + blockW + 4);
      line.setAttribute('y1', encTopY + blockH / 2);
      line.setAttribute('x2', decX - 4);
      line.setAttribute('y2', crossAttnY);
      line.setAttribute('stroke', encColor);
      line.setAttribute('stroke-width', 1.5);
      line.setAttribute('stroke-dasharray', '5,3');
      line.setAttribute('marker-end', 'url(#arrowhead)');
      svg.appendChild(line);
    }

    // ===== Brackets (once, outside loop) =====
    const encBracketTop = encTopY;
    const encBracketBottom = baseY;
    addBracket(
      encX - 2,
      encBracketTop,
      encBracketBottom - encBracketTop,
      encColor,
      `×${N}`,
      'left',
    );

    const decBracketTop = decTopY;
    const decBracketBottom = baseY;
    addBracket(
      decX + blockW + 2,
      decBracketTop,
      decBracketBottom - decBracketTop,
      decColor,
      `×${N}`,
      'right',
    );

    // ===== Arrow from decoder top to Linear =====
    const topY = decTopY - 20;
    addArrow(decX + blockW / 2, decTopY, decX + blockW / 2, topY + blockH);
    addBlock(
      decX,
      topY,
      blockW,
      blockH,
      '#FF7043',
      'Linear',
      null,
      '선형 변환 (보캡 크기)',
    );

    const softmaxY = topY - blockH - gap;
    addArrow(decX + blockW / 2, topY, decX + blockW / 2, softmaxY + blockH);
    addBlock(
      decX,
      softmaxY,
      blockW,
      blockH,
      '#FF5252',
      'Softmax',
      null,
      '확률 분포로 변환',
    );

    addLabel(decX + blockW / 2, softmaxY - 12, '출력 확률', '#aaa', 12);

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
