// ===== Swin Transformer — main.js =====
import { initOverview } from './overview.js';
import { initPatch } from './patch.js';
import { initWindowAttention } from './window-attention.js';
import { initPositionBias } from './position-bias.js';
import { initPlayground } from './playground.js';

// ─── Glossary (data-term → tooltip) ───
const GLOSSARY = {
  'swin-transformer': {
    en: 'Swin Transformer',
    ko: '시프트 윈도우 기반 계층적 비전 트랜스포머 (Liu et al., 2021)',
  },
  'shifted-window': {
    en: 'Shifted Window',
    ko: '윈도우를 (M/2, M/2)만큼 이동하여 윈도우 간 정보 교환을 가능하게 하는 메커니즘',
  },
  hierarchical: {
    en: 'Hierarchical Representation',
    ko: '다양한 해상도의 특징 맵을 생성하는 피라미드 구조. CNN과 유사한 다중 스케일 표현',
  },
  patch: {
    en: 'Patch',
    ko: '이미지를 겹치지 않게 분할한 작은 조각. Swin에서는 4×4 픽셀 = 1 패치',
  },
  stage: {
    en: 'Stage',
    ko: 'Swin Block 여러 개 + Patch Merging으로 구성된 처리 단계. 총 4개의 Stage',
  },
  vit: {
    en: 'Vision Transformer (ViT)',
    ko: '이미지 전체에 전역 어텐션을 적용하는 비전 트랜스포머 (Dosovitskiy et al., 2020)',
  },
  'global-attention': {
    en: 'Global Self-Attention',
    ko: '모든 토큰 쌍에 대해 어텐션을 계산. 연산량 O(n²). ViT에서 사용',
  },
  'window-attention': {
    en: 'Window-based Self-Attention',
    ko: 'M×M 윈도우 내에서만 어텐션 계산. 연산량 O(n·M²). Swin에서 사용',
  },
  window: {
    en: 'Window',
    ko: '특징 맵을 겹치지 않게 분할한 M×M 크기의 영역. 윈도우 내에서만 어텐션 수행',
  },
  'w-msa': {
    en: 'Window-based Multi-head Self-Attention (W-MSA)',
    ko: '고정된 윈도우 내 셀프 어텐션. 홀수 Swin Block에서 사용',
  },
  'sw-msa': {
    en: 'Shifted Window MSA (SW-MSA)',
    ko: '윈도우를 (M/2, M/2)만큼 시프트한 후 어텐션 수행. 짝수 Swin Block에서 사용',
  },
  'self-attention': {
    en: 'Self-Attention',
    ko: 'Query, Key, Value를 같은 입력에서 생성하여 토큰 간 관계를 학습하는 메커니즘',
  },
  'patch-partition': {
    en: 'Patch Partition',
    ko: '이미지를 4×4 픽셀 패치로 분할. 224×224 → 56×56 개의 패치 토큰 생성',
  },
  'patch-merging': {
    en: 'Patch Merging',
    ko: '2×2 인접 패치를 연결(concat)하고 선형 투영하여 해상도를 ½로 줄이고 채널을 2배로 늘림',
  },
  'cyclic-shift': {
    en: 'Cyclic Shift',
    ko: 'SW-MSA 구현 시 특징 맵을 순환 이동. 추가 패딩 없이 시프트 윈도우를 효율적으로 처리',
  },
  'attention-mask': {
    en: 'Attention Mask',
    ko: '순환 시프트 후 서로 다른 영역의 토큰이 같은 윈도우에 섞이지 않도록 마스킹',
  },
  'feature-pyramid': {
    en: 'Feature Pyramid',
    ko: '다양한 해상도의 특징 맵. 객체 탐지(FPN), 세그멘테이션 등에 활용',
  },
  'relative-position-bias': {
    en: 'Relative Position Bias',
    ko: '두 토큰의 상대적 거리에 따른 학습 가능한 바이어스. 어텐션 스코어에 더해짐',
  },
  'absolute-position': {
    en: 'Absolute Position Encoding',
    ko: '각 토큰에 고정된 위치 값을 더하는 방식. ViT에서 사용. 해상도 변경 시 보간 필요',
  },
  pooling: {
    en: 'Pooling',
    ko: '공간 해상도를 줄이는 연산. CNN에서 max/avg pooling, Swin에서는 Patch Merging이 유사 역할',
  },
  'layer-norm': {
    en: 'Layer Normalization',
    ko: '각 토큰(샘플) 내에서 정규화. Transformer의 표준 정규화 기법',
  },
  mlp: {
    en: 'MLP (Multi-Layer Perceptron)',
    ko: '2층 완전연결 네트워크. GELU 활성화 + dropout. 채널 차원을 4배 확장 후 복원',
  },
  gelu: {
    en: 'GELU (Gaussian Error Linear Unit)',
    ko: '가우시안 오차 함수 기반 활성화. ReLU보다 부드러운 비선형성',
  },
  'swin-block': {
    en: 'Swin Transformer Block',
    ko: 'LN → W-MSA/SW-MSA → 잔차연결 → LN → MLP → 잔차연결. 2개가 한 쌍으로 동작',
  },
};

