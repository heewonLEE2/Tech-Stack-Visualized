// ===== Embedding: 2D Vector Space Visualization =====
export function initEmbedding() {
  const canvas = document.getElementById('embedding-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const legendEl = document.getElementById('embed-legend');

  const categories = {
    기술: {
      color: '#60a5fa',
      words: ['인공지능', '딥러닝', '머신러닝', '신경망', '알고리즘', '데이터'],
    },
    자연: {
      color: '#4ade80',
      words: ['강아지', '고양이', '새', '나무', '꽃', '바다'],
    },
    음식: {
      color: '#fbbf24',
      words: ['피자', '치킨', '라면', '김치', '초밥', '파스타'],
    },
    감정: {
      color: '#f472b6',
      words: ['행복', '슬픔', '분노', '사랑', '공포', '기쁨'],
    },
  };

  // Pre-computed 2D positions (simulated t-SNE output on real embeddings)
  const points = [];
  const clusterCenters = {
    기술: { cx: 0.25, cy: 0.3 },
    자연: { cx: 0.75, cy: 0.25 },
    음식: { cx: 0.3, cy: 0.75 },
    감정: { cx: 0.7, cy: 0.7 },
  };

  // Deterministic pseudo-random from seed
  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  let seed = 42;
  Object.entries(categories).forEach(([cat, data]) => {
    const center = clusterCenters[cat];
    data.words.forEach((word, i) => {
      const r1 = seededRandom(seed++) * 0.12 - 0.06;
      const r2 = seededRandom(seed++) * 0.12 - 0.06;
      points.push({
        word,
        category: cat,
        color: data.color,
        x: center.cx + r1 + (i % 3) * 0.03,
        y: center.cy + r2 + Math.floor(i / 3) * 0.03,
      });
    });
  });

  const state = {
    selected: null,
    hovered: null,
    clickCount: 0,
  };

  // Legend
  if (legendEl) {
    legendEl.innerHTML = Object.entries(categories)
      .map(
        ([cat, d]) =>
          `<div class="legend-item"><span class="legend-dot" style="background:${d.color}"></span>${cat}</div>`,
      )
      .join('');
  }

  function toCanvasX(x) {
    return x * canvas.width * 0.8 + canvas.width * 0.1;
  }
  function toCanvasY(y) {
    return y * canvas.height * 0.8 + canvas.height * 0.1;
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw similarity circle for selected point
    if (state.selected) {
      const sx = toCanvasX(state.selected.x);
      const sy = toCanvasY(state.selected.y);
      const radius = 80;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96, 165, 250, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw cosine similarity lines to nearby points
      points.forEach((p) => {
        if (p === state.selected) return;
        const px = toCanvasX(p.x);
        const py = toCanvasY(p.y);
        const dist = Math.sqrt((px - sx) ** 2 + (py - sy) ** 2);
        if (dist < radius) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Similarity score
          const sim = Math.max(0, 1 - dist / radius).toFixed(2);
          const mx = (sx + px) / 2;
          const my = (sy + py) / 2;
          ctx.font = '10px "Noto Sans KR"';
          ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
          ctx.fillText(sim, mx + 4, my - 4);
        }
      });
    }

    // Draw points
    points.forEach((p) => {
      const px = toCanvasX(p.x);
      const py = toCanvasY(p.y);
      const isSelected = p === state.selected;
      const isHovered = p === state.hovered;
      const r = isSelected ? 8 : isHovered ? 7 : 5;

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      if (isSelected) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.font = `${isSelected || isHovered ? '12' : '10'}px "Noto Sans KR"`;
      ctx.fillStyle = isSelected ? '#fff' : 'rgba(224,224,224,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(p.word, px, py - r - 4);
    });

    // Cosine similarity angle visualization for selected point
    if (state.selected) {
      const sx = toCanvasX(state.selected.x);
      const sy = toCanvasY(state.selected.y);
      const origin = { x: canvas.width / 2, y: canvas.height / 2 };

      // Selected vector arrow
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = state.selected.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function getPointAt(mx, my) {
    for (const p of points) {
      const px = toCanvasX(p.x);
      const py = toCanvasY(p.y);
      if (Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < 12) return p;
    }
    return null;
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    const p = getPointAt(pos.x, pos.y);
    state.hovered = p;
    canvas.style.cursor = p ? 'pointer' : 'default';
    render();
  });

  canvas.addEventListener('click', (e) => {
    const pos = getMousePos(e);
    const p = getPointAt(pos.x, pos.y);
    state.selected = p;
    if (p) {
      state.clickCount++;
      if (state.clickCount >= 3 && window.__ragProgress) {
        window.__ragProgress.save('section-embedding');
      }
    }
    render();
  });

  render();
}
