// ===== Main Navigation & Section Initialization =====
import { initArchitecture } from './architecture.js';
import { initAttention, initMultiHead } from './attention.js';
import { initPositional } from './positional.js';
import { initAddNorm, initFFN } from './feedforward.js';
import { initDataflow } from './dataflow.js';
import { initPlayground } from './playground.js';

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

// IntersectionObserver for section visibility & nav highlight
function setupObserver() {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
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
          import('./attention.js').then(m => m.initDecoder());
          initialized.add(id);
        }
        // Update nav
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(s => observer.observe(s));
}

// Smooth scroll navigation
function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
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
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== btn) {
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

// Global tooltip
function setupTooltips() {
  const tooltip = document.getElementById('tooltip');
  document.addEventListener('mouseover', (e) => {
    const trigger = e.target.closest('[data-tooltip]');
    if (trigger) {
      tooltip.textContent = trigger.dataset.tooltip;
      tooltip.style.display = 'block';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY + 12) + 'px';
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-tooltip]')) {
      tooltip.style.display = 'none';
    }
  });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
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