// ─── Section → Init 매핑 ───
const sectionInits = {
  'section-overview': initOverview,
  'section-patch': initPatch,
  'section-window-attention': initWindowAttention,
  'section-position-bias': initPositionBias,
  'section-playground': initPlayground,
};

const initialized = new Set();

// ─── Progress System ───
const PROGRESS_KEY = 'swin-progress';

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

window.__swinProgress = { save: saveProgress };

// ─── Navigation ───
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

// ─── Mobile Menu ───
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

// ─── Theme Toggle ───
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

// ─── Tooltip System ───
function setupTooltips() {
  const tooltip = document.getElementById('tooltip');

  document.addEventListener('mouseover', (e) => {
    const termEl = e.target.closest('[data-term]');
    if (termEl) {
      const term = GLOSSARY[termEl.dataset.term];
      if (term) {
        tooltip.innerHTML = `<strong>${term.en}</strong><br>${term.ko}`;
        tooltip.style.display = 'block';
      }
      return;
    }
    const tipEl = e.target.closest('[data-tooltip]');
    if (tipEl) {
      tooltip.textContent = tipEl.dataset.tooltip;
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

// ─── KaTeX Formula Rendering ───
function setupKaTeX() {
  const render = () => {
    if (typeof katex === 'undefined') {
      setTimeout(render, 100);
      return;
    }

    const formulas = {
      'patch-formula':
        'N = \\dfrac{H}{4} \\times \\dfrac{W}{4} \\;\\;\\; \\text{(패치 파티션)} \\quad\\longrightarrow\\quad \\text{Merging: concat}(2{\\times}2) \\to \\text{Linear}(4C \\to 2C)',
      'attn-formula':
        '\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\dfrac{QK^T}{\\sqrt{d}} + B\\right)V',
      'cost-wmsa-formula': '\\Omega(\\text{W-MSA}) = 4hwC^2 + 2M^2hwC',
      'cost-global-formula': '\\Omega(\\text{Global}) = 4hwC^2 + 2(hw)^2C',
      'bias-attn-formula':
        '\\text{Attention} = \\text{softmax}\\!\\left(\\dfrac{QK^T}{\\sqrt{d}} + B\\right)V, \\quad B \\in \\mathbb{R}^{M^2 \\times M^2}',
      'bias-B-formula':
        '\\hat{B} \\in \\mathbb{R}^{(2M-1) \\times (2M-1)}, \\quad \\text{index}(i,j) = (\\Delta r + M - 1)(2M-1) + (\\Delta c + M - 1)',
    };

    for (const [id, tex] of Object.entries(formulas)) {
      const el = document.getElementById(id);
      if (el) {
        katex.render(tex, el, { displayMode: false, throwOnError: false });
      }
    }
  };
  render();
}

// ─── IntersectionObserver ───
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

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
  setupKaTeX();
  updateProgressUI();
  setupObserver();

  // Force-init first section
  const first = document.getElementById('section-overview');
  if (first) {
    first.classList.add('visible');
    if (!initialized.has('section-overview')) {
      initOverview();
      initialized.add('section-overview');
    }
  }
});
