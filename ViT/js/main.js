// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initPatch } from './patch.js';
import { initEmbedding } from './embedding.js';
import { initAttention } from './attention.js';
import { initClassifier } from './classifier.js';
import { initPlayground } from './playground.js';

// ───── Glossary (용어 사전) ─────
const GLOSSARY = {
  vit: {
    en: 'Vision Transformer (ViT)',
    ko: '이미지를 패치 시퀀스로 변환하여 Transformer로 분류하는 모델 (2020, Dosovitskiy et al.)',
  },
  patch: {
    en: 'Patch',
    ko: '패치: 이미지를 고정 크기(P×P)로 나눈 조각. NLP의 토큰에 해당',
  },
  embedding: {
    en: 'Embedding',
    ko: '임베딩: 데이터를 고정 차원의 연속 벡터로 변환하는 과정',
  },
  'linear-projection': {
    en: 'Linear Projection',
    ko: '선형 투영: 행렬 곱으로 차원을 변환. ViT에서는 패치를 D차원으로 사상',
  },
  'cls-token': {
    en: '[CLS] Token',
    ko: 'CLS 토큰: 시퀀스 앞에 추가하는 학습 가능 토큰. 전체 이미지를 대표하는 벡터',
  },
  'position-embedding': {
    en: 'Position Embedding',
    ko: '위치 임베딩: 토큰의 공간적 위치 정보를 주입하는 학습 가능 벡터',
  },
  encoder: {
    en: 'Transformer Encoder',
    ko: '인코더: MSA + MLP + 잔차 연결로 구성된 블록을 L번 반복',
  },
  'self-attention': {
    en: 'Self-Attention',
    ko: '셀프 어텐션: 같은 시퀀스 내에서 각 토큰이 다른 모든 토큰을 참조하는 메커니즘',
  },
  'multi-head-attention': {
    en: 'Multi-Head Attention',
    ko: '멀티헤드 어텐션: 여러 독립적인 어텐션 헤드로 다양한 관계 패턴을 동시에 학습',
  },
  query: {
    en: 'Query (Q)',
    ko: '쿼리: "어떤 정보가 필요한가?"를 표현하는 벡터. 입력에 W_Q를 곱해 생성',
  },
  key: {
    en: 'Key (K)',
    ko: '키: "어떤 정보를 가지고 있는가?"를 표현하는 벡터. 입력에 W_K를 곱해 생성',
  },
  value: {
    en: 'Value (V)',
    ko: '밸류: 실제 전달할 정보를 담은 벡터. 어텐션 가중치로 합산하여 출력 생성',
  },
  softmax: {
    en: 'Softmax',
    ko: '소프트맥스: 실수 벡터를 확률 분포로 변환하는 함수. 합이 1이 되도록 정규화',
  },
  scaling: {
    en: 'Scaled Dot-Product',
    ko: '스케일링: QK^T를 √d_k로 나누어 softmax 포화를 방지하는 기법',
  },
  'layer-norm': {
    en: 'Layer Normalization',
    ko: '레이어 정규화: 각 토큰 벡터를 평균 0, 분산 1로 정규화. 학습 안정화',
  },
  mlp: {
    en: 'MLP (Feed-Forward Network)',
    ko: '다층 퍼셉트론: Linear → GELU → Linear 구조. 토큰별 독립적으로 비선형 변환',
  },
  gelu: {
    en: 'GELU',
    ko: 'Gaussian Error Linear Unit: ViT가 사용하는 활성화 함수. ReLU보다 부드러운 비선형성',
  },
  'residual-connection': {
    en: 'Residual Connection',
    ko: '잔차 연결: 입력을 출력에 더하는 skip connection. 기울기 소실 방지 + 학습 안정화',
  },
  'inductive-bias': {
    en: 'Inductive Bias',
    ko: '귀납적 편향: 모델에 내장된 가정. CNN은 locality/translation equivariance가 강하지만 ViT는 최소한',
  },
  flatten: {
    en: 'Flatten',
    ko: '평탄화: 2D 패치를 1D 벡터로 펼치는 연산. (P, P, C) → (P²·C)',
  },
  transformer: {
    en: 'Transformer',
    ko: '어텐션 메커니즘만으로 시퀀스를 처리하는 모델 (2017, Vaswani et al.)',
  },
  'attention-map': {
    en: 'Attention Map',
    ko: '어텐션 맵: 각 토큰이 다른 토큰에 보내는 어텐션 가중치를 시각화한 행렬/히트맵',
  },
  imagenet: {
    en: 'ImageNet',
    ko: 'ImageNet: 1000개 클래스, 128만 장의 이미지 분류 벤치마크 데이터셋',
  },
};

