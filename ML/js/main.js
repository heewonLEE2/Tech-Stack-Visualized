// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initRegression } from './linear-regression.js';
import { initGradientDescent } from './gradient-descent.js';
import { initClassification } from './classification.js';
import { initOverfitting } from './overfitting.js';
import { initDecisionTree } from './decision-tree.js';
import { initEnsemble } from './ensemble.js';
import { initClustering } from './clustering.js';
import { initPlayground } from './playground.js';

const sectionInits = {
  'section-overview': initOverview,
  'section-regression': initRegression,
  'section-gradient': initGradientDescent,
  'section-classification': initClassification,
  'section-overfitting': initOverfitting,
  'section-tree': initDecisionTree,
  'section-ensemble': initEnsemble,
  'section-clustering': initClustering,
  'section-playground': initPlayground,
};

const initialized = new Set();

// ===== Glossary Terms =====
const GLOSSARY = {
  ml: {
    en: 'Machine Learning',
    ko: '머신러닝: 데이터로부터 패턴을 학습하여 예측·분류를 수행하는 알고리즘',
  },
  regression: {
    en: 'Regression',
    ko: '회귀: 연속적인 숫자 값을 예측하는 문제 (예: 집값, 온도)',
  },
  classification: {
    en: 'Classification',
    ko: '분류: 입력을 이산적인 카테고리(클래스)로 나누는 문제',
  },
  loss: {
    en: 'Loss Function',
    ko: '손실 함수: 모델 예측과 실제 값의 차이를 측정하는 함수. 이 값을 최소화하는 것이 학습 목표',
  },
  'gradient-descent': {
    en: 'Gradient Descent',
    ko: '경사 하강법: 손실 함수의 기울기(그래디언트) 방향으로 파라미터를 반복 업데이트하는 최적화 알고리즘',
  },
  'learning-rate': {
    en: 'Learning Rate (η)',
    ko: '학습률: 각 스텝에서 파라미터를 얼마나 크게 업데이트할지 결정하는 하이퍼파라미터',
  },
  overfitting: {
    en: 'Overfitting',
    ko: '과적합: 학습 데이터에 지나치게 맞춰져 새로운 데이터에 일반화하지 못하는 현상',
  },
  underfitting: {
    en: 'Underfitting',
    ko: '과소적합: 모델이 너무 단순하여 학습 데이터의 패턴조차 포착하지 못하는 현상',
  },
  regularization: {
    en: 'Regularization',
    ko: '정규화: 모델 가중치에 제약을 가해 과적합을 방지하는 기법 (L1, L2 등)',
  },
  'decision-tree': {
    en: 'Decision Tree',
    ko: '결정 트리: if-else 규칙의 트리 구조로 데이터를 분류·회귀하는 모델',
  },
  gini: {
    en: 'Gini Impurity',
    ko: 'Gini 불순도: 노드의 불순도를 측정. 0이면 완전 순수(한 클래스만), 0.5이면 최대 혼합',
  },
  entropy: {
    en: 'Entropy',
    ko: '엔트로피: 정보 이론 기반 불순도. 불확실성이 높을수록 큰 값',
  },
  ensemble: {
    en: 'Ensemble',
    ko: '앙상블: 여러 모델의 예측을 결합하여 단일 모델보다 나은 성능을 얻는 기법',
  },
  bagging: {
    en: 'Bagging (Bootstrap Aggregating)',
    ko: '배깅: 부트스트랩 샘플로 여러 모델을 독립적으로 학습한 뒤 다수결/평균으로 결합',
  },
  boosting: {
    en: 'Boosting',
    ko: '부스팅: 이전 모델의 오류에 집중하여 순차적으로 모델을 추가하는 기법',
  },
  kmeans: {
    en: 'K-Means',
    ko: 'K-Means: k개의 센트로이드를 반복적으로 업데이트하여 클러스터를 형성하는 알고리즘',
  },
  unsupervised: {
    en: 'Unsupervised Learning',
    ko: '비지도 학습: 레이블(정답) 없이 데이터의 구조·패턴을 발견하는 학습 방식',
  },
  'logistic-regression': {
    en: 'Logistic Regression',
    ko: '로지스틱 회귀: Sigmoid 함수를 사용하여 이진 분류를 수행하는 선형 모델',
  },
  class: {
    en: 'Class / Label',
    ko: '클래스: 분류 문제에서 데이터가 속하는 범주 (예: 양성/음성, 고양이/개)',
  },
  'confusion-matrix': {
    en: 'Confusion Matrix',
    ko: '혼동 행렬: 분류 모델의 예측 결과를 TP/FP/TN/FN으로 정리한 표',
  },
  mse: {
    en: 'Mean Squared Error',
    ko: '평균 제곱 오차: 예측값과 실제값 차이의 제곱 평균. 회귀의 대표적 손실 함수',
  },
  bias: {
    en: 'Bias',
    ko: '편향: 모델이 체계적으로 잘못 예측하는 정도. 높으면 과소적합',
  },
  variance: {
    en: 'Variance',
    ko: '분산: 데이터가 바뀔 때 모델 예측이 변하는 정도. 높으면 과적합',
  },
  'cross-validation': {
    en: 'Cross-Validation',
    ko: '교차 검증: 데이터를 k개 폴드로 나누어 번갈아 검증하는 모델 평가 기법',
  },
  hyperparameter: {
    en: 'Hyperparameter',
    ko: '하이퍼파라미터: 학습 전에 사람이 설정하는 값 (예: learning rate, max_depth, k)',
  },
};

// ===== Progress Tracking =====
const PROGRESS_KEY = 'ml-progress';

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

window.__mlProgress = { save: saveProgress };

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
    const triggerTip = e.target.closest('[data-tooltip]');
    if (triggerTip) {
      tooltip.textContent = triggerTip.dataset.tooltip;
      tooltip.style.display = 'block';
      return;
    }
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

function renderKaTeX() {
  const tryRender = () => {
    if (typeof katex === 'undefined') {
      setTimeout(tryRender, 100);
      return;
    }
    const formulas = {
      'regression-formula':
        '\\hat{y} = wx + b, \\quad MSE = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2',
      'gd-formula': 'w_{t+1} = w_t - \\eta \\nabla L(w_t)',
    };
    for (const [id, tex] of Object.entries(formulas)) {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = katex.renderToString(tex, { throwOnError: false });
      }
    }
  };
  tryRender();
}

document.addEventListener('DOMContentLoaded', () => {
  setupObserver();
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
  updateProgressUI();
  renderKaTeX();
});
