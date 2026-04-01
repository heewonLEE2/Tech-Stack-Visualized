// ===== Docker Compose Visualization =====

export function initCompose() {
  const container = document.getElementById('compose-container');
  if (!container) return;

  const state = {
    animating: false,
    step: 0,
    timer: null,
    speed: 1,
  };

  const services = [
    {
      name: 'web',
      label: 'Nginx',
      port: '80:80',
      color: '#66bb6a',
      icon: '🌐',
      depends: ['app'],
      x: 300,
      y: 30,
    },
    {
      name: 'app',
      label: 'Node.js',
      port: '3000',
      color: '#26c6da',
      icon: '⚙',
      depends: ['db', 'cache'],
      x: 300,
      y: 130,
    },
    {
      name: 'db',
      label: 'PostgreSQL',
      port: '5432',
      color: '#ff9800',
      icon: '🗄',
      depends: [],
      x: 180,
      y: 240,
    },
    {
      name: 'cache',
      label: 'Redis',
      port: '6379',
      color: '#ec407a',
      icon: '⚡',
      depends: [],
      x: 420,
      y: 240,
    },
  ];

  const yamlCode = `version: "3.9"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - app

  app:
    build: ./app
    ports:
      - "3000:3000"
    depends_on:
      - db
      - cache
    environment:
      - DB_HOST=db
      - REDIS_HOST=cache

  db:
    image: postgres:15
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret

  cache:
    image: redis:7-alpine

volumes:
  db-data:`;

  function render() {
    container.innerHTML = '';

    const layout = document.createElement('div');
    layout.className = 'compose-layout';

    // Left: YAML
    const yamlPanel = document.createElement('div');
    yamlPanel.className = 'compose-yaml';
    yamlPanel.innerHTML = `
      <div style="font-weight:600; font-size:0.85rem; margin-bottom:8px; color:var(--compose-color);">
        📄 docker-compose.yml
      </div>
      <pre style="font-size:0.75rem; line-height:1.5; color:var(--text-secondary); overflow-x:auto; margin:0;">${escapeHtml(yamlCode)}</pre>
    `;
    layout.appendChild(yamlPanel);

    // Right: Architecture diagram
    const vizPanel = document.createElement('div');
    vizPanel.className = 'compose-visual';

    // SVG diagram
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 600 340');
    svg.setAttribute('id', 'compose-svg');
    svg.style.cssText =
      'width:100%; max-width:600px; display:block; margin:0 auto;';

    // Network background
    const netRect = document.createElementNS(svgNS, 'rect');
    netRect.setAttribute('x', 30);
    netRect.setAttribute('y', 10);
    netRect.setAttribute('width', 540);
    netRect.setAttribute('height', 300);
    netRect.setAttribute('rx', 12);
    netRect.setAttribute('fill', 'rgba(92,107,192,0.06)');
    netRect.setAttribute('stroke', 'var(--compose-color)');
    netRect.setAttribute('stroke-width', '1.5');
    netRect.setAttribute('stroke-dasharray', '6 4');
    svg.appendChild(netRect);

    const netLabel = document.createElementNS(svgNS, 'text');
    netLabel.setAttribute('x', 300);
    netLabel.setAttribute('y', 325);
    netLabel.setAttribute('text-anchor', 'middle');
    netLabel.setAttribute('font-size', '11');
    netLabel.setAttribute('fill', 'var(--compose-color)');
    netLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
    netLabel.textContent = '🌐 default network (bridge)';
    svg.appendChild(netLabel);

    // Draw dependency arrows first (behind boxes)
    services.forEach((svc) => {
      svc.depends.forEach((dep) => {
        const target = services.find((s) => s.name === dep);
        if (!target) return;

        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', svc.x);
        line.setAttribute('y1', svc.y + 55);
        line.setAttribute('x2', target.x);
        line.setAttribute('y2', target.y);
        line.setAttribute('stroke', '#555');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '4 3');
        line.classList.add('compose-dep-line');
        line.setAttribute('data-from', svc.name);
        line.setAttribute('data-to', dep);
        svg.appendChild(line);

        // Arrow label
        const mx = (svc.x + target.x) / 2;
        const my = (svc.y + 55 + target.y) / 2;
        const depLabel = document.createElementNS(svgNS, 'text');
        depLabel.setAttribute('x', mx + 10);
        depLabel.setAttribute('y', my);
        depLabel.setAttribute('font-size', '9');
        depLabel.setAttribute('fill', '#888');
        depLabel.setAttribute('font-family', "'Noto Sans KR', sans-serif");
        depLabel.textContent = 'depends_on';
        svg.appendChild(depLabel);
      });
    });

    // Draw service boxes
    services.forEach((svc) => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('data-service', svc.name);
      g.style.opacity = '0.3';

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', svc.x - 65);
      rect.setAttribute('y', svc.y);
      rect.setAttribute('width', 130);
      rect.setAttribute('height', 55);
      rect.setAttribute('rx', 8);
      rect.setAttribute('fill', svc.color + '18');
      rect.setAttribute('stroke', svc.color);
      rect.setAttribute('stroke-width', '2');

      const icon = document.createElementNS(svgNS, 'text');
      icon.setAttribute('x', svc.x - 45);
      icon.setAttribute('y', svc.y + 35);
      icon.setAttribute('font-size', '18');
      icon.textContent = svc.icon;

      const name = document.createElementNS(svgNS, 'text');
      name.setAttribute('x', svc.x - 20);
      name.setAttribute('y', svc.y + 25);
      name.setAttribute('font-size', '13');
      name.setAttribute('font-weight', '700');
      name.setAttribute('fill', svc.color);
      name.setAttribute('font-family', "'Noto Sans KR', sans-serif");
      name.textContent = svc.label;

      const portText = document.createElementNS(svgNS, 'text');
      portText.setAttribute('x', svc.x - 20);
      portText.setAttribute('y', svc.y + 43);
      portText.setAttribute('font-size', '10');
      portText.setAttribute('fill', '#a0a0b0');
      portText.setAttribute('font-family', "'Courier New', monospace");
      portText.textContent = `:${svc.port}`;

      g.appendChild(rect);
      g.appendChild(icon);
      g.appendChild(name);
      g.appendChild(portText);
      svg.appendChild(g);
    });

    vizPanel.appendChild(svg);
    layout.appendChild(vizPanel);
    container.appendChild(layout);
  }

  function startAnimation() {
    if (state.animating) return;
    state.animating = true;

    // Start order: dependencies first → db, cache → app → web
    const startOrder = ['db', 'cache', 'app', 'web'];
    let idx = 0;

    function activateNext() {
      if (idx >= startOrder.length) {
        state.animating = false;
        window.__dockerProgress?.save('section-compose');
        return;
      }

      const svcName = startOrder[idx];
      const svg = document.getElementById('compose-svg');
      if (!svg) return;

      const g = svg.querySelector(`g[data-service="${svcName}"]`);
      if (g) {
        g.style.transition = 'opacity 0.5s ease';
        g.style.opacity = '1';

        // Highlight rect
        const rect = g.querySelector('rect');
        if (rect) {
          rect.setAttribute('stroke-width', '3');
        }
      }

      // Highlight lines pointing to this service
      svg
        .querySelectorAll(`.compose-dep-line[data-to="${svcName}"]`)
        .forEach((line) => {
          line.setAttribute(
            'stroke',
            services.find((s) => s.name === svcName)?.color || '#5c6bc0',
          );
          line.setAttribute('stroke-width', '2');
        });

      idx++;
      state.timer = setTimeout(activateNext, 800 / state.speed);
    }

    // Reset first
    const svg = document.getElementById('compose-svg');
    if (svg) {
      svg.querySelectorAll('g[data-service]').forEach((g) => {
        g.style.opacity = '0.3';
        const rect = g.querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '2');
      });
      svg.querySelectorAll('.compose-dep-line').forEach((l) => {
        l.setAttribute('stroke', '#555');
        l.setAttribute('stroke-width', '1.5');
      });
    }

    setTimeout(activateNext, 300);
  }

  function resetAnimation() {
    clearTimeout(state.timer);
    state.animating = false;
    render();
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  render();

  // Bind HTML controls
  const composeUpBtn = document.getElementById('compose-up');
  const composeDownBtn = document.getElementById('compose-down');
  const composeResetBtn = document.getElementById('compose-reset');
  const composeSpeedEl = document.getElementById('compose-speed');
  const composeSpeedValEl = document.getElementById('compose-speed-val');

  if (composeUpBtn)
    composeUpBtn.addEventListener('click', () => startAnimation());
  if (composeDownBtn)
    composeDownBtn.addEventListener('click', () => resetAnimation());
  if (composeResetBtn)
    composeResetBtn.addEventListener('click', () => resetAnimation());
  if (composeSpeedEl) {
    composeSpeedEl.addEventListener('input', () => {
      state.speed = parseFloat(composeSpeedEl.value);
      if (composeSpeedValEl)
        composeSpeedValEl.textContent = composeSpeedEl.value + 'x';
    });
  }
}
