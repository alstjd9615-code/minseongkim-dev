# AI 라이프 매니저 🧬

> 나만의 AI 기반 개인 라이프 매니저 — 커리어, 지식, 운동, 목표를 한 곳에서 관리

[![Python](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-19-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900.svg)](https://aws.amazon.com/)

**개인 전용** AI 라이프 매니저입니다. AWS 서버리스 인프라와 Amazon Bedrock (Claude 3.5 Sonnet)을 기반으로, 커리어·지식·운동·목표를 AI로 관리합니다.

---

## ✨ 주요 기능

### 💼 커리어
- **AI 포트폴리오 빌더**: Claude와 대화하며 자동으로 포트폴리오 생성
- **블로그**: 일상 기록을 AI가 블로그 포스트로 변환 (초안 저장·편집·발행)

### 🧠 지식 관리
- **책/아티클/강의/영상 기록**: 읽고 들은 것을 노트와 함께 저장
- **AI 자동 요약**: Claude가 핵심 요약과 태그를 자동 추출
- **유형별 필터**: 책 / 아티클 / 강의 / 영상 / 기타

### 💪 운동 관리
- **운동 기록**: 종류, 시간, 강도, 메모 기록
- **Quick Overview**: 총 운동 횟수, 총 시간, 이번 주 운동 현황
- **이력 조회**: 날짜순 운동 기록 목록

### 🎯 목표 관리
- **단기/장기 목표 설정**: 제목, 설명, 기한 설정
- **진행률 추적**: 슬라이더로 달성률 업데이트
- **상태 관리**: 진행중 / 완료 / 포기

### 📓 일상 기록
- **자유 기록**: 오늘의 생각, 독서, 운동, 아이디어를 자유롭게 입력
- **AI 자동 분류**: 카테고리 자동 태깅 (독서·운동·프로젝트·시사·목표·아이디어)

### 🤖 AI 어시스턴트
- **자유 대화**: Claude와 자유롭게 대화하며 조언 및 아이디어 탐구

### 📊 대시보드
- **활동 통계**: 카테고리별 기록 수, 연속 기록 일수
- **시각화**: 막대 차트, 파이 차트, 30일 히트맵

---

## 🎨 UI

| 항목 | 사양 |
|------|------|
| 레이아웃 | 왼쪽 사이드바 + 메인 콘텐츠 |
| 사이드바 | #1E3A5F 다크 네이비 |
| 메인 배경 | #F8FAFC 라이트 |
| 포인트 컬러 | #3B82F6 블루 |
| 카드 배경 | #FFFFFF |
| 텍스트 | #1E293B |
| 모드 | 라이트 모드 고정 |

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────┐
│         개인 브라우저 (로컬)          │
└──────────────┬──────────────────────┘
               │
         ┌─────▼─────┐
         │CloudFront │──► S3 (React 앱)
         └─────┬─────┘
               │
         ┌─────▼──────────┐
         │  API Gateway   │──► Cognito (인증)
         └─────┬──────────┘
               │
     ┌─────────▼─────────────────────────┐
     │         Lambda Functions          │
     │  chat · portfolio · diary · blog  │
     │  workout · knowledge · goals      │──► Bedrock (Claude)
     │  stats · public                   │
     └─────────┬─────────────────────────┘
               │
     ┌─────────▼─────────┐
     │     DynamoDB      │
     │  Sessions         │
     │  Portfolios       │
     │  Diary            │
     │  Blog             │
     │  Workout  (신규)  │
     │  Knowledge (신규) │
     │  Goals    (신규)  │
     └───────────────────┘
```

### 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Frontend** | React 19, TypeScript, Vite, CSS Modules |
| **Backend** | AWS Lambda (Python 3.13) |
| **AI** | Amazon Bedrock (Claude 3.5 Sonnet) |
| **Database** | Amazon DynamoDB (On-Demand) |
| **인증** | Amazon Cognito |
| **API** | Amazon API Gateway (REST) |
| **CDN/Storage** | Amazon CloudFront + S3 |
| **Infrastructure** | AWS SAM |

---

## 🚀 로컬 개발 시작

### 사전 요구사항

- Node.js 20+
- Python 3.13+
- AWS CLI (자격 증명 설정 완료)
- AWS SAM CLI
- Bedrock 모델 접근 권한

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev
VITE_USER_POOL_ID=your-cognito-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-cognito-client-id
VITE_AWS_REGION=ap-northeast-2
```

### 3. 프론트엔드 개발 서버

```bash
npm run dev
# http://localhost:5173 에서 확인
```

### 4. 백엔드 배포 (AWS SAM)

```bash
cd infrastructure
sam build
sam deploy --guided   # 최초 배포 시
# 이후: sam deploy
```

배포 후 출력된 `ApiUrl`, `UserPoolId`, `UserPoolClientId` 값을 `.env.local`에 입력.

### 5. 프론트엔드 빌드 & 배포

```bash
npm run build
aws s3 sync dist/ s3://<FrontendBucketName>/ --delete
```

---

## 📁 프로젝트 구조

```
.
├── src/
│   ├── api/                    # API 클라이언트
│   │   ├── chat.ts
│   │   ├── portfolio.ts
│   │   ├── diary.ts
│   │   ├── blog.ts
│   │   ├── stats.ts
│   │   ├── workout.ts          # 신규
│   │   ├── knowledge.ts        # 신규
│   │   └── goals.ts            # 신규
│   ├── components/
│   │   ├── Auth/
│   │   ├── Chat/               # AI 어시스턴트 + 포트폴리오 빌더
│   │   ├── Portfolio/
│   │   ├── Diary/
│   │   ├── Blog/
│   │   ├── Dashboard/
│   │   ├── Workout/            # 신규 — 운동 관리
│   │   ├── Knowledge/          # 신규 — 지식 관리
│   │   └── Goals/              # 신규 — 목표 관리
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useDiary.ts
│   │   ├── useStats.ts
│   │   ├── useWorkout.ts       # 신규
│   │   ├── useKnowledge.ts     # 신규
│   │   └── useGoals.ts         # 신규
│   ├── contexts/
│   ├── lib/
│   └── types/index.ts          # 모든 타입 정의
│
├── backend/functions/
│   ├── chat/
│   ├── portfolio/
│   ├── diary/
│   ├── blog/
│   ├── blog_publish/
│   ├── public/
│   ├── public_blog/
│   ├── stats/
│   ├── workout/                # 신규
│   ├── knowledge/              # 신규
│   └── goals/                  # 신규
│
└── infrastructure/
    └── template.yaml           # SAM 템플릿 (모든 리소스)
```

---

## 🔧 환경 변수

### Frontend (`.env.local`)

| 변수 | 설명 |
|------|------|
| `VITE_API_BASE_URL` | API Gateway 엔드포인트 |
| `VITE_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_USER_POOL_CLIENT_ID` | Cognito App Client ID |
| `VITE_AWS_REGION` | AWS 리전 (기본: ap-northeast-2) |

### Backend Lambda 환경 변수 (template.yaml에서 자동 설정)

| 변수 | 설명 |
|------|------|
| `DIARY_TABLE` | DynamoDB 일상 기록 테이블 |
| `BLOG_TABLE` | DynamoDB 블로그 테이블 |
| `WORKOUT_TABLE` | DynamoDB 운동 기록 테이블 |
| `KNOWLEDGE_TABLE` | DynamoDB 지식 관리 테이블 |
| `GOALS_TABLE` | DynamoDB 목표 관리 테이블 |
| `BEDROCK_MODEL_ID` | Bedrock 모델 ID |

---

## 🎯 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/chat` | AI 채팅 (포트폴리오 빌더) |
| `GET/PUT` | `/portfolio/:id` | 포트폴리오 조회/수정 |
| `POST/GET` | `/diary` | 일상 기록 |
| `POST/GET/PUT/DELETE` | `/blog[/:id]` | 블로그 관리 |
| `POST/GET/DELETE` | `/workout[/:id]` | 운동 기록 |
| `POST/GET/DELETE` | `/knowledge[/:id]` | 지식 관리 |
| `POST/GET/PUT/DELETE` | `/goals[/:id]` | 목표 관리 |
| `GET` | `/stats` | 통계 |

---

## 🛠️ 개발 명령어

```bash
# 프론트엔드 개발 서버
npm run dev

# 린트
npm run lint

# 타입 체크
npx tsc --noEmit

# 빌드
npm run build
```

---

## 🆕 최근 업데이트

### v2.0 – 종합 개선 (2025)

1. **🤖 AI 어시스턴트 범용화**
   - 포트폴리오 전용이 아닌 범용 개인 라이프 매니저 AI 어시스턴트 추가
   - 현재 페이지 컨텍스트를 인식하여 맞춤형 응답 제공
   - 운동·목표·일기·지식 등 각 페이지별 환영 메시지

2. **📊 대시보드 실제 데이터 연동**
   - 일기·운동·목표·지식 4개 영역의 통합 통계 카드 (6개)
   - 최근 활동 타임라인 (diary/workout/goal/knowledge 구분)
   - 이번 주 운동 횟수, 진행 중/달성 목표 수, 지식 항목 수 표시

3. **💪 운동 주간 차트**
   - 최근 7일간 운동 시간(분)을 막대 차트로 시각화
   - Recharts 기반 반응형 BarChart

4. **📓 일상 기록 감정 태그**
   - 기록 시 😊 좋음 / 😐 보통 / 😔 나쁨 감정 선택 기능
   - 카드 목록에서 감정 이모지 표시

5. **🧠 지식 관리 검색**
   - 제목·저자·내용·AI 요약·태그를 통합 검색하는 실시간 검색 필터

---

## 🗺️ 로드맵

- [x] AI 포트폴리오 빌더
- [x] 일상 기록 (AI 자동 분류)
- [x] AI 블로그 생성기
- [x] 대시보드 (활동 통계)
- [x] 라이트 모드 + 사이드바 레이아웃
- [x] 운동 관리
- [x] 지식 관리 (AI 자동 요약)
- [x] 목표 관리 (진행률 추적)
- [ ] AI 종합 주간/월간 리포트
- [ ] 운동 AI 루틴 추천
- [ ] 커리어 성장 AI 분석
- [ ] 모바일 반응형 개선

---

## 📧 Contact

**MinSeong Kim** — [@alstjd9615-code](https://github.com/alstjd9615-code)

Project: [https://github.com/alstjd9615-code/minseongkim-dev](https://github.com/alstjd9615-code/minseongkim-dev)

---

Made with ❤️ using AWS & AI — 개인 전용 라이프 매니저