const sectionInits = {
  'section-overview': initOverview,
  'section-patch': initPatch,
  'section-patch-embed': () => initEmbedding('patch'),
  'section-pos-embed': () => initEmbedding('position'),
  'section-cls-token': () => initEmbedding('cls'),
  'section-encoder': () => initEmbedding('encoder'),
  'section-attention': initAttention,
  'section-mlp-head': initClassifier,
  'section-playground': initPlayground,
};

const initialized = new Set();

// ───── Progress Tracking ─────
const PROGRESS_KEY = 'vit-progress';

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

window.__vitProgress = { save: saveProgress };

// ───── IntersectionObserver ─────
function setupObserver() {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (!initialized.has(id) && sectionInits[id]) {
            sectionInits[id]();
            initialized.add(id);
          }
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

function setupNav() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
}

function setupMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
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

// ───── Tooltips (data-term) ─────
function setupTooltips() {
  const tooltip = document.getElementById('tooltip');
  document.addEventListener('mouseover', (e) => {
    const triggerTerm = e.target.closest('[data-term]');
    if (triggerTerm) {
      const term = GLOSSARY[triggerTerm.dataset.term];
      if (term) {
        tooltip.innerHTML = `<strong>${term.en}</strong><br>${term.ko}`;
        tooltip.style.display = 'block';
      }
      return;
    }
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

// ───── KaTeX 수식 렌더링 ─────
function setupKaTeX() {
  const renderFormulas = () => {
    if (typeof katex === 'undefined') {
      setTimeout(renderFormulas, 100);
      return;
    }
    const formulas = {
      'patch-formula': 'N = \\dfrac{H \\times W}{P^2}',
      'embed-formula':
        '\\mathbf{z}_0 = [\\mathbf{x}_{\\text{class}};\\; \\mathbf{x}^1_p E;\\; \\mathbf{x}^2_p E;\\; \\cdots;\\; \\mathbf{x}^N_p E] + \\mathbf{E}_{pos}',
      'pos-embed-formula':
        '\\mathbf{E}_{pos} \\in \\mathbb{R}^{(N+1) \\times D},\\quad \\text{learnable}',
      'attn-formula':
        '\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\dfrac{QK^T}{\\sqrt{d_k}}\\right)V',
      'mh-formula':
        '\\text{MultiHead}(Q,K,V) = \\text{Concat}(\\text{head}_1, \\ldots, \\text{head}_h)\\,W^O',
      'encoder-formula1':
        "\\mathbf{z}'_\\ell = \\text{MSA}(\\text{LN}(\\mathbf{z}_{\\ell-1})) + \\mathbf{z}_{\\ell-1}",
      'encoder-formula2':
        "\\mathbf{z}_\\ell = \\text{MLP}(\\text{LN}(\\mathbf{z}'_\\ell)) + \\mathbf{z}'_\\ell",
      'cls-formula': '\\mathbf{y} = \\text{MLP}(\\text{LN}(\\mathbf{z}_L^0))',
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

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
  setupKaTeX();
  updateProgressUI();
  setupObserver();

  // 첫 번째 섹션 즉시 표시
  const first = document.getElementById('section-overview');
  if (first) {
    first.classList.add('visible');
    if (!initialized.has('section-overview')) {
      initOverview();
      initialized.add('section-overview');
    }
  }
});
