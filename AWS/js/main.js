// ===== Main Navigation & Section Initialization =====
import { initOverview } from './overview.js';
import { initGlobalInfra } from './global-infra.js';
import { initIAM } from './iam.js';
import { initVPC } from './vpc.js';
import { initCompute } from './compute.js';
import { initStorage } from './storage.js';
import { initDatabase } from './database.js';
import { initServerless } from './serverless.js';

const sectionInits = {
  'section-overview': initOverview,
  'section-global-infra': initGlobalInfra,
  'section-iam': initIAM,
  'section-vpc': initVPC,
  'section-compute': initCompute,
  'section-storage': initStorage,
  'section-database': initDatabase,
  'section-serverless': initServerless,
};

const initialized = new Set();

// ===== Glossary Terms =====
const GLOSSARY = {
  region: {
    en: 'Region',
    ko: '리전: AWS 인프라가 위치한 지리적 영역. 각 리전은 독립적으로 운영',
  },
  az: {
    en: 'Availability Zone (AZ)',
    ko: '가용 영역: 리전 내 1개 이상의 데이터센터. 독립된 전력·네트워크를 갖춤',
  },
  'edge-location': {
    en: 'Edge Location',
    ko: '엣지 로케이션: CloudFront가 콘텐츠를 캐싱하여 전달하는 전 세계 PoP',
  },
  vpc: {
    en: 'VPC (Virtual Private Cloud)',
    ko: 'VPC: AWS 내 논리적으로 격리된 가상 네트워크. IP 대역, 서브넷, 라우팅 설정 가능',
  },
  subnet: {
    en: 'Subnet',
    ko: '서브넷: VPC 내 IP 주소 범위를 나눈 하위 네트워크. Public/Private 구분',
  },
  igw: {
    en: 'Internet Gateway (IGW)',
    ko: '인터넷 게이트웨이: VPC와 인터넷 간 통신을 가능하게 하는 게이트웨이',
  },
  'nat-gw': {
    en: 'NAT Gateway',
    ko: 'NAT 게이트웨이: Private 서브넷의 리소스가 인터넷에 접근할 수 있게 하는 서비스',
  },
  sg: {
    en: 'Security Group',
    ko: '보안 그룹: 인스턴스 수준의 가상 방화벽. Stateful (인바운드 허용 시 아웃바운드 자동 허용)',
  },
  nacl: {
    en: 'Network ACL',
    ko: 'NACL: 서브넷 수준의 방화벽. Stateless (인바운드/아웃바운드 각각 규칙 필요)',
  },
  ec2: {
    en: 'EC2 (Elastic Compute Cloud)',
    ko: 'EC2: 크기 조절 가능한 가상 서버. 다양한 인스턴스 타입과 AMI를 지원',
  },
  'instance-type': {
    en: 'Instance Type',
    ko: '인스턴스 타입: CPU, 메모리, 스토리지 조합 (예: t3.micro, c5.xlarge, r5.2xlarge)',
  },
  asg: {
    en: 'Auto Scaling Group (ASG)',
    ko: 'ASG: EC2 인스턴스를 자동으로 확장/축소하는 그룹. 최소/최대/희망 수 설정',
  },
  elb: {
    en: 'Elastic Load Balancer (ELB)',
    ko: 'ELB: 들어오는 트래픽을 여러 대상에 분산하는 로드 밸런서 (ALB, NLB, CLB)',
  },
  alb: {
    en: 'Application Load Balancer',
    ko: 'ALB: HTTP/HTTPS 트래픽을 L7에서 라우팅하는 로드 밸런서. 경로/호스트 기반 라우팅',
  },
  s3: {
    en: 'Amazon S3',
    ko: 'S3: 무제한 확장 가능한 객체 스토리지. 버킷에 객체(파일)를 저장',
  },
  'storage-class': {
    en: 'Storage Class',
    ko: '스토리지 클래스: 접근 빈도에 따른 S3 요금 등급 (Standard, IA, Glacier 등)',
  },
  'lifecycle-policy': {
    en: 'Lifecycle Policy',
    ko: '라이프사이클 정책: 시간 경과에 따라 객체를 자동으로 다른 스토리지 클래스로 이동/삭제',
  },
  rds: {
    en: 'RDS (Relational Database Service)',
    ko: 'RDS: 관리형 관계형 DB. MySQL, PostgreSQL, Aurora 등 지원. Multi-AZ 자동 복제',
  },
  dynamodb: {
    en: 'DynamoDB',
    ko: 'DynamoDB: 완전관리형 NoSQL DB. 밀리초 응답, 자동 스케일링, 파티션 기반',
  },
  elasticache: {
    en: 'ElastiCache',
    ko: 'ElastiCache: 관리형 인메모리 캐시 (Redis/Memcached). DB 앞단에 배치하여 지연 시간 감소',
  },
  lambda: {
    en: 'AWS Lambda',
    ko: 'Lambda: 서버리스 컴퓨팅. 이벤트에 의해 트리거되며 실행 시간(ms)만큼만 과금',
  },
  'api-gw': {
    en: 'API Gateway',
    ko: 'API Gateway: REST/WebSocket API를 생성·관리하는 서비스. Lambda와 주로 연동',
  },
  'step-functions': {
    en: 'Step Functions',
    ko: 'Step Functions: 시각적 워크플로우로 서버리스 애플리케이션을 오케스트레이션',
  },
  iam: {
    en: 'IAM (Identity & Access Management)',
    ko: 'IAM: AWS 리소스 접근 권한을 관리. 사용자, 그룹, 역할, 정책으로 구성',
  },
  'iam-user': {
    en: 'IAM User',
    ko: 'IAM 사용자: AWS에 접근하는 개인/앱. 영구 자격 증명(Access Key) 보유 가능',
  },
  'iam-group': {
    en: 'IAM Group',
    ko: 'IAM 그룹: 사용자를 묶어 동일한 정책을 일괄 적용하는 단위',
  },
  'iam-role': {
    en: 'IAM Role',
    ko: 'IAM 역할: 임시 자격 증명을 사용하는 AWS 신뢰 관계. EC2, Lambda 등에 부여',
  },
  'iam-policy': {
    en: 'IAM Policy',
    ko: 'IAM 정책: JSON 형식의 권한 문서. Effect(허용/거부), Action, Resource로 구성',
  },
  authentication: {
    en: 'Authentication',
    ko: '인증: "누구인가?"를 확인. Access Key/Secret Key 또는 MFA로 본인 확인',
  },
  authorization: {
    en: 'Authorization',
    ko: '인가: "무엇을 할 수 있는가?"를 확인. IAM 정책으로 리소스 접근 권한 결정',
  },
  cloudtrail: {
    en: 'CloudTrail',
    ko: 'CloudTrail: AWS 계정의 모든 API 호출을 기록하는 감사 서비스',
  },
  route53: {
    en: 'Route 53',
    ko: 'Route 53: AWS의 관리형 DNS 서비스. 도메인 등록, 라우팅 정책, 헬스체크 지원',
  },
  cloudfront: {
    en: 'CloudFront',
    ko: 'CloudFront: 전 세계 엣지 로케이션에서 콘텐츠를 캐싱하여 전달하는 CDN 서비스',
  },
  'multi-az': {
    en: 'Multi-AZ',
    ko: 'Multi-AZ: 여러 가용 영역에 걸쳐 리소스를 복제하여 고가용성을 확보하는 배포 전략',
  },
  'read-replica': {
    en: 'Read Replica',
    ko: 'Read Replica: 읽기 전용 DB 복제본. 읽기 트래픽을 분산하여 성능 향상',
  },
};

// ===== Progress Tracking =====
const PROGRESS_KEY = 'aws-progress';

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

window.__awsProgress = { save: saveProgress };

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
