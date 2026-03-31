// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initObjects } from './objects.js';
import { initBranching } from './branching.js';
import { initMerge } from './merge.js';
import { initRemote } from './remote.js';
import { initGithubFlow } from './github-flow.js';
import { initAdvanced } from './advanced.js';
import { initPlayground } from './playground.js';

const sectionInits = {
  'section-overview': initOverview,
  'section-objects': initObjects,
  'section-branching': initBranching,
  'section-merge': initMerge,
  'section-remote': initRemote,
  'section-github-flow': initGithubFlow,
  'section-advanced': initAdvanced,
  'section-playground': initPlayground,
};

const initialized = new Set();

// ===== Glossary Terms =====
const GLOSSARY = {
  git: {
    en: 'Git',
    ko: '분산 버전 관리 시스템: 코드의 변경 이력을 추적하고 협업을 지원',
  },
  'working-directory': {
    en: 'Working Directory',
    ko: '작업 디렉토리: 실제 파일을 수정하는 공간',
  },
  'staging-area': {
    en: 'Staging Area (Index)',
    ko: '스테이징 영역: 다음 커밋에 포함할 변경사항을 준비하는 중간 단계',
  },
  'local-repo': {
    en: 'Local Repository',
    ko: '로컬 저장소: .git 디렉토리에 저장된 커밋 히스토리와 객체 DB',
  },
  'remote-repo': {
    en: 'Remote Repository',
    ko: '원격 저장소: GitHub, GitLab 등 네트워크상의 공유 저장소',
  },
  commit: {
    en: 'Commit',
    ko: '커밋: 특정 시점의 프로젝트 스냅샷. 부모 커밋을 참조하여 히스토리를 형성',
  },
  branch: {
    en: 'Branch',
    ko: '브랜치: 특정 커밋을 가리키는 이동 가능한 포인터',
  },
  head: {
    en: 'HEAD',
    ko: 'HEAD: 현재 체크아웃된 브랜치(또는 커밋)를 가리키는 포인터',
  },
  merge: {
    en: 'Merge',
    ko: '머지: 두 브랜치의 변경사항을 합치는 작업',
  },
  rebase: {
    en: 'Rebase',
    ko: '리베이스: 커밋들을 다른 베이스 위로 재적용하여 히스토리를 정리',
  },
  'fast-forward': {
    en: 'Fast-Forward',
    ko: '패스트포워드: 분기가 없을 때 포인터만 앞으로 이동하는 머지 방식',
  },
  'three-way-merge': {
    en: '3-Way Merge',
    ko: '3-way 머지: 공통 조상 + 두 브랜치의 최신 커밋을 비교하여 병합',
  },
  blob: {
    en: 'Blob',
    ko: 'Blob: 파일 내용을 저장하는 Git 객체 (파일명 없이 순수 데이터)',
  },
  tree: {
    en: 'Tree',
    ko: 'Tree: 디렉토리 구조를 저장하는 Git 객체 (blob과 하위 tree 참조)',
  },
  tag: {
    en: 'Tag',
    ko: 'Tag: 특정 커밋에 이름을 붙이는 참조 (버전 릴리스 등)',
  },
  sha1: {
    en: 'SHA-1',
    ko: 'SHA-1: 40자 16진수 해시. Git이 모든 객체를 식별하는 데 사용',
  },
  remote: {
    en: 'Remote',
    ko: '원격: 네트워크의 다른 저장소를 가리키는 이름 (보통 origin)',
  },
  repository: {
    en: 'Repository',
    ko: '저장소: 프로젝트의 파일과 전체 변경 이력을 담는 공간',
  },
  clone: {
    en: 'Clone',
    ko: '클론: 원격 저장소의 전체 복사본을 로컬에 생성',
  },
  fetch: {
    en: 'Fetch',
    ko: '페치: 원격 변경사항을 다운로드하되 현재 브랜치에 병합하지 않음',
  },
  pull: {
    en: 'Pull',
    ko: '풀: fetch + merge. 원격 변경사항을 다운로드하고 현재 브랜치에 병합',
  },
  push: {
    en: 'Push',
    ko: '푸시: 로컬 커밋을 원격 저장소에 업로드',
  },
  github: {
    en: 'GitHub',
    ko: 'GitHub: Git 원격 저장소 호스팅 + 협업 도구 (PR, Issue, Actions 등)',
  },
  fork: {
    en: 'Fork',
    ko: '포크: 다른 사람의 저장소를 내 계정에 복사하여 독립적으로 수정',
  },
  'pull-request': {
    en: 'Pull Request (PR)',
    ko: 'PR: 변경사항을 원본 저장소에 반영해달라고 요청하는 협업 메커니즘',
  },
  reset: {
    en: 'Reset',
    ko: 'reset: HEAD를 이전 커밋으로 이동. --soft/--mixed/--hard 3가지 모드',
  },
  revert: {
    en: 'Revert',
    ko: 'revert: 이전 커밋을 취소하는 새로운 커밋을 생성 (히스토리 보존)',
  },
  'cherry-pick': {
    en: 'Cherry-pick',
    ko: 'cherry-pick: 다른 브랜치의 특정 커밋 하나만 현재 브랜치에 적용',
  },
  stash: {
    en: 'Stash',
    ko: 'stash: 작업 중인 변경사항을 임시로 저장하고 워킹 디렉토리를 깨끗하게',
  },
  reflog: {
    en: 'Reflog',
    ko: 'reflog: HEAD가 이동한 모든 기록. 실수로 삭제한 커밋도 복구 가능',
  },
};

// ===== Progress Tracking =====
const PROGRESS_KEY = 'git-progress';

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
window.__gitProgress = { save: saveProgress };

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

function setupKaTeX() {
  const renderFormulas = () => {
    if (typeof katex === 'undefined') {
      setTimeout(renderFormulas, 100);
      return;
    }
    // SHA-1 formula (objects section)
    const shaFormula = document.getElementById('sha-formula');
    if (shaFormula) {
      katex.render(
        'H = \\text{SHA-1}(\\text{type} \\| \\text{size} \\| \\text{content})',
        shaFormula,
        { displayMode: false },
      );
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
