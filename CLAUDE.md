# CLAUDE.md — Tech-Stack-Visualized

## 프로젝트 목적

프로그래밍/AI 개념을 인터랙티브 시각화로 학습하는 교육용 저장소. 모든 UI는 한국어(Noto Sans KR).

## 기술 스택

- **Vanilla HTML / CSS / JS (ES6 모듈)** — 프레임워크 없음
- **KaTeX** — 유일하게 허용하는 외부 라이브러리 (수식 렌더링 전용)
- **시각화**: Canvas 2D API, CSS Grid, SVG, HTML/CSS 조합
- D3, Three.js, Plotly 등 기타 외부 라이브러리 사용 금지

## 폴더 구조

모든 주제는 아래 구조를 따른다 (RAG 포함):

```
[Topic]/
├── index.html
├── css/
│   ├── style.css          # 전역 + 주제 스타일, CSS 변수 테마
│   └── animations.css     # @keyframes 분리
└── js/
    ├── main.js            # 진입점: sectionInits 맵 + IntersectionObserver
    ├── [feature].js       # 기능별 독립 모듈 (4~8개)
    ├── utils.js           # 공용 유틸리티 (선택)
    └── data/              # 사전 계산된 모델 데이터 JSON (선택)
```

## JS 아키텍처

- **진입점** (`main.js`): `sectionInits` 객체에 섹션 ID → init 함수 매핑. `IntersectionObserver`(threshold: 0.15)로 뷰포트 진입 시 1회만 초기화
- **기능 모듈**: 독립적. 내부 `state` 객체 → `recompute()` → `render()` 패턴
- **애니메이션 컨트롤**: Play / Pause / Step(이전/다음) / Reset + Speed 슬라이더(0.5x~3x) 표준 제공
- **이벤트**: 슬라이더·버튼 변경 → state 업데이트 → recompute → render 즉시 반영

## CSS 컨벤션

- `:root`에 주제별 색상 팔레트를 CSS 변수로 정의 (예: `--input-color`, `--kernel-color`)
- 다크/라이트 테마: `[data-theme="light"]`로 전환
- 사이드바 260px 고정 + 메인 콘텐츠 영역. 모바일 햄버거 메뉴
- 섹션: `min-height: 100vh`, 뷰포트 진입 시 fadeIn

## 네이밍 규칙

| 대상         | 규칙                              | 예시                                 |
| ------------ | --------------------------------- | ------------------------------------ |
| 섹션 ID      | `section-[name]`                  | `section-convolution`                |
| 컨테이너     | `[topic]-container`               | `convolution-container`              |
| CSS 클래스   | kebab-case                        | `viz-container`, `control-row`       |
| JS 함수      | camelCase, init/draw/setup 접두어 | `initConvolution()`, `drawHeatmap()` |
| JS 모듈 파일 | 기능명.js                         | `attention.js`, `pooling.js`         |

## 시각화 원칙

### 1. 파이프라인 플로우 애니메이션

- 각 주제 Overview 섹션에 **입력→출력 전체 데이터 흐름 애니메이션** 포함
- SVG path를 따라 데이터 토큰이 이동하는 CSS animation
- 각 블록 클릭 시 해당 섹션으로 `scrollIntoView({ behavior: 'smooth' })`
- 참고: `Transformer/js/architecture.js`의 클릭 네비게이션 패턴

### 2. Before/After 비교 모드

- 파라미터 변경 효과를 **split-view로 병렬 비교** 가능하게 구현
- 예: stride=1 vs stride=2, head 1개 vs 4개, patch 4×4 vs 16×16
- 두 상태를 나란히 렌더링하는 컨테이너 제공

### 3. KaTeX 수식 렌더링

- 수학 공식은 텍스트가 아닌 **KaTeX로 렌더링**
- 수식 내 변수에 호버 시 현재 파라미터 값을 **tooltip으로 표시**
- inline: `katex.renderToString()`, block: display mode

### 4. 진행 표시기

- 사이드바에 섹션별 **학습 진행도** 표시 (체크 아이콘 등)
- 해당 섹션의 핵심 인터랙션(슬라이더 조작, 애니메이션 완주 등)을 완료하면 "체험 완료"로 체크
- `localStorage`에 진행 상태 저장

### 5. "왜 필요한가?" 패널

- 각 섹션에 접이식 **Why 패널** 포함
- What(무엇) / How(어떻게)뿐 아니라 **Why(왜 이 기법을 쓰는가)** 설명
- 예: Pooling → "계산량 감소 + 위치 불변성", Scaling → "softmax 포화 방지"

### 6. 실제 데이터 활용

- 랜덤/하드코딩 대신 **사전 계산된 실제 모델 데이터** 사용
- `js/data/` 폴더에 JSON으로 저장 (학습된 커널 웨이트, attention 패턴 등)
- 시각화에서 "이것은 실제 학습된 모델의 값입니다" 라벨 표시

### 7. Tooltip 용어 사전

- 전문 용어 첫 등장 시 **점선 밑줄** + 호버로 한/영 용어 + 한줄 설명
- `data-term` 속성으로 마크업, CSS + JS로 tooltip 렌더링
- 예: `<span data-term="stride">스트라이드</span>` → 호버 시 "Stride: 커널이 이동하는 간격"

### 8. 코드 ↔ 시각화 연결

- 시각화 옆에 대응하는 **PyTorch 코드 스니펫** 표시
- 시각화 파라미터 변경 시 코드도 **동기화** (예: kernel_size 슬라이더 → `nn.Conv2d(... kernel_size=N)`)
- 접이식 코드 블록으로 원하는 사용자만 펼쳐 볼 수 있게

## UI 레이아웃 구조

```
┌──────────┬──────────────────────────────┐
│ Sidebar  │  Main Content               │
│ 260px    │                              │
│          │  ┌─ Section ──────────────┐  │
│ • Nav    │  │ Title                  │  │
│ • Nav ✓  │  │ Description            │  │
│ • Nav    │  │ Why 패널 (접이식)       │  │
│          │  │ Controls (슬라이더/버튼) │  │
│          │  │ Viz Container (Canvas)  │  │
│          │  │ Code Snippet (접이식)   │  │
│ ──────── │  └────────────────────────┘  │
│ Theme 🌙 │                              │
│ Progress │                              │
└──────────┴──────────────────────────────┘
```

## 새 주제 추가 체크리스트

1. 기존 폴더(CNN 등)를 복사하여 구조 생성
2. `:root`에 주제별 색상 팔레트 정의
3. `main.js`에 섹션 → init 함수 매핑
4. 각 기능 모듈을 state → recompute → render 패턴으로 작성
5. Overview에 파이프라인 플로우 애니메이션 구현
6. 각 섹션에 Why 패널, Tooltip 용어, KaTeX 수식, 코드 스니펫 포함
7. Before/After 비교가 의미 있는 섹션에 split-view 추가
8. 실제 데이터가 있으면 `js/data/`에 JSON 배치
9. 진행 표시기 연동 (인터랙션 완료 이벤트 → localStorage)
10. 다크/라이트 테마, 모바일 반응형 확인
