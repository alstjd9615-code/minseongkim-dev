# DB Schema — AI 라이프 매니저

> 현재 AWS DynamoDB 사용. 모든 테이블 PAY_PER_REQUEST 빌링.  
> PK = `userId` (Cognito 사용자 ID), SK = 각 항목 고유 ID.

---

## 오늘 필수 테이블

### TasksTable
- **목적**: 아이젠하워 매트릭스 할 일 관리
- **PK**: `userId`
- **SK**: `taskId` (UUID)
- **필수 컬럼**:
  ```
  taskId: string       // UUID
  userId: string       // Cognito sub
  title: string        // 할 일 제목 (max 200자)
  urgent: boolean      // 긴급 여부
  important: boolean   // 중요 여부
  completed: boolean   // 완료 여부
  dueDate?: string     // YYYY-MM-DD (선택)
  projectId?: string   // 연결된 프로젝트 ID (선택, 느슨한 외래키)
  milestoneId?: string // 연결된 마일스톤 ID (선택)
  createdAt: string    // ISO 8601
  updatedAt: string    // ISO 8601
  ```
- **관계**: `projectId`로 ProjectsTable의 프로젝트와 느슨하게 연결 (삭제 시 null 처리 별도 구현 필요)
- **오늘 필요**: ✅ 핵심

### HabitsTable
- **목적**: 일일 습관 체크 및 streak 계산
- **PK**: `userId`
- **SK**: `habitId` (UUID)
- **필수 컬럼**:
  ```
  habitId: string      // UUID
  userId: string
  name: string         // 습관명 (max 100자)
  emoji?: string       // 이모지 (선택)
  checkDates: string[] // 체크된 날짜 목록 ["2025-01-01", ...]
  createdAt: string
  ```
- **관계**: 없음
- **오늘 필요**: ✅ 핵심

### GoalsTable
- **목적**: 중장기 목표 관리 및 진행 추적
- **PK**: `userId`
- **SK**: `goalId` (UUID)
- **필수 컬럼**:
  ```
  goalId: string       // UUID
  userId: string
  title: string        // 목표 제목
  description?: string // 상세 설명
  status: '진행중' | '완료' | '보류'
  category?: string    // 카테고리 (커리어/건강/자기계발 등)
  dueDate?: string     // 목표 기한
  progress?: number    // 0-100 진행률
  createdAt: string
  updatedAt: string
  ```
- **관계**: 없음 (태스크와 소프트 연결 가능, 오늘은 제외)
- **오늘 필요**: ✅ 핵심

---

## 오늘 사용하는 추가 테이블 (기존 구현됨)

### DiaryTable
- **PK**: `userId`, **SK**: `entryId`
- **GSI**: `category-createdAt-index`
- 오늘 필요: 낮음 (구현됨, MVP 우선순위 낮음)

### KnowledgeTable
- **PK**: `userId`, **SK**: `knowledgeId`
- 오늘 필요: 낮음

### WorkoutTable
- **PK**: `userId`, **SK**: `workoutId`
- 오늘 필요: 낮음

### LifeWheelTable / MandalartTable / JournalTable / ProjectsTable
- 오늘 필요: 낮음 (구현됨, 추가 작업 없음)

---

## 제외된 테이블 (Not Today)

| 테이블 | 제외 이유 |
|--------|-----------|
| `ai_briefings` | 별도 저장 불필요. Bedrock 호출 후 프론트 상태로만 관리 |
| `calendar_events` | TasksTable의 `dueDate` 필드로 대체 |
| `weekly_reviews` | JournalTable로 커버 |
| `notes` | DiaryTable + KnowledgeTable로 커버 |
| `ai_recommendations` | 브리핑 API에 통합 |
| `task_sources` | MVP 범위 초과 |

---

## 세션 테이블 (기존)

### SessionsTable
- **PK**: `sessionId`
- AI 채팅 세션 저장
- **오늘 필요**: ✅ (AI 어시스턴트 이미 사용중)

---

## API → DynamoDB 매핑

```
POST   /tasks          → TasksTable.put()
GET    /tasks          → TasksTable.query(userId)
PUT    /tasks/{id}     → TasksTable.update()
DELETE /tasks/{id}     → TasksTable.delete()

POST   /habits         → HabitsTable.put()
GET    /habits         → HabitsTable.query(userId)
PUT    /habits/{id}    → HabitsTable.update()
DELETE /habits/{id}    → HabitsTable.delete()

POST   /goals          → GoalsTable.put()
GET    /goals          → GoalsTable.query(userId)
PUT    /goals/{id}     → GoalsTable.update()
DELETE /goals/{id}     → GoalsTable.delete()

POST   /briefing       → Bedrock 호출 (DynamoDB 저장 없음)
POST   /chat           → SessionsTable + Bedrock 호출
```
