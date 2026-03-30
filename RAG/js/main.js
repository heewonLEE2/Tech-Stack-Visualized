// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initPipeline } from './pipeline.js';
import { initEmbedding } from './embedding.js';
import { initRetrieval } from './retrieval.js';
import { initChunking } from './chunking.js';
import { initLangChain } from './langchain.js';
import { initLangGraph } from './langgraph.js';
import { initCompare } from './compare.js';

const sectionInits = {
  'section-overview': initOverview,
  'section-rag-pipeline': initPipeline,
  'section-embedding': initEmbedding,
  'section-retrieval': initRetrieval,
  'section-chunking': initChunking,
  'section-langchain': initLangChain,
  'section-langgraph': initLangGraph,
  'section-compare': initCompare,
};

const initialized = new Set();

// ===== Glossary Terms =====
const GLOSSARY = {
  rag: {
    en: 'Retrieval-Augmented Generation',
    ko: '검색 증강 생성: 외부 문서를 검색하여 LLM 생성에 활용하는 아키텍처 패턴',
  },
  embedding: {
    en: 'Embedding',
    ko: '임베딩: 텍스트를 고차원 벡터로 변환하여 의미적 유사도를 수치화하는 기법',
  },
  'vector-store': {
    en: 'Vector Store',
    ko: '벡터 스토어: 임베딩 벡터를 저장하고 유사도 검색을 수행하는 데이터베이스 (Chroma, FAISS 등)',
  },
  retriever: {
    en: 'Retriever',
    ko: '리트리버: 쿼리와 관련된 문서를 벡터 스토어에서 검색하는 컴포넌트',
  },
  chunk: {
    en: 'Chunk',
    ko: '청크: 긴 문서를 분할한 텍스트 조각. 벡터 스토어의 기본 저장 단위',
  },
  langchain: {
    en: 'LangChain',
    ko: 'LangChain: LLM 애플리케이션 개발을 위한 Python/JS 프레임워크',
  },
  lcel: {
    en: 'LangChain Expression Language',
    ko: 'LCEL: 파이프(|) 구문으로 컴포넌트를 연결하는 LangChain의 선언적 체인 구성 문법',
  },
  langgraph: {
    en: 'LangGraph',
    ko: 'LangGraph: 상태 그래프 기반 AI 에이전트 프레임워크. 조건 분기와 사이클을 지원',
  },
  'state-graph': {
    en: 'State Graph',
    ko: '상태 그래프: 노드(함수)와 엣지(흐름)로 구성된 실행 그래프. 공유 상태를 전파',
  },
  'prompt-template': {
    en: 'Prompt Template',
    ko: '프롬프트 템플릿: 변수를 포함한 프롬프트 틀. 실행 시 실제 값으로 치환',
  },
  llm: {
    en: 'Large Language Model',
    ko: 'LLM: 대규모 언어 모델. GPT-4, Claude 등 자연어 생성에 사용',
  },
  hallucination: {
    en: 'Hallucination',
    ko: '할루시네이션: LLM이 사실이 아닌 내용을 그럴듯하게 생성하는 현상',
  },
  'top-k': {
    en: 'Top-K',
    ko: 'Top-K: 유사도 점수가 높은 상위 K개 문서만 선택하는 검색 전략',
  },
  'cosine-similarity': {
    en: 'Cosine Similarity',
    ko: '코사인 유사도: 두 벡터 사이 각도의 코사인 값. 1에 가까울수록 유사',
  },
  bm25: {
    en: 'BM25 (Best Matching 25)',
    ko: 'BM25: TF-IDF에서 발전한 확률적 키워드 검색 알고리즘. 단어 빈도 포화(saturation)와 문서 길이 정규화를 적용해 정확한 단어 매칭에 강함',
  },
};

// ===== Progress Tracking =====
const PROGRESS_KEY = 'rag-progress';

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

window.__ragProgress = { save: saveProgress };

// ===== Observer =====
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

// ===== Navigation =====
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

// ===== Theme =====
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

// ===== Tooltips =====
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
    }
  });
  document.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = e.clientX + 12 + 'px';
      tooltip.style.top = e.clientY + 12 + 'px';
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-term]')) {
      tooltip.style.display = 'none';
    }
  });
}

// ===== KaTeX =====
function setupKaTeX() {
  const renderFormulas = () => {
    if (typeof katex === 'undefined') {
      setTimeout(renderFormulas, 100);
      return;
    }
    const cosineFormula = document.getElementById('cosine-formula');
    if (cosineFormula) {
      katex.render(
        '\\cos(\\theta) = \\dfrac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\, \\|\\mathbf{B}\\|}',
        cosineFormula,
        { displayMode: false },
      );
    }
  };
  renderFormulas();
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  setupObserver();
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
  setupKaTeX();
  updateProgressUI();
});
