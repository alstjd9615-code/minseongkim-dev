# AI 라이프 매니저 — 재구성된 PRD

> 이 문서는 PRD를 9단계 실행 문서로 재구성한 것입니다.  
> 기획서가 아닌 **오늘 바로 구현 가능한 실행 문서**입니다.

---

## 1. Product Overview

**제품명**: AI 라이프 매니저  
**목표**: 삶의 데이터를 구조화하고, AI가 오늘의 행동으로 연결해주는 개인용 AI 대시보드  
**핵심 차별점**: 기록(Notion처럼) + 실행(TickTick처럼) + AI 상호작용(Slack처럼)  
**기술 스택**: Next.js(현재 Vite/React) + Tailwind + AWS Cognito/Bedrock/DynamoDB

---

## 2. Problem Statement

- 할 일, 목표, 습관, 지식이 모두 다른 앱에 분산됨
- 기록은 하지만 "오늘 뭘 해야 하는지" AI가 연결해주지 않음
- 데이터가 쌓여도 인사이트로 이어지지 않음
- 아침에 앱 열었을 때 "지금 당장 뭘 해야 하는지" 즉시 알 수 없음

---

## 3. Target Users

**주 타깃**: 자기계발에 적극적인 20~35세 직장인/취준생  
**공통 특징**:
- 목표는 있지만 실행이 흩어짐
- 앱을 여러 개 씀 (캘린더, 노션, 투두앱 등)
- AI를 활용하고 싶지만 어떻게 써야 할지 모름

---

## 4. Core Value Proposition

> **"아침에 앱 하나 열면, AI가 오늘 뭘 해야 하는지 알려준다"**

1. 모든 기록이 한 곳에 (목표, 습관, 할 일, 지식, 일기)
2. AI가 매일 아침 브리핑 생성 (오늘 우선순위 + 습관 체크 + 한 줄 조언)
3. 자연어로 빠른 입력 ("오늘 운동 30분" → tasks에 자동 분류)

---

## 5. MVP Scope (오늘 안에 완성)

### Must Have Today
- [x] 홈 대시보드 (목표·습관 현황 카드)
- [x] 태스크 매트릭스 (아이젠하워 4분면)
- [x] AI 어시스턴트 채팅 (AWS Bedrock)
- [x] 목표 관리 CRUD
- [x] 습관 트래커 CRUD
- [x] **AI 일일 브리핑 카드** (홈에서 오늘의 우선순위 + AI 한 줄 조언)
- [x] **캘린더 뷰** (태스크 마감일 기반 월간 뷰)
- [ ] **빠른 추가 (Quick Add)** — 홈에서 할 일 빠르게 입력

### Should Have If Time Allows
- 태스크 → AI 자동 분류 (urgent/important 자동 판단)
- 주간 회고 자동 생성 (Bedrock 호출)
- 습관 + 목표 연결 (목표별 관련 습관 표시)

### Not Today
- Supabase 마이그레이션 (현재 DynamoDB 잘 작동함)
- 소셜 기능, 공유, 팀 기능
- 모바일 앱 (PWA)
- 알림/푸시
- 캘린더 외부 연동 (Google Calendar)
- 주간/월간 통계 대시보드 리빌드

---

## 6. Out of Scope

| 기능 | 이유 |
|------|------|
| Google Calendar 연동 | OAuth 설정 복잡, 오늘 불가 |
| Supabase 전환 | 기존 DynamoDB 잘 작동중 |
| 모바일 네이티브 앱 | 오버엔지니어링 |
| 팀/공유 기능 | 단일 사용자 MVP |
| 결제/구독 | 무료 MVP 우선 |
| 복잡한 AI 파이프라인 | Claude 직접 호출로 충분 |

---

## 7. Key User Flows

### Flow 1: 아침 루틴
```
홈 열기 → AI 브리핑 카드 확인 → 오늘 태스크 3개 확인 → 습관 체크 → 실행 시작
```

### Flow 2: 할 일 빠른 추가
```
홈 Quick Add 클릭 → 자연어 입력 ("포트폴리오 정리 오늘까지") → Tasks 등록 → 매트릭스 배치
```

### Flow 3: 목표 추적
```
목표 섹션 → 진행중 목표 확인 → 관련 태스크 확인 → 완료 처리
```

### Flow 4: AI 조언 요청
```
AI 어시스턴트 → 현재 섹션 컨텍스트 자동 주입 → 개인화된 조언 수신
```

---

## 8. Core Screens

### Screen 1: Home (홈 대시보드)
- **목적**: 하루 시작점. 오늘의 상황을 30초 안에 파악
- **핵심 정보**: AI 브리핑 카드, 진행중 목표 수, 오늘 습관 달성률, Q1 태스크 수
- **필수 컴포넌트**: `AiBriefing`, `StatCard`, `QuickAdd`, `TodayTaskList`
- **주요 액션**: Quick Add, 각 섹션 진입
- **상태값**: AI 브리핑 로딩중/완료/에러
- **비워둘 수 있는 요소**: 상세 통계, 차트

### Screen 2: Tasks (우선순위 매트릭스)
- **목적**: 할 일 등록 + 아이젠하워 분류
- **핵심 정보**: Q1/Q2/Q3/Q4 분면, 완료율
- **필수 컴포넌트**: `QuadrantPanel`, `TaskCard`, `AddTaskForm`
- **주요 액션**: 태스크 추가, 완료 처리, 삭제
- **상태값**: 로딩중, 성공, 에러

### Screen 3: AI Assistant (AI 어시스턴트)
- **목적**: 자유로운 AI 대화 + 섹션별 컨텍스트 자동 주입
- **핵심 정보**: 채팅 이력, 현재 섹션명
- **필수 컴포넌트**: `ChatInterface`, `MessageBubble`, `InputBar`
- **주요 액션**: 메시지 전송, 대화 초기화

