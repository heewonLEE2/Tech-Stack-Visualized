// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initPatch } from './patch.js';
import { initEmbedding } from './embedding.js';
import { initAttention } from './attention.js';
import { initClassifier } from './classifier.js';
import { initPlayground } from './playground.js';

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
    { threshold: 0.1 },
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

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupObserver();
});
