<div align="center">

# 🧬 AI 라이프 매니저

**아침에 앱 하나 열면, AI가 오늘 뭘 해야 하는지 알려준다**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900?style=flat-square&logo=amazonaws)](https://aws.amazon.com/)
[![Bedrock](https://img.shields.io/badge/Amazon_Bedrock-Claude_3.5-8B5CF6?style=flat-square)](https://aws.amazon.com/bedrock/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 💡 무엇인가요?

할 일, 목표, 습관, 지식이 모두 다른 앱에 흩어진 문제를 해결합니다.  
**기록**(Notion처럼) + **실행**(TickTick처럼) + **AI 조언**(Claude처럼) — 세 가지를 하나로.

```
앱 열기 → AI 브리핑 자동 생성 → 오늘 Q1 태스크 확인 → 습관 체크 → 목표 진행
```

개인 전용 앱입니다. AWS 서버리스 + Amazon Bedrock(Claude 3.5 Sonnet)을 기반으로 동작합니다.

---

## 🗂️ 목차

- [주요 기능](#-주요-기능)
- [아키텍처](#️-아키텍처)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [프로젝트 구조](#-프로젝트-구조)
- [API 엔드포인트](#-api-엔드포인트)
- [환경 변수](#-환경-변수)
- [개발 명령어](#️-개발-명령어)
- [로드맵](#️-로드맵)

---

## ✨ 주요 기능

### 🏠 홈 대시보드
> 앱을 열자마자 오늘의 현황을 한눈에

- 목표 진행 현황 · 오늘 습관 달성률 · 최대 연속 스트릭 실시간 표시
- 섹션별 바로가기 카드 9개 — 클릭 한 번으로 이동

---

### 🤖 AI 오늘의 브리핑
> Claude가 내 데이터를 분석해 오늘의 행동 계획을 자동 생성

- 홈 진입 시 **자동 생성** (버튼 클릭 불필요)
- Q1 태스크 · 미체크 습관 · 진행중 목표를 종합한 **맞춤 브리핑**
- 브리핑에서 바로 해당 섹션으로 이동하는 **액션 링크** (`[⚡ Q1 보기 →]`)
- 당일 캐싱 — 탭 이동 후 돌아와도 재생성 없음

---

### ⚡ 우선순위 매트릭스 (Eisenhower)
> 긴급도 × 중요도로 할 일을 4분면에 분류

| 분면 | 의미 | 색상 |
|------|------|------|
| Q1 — 즉시 실행 | 긴급 + 중요 | 🔴 빨강 |
| Q2 — 계획 | 중요 + 여유 | 🔵 파랑 |
| Q3 — 위임 | 긴급 + 덜 중요 | 🟡 노랑 |
| Q4 — 제거 | 낮은 우선순위 | ⚫ 회색 |

- 마감일(dueDate) 설정 → 캘린더에 자동 반영
- 완료 체크 · 삭제 인라인 처리

---

### 📅 캘린더
> 태스크 마감일 기반 월간 뷰

- 날짜 셀에 분면별 컬러 도트 (최대 4개)
- 날짜 클릭 → 해당 날 태스크 목록 + **완료 토글**
- 빈 날짜 클릭 → "이 날 태스크 추가하기" CTA
- **오늘로 이동** 버튼 — 다른 달 탐색 후 즉시 복귀

---

### 🌱 습관 트래커
> 매일 반복할 루틴을 시각적으로 관리

- 커스텀 아이콘 · 색상으로 습관 카드 생성
- 오늘 체크 · 체크 취소 원터치
- **16주 히트맵** — GitHub 잔디처럼 체크 이력 시각화
- 연속 스트릭(연속 달성일) 자동 계산

---

### 🎯 목표 관리
> 단기/장기 목표를 진행률과 함께 추적

- 기한 설정 · 진행률 슬라이더(0~100%)
- 상태: 진행중 / 완료 / 포기
- 목표별 설명 카드 + 달성 통계

---

### 🎡 Life Wheel
> 인생 8개 영역 균형 레이더 차트

`건강` · `재정` · `커리어` · `관계` · `성장` · `여가` · `환경` · `정신/영적`

- 각 영역 1~10점 평가 → 방사형 차트 시각화
- 이력 저장 → 시간별 변화 추이 확인

---

### 🏮 만다라트
> 핵심 목표를 9×9 그리드로 세분화

- 중앙 핵심 목표 → 8개 서브 목표 → 72개 실행 항목
- 셀 클릭으로 텍스트 편집 · 완료 체크
- 목표를 행동 단위까지 분해

---

### 📖 저널 (회고)
> 주간 / 월간 / 분기 회고 + KPT 템플릿

- **KPT 모드**: Keep · Problem · Try 세 섹션 구조화 입력
- AI 인사이트 자동 생성
- 기간 설정(periodStart ~ periodEnd)으로 시계열 관리

---

### 💼 커리어
> AI와 대화하며 포트폴리오 자동 생성

- Claude와 대화하면 포트폴리오 섹션(소개·경력·스킬·프로젝트·학력·연락처) 자동 구성
- 공개 URL 생성 — `/portfolio/:id` 로 외부 공유 가능
- 일상 기록을 AI 블로그 포스트로 변환 · 발행

---

### 🧠 지식 관리
> 읽고 들은 것을 AI 요약과 함께 저장

- 유형: 책 / 아티클 / 강의 / 영상 / 기타
- 저장 즉시 Claude가 핵심 요약 · 태그 자동 추출
- 제목·저자·내용·AI 요약·태그 통합 실시간 검색

---

### 💪 운동 관리
> 운동 기록과 주간 차트

- 종류(15가지) · 시간 · 강도 · 메모 기록
- 최근 7일 운동 시간 막대 차트 (Recharts)
- 이번 주 운동 횟수 · 총 시간 자동 집계

---

### 📓 일상 기록
> 자유 기록 → AI 자동 분류

- 오늘의 생각을 자유롭게 입력
- Claude가 카테고리 자동 태깅 (독서·운동·프로젝트·시사·목표·아이디어)
- 감정 태그 (😊 좋음 / 😐 보통 / 😔 나쁨)

---

### 📊 대시보드
> 전체 활동 통계 한눈에

- 연속 기록 일수 · 카테고리별 분포 파이 차트
- 30일 활동 히트맵 · 최근 활동 타임라인
- 운동·목표·지식 영역 교차 통계

---

## 🏗️ 아키텍처

```
브라우저 (React + TypeScript + Vite)
    │
    ├── Amazon CloudFront ──► S3 (정적 빌드 파일)
    │
    └── Amazon API Gateway ──► Amazon Cognito (JWT 인증)
              │
     ┌────────┴──────────────────────────────┐
     │          AWS Lambda (Python 3.13)      │
     │                                        │
     │  /assistant  /tasks   /habits          │
     │  /goals      /chat    /portfolio       │──► Amazon Bedrock
     │  /diary      /blog    /workout         │    (Claude 3.5 Sonnet)
     │  /knowledge  /stats   /journal         │
     └────────┬──────────────────────────────┘
              │
     ┌────────▼──────────────────────────────┐
     │              Amazon DynamoDB           │
     │                                        │
     │  SessionsTable    PortfoliosTable      │
     │  DiaryTable       BlogTable            │
     │  WorkoutTable     KnowledgeTable       │
     │  GoalsTable       HabitsTable          │
     │  TasksTable       JournalTable         │
     │  MandalartTable   LifeWheelTable       │
     └───────────────────────────────────────┘
```

---

## 🛠️ 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Frontend** | React 19, TypeScript 5.9, Vite 6, CSS Modules |
| **상태 관리** | React Context API + Custom Hooks |
| **차트** | Recharts |
| **Backend** | AWS Lambda (Python 3.13) |
| **AI** | Amazon Bedrock — Claude 3.5 Sonnet |
| **Database** | Amazon DynamoDB (On-Demand / PAY_PER_REQUEST) |
| **인증** | Amazon Cognito + aws-amplify |
| **API** | Amazon API Gateway (REST) |
| **CDN / Storage** | Amazon CloudFront + S3 |
| **IaC** | AWS SAM (template.yaml) |

---

## 🚀 빠른 시작

### 사전 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 20 이상 |
| Python | 3.13 이상 |
| AWS CLI | 자격 증명 설정 완료 |
| AWS SAM CLI | 최신 |
| Amazon Bedrock | `anthropic.claude-3-5-sonnet` 모델 접근 권한 |

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
VITE_API_BASE_URL=https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/dev
VITE_USER_POOL_ID=ap-northeast-2_xxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=ap-northeast-2
```

> `.env.example` 파일을 복사해서 시작하세요: `cp .env.example .env.local`

### 3. 프론트엔드 개발 서버

```bash
npm run dev
# → http://localhost:5173
```

### 4. 백엔드 배포 (AWS SAM)

```bash
cd infrastructure
sam build
sam deploy --guided   # 최초 배포 — 대화형으로 스택 이름·리전 설정
# 이후 재배포: sam deploy
```

배포 완료 후 출력되는 `ApiUrl`, `UserPoolId`, `UserPoolClientId` 값을 `.env.local`에 입력하세요.

### 5. 프론트엔드 빌드 & 배포

```bash
npm run build
aws s3 sync dist/ s3://<FrontendBucketName>/ --delete
aws cloudfront create-invalidation --distribution-id <CF_ID> --paths "/*"
```

---

## 📁 프로젝트 구조

```
minseongkim-dev/
│
├── src/
│   ├── api/                        # API 클라이언트 (fetch + authHeaders)
│   │   ├── briefing.ts             # AI 브리핑 (POST /assistant 재사용)
│   │   ├── tasks.ts                # 태스크 CRUD
│   │   ├── habits.ts               # 습관 CRUD + 체크 토글
│   │   ├── goals.ts                # 목표 CRUD
│   │   ├── chat.ts                 # 포트폴리오 빌더 채팅
│   │   ├── diary.ts / blog.ts      # 일상 기록 / 블로그
│   │   ├── workout.ts              # 운동 기록
│   │   ├── knowledge.ts            # 지식 관리
│   │   ├── journal.ts              # 저널 회고
│   │   └── stats.ts                # 통합 통계
│   │
│   ├── components/
│   │   ├── AI/                     # AiBriefing (홈 자동 브리핑)
│   │   ├── Calendar/               # CalendarView (월간 뷰 + 완료 토글)
│   │   ├── Home/                   # HomeDashboard (9개 바로가기 카드)
│   │   ├── Tasks/                  # TaskMatrix (아이젠하워 4분면)
│   │   ├── Habits/                 # HabitsTracker (16주 히트맵)
│   │   ├── Goals/                  # GoalsList (진행률 슬라이더)
│   │   ├── LifeWheel/              # LifeWheelView (레이더 차트)
│   │   ├── Mandalart/              # MandalartView (9×9 그리드)
│   │   ├── Journal/                # JournalView (KPT 회고)
│   │   ├── Chat/                   # ChatInterface (AI 어시스턴트)
│   │   ├── Portfolio/              # PortfolioView + 공개 페이지
│   │   ├── Blog/                   # BlogList + 공개 블로그
│   │   ├── Diary/                  # DiaryList
│   │   ├── Workout/                # WorkoutLog + 주간 차트
│   │   ├── Knowledge/              # KnowledgeList + 검색
│   │   ├── Dashboard/              # 통합 통계 대시보드
│   │   └── Auth/                   # AuthGuard + 로그인 UI
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Cognito 세션 관리
│   │   └── TasksContext.tsx        # 공유 Tasks 상태 (API 중복 호출 방지)
│   │
│   ├── hooks/
│   │   ├── useTasks.ts             # 태스크 상태 + CRUD
│   │   ├── useHabits.ts            # 습관 상태 + toggleCheck
│   │   ├── useGoals.ts             # 목표 상태 + CRUD
│   │   ├── useChat.ts / useAssistant.ts
│   │   ├── useWorkout.ts / useKnowledge.ts
│   │   └── useStats.ts
│   │
│   ├── utils/
│   │   └── date.ts                 # getLocalDateStr() — KST 기준 날짜 유틸
│   │
│   ├── lib/
│   │   └── auth.ts                 # Amplify 초기화 + authHeaders()
│   │
│   └── types/index.ts              # 전체 TypeScript 타입 정의
│
├── backend/functions/
│   ├── assistant/                  # AI 어시스턴트 + 브리핑 공용 엔드포인트
│   ├── chat/ / portfolio/          # 포트폴리오 빌더
│   ├── diary/ / blog/ / blog_publish/
│   ├── workout/ / knowledge/ / goals/
│   ├── tasks/ / habits/ / journal/
│   ├── stats/ / public/ / public_blog/
│   └── lifewheel/ / mandalart/
│
├── infrastructure/
│   └── template.yaml               # AWS SAM — Lambda·DynamoDB·API GW·Cognito 전체 정의
│
└── docs/
    ├── AI_LIFE_MANAGER_PRD.md      # 제품 요구사항 + 실행 문서
    ├── DB_SCHEMA.md                # DynamoDB 테이블 스키마
    └── TODO_CHECKLIST.md           # 단계별 구현 체크리스트
```

---

## 🎯 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/assistant` | AI 어시스턴트 · 브리핑 생성 (Claude) |
| `POST` | `/chat` | 포트폴리오 빌더 채팅 |
| `GET · PUT` | `/portfolio/:id` | 포트폴리오 조회 · 수정 |
| `GET · POST` | `/tasks` | 태스크 목록 · 생성 |
| `PUT · DELETE` | `/tasks/:id` | 태스크 수정 · 삭제 |
| `GET · POST` | `/habits` | 습관 목록 · 생성 |
| `PUT · DELETE` | `/habits/:id` | 습관 수정(체크 포함) · 삭제 |
| `GET · POST` | `/goals` | 목표 목록 · 생성 |
| `PUT · DELETE` | `/goals/:id` | 목표 수정 · 삭제 |
| `GET · POST` | `/diary` | 일상 기록 |
| `GET · POST · PUT · DELETE` | `/blog[/:id]` | 블로그 관리 |
| `GET · POST · DELETE` | `/workout[/:id]` | 운동 기록 |
| `GET · POST · DELETE` | `/knowledge[/:id]` | 지식 관리 |
| `GET · POST · PUT · DELETE` | `/journal[/:id]` | 저널 회고 |
| `GET` | `/stats` | 통합 통계 |

---

## 🔧 환경 변수

### Frontend (`.env.local`)

| 변수 | 설명 | 예시 |
|------|------|------|
| `VITE_API_BASE_URL` | API Gateway 엔드포인트 | `https://abc123.execute-api.ap-northeast-2.amazonaws.com/dev` |
| `VITE_USER_POOL_ID` | Cognito User Pool ID | `ap-northeast-2_XxXxXxXx` |
| `VITE_USER_POOL_CLIENT_ID` | Cognito App Client ID | `1abc2defg3hij4klm` |
| `VITE_AWS_REGION` | AWS 리전 | `ap-northeast-2` |

### Backend (template.yaml에서 Lambda에 자동 주입)

| 변수 | 설명 |
|------|------|
| `TASKS_TABLE` | DynamoDB 태스크 테이블 |
| `HABITS_TABLE` | DynamoDB 습관 테이블 |
| `GOALS_TABLE` | DynamoDB 목표 테이블 |
| `DIARY_TABLE` | DynamoDB 일상 기록 테이블 |
| `BLOG_TABLE` | DynamoDB 블로그 테이블 |
| `WORKOUT_TABLE` | DynamoDB 운동 기록 테이블 |
| `KNOWLEDGE_TABLE` | DynamoDB 지식 관리 테이블 |
| `BEDROCK_MODEL_ID` | Bedrock 모델 ID (`anthropic.claude-3-5-sonnet-...`) |

---

## ⚙️ 개발 명령어

```bash
# 개발 서버 (HMR)
npm run dev

# 타입 체크
npx tsc --noEmit

# 린트
npm run lint

# 프로덕션 빌드
npm run build

# 백엔드 빌드 & 배포
cd infrastructure && sam build && sam deploy
```

---

## 🗺️ 로드맵

### ✅ 완성됨

- [x] 홈 대시보드 — 현황 카드 9개 + 날짜별 인사말
- [x] AI 오늘의 브리핑 — 자동 생성 + 액션 링크
- [x] 아이젠하워 매트릭스 — 4분면 태스크 관리
- [x] 캘린더 — 마감일 기반 월간 뷰 + 완료 토글
- [x] 습관 트래커 — 16주 히트맵 + 스트릭
- [x] Life Wheel — 8개 영역 레이더 차트
- [x] 만다라트 — 9×9 목표 그리드
- [x] 저널 — 주간/월간/KPT 회고
- [x] 목표 관리 — 진행률 추적 + 상태 관리
- [x] AI 포트폴리오 빌더
- [x] AI 블로그 생성 · 발행
- [x] 지식 관리 — AI 자동 요약 + 통합 검색
- [x] 운동 관리 — 주간 차트
- [x] 일상 기록 — AI 자동 분류 + 감정 태그
- [x] 통합 대시보드 — 활동 통계 시각화
- [x] AI 어시스턴트 — 컨텍스트 인식 대화

### 🔜 진행 예정

- [ ] Quick Add — 홈에서 한 줄로 태스크 즉시 추가
- [ ] AI 주간/월간 리포트 자동 생성
- [ ] 운동 AI 루틴 추천
- [ ] 커리어 성장 AI 분석
- [ ] 프로젝트 관리 — 마일스톤 + 태스크 연결

---

## 📧 Contact

**MinSeong Kim** · [@alstjd9615-code](https://github.com/alstjd9615)

프로젝트: [github.com/alstjd9615-code/minseongkim-dev](https://github.com/alstjd9615-code/minseongkim-dev)

---

<div align="center">

Made with ❤️ · AWS Serverless + Amazon Bedrock · 개인 전용 AI 라이프 매니저

</div>