### Screen 4: Calendar (캘린더 뷰)
- **목적**: 태스크 마감일 + 달력으로 시각화
- **핵심 정보**: 월간 뷰, 날짜별 태스크 점 표시
- **필수 컴포넌트**: `MonthGrid`, `DayCell`, `TaskDot`
- **주요 액션**: 날짜 클릭 → 해당일 태스크 목록 표시

### Screen 5: Goals (목표 관리)
- **목적**: 중장기 목표 관리 + 진행상황 추적
- **핵심 정보**: 목표 목록, 상태(진행중/완료/보류)
- **필수 컴포넌트**: `GoalCard`, `AddGoalForm`, `StatusBadge`
- **주요 액션**: 목표 추가, 상태 변경, 삭제

---

## 9. Core Features

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| AI 일일 브리핑 | 매일 아침 Bedrock 호출, 오늘의 태스크/습관 요약 + 조언 | P0 |
| 태스크 CRUD | 아이젠하워 분류 기반 할 일 관리 | P0 |
| 습관 트래커 | 일일 체크, 연속 streak 표시 | P0 |
| 목표 관리 | 중장기 목표 CRUD, 상태 관리 | P0 |
| AI 어시스턴트 채팅 | 섹션 컨텍스트 주입, Bedrock Claude 응답 | P0 |
| 캘린더 뷰 | 태스크 마감일 기반 월간 달력 | P1 |
| Quick Add | 홈에서 빠른 태스크 입력 | P1 |
| 지식 관리 | 책/아티클 요약 저장 | P2 |
| 일상 기록 | 일기 CRUD | P2 |
| Life Wheel | 8개 영역 점수화 | P2 |
| 만다라트 | 9×9 목표 그리드 | P2 |

---

## 10. Data Model

> 현재 AWS DynamoDB 사용 중. 각 테이블 구조는 `docs/DB_SCHEMA.md` 참조.

### 오늘 필수 테이블
| 테이블 | 이유 |
|--------|------|
| TasksTable | 태스크 CRUD 핵심 |
| HabitsTable | 습관 체크 핵심 |
| GoalsTable | 목표 관리 핵심 |

### 오늘 필요 없는 테이블 (이미 있지만 MVP 우선순위 낮음)
| 테이블 | 이유 |
|--------|------|
| ai_briefings | 별도 테이블 불필요, 세션 내 Bedrock 호출로 충분 |
| calendar_events | 태스크의 dueDate 필드로 대체 가능 |
| weekly_reviews | 저널 테이블로 커버 |

---

## 11. API / Backend Needs

### 기존 API (이미 구현됨)
- `POST/GET/PUT/DELETE /tasks` — 태스크 CRUD
- `POST/GET/PUT/DELETE /habits` — 습관 CRUD  
- `POST/GET/PUT/DELETE /goals` — 목표 CRUD
- `POST /chat` — AI 어시스턴트 채팅

### 오늘 추가할 API
- `POST /briefing` — AI 일일 브리핑 생성 (태스크+습관+목표 요약 → Bedrock)

---

## 12. AI Features

### 구현됨
- **AI 어시스턴트 채팅**: AWS Bedrock Claude 3.5 Sonnet, 섹션 컨텍스트 주입

### 오늘 추가
- **AI 일일 브리핑**: 사용자의 오늘 태스크(Q1), 미완료 습관, 진행중 목표를 Bedrock에 보내 3~5줄 브리핑 생성

### 나중에
- 태스크 자연어 파싱 → urgent/important 자동 분류
- 주간 회고 자동 생성
- 목표 달성률 기반 코칭

---

## 13. Design / UI Principles

- **색상**: 기존 CSS 변수 유지 (`--brand-blue`, `--surface-card`)
- **레이아웃**: 상단 탭바 + 메인 콘텐츠 + 모바일 하단 탭바
- **카드 패턴**: 아이콘 + 제목 + 값 + 서브텍스트 + 화살표
- **AI 패널**: 섹션 내 우측 패널 또는 전용 탭 (현재 구조 유지)
- **반응형**: 모바일은 하단 5탭 바 (홈/커리어/목표/운동/AI)
- **컴포넌트 스타일**: CSS Modules 사용 중 (shadcn/ui 미도입 — 기존 패턴 유지)

---

## 14. Technical Decisions

| 결정 | 이유 |
|------|------|
| DynamoDB 유지 | 이미 잘 작동, 마이그레이션 리스크 불필요 |
| AWS Bedrock Claude | 이미 연결됨, 추가 비용 없음 |
| CSS Modules | 기존 패턴 일관성 유지 |
| Vite + React | 기존 세팅 유지 (Next.js 전환은 나중) |
| Cognito 인증 | 이미 구현됨 |

---

## 15. Risks / Trade-offs

| 리스크 | 대응 |
|--------|------|
| Bedrock API 지연 | 브리핑은 비동기 로딩, 스켈레톤 UI 표시 |
| DynamoDB 쿼리 제한 | 단일 사용자 PK=userId로 충분 |
| 모바일 UX | 하단 탭바로 최소 대응 완료 |
| AI 브리핑 품질 | 프롬프트 엔지니어링으로 조정 |

---

## 16. Today's Build Plan

```
1. AI 브리핑 컴포넌트 생성 (AiBriefing.tsx)
2. 백엔드 /briefing 엔드포인트 추가
3. HomeDashboard에 AiBriefing 통합
4. 캘린더 뷰 컴포넌트 생성 (CalendarView.tsx)
5. App.tsx에 Calendar 섹션 추가
6. QuickAdd 컴포넌트로 홈 빠른 입력
7. 더미 데이터 및 문서화
```
