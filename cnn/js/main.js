// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initConvolution } from './convolution.js';
import { initChannels } from './channels.js';
import { initDimensions } from './dimensions.js';
import { initPooling } from './pooling.js';
import { initActivation } from './activation.js';
import { initFlatten } from './flatten.js';

const sectionInits = {
  'section-overview': initOverview,
  'section-convolution': initConvolution,
  'section-channels': initChannels,
  'section-dimensions': initDimensions,
  'section-pooling': initPooling,
  'section-activation': initActivation,
  'section-flatten': initFlatten,
};

const initialized = new Set();

// ===== Glossary Terms =====
const GLOSSARY = {
  cnn: {
    en: 'Convolutional Neural Network',
    ko: '합성곱 신경망: 이미지의 공간 구조를 보존하며 특징을 학습하는 네트워크',
  },
  kernel: {
    en: 'Kernel / Filter',
    ko: '커널(필터): 입력 위를 슬라이딩하며 특징을 추출하는 작은 가중치 행렬',
  },
  stride: {
    en: 'Stride',
    ko: '스트라이드: 커널이 이동하는 간격 (클수록 출력이 작아짐)',
  },
  padding: {
    en: 'Padding',
    ko: '패딩: 입력 가장자리를 0으로 채워 출력 크기를 유지하는 기법',
  },
  filter: {
    en: 'Filter',
    ko: '필터: 특정 패턴(엣지, 텍스처 등)을 감지하도록 학습된 커널',
  },
  'feature-map': {
    en: 'Feature Map',
    ko: '특성맵(채널): 합성곱 결과로 생성된 2D 출력, 특정 특징의 위치를 나타냄',
  },
  tensor: {
    en: 'Tensor',
    ko: '텐서: 다차원 배열. CNN에서는 [배치, 채널, 높이, 너비] 4D 텐서를 사용',
  },
  'batch-size': {
    en: 'Batch Size',
    ko: '배치 크기: 한 번에 처리하는 데이터 수. 메모리와 학습 속도에 영향',
  },
  activation: {
    en: 'Activation Function',
    ko: '활성화 함수: 비선형성을 추가하여 네트워크의 표현력을 높이는 함수',
  },
  gradient: {
    en: 'Gradient',
    ko: '그래디언트: 손실 함수의 미분값. 역전파 시 가중치 업데이트 방향을 결정',
  },
  fc: {
    en: 'Fully Connected Layer',
    ko: '완전연결층: 모든 입력 뉴런이 모든 출력 뉴런에 연결된 레이어',
  },
  pooling: {
    en: 'Pooling',
    ko: '풀링: 공간 크기를 줄이는 다운샘플링 연산 (Max, Average 등)',
  },
};

// ===== Progress Tracking =====
const PROGRESS_KEY = 'cnn-progress';

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

// Expose globally for feature modules
window.__cnnProgress = { save: saveProgress };

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

function setupTooltips() {
  const tooltip = document.getElementById('tooltip');
  document.addEventListener('mouseover', (e) => {
    // data-tooltip (legacy)
    const triggerTip = e.target.closest('[data-tooltip]');
    if (triggerTip) {
      tooltip.textContent = triggerTip.dataset.tooltip;
      tooltip.style.display = 'block';
      return;
    }
    // data-term (glossary)
    const triggerTerm = e.target.closest('[data-term]');
    if (triggerTerm) {
      const term = GLOSSARY[triggerTerm.dataset.term];
      if (term) {
        tooltip.innerHTML = `<strong>${term.en}</strong><br>${term.ko}`;
        tooltip.style.display = 'block';
      }
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

function setupKaTeX() {
  // Wait for KaTeX to load then render formulas
  const renderFormulas = () => {
    if (typeof katex === 'undefined') {
      setTimeout(renderFormulas, 100);
      return;
    }
    // Convolution formula
    const convFormula = document.getElementById('conv-formula');
    if (convFormula) {
      katex.render(
        'O = \\left\\lfloor \\dfrac{W - K + 2P}{S} \\right\\rfloor + 1',
        convFormula,
        { displayMode: false },
      );
    }
    // Dimensions [B, C, H, W] label
    const dimFormula = document.getElementById('dim-shape-formula');
    if (dimFormula) {
      katex.render('[B,\\, C,\\, H,\\, W]', dimFormula, { displayMode: false });
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

  const first = document.getElementById('section-overview');
  if (first) {
    first.classList.add('visible');
    if (!initialized.has('section-overview')) {
      initOverview();
      initialized.add('section-overview');
    }
  }
});
