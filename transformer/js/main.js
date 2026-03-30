// ===== Main Navigation & Section Initialization =====
import { initArchitecture } from './architecture.js';
import { initAttention, initMultiHead } from './attention.js';
import { initPositional } from './positional.js';
import { initAddNorm, initFFN } from './feedforward.js';
import { initDataflow } from './dataflow.js';
import { initPlayground } from './playground.js';

// ===== Glossary Terms =====
const GLOSSARY = {
  transformer: {
    en: 'Transformer',
    ko: '어텐션 메커니즘만으로 시퀀스를 처리하는 모델 (2017, Vaswani et al.)',
  },
  encoder: {
    en: 'Encoder',
    ko: '인코더: 입력 시퀀스를 문맥 벡터로 변환하는 구조',
  },
  decoder: {
    en: 'Decoder',
    ko: '디코더: 인코더 출력을 참조하여 출력 시퀀스를 생성하는 구조',
  },
  attention: {
    en: 'Attention',
    ko: '어텐션: 시퀀스의 각 위치가 다른 위치에 얼마나 집중할지 계산하는 메커니즘',
  },
  'self-attention': {
    en: 'Self-Attention',
    ko: '셀프 어텐션: 같은 시퀀스 내에서 각 토큰이 다른 토큰을 참조하는 어텐션',
  },
  query: {
    en: 'Query (Q)',
    ko: '쿼리: "무엇을 찾고 있는가?" — 현재 토큰의 질의 벡터',
  },
  key: {
    en: 'Key (K)',
    ko: '키: "나는 어떤 정보를 갖고 있는가?" — 각 토큰의 색인 벡터',
  },
  value: {
    en: 'Value (V)',
    ko: '밸류: "실제 전달할 정보" — 어텐션 가중치로 합산될 벡터',
  },
  'scaled-dot-product': {
    en: 'Scaled Dot-Product',
    ko: '스케일드 내적: QK^T / √d_k로 어텐션 스코어를 계산하는 방식',
  },
  'multi-head': {
    en: 'Multi-Head Attention',
    ko: '멀티-헤드 어텐션: 여러 부분공간에서 병렬로 어텐션을 수행하는 구조',
  },
  'positional-encoding': {
    en: 'Positional Encoding',
    ko: '위치 인코딩: sin/cos 함수로 토큰의 순서 정보를 벡터에 추가하는 기법',
  },
  embedding: {
    en: 'Embedding',
    ko: '임베딩: 토큰(단어)을 고정 크기의 밀집 벡터로 변환하는 과정',
  },
  'layer-norm': {
    en: 'Layer Normalization',
    ko: '레이어 정규화: 한 샘플 내 모든 차원의 값을 평균=0, 분산=1로 맞추는 정규화',
  },
  residual: {
    en: 'Residual Connection',
    ko: '잔차 연결(Skip Connection): 입력을 서브레이어 출력에 직접 더하여 기울기 소실을 방지',
  },
  ffn: {
    en: 'Feed-Forward Network',
    ko: 'FFN: 각 토큰을 독립적으로 비선형 변환하는 2층 MLP (d_model→d_ff→d_model)',
  },
  softmax: {
    en: 'Softmax',
    ko: '소프트맥스: 실수 벡터를 확률 분포(합=1)로 변환하는 함수',
  },
  'cross-attention': {
    en: 'Cross-Attention',
    ko: '크로스 어텐션: 디코더의 Q가 인코더의 K, V를 참조하는 어텐션',
  },
  'masked-attention': {
    en: 'Masked Self-Attention',
    ko: '마스크드 셀프 어텐션: 미래 토큰을 −∞로 마스킹하여 참조를 차단하는 어텐션',
  },
  token: {
    en: 'Token',
    ko: '토큰: 텍스트를 분할한 최소 단위 (단어, 서브워드, 문자 등)',
  },
  'd-model': {
    en: 'd_model',
    ko: '모델 차원: Transformer 전체에서 사용하는 벡터 크기 (논문 기준 512)',
  },
  gradient: {
    en: 'Gradient',
    ko: '기울기: 손실 함수의 미분값. 역전파 시 가중치 업데이트 방향을 결정',
  },
};

// Section initializers map
const sectionInits = {
  'section-architecture': initArchitecture,
  'section-positional': initPositional,
  'section-attention': initAttention,
  'section-multihead': initMultiHead,
  'section-addnorm': initAddNorm,
  'section-ffn': initFFN,
  'section-decoder': null, // handled inside attention.js
  'section-dataflow': initDataflow,
  'section-playground': initPlayground,
};

