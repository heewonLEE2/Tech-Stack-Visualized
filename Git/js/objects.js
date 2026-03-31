// ===== Git Internal Objects & DAG Visualization =====

export function initObjects() {
  const container = document.getElementById('objects-container');
  if (!container) return;

  // Simple SHA-1 simulation (not cryptographic, just for demo)
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    // Convert to hex-like string
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return (hex + hex.split('').reverse().join('') + hex).substring(0, 40);
  }

  // Hash demo
  const hashInput = document.getElementById('hash-input');
  const hashOutput = document.getElementById('hash-output');
  if (hashInput && hashOutput) {
    function updateHash() {
      const val = hashInput.value || '';
      const hash = simpleHash(`blob ${val.length}\0${val}`);
      hashOutput.textContent = hash;
    }
    hashInput.addEventListener('input', updateHash);
    updateHash();
  }

  // Object type tabs
  const objBtns = document.querySelectorAll('[data-obj-type]');
  let currentType = 'blob';

  objBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      objBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.objType;
      render();
    });
  });

  // Object data for DAG
  const objects = {
    blobs: [
      { sha: 'a1b2c3d', content: 'console.log("hello")', filename: 'index.js' },
      { sha: 'e4f5a6b', content: '# My Project', filename: 'README.md' },
      {
        sha: 'c7d8e9f',
        content: '{ "name": "app" }',
        filename: 'package.json',
      },
    ],
    trees: [
      {
        sha: 'f1a2b3c',
        entries: [
          { mode: '100644', type: 'blob', sha: 'a1b2c3d', name: 'index.js' },
          { mode: '100644', type: 'blob', sha: 'e4f5a6b', name: 'README.md' },
          {
            mode: '100644',
            type: 'blob',
            sha: 'c7d8e9f',
            name: 'package.json',
          },
        ],
      },
    ],
    commits: [
      {
        sha: 'd4e5f6a',
        tree: 'f1a2b3c',
        parent: null,
        author: 'Developer',
        message: 'Initial commit',
        date: '2024-01-15',
      },
      {
        sha: 'b7c8d9e',
        tree: 'f1a2b3c',
        parent: 'd4e5f6a',
        author: 'Developer',
        message: 'Add README',
        date: '2024-01-16',
      },
      {
        sha: '1a2b3c4',
        tree: 'f1a2b3c',
        parent: 'b7c8d9e',
        author: 'Developer',
        message: 'Add package.json',
        date: '2024-01-17',
      },
    ],
    tags: [
      {
        sha: '5e6f7a8',
        name: 'v1.0.0',
        target: '1a2b3c4',
        message: 'Release 1.0.0',
      },
    ],
  };

  const svgNS = 'http://www.w3.org/2000/svg';

  function render() {
    container.innerHTML = '';

    const svgW = 800;
    const svgH = 400;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.maxWidth = svgW + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    const colors = {
      blob: '#4fc3f7',
      tree: '#81c784',
      commit: '#ffb74d',
      tag: '#ffd54f',
    };

    if (currentType === 'blob') {
      drawBlobView(svg, svgW, svgH, colors);
    } else if (currentType === 'tree') {
      drawTreeView(svg, svgW, svgH, colors);
    } else if (currentType === 'commit') {
      drawCommitChain(svg, svgW, svgH, colors);
    } else if (currentType === 'tag') {
      drawTagView(svg, svgW, svgH, colors);
    }

    container.appendChild(svg);

    // Detail card
    const card = document.createElement('div');
    card.className = 'obj-detail-card';
    card.innerHTML = getDetailHtml(currentType);
    container.appendChild(card);
  }

  function drawBlobView(svg, w, h, colors) {
    const blobs = objects.blobs;
    const startX = 100;
    const gap = 220;

    blobs.forEach((blob, i) => {
      const x = startX + i * gap;
      const y = 120;

      // Blob circle
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 40);
      circle.setAttribute('fill', colors.blob);
      circle.setAttribute('opacity', '0.85');
      circle.setAttribute('class', 'dag-node node-enter');
      svg.appendChild(circle);

      // "blob" label
      const typeLabel = document.createElementNS(svgNS, 'text');
      typeLabel.setAttribute('x', x);
      typeLabel.setAttribute('y', y - 5);
      typeLabel.setAttribute('text-anchor', 'middle');
      typeLabel.setAttribute('font-size', '11');
      typeLabel.setAttribute('font-weight', '700');
      typeLabel.setAttribute('fill', '#1a1a2e');
      typeLabel.textContent = 'blob';
      svg.appendChild(typeLabel);

      // SHA
      const shaLabel = document.createElementNS(svgNS, 'text');
      shaLabel.setAttribute('x', x);
      shaLabel.setAttribute('y', y + 12);
      shaLabel.setAttribute('text-anchor', 'middle');
      shaLabel.setAttribute('font-size', '10');
      shaLabel.setAttribute('font-family', 'Courier New, monospace');
      shaLabel.setAttribute('fill', '#1a1a2e');
      shaLabel.textContent = blob.sha;
      svg.appendChild(shaLabel);

      // Filename
      const nameLabel = document.createElementNS(svgNS, 'text');
      nameLabel.setAttribute('x', x);
      nameLabel.setAttribute('y', y + 70);
      nameLabel.setAttribute('text-anchor', 'middle');
      nameLabel.setAttribute('font-size', '12');
      nameLabel.setAttribute('fill', '#a0a0b0');
      nameLabel.textContent = blob.filename;
      svg.appendChild(nameLabel);

      // Content preview
      const contentLabel = document.createElementNS(svgNS, 'text');
      contentLabel.setAttribute('x', x);
      contentLabel.setAttribute('y', y + 90);
      contentLabel.setAttribute('text-anchor', 'middle');
      contentLabel.setAttribute('font-size', '10');
      contentLabel.setAttribute('font-family', 'Courier New, monospace');
      contentLabel.setAttribute('fill', '#e0e0e0');
      contentLabel.textContent =
        blob.content.length > 22
          ? blob.content.substring(0, 22) + '...'
          : blob.content;
      svg.appendChild(contentLabel);
    });

    // Title
    addTitle(svg, w, 'Blob: 파일 내용을 저장하는 객체');
  }

  function drawTreeView(svg, w, h, colors) {
    const tree = objects.trees[0];
    const treeX = w / 2;
    const treeY = 100;

    // Tree node
    drawHexagon(svg, treeX, treeY, 40, colors.tree, 'tree', tree.sha);

    // Blob children
    tree.entries.forEach((entry, i) => {
      const bx = 150 + i * 250;
      const by = 280;

      // Edge
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', treeX);
      line.setAttribute('y1', treeY + 40);
      line.setAttribute('x2', bx);
      line.setAttribute('y2', by - 40);
      line.setAttribute('stroke', '#a0a0b0');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '6,3');
      line.setAttribute('class', 'dag-edge');
      svg.appendChild(line);

      // Blob circle
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', bx);
      circle.setAttribute('cy', by);
      circle.setAttribute('r', 30);
      circle.setAttribute('fill', colors.blob);
      circle.setAttribute('opacity', '0.85');
      circle.setAttribute('class', 'dag-node node-enter');
      svg.appendChild(circle);

      addNodeText(svg, bx, by - 5, 'blob', 10, '#1a1a2e');
      addNodeText(svg, bx, by + 10, entry.sha.substring(0, 7), 9, '#1a1a2e');
      addNodeText(svg, bx, by + 50, entry.name, 11, '#a0a0b0');

      // Mode label on edge
      const midX = (treeX + bx) / 2;
      const midY = (treeY + 40 + by - 40) / 2;
      addNodeText(svg, midX + 10, midY, entry.mode, 9, '#a0a0b0');
    });

    addTitle(svg, w, 'Tree: 디렉토리 구조를 저장하는 객체');
  }

  function drawCommitChain(svg, w, h, colors) {
    const commits = objects.commits;
    const startX = 120;
    const gap = 220;
    const y = 160;

    commits.forEach((c, i) => {
      const x = startX + i * gap;

      // Commit circle
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 35);
      circle.setAttribute('fill', colors.commit);
      circle.setAttribute('opacity', '0.9');
      circle.setAttribute('class', 'dag-node node-enter');
      svg.appendChild(circle);

      addNodeText(svg, x, y - 8, 'commit', 10, '#1a1a2e');
      addNodeText(svg, x, y + 8, c.sha.substring(0, 7), 9, '#1a1a2e');

      // Message
      addNodeText(svg, x, y + 55, c.message, 11, '#e0e0e0');
      // Date
      addNodeText(svg, x, y + 72, c.date, 9, '#a0a0b0');

      // Parent arrow
      if (i > 0) {
        const prevX = startX + (i - 1) * gap;

        const marker = document.createElementNS(svgNS, 'marker');
        marker.setAttribute('id', `commit-arrow-${i}`);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '2');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '7');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('orient', 'auto-start-reverse');
        const mp = document.createElementNS(svgNS, 'path');
        mp.setAttribute('d', 'M 10 0 L 0 5 L 10 10 z');
        mp.setAttribute('fill', '#a0a0b0');
        marker.appendChild(mp);
        svg.appendChild(marker);

        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x - 35);
        line.setAttribute('y1', y);
        line.setAttribute('x2', prevX + 40);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#a0a0b0');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', `url(#commit-arrow-${i})`);
        svg.appendChild(line);

        // "parent" label
        const mx = (x - 35 + prevX + 40) / 2;
        addNodeText(svg, mx, y - 14, 'parent', 9, '#a0a0b0');
      }
    });

    // HEAD pointer
    const lastX = startX + (commits.length - 1) * gap;
    const headY = y - 70;
    const headRect = document.createElementNS(svgNS, 'rect');
    headRect.setAttribute('x', lastX - 28);
    headRect.setAttribute('y', headY - 12);
    headRect.setAttribute('width', 56);
    headRect.setAttribute('height', 24);
    headRect.setAttribute('rx', '6');
    headRect.setAttribute('fill', '#e94560');
    svg.appendChild(headRect);
    addNodeText(svg, lastX, headY + 4, 'HEAD', 11, '#fff');

    // Arrow from HEAD to last commit
    const headArrow = document.createElementNS(svgNS, 'line');
    headArrow.setAttribute('x1', lastX);
    headArrow.setAttribute('y1', headY + 12);
    headArrow.setAttribute('x2', lastX);
    headArrow.setAttribute('y2', y - 38);
    headArrow.setAttribute('stroke', '#e94560');
    headArrow.setAttribute('stroke-width', '2');
    svg.appendChild(headArrow);

    addTitle(
      svg,
      w,
      'Commit: 스냅샷을 저장하는 객체 (부모 참조 → 히스토리 형성)',
    );
  }

  function drawTagView(svg, w, h, colors) {
    const tag = objects.tags[0];
    const commit = objects.commits[2];
    const tagX = 250;
    const commitX = 550;
    const y = 180;

    // Tag node (pentagon-like)
    const tagRect = document.createElementNS(svgNS, 'rect');
    tagRect.setAttribute('x', tagX - 45);
    tagRect.setAttribute('y', y - 30);
    tagRect.setAttribute('width', 90);
    tagRect.setAttribute('height', 60);
    tagRect.setAttribute('rx', '8');
    tagRect.setAttribute('fill', colors.tag);
    tagRect.setAttribute('opacity', '0.9');
    tagRect.setAttribute('class', 'node-enter');
    svg.appendChild(tagRect);

    addNodeText(svg, tagX, y - 8, 'tag', 11, '#1a1a2e');
    addNodeText(svg, tagX, y + 10, tag.name, 12, '#1a1a2e');

    // Commit node
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', commitX);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 35);
    circle.setAttribute('fill', colors.commit);
    circle.setAttribute('opacity', '0.85');
    circle.setAttribute('class', 'node-enter');
    svg.appendChild(circle);

    addNodeText(svg, commitX, y - 5, 'commit', 10, '#1a1a2e');
    addNodeText(svg, commitX, y + 10, commit.sha.substring(0, 7), 9, '#1a1a2e');
    addNodeText(svg, commitX, y + 55, commit.message, 11, '#e0e0e0');

    // Arrow tag → commit
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', tagX + 45);
    line.setAttribute('y1', y);
    line.setAttribute('x2', commitX - 38);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#a0a0b0');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,3');
    svg.appendChild(line);

    addNodeText(svg, (tagX + commitX) / 2, y - 14, 'target', 10, '#a0a0b0');

    // Tag info
    addNodeText(svg, tagX, y + 60, `"${tag.message}"`, 10, '#a0a0b0');

    addTitle(svg, w, 'Tag: 특정 커밋에 이름을 붙이는 참조 (릴리스 버전 등)');
  }

  function drawHexagon(svg, cx, cy, r, fill, label, sha) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    const hex = document.createElementNS(svgNS, 'polygon');
    hex.setAttribute('points', points.join(' '));
    hex.setAttribute('fill', fill);
    hex.setAttribute('opacity', '0.85');
    hex.setAttribute('class', 'dag-node node-enter');
    svg.appendChild(hex);

    addNodeText(svg, cx, cy - 5, label, 11, '#1a1a2e');
    addNodeText(svg, cx, cy + 10, sha.substring(0, 7), 8, '#1a1a2e');
  }

  function addNodeText(svg, x, y, text, size, fill) {
    const el = document.createElementNS(svgNS, 'text');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('font-size', size);
    el.setAttribute('fill', fill);
    el.setAttribute('font-weight', size > 10 ? '600' : '400');
    el.textContent = text;
    svg.appendChild(el);
  }

  function addTitle(svg, w, text) {
    const el = document.createElementNS(svgNS, 'text');
    el.setAttribute('x', w / 2);
    el.setAttribute('y', 35);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('font-size', '14');
    el.setAttribute('fill', '#a0a0b0');
    el.setAttribute('font-weight', '500');
    el.textContent = text;
    svg.appendChild(el);
  }

  function getDetailHtml(type) {
    const details = {
      blob: `<h4>Blob 객체</h4>
        <p>파일의 <strong>내용만</strong> 저장합니다 (파일명, 경로 정보 없음).</p>
        <p>동일 내용 → 동일 해시 → <strong>중복 제거</strong>.</p>
        <p>저장 형식: <code>blob {size}\0{content}</code></p>`,
      tree: `<h4>Tree 객체</h4>
        <p><strong>디렉토리 구조</strong>를 저장합니다: 파일명 + blob/tree 참조.</p>
        <p>각 항목: <code>{mode} {type} {sha} {name}</code></p>
        <p>중첩 tree로 하위 디렉토리를 표현합니다.</p>`,
      commit: `<h4>Commit 객체</h4>
        <p>프로젝트의 <strong>스냅샷</strong>: tree 참조 + parent 커밋 + 메타데이터.</p>
        <p>포함 정보: tree SHA, parent SHA, author, committer, message</p>
        <p>parent 참조로 <strong>DAG (Directed Acyclic Graph)</strong>를 형성합니다.</p>`,
      tag: `<h4>Tag 객체</h4>
        <p>특정 커밋에 <strong>영구적인 이름</strong>을 부여합니다 (v1.0.0 등).</p>
        <p>Lightweight tag: 단순 참조 / Annotated tag: 메시지+서명 포함 객체.</p>
        <p>릴리스 버전 관리에 주로 사용합니다.</p>`,
    };
    return details[type] || '';
  }

  render();

  if (window.__gitProgress) {
    window.__gitProgress.save('section-objects');
  }
}
