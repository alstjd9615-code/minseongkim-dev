# AI 포트폴리오 빌더 ✨

AWS 서버리스 아키텍처로 구축된 AI 포트폴리오 생성 서비스입니다.  
AI와 대화하면 포트폴리오가 자동으로 노션(Notion)처럼 정리됩니다.

---

## 아키텍처

```
사용자 브라우저
    │
    ▼
CloudFront (CDN)
    ├── /  →  S3 (React 정적 파일)
    └── /dev/*  →  API Gateway
                      ├── POST /chat          → Lambda (chat)   → Bedrock (Claude)
                      ├── GET  /portfolio/:id → Lambda (portfolio)
                      └── PUT  /portfolio/:id → Lambda (portfolio)

Lambda (chat / portfolio)
    ├── Amazon Bedrock  (Claude 3.5 Sonnet)
    └── DynamoDB
          ├── portfolio-sessions   (대화 히스토리)
          └── portfolio-data       (포트폴리오 섹션)
```

| 레이어 | 기술 |
|--------|------|
| **프론트엔드** | React 19, TypeScript, Vite, react-markdown |
| **CDN / 스토리지** | Amazon CloudFront + S3 |
| **API** | Amazon API Gateway (REST) |
| **백엔드** | AWS Lambda (Python 3.12) |
| **AI** | Amazon Bedrock – Claude 3.5 Sonnet |
| **DB** | Amazon DynamoDB (Pay-per-request) |

---

## 폴더 구조

```
.
├── src/                        # React 프론트엔드
│   ├── api/
│   │   └── chat.ts             # API Gateway 클라이언트
│   ├── components/
│   │   ├── Chat/               # 채팅 UI (ChatInterface, ChatMessage, ChatInput)
│   │   └── Portfolio/          # 포트폴리오 뷰어 (노션 스타일 블록)
│   ├── hooks/
│   │   └── useChat.ts          # 채팅 상태 관리 훅
│   ├── types/
│   │   └── index.ts            # TypeScript 타입 정의
│   ├── App.tsx
│   └── main.tsx
│
├── backend/
│   ├── functions/
│   │   ├── chat/
│   │   │   └── handler.py      # 채팅 Lambda (Bedrock 호출 + DynamoDB 저장)
│   │   └── portfolio/
│   │       └── handler.py      # 포트폴리오 CRUD Lambda
│   └── requirements.txt        # Python 의존성
│
├── infrastructure/
│   ├── template.yaml           # AWS SAM / CloudFormation 템플릿
│   └── samconfig.toml          # SAM 배포 설정
│
└── .env.example                # 환경변수 예시
```

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- Python 3.12+
- AWS CLI + SAM CLI
- AWS 계정 (Bedrock 모델 접근 권한 필요)

### 1. 프론트엔드

```bash
npm install
cp .env.example .env.local
# .env.local 파일에 VITE_API_BASE_URL 설정 후:
npm run dev
```

### 2. 백엔드 배포 (AWS SAM)

```bash
cd infrastructure

# 첫 배포
sam build
sam deploy --guided

# 이후 배포
sam build && sam deploy
```

배포 완료 후 출력되는 `ApiUrl` 값을 `.env.local`의 `VITE_API_BASE_URL`에 입력합니다.

### 3. 프론트엔드 빌드 & S3 업로드

```bash
npm run build

# 출력되는 FrontendBucketName 값 사용
aws s3 sync dist/ s3://<FrontendBucketName>/ --delete
```

---

## 기능

- 💬 **AI 채팅** – 자연어로 경력, 기술, 프로젝트 정보를 입력
- 📄 **자동 포트폴리오 생성** – AI가 입력 내용을 구조화된 섹션으로 정리
- 🎨 **노션 스타일 렌더링** – Markdown 기반 블록 뷰어
- 🌗 **다크/라이트 모드** – 시스템 설정 자동 반영
- 🔒 **보안** – S3 퍼블릭 접근 차단, CloudFront OAC 인증

---

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_API_BASE_URL` | API Gateway 기본 URL | `""` (빈 값 = 상대경로) |
| `SESSIONS_TABLE` | DynamoDB 세션 테이블명 | `portfolio-sessions` |
| `PORTFOLIOS_TABLE` | DynamoDB 포트폴리오 테이블명 | `portfolio-data` |
| `BEDROCK_MODEL_ID` | Bedrock 모델 ID | `anthropic.claude-3-5-sonnet-20240620-v1:0` |
| `MAX_TOKENS` | 최대 응답 토큰 수 | `4096` |
| `CORS_ORIGIN` | CORS 허용 오리진 | `*` |

---

## Bedrock 모델 접근 권한

AWS 콘솔 → **Amazon Bedrock** → **Model access** 메뉴에서  
`Claude 3.5 Sonnet` 모델에 대한 접근을 활성화해야 합니다.

