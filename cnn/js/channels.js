// ===== Section 3: 다채널 합성곱 =====
import { convolve2D, fmt, valueToColor, arrayMinMax } from './utils.js';

export function initChannels() {
  const container = document.getElementById('channels-container');
  if (!container) return;

  const coutSlider = document.getElementById('ch-cout-slider');
  const coutVal = document.getElementById('ch-cout-val');

  let cOut = 1;

  // RGB 5x5 inputs
  const inputs = {
    R: [[10,20,30,40,50],[15,25,35,45,55],[20,30,40,50,60],[25,35,45,55,65],[30,40,50,60,70]],
    G: [[5,15,25,35,45],[10,20,30,40,50],[15,25,35,45,55],[20,30,40,50,60],[25,35,45,55,65]],
    B: [[0,10,20,30,40],[5,15,25,35,45],[10,20,30,40,50],[15,25,35,45,55],[20,30,40,50,60]]
  };

  // Kernels per output channel: [C_out][C_in][3][3]
  const allKernels = [
    { R: [[1,0,-1],[1,0,-1],[1,0,-1]], G: [[0,1,0],[0,1,0],[0,1,0]], B: [[-1,0,1],[-1,0,1],[-1,0,1]] },
    { R: [[1,1,1],[0,0,0],[-1,-1,-1]], G: [[0,0,0],[1,1,1],[0,0,0]], B: [[-1,-1,-1],[0,0,0],[1,1,1]] },
    { R: [[0,-1,0],[-1,4,-1],[0,-1,0]], G: [[0,0,0],[0,1,0],[0,0,0]], B: [[0,1,0],[1,-4,1],[0,1,0]] }
  ];

  function renderAll() {
    container.innerHTML = '';

    // Shape info
    const shapeInfo = document.createElement('div');
    shapeInfo.style.marginBottom = '16px';
    shapeInfo.innerHTML = `
      <span class="shape-label">[3, 5, 5]</span>
      <span style="color:var(--text-secondary);margin:0 8px">×</span>
      <span class="shape-label">[${cOut}, 3, 3, 3]</span>
      <span style="color:var(--text-secondary);margin:0 8px">→</span>
      <span class="shape-label">[${cOut}, 3, 3]</span>
    `;
    container.appendChild(shapeInfo);

    for (let f = 0; f < cOut; f++) {
      const filterSection = document.createElement('div');
      filterSection.style.marginBottom = '24px';
      filterSection.style.paddingBottom = '16px';
      if (f < cOut - 1) filterSection.style.borderBottom = '1px solid var(--border-color)';

      const title = document.createElement('div');
      title.style.cssText = 'font-size:0.9rem;font-weight:700;margin-bottom:12px;';
      title.style.color = 'var(--kernel-color)';
      title.textContent = cOut > 1 ? `필터 ${f + 1}` : '필터';
      filterSection.appendChild(title);

      const channels = ['R', 'G', 'B'];
      const channelColors = { R: '#EF5350', G: '#81C784', B: '#4FC3F7' };
      const channelResults = [];

      const row = document.createElement('div');
      row.className = 'channel-row';

      channels.forEach((ch, ci) => {
        const kernel = allKernels[f][ch];
        const result = convolve2D(inputs[ch], kernel);
        channelResults.push(result.output);

        // Input
        const inputBlock = document.createElement('div');
        inputBlock.className = 'channel-block';
        inputBlock.innerHTML = `<div class="channel-label" style="color:${channelColors[ch]}">입력 ${ch} (5x5)</div>`;
        const ig = document.createElement('div');
        ig.className = 'channel-grid';
        ig.style.gridTemplateColumns = 'repeat(5, 44px)';
        const { min: imin, max: imax } = arrayMinMax(inputs[ch]);
        for (const r of inputs[ch]) {
          for (const v of r) {
            const cell = document.createElement('div');
            cell.className = 'channel-cell';
            cell.textContent = fmt(v, 0);
            cell.style.background = valueToColor(v, imin, imax, ch === 'R' ? 'red' : ch === 'G' ? 'green' : 'blue');
            ig.appendChild(cell);
          }
        }
        inputBlock.appendChild(ig);

        // * symbol
        const mulSign = document.createElement('div');
        mulSign.className = 'channel-arrow';
        mulSign.textContent = '×';

        // Kernel
        const kernelBlock = document.createElement('div');
        kernelBlock.className = 'channel-block';
        kernelBlock.innerHTML = `<div class="channel-label" style="color:var(--kernel-color)">커널 ${ch} (3x3)</div>`;
        const kg = document.createElement('div');
        kg.className = 'channel-grid';
        kg.style.gridTemplateColumns = 'repeat(3, 44px)';
        const { min: kmin, max: kmax } = arrayMinMax(kernel);
        for (const r of kernel) {
          for (const v of r) {
            const cell = document.createElement('div');
            cell.className = 'channel-cell';
            cell.textContent = fmt(v);
            cell.style.background = valueToColor(v, kmin, kmax, 'orange');
            kg.appendChild(cell);
          }
        }
        kernelBlock.appendChild(kg);

        // = symbol
        const eqSign = document.createElement('div');
        eqSign.className = 'channel-arrow';
        eqSign.textContent = '=';

        // Channel result
        const resBlock = document.createElement('div');
        resBlock.className = 'channel-block';
        resBlock.innerHTML = `<div class="channel-label" style="color:${channelColors[ch]}">결과 ${ch}</div>`;
        const rg = document.createElement('div');
        rg.className = 'channel-grid';
        rg.style.gridTemplateColumns = 'repeat(3, 44px)';
        const { min: rmin, max: rmax } = arrayMinMax(result.output);
        for (const r of result.output) {
          for (const v of r) {
            const cell = document.createElement('div');
            cell.className = 'channel-cell';
            cell.textContent = fmt(v, 0);
            cell.style.background = valueToColor(v, rmin, rmax, ch === 'R' ? 'red' : ch === 'G' ? 'green' : 'blue');
            rg.appendChild(cell);
          }
        }
        resBlock.appendChild(rg);

        if (ci > 0) {
          const plusSign = document.createElement('div');
          plusSign.className = 'channel-arrow';
          plusSign.style.alignSelf = 'center';
          plusSign.textContent = '+';
          row.appendChild(plusSign);
        }

        row.appendChild(inputBlock);
        row.appendChild(mulSign);
        row.appendChild(kernelBlock);
        row.appendChild(eqSign);
        row.appendChild(resBlock);
      });

      filterSection.appendChild(row);

      // Sum across channels
      const sumRow = document.createElement('div');
      sumRow.style.marginTop = '12px';
      sumRow.style.display = 'flex';
      sumRow.style.alignItems = 'center';
      sumRow.style.gap = '12px';

      const sumLabel = document.createElement('div');
      sumLabel.style.cssText = 'font-size:0.85rem;color:var(--output-color);font-weight:500;';
      sumLabel.textContent = 'R + G + B 합산 → 출력:';
      sumRow.appendChild(sumLabel);

      const oH = channelResults[0].length;
      const oW = channelResults[0][0].length;
      const summed = Array.from({ length: oH }, (_, i) =>
        Array.from({ length: oW }, (_, j) =>
          Math.round(channelResults.reduce((s, ch) => s + ch[i][j], 0) * 100) / 100
        )
      );

      const sg = document.createElement('div');
      sg.className = 'channel-grid';
      sg.style.gridTemplateColumns = `repeat(${oW}, 52px)`;
      const { min: smin, max: smax } = arrayMinMax(summed);
      for (const r of summed) {
        for (const v of r) {
          const cell = document.createElement('div');
          cell.className = 'channel-cell';
          cell.style.width = '52px';
          cell.style.height = '44px';
          cell.textContent = fmt(v, 0);
          cell.style.background = valueToColor(v, smin, smax, 'green');
          sg.appendChild(cell);
        }
      }
      sumRow.appendChild(sg);
      filterSection.appendChild(sumRow);

      container.appendChild(filterSection);
    }
  }

  coutSlider.addEventListener('input', () => {
    cOut = parseInt(coutSlider.value);
    coutVal.textContent = cOut;
    renderAll();
  });

  renderAll();
}
