// ===== Section 1: CNN 전체 구조 SVG 다이어그램 =====

export function initOverview() {
  const container = document.getElementById('overview-container');
  if (!container) return;

  // Each shape = OUTPUT of that stage (LeNet-5 style, input 28x28)
  const stages = [
    { id: 'section-convolution', label: 'Conv1', sub: '3x3, 6 filters', shape: '[1,6,26,26]', color: '#FFB74D', type: 'conv' },
    { id: 'section-activation', label: 'ReLU', sub: '', shape: '[1,6,26,26]', color: '#26A69A', type: 'relu' },
    { id: 'section-pooling', label: 'MaxPool', sub: '2x2', shape: '[1,6,13,13]', color: '#CE93D8', type: 'pool' },
    { id: 'section-convolution', label: 'Conv2', sub: '3x3, 16 filters', shape: '[1,16,11,11]', color: '#FFB74D', type: 'conv' },
    { id: 'section-activation', label: 'ReLU', sub: '', shape: '[1,16,11,11]', color: '#26A69A', type: 'relu' },
    { id: 'section-pooling', label: 'MaxPool', sub: '2x2', shape: '[1,16,5,5]', color: '#CE93D8', type: 'pool' },
    { id: 'section-flatten', label: 'Flatten', sub: '', shape: '[1,400]', color: '#EF5350', type: 'flatten' },
    { id: 'section-flatten', label: 'FC', sub: '400→120', shape: '[1,120]', color: '#EF5350', type: 'fc' },
    { id: 'section-flatten', label: 'Output', sub: '10 classes', shape: '[1,10]', color: '#81C784', type: 'output' },
  ];

  const blockW = 100;
  const blockH = 76;
  const gap = 16;
  const arrowW = 28;
  const totalW = stages.length * (blockW + arrowW) - arrowW + 60;
  const svgH = 160;

  let svg = `<svg class="overview-svg" viewBox="0 0 ${totalW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

  // Input label
  svg += `<text x="10" y="${svgH / 2 - 20}" fill="#4FC3F7" font-size="14" font-family="'Noto Sans KR', sans-serif" font-weight="700">Input</text>`;
  svg += `<text x="10" y="${svgH / 2 + 2}" fill="#a0a0b0" font-size="11" font-family="Courier New, monospace">[1,1,28,28]</text>`;

  let x = 80;
  const cy = svgH / 2;

  stages.forEach((stage, i) => {
    // Arrow before block
    if (i > 0) {
      svg += `<line x1="${x - arrowW}" y1="${cy}" x2="${x - 4}" y2="${cy}" stroke="#555" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }

    // Block
    const rx = 6;
    svg += `<g class="overview-block" data-section="${stage.id}" style="cursor:pointer">`;
    svg += `<rect x="${x}" y="${cy - blockH / 2}" width="${blockW}" height="${blockH}" rx="${rx}" fill="${stage.color}" opacity="0.85"/>`;
    svg += `<text x="${x + blockW / 2}" y="${cy - 8}" text-anchor="middle" font-size="14" font-weight="700">${stage.label}</text>`;
    if (stage.sub) {
      svg += `<text x="${x + blockW / 2}" y="${cy + 10}" text-anchor="middle" font-size="10" opacity="0.8">${stage.sub}</text>`;
    }
    svg += `</g>`;

    // Shape below
    svg += `<text x="${x + blockW / 2}" y="${cy + blockH / 2 + 18}" text-anchor="middle" fill="#a0a0b0" font-size="10" font-family="Courier New, monospace">${stage.shape}</text>`;

    x += blockW + arrowW;
  });

  // Arrowhead marker
  svg += `<defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">`;
  svg += `<polygon points="0 0, 8 3, 0 6" fill="#555"/></marker></defs>`;
  svg += `</svg>`;

  container.innerHTML = svg;

  // Click handlers
  container.querySelectorAll('.overview-block').forEach(block => {
    block.addEventListener('click', () => {
      const sectionId = block.dataset.section;
      const target = document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
