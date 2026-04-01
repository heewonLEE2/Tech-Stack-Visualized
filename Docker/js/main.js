// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initContainer } from './container.js';
import { initImage } from './image.js';
import { initLifecycle } from './lifecycle.js';
import { initVolumeNetwork } from './volume-network.js';
import { initCompose } from './compose.js';
import { initK8sArch } from './k8s-arch.js';
import { initDeployment } from './deployment.js';

const sectionInits = {
  'section-overview': initOverview,
  'section-container': initContainer,
  'section-image': initImage,
  'section-lifecycle': initLifecycle,
  'section-volume-network': initVolumeNetwork,
  'section-compose': initCompose,
  'section-k8s-arch': initK8sArch,
  'section-deployment': initDeployment,
};

const initialized = new Set();

// ===== Glossary Terms =====
const GLOSSARY = {
  dockerfile: {
    en: 'Dockerfile',
    ko: 'Dockerfile: 이미지를 빌드하기 위한 명령어를 담은 텍스트 파일',
  },
  image: {
    en: 'Docker Image',
    ko: '이미지: 컨테이너 실행에 필요한 파일 시스템과 설정을 담은 읽기 전용 템플릿',
  },
  container: {
    en: 'Container',
    ko: '컨테이너: 이미지를 기반으로 실행되는 격리된 프로세스 환경',
  },
  layer: {
    en: 'Layer',
    ko: '레이어: 이미지를 구성하는 읽기 전용 파일 시스템 계층. Dockerfile 명령마다 생성',
  },
  'layer-cache': {
    en: 'Layer Cache',
    ko: '레이어 캐시: 변경되지 않은 레이어를 재사용하여 빌드 속도를 높이는 메커니즘',
  },
  volume: {
    en: 'Volume',
    ko: '볼륨: 컨테이너와 독립적으로 데이터를 영속 저장하는 Docker 관리 디렉토리',
  },
  'bind-mount': {
    en: 'Bind Mount',
    ko: '바인드 마운트: 호스트의 특정 경로를 컨테이너에 직접 연결',
  },
  tmpfs: {
    en: 'tmpfs',
    ko: 'tmpfs: 메모리에만 존재하는 임시 파일 시스템. 컨테이너 종료 시 삭제',
  },
  'docker-network': {
    en: 'Docker Network',
    ko: 'Docker 네트워크: 컨테이너 간 통신을 가능하게 하는 가상 네트워크',
  },
  bridge: {
    en: 'Bridge Network',
    ko: 'Bridge: 동일 호스트 내 컨테이너 간 통신을 위한 기본 네트워크 드라이버',
  },
  'host-network': {
    en: 'Host Network',
    ko: 'Host: 컨테이너가 호스트의 네트워크 네임스페이스를 직접 사용',
  },
  overlay: {
    en: 'Overlay Network',
    ko: 'Overlay: 여러 Docker 호스트에 걸쳐 컨테이너를 연결하는 네트워크 (Swarm/K8s)',
  },
  'docker-compose': {
    en: 'Docker Compose',
    ko: 'Docker Compose: 다중 컨테이너 앱을 YAML로 정의하고 관리하는 도구',
  },
  service: {
    en: 'Service',
    ko: '서비스: Docker Compose에서 하나의 컨테이너 유형을 정의하는 단위',
  },
  'depends-on': {
    en: 'depends_on',
    ko: 'depends_on: 서비스 시작 순서를 정의하는 Compose 디렉티브',
  },
  kubernetes: {
    en: 'Kubernetes (K8s)',
    ko: 'Kubernetes: 컨테이너 오케스트레이션 플랫폼. 배포, 스케일링, 관리를 자동화',
  },
  pod: {
    en: 'Pod',
    ko: 'Pod: K8s의 최소 배포 단위. 하나 이상의 컨테이너를 포함하며 네트워크/스토리지 공유',
  },
  'worker-node': {
    en: 'Worker Node',
    ko: 'Worker Node: Pod가 실행되는 물리/가상 머신. Kubelet이 컨테이너를 관리',
  },
  'control-plane': {
    en: 'Control Plane',
    ko: 'Control Plane: 클러스터의 두되. API Server, Scheduler, Controller Manager, etcd로 구성',
  },
  'api-server': {
    en: 'API Server',
    ko: 'API Server: K8s의 프론트엔드. 모든 요청을 받고 인증/인가 후 처리',
  },
  etcd: {
    en: 'etcd',
    ko: 'etcd: 분산 키-값 저장소. 클러스터의 모든 상태 데이터를 저장',
  },
  scheduler: {
    en: 'Scheduler',
    ko: 'Scheduler: 새 Pod를 어느 노드에 배치할지 결정',
  },
  'controller-manager': {
    en: 'Controller Manager',
    ko: 'Controller Manager: Desired State와 Current State를 비교하여 조정하는 컨트롤 루프',
  },
  kubelet: {
    en: 'Kubelet',
    ko: 'Kubelet: 각 노드에서 실행되며 Pod의 컨테이너가 정상 동작하도록 관리',
  },
  'kube-proxy': {
    en: 'kube-proxy',
    ko: 'kube-proxy: 노드의 네트워크 규칙을 관리하여 Pod 간 통신을 라우팅',
  },
  deployment: {
    en: 'Deployment',
    ko: 'Deployment: Pod의 선언적 업데이트를 관리. ReplicaSet을 자동 생성',
  },
  replicaset: {
    en: 'ReplicaSet',
    ko: 'ReplicaSet: 지정된 수의 Pod 복제본이 항상 실행되도록 보장',
  },
  'rolling-update': {
    en: 'Rolling Update',
    ko: 'Rolling Update: 기존 Pod를 점진적으로 새 버전으로 교체하는 무중단 배포 전략',
  },
  hpa: {
    en: 'HPA (Horizontal Pod Autoscaler)',
    ko: 'HPA: CPU/메모리 사용률에 따라 Pod 수를 자동으로 조절하는 K8s 리소스',
  },
  'docker-cli': {
    en: 'Docker CLI',
    ko: 'Docker CLI: docker 명령어를 통해 Docker 데몬과 상호작용하는 커맨드라인 도구',
  },
  vm: {
    en: 'Virtual Machine',
    ko: 'VM: 하이퍼바이저 위에서 Guest OS를 포함한 완전한 가상 머신',
  },
  hypervisor: {
    en: 'Hypervisor',
    ko: '하이퍼바이저: 하드웨어 위에서 여러 VM을 생성·관리하는 소프트웨어 (VMware, VirtualBox 등)',
  },
  kernel: {
    en: 'Kernel',
    ko: '커널: OS의 핵심. 하드웨어와 소프트웨어 사이의 중재자',
  },
  registry: {
    en: 'Container Registry',
    ko: '레지스트리: Docker 이미지를 저장·배포하는 서버 (Docker Hub, ECR, GCR 등)',
  },
  namespace: {
    en: 'Namespace',
    ko: '네임스페이스: K8s 클러스터 내에서 리소스를 논리적으로 분리하는 가상 클러스터',
  },
  ingress: {
    en: 'Ingress',
    ko: 'Ingress: 클러스터 외부 HTTP(S) 요청을 내부 서비스로 라우팅하는 K8s 리소스',
  },
  'port-mapping': {
    en: 'Port Mapping',
    ko: '포트 매핑: 호스트 포트를 컨테이너 포트에 연결 (-p 8080:80)',
  },
};

// ===== Progress Tracking =====
const PROGRESS_KEY = 'docker-progress';

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

window.__dockerProgress = { save: saveProgress };

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

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupMobileMenu();
  setupTheme();
  setupTooltips();
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