const initialized = new Set();

// ===== Progress Tracking =====
const PROGRESS_KEY = 'transformer-progress';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(sectionId) {
  const progress = loadProgress();
  if (progress[sectionId]) return;
  progress[sectionId] = true;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  updateProgressUI();
}

function updateProgressUI() {
  const progress = loadProgress();
  document.querySelectorAll('.nav-check[data-progress]').forEach((el) => {
    if (progress[el.dataset.progress]) {
      el.classList.add('completed');
    }
  });
}

window.__transformerProgress = { save: saveProgress };

// IntersectionObserver for section visibility & nav highlight
function setupObserver() {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Initialize section on first view
          if (!initialized.has(id) && sectionInits[id]) {
            sectionInits[id]();
            initialized.add(id);
          }
          // Special case: decoder is in attention.js
          if (id === 'section-decoder' && !initialized.has(id)) {
            import('./attention.js').then((m) => m.initDecoder());
            initialized.add(id);
          }
          // Update nav
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    },
    { threshold: 0.15 },
  );

  sections.forEach((s) => observer.observe(s));
}

// Smooth scroll navigation
function setupNav() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        // Close mobile menu
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
}

// Mobile menu
function setupMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== btn
    ) {
      sidebar.classList.remove('open');
    }
  });
}

// Theme toggle
function setupTheme() {
  const btn = document.getElementById('theme-toggle');
  const icon = btn.querySelector('.theme-icon');
  let isDark = true;

  btn.addEventListener('click', () => {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    icon.textContent = isDark ? '☀' : '☾';
  });
}

// Global tooltip (supports data-tooltip AND data-term glossary)
function setupTooltips() {
  const tooltip = document.getElementById('tooltip');
  document.addEventListener('mouseover', (e) => {
    // data-term (glossary)
    const triggerTerm = e.target.closest('[data-term]');
    if (triggerTerm) {
      const term = GLOSSARY[triggerTerm.dataset.term];
      if (term) {
        tooltip.innerHTML = `<strong>${term.en}</strong><br>${term.ko}`;
        tooltip.style.display = 'block';
      }
      return;
    }
    // data-tooltip (legacy)
    const trigger = e.target.closest('[data-tooltip]');
    if (trigger) {
      tooltip.textContent = trigger.dataset.tooltip;
      tooltip.style.display = 'block';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = e.clientX + 12 + 'px';
      tooltip.style.top = e.clientY + 12 + 'px';
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-tooltip]') || e.target.closest('[data-term]')) {
      tooltip.style.display = 'none';
    }
  });
}

// KaTeX formula rendering
function setupKaTeX() {
  const renderFormulas = () => {
    if (typeof katex === 'undefined') {
      setTimeout(renderFormulas, 100);
      return;
    }
    const formulas = {
      'pe-formula':
        'PE_{(pos,2i)} = \\sin\\!\\left(\\dfrac{pos}{10000^{2i/d_{model}}}\\right),\\quad PE_{(pos,2i+1)} = \\cos\\!\\left(\\dfrac{pos}{10000^{2i/d_{model}}}\\right)',
      'attn-formula':
        '\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\dfrac{QK^T}{\\sqrt{d_k}}\\right)V',
      'mh-formula':
        '\\text{MultiHead}(Q,K,V) = \\text{Concat}(\\text{head}_1,\\ldots,\\text{head}_h)\\,W^O',
      'addnorm-formula':
        '\\text{LayerNorm}(x + \\text{Sublayer}(x)),\\quad y = \\gamma\\,\\dfrac{x-\\mu}{\\sqrt{\\sigma^2+\\epsilon}} + \\beta',
      'ffn-formula': '\\text{FFN}(x) = \\max(0,\\, xW_1 + b_1)\\,W_2 + b_2',
    };
    for (const [id, tex] of Object.entries(formulas)) {
      const el = document.getElementById(id);
      if (el) {
        katex.render(tex, el, { displayMode: false, throwOnError: false });
      }
    }
  };
  renderFormulas();
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
  setupKaTeX();
  updateProgressUI();
  setupObserver();

  // Make first section visible immediately
  const first = document.getElementById('section-architecture');
  if (first) {
    first.classList.add('visible');
    if (!initialized.has('section-architecture')) {
      initArchitecture();
      initialized.add('section-architecture');
    }
  }
});
