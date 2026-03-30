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

function setupObserver() {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (!initialized.has(id) && sectionInits[id]) {
          sectionInits[id]();
          initialized.add(id);
        }
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(s => observer.observe(s));
}

function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
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
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== btn) {
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

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
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
