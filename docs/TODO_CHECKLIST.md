# AI 라이프 매니저 — 개발 TODO 체크리스트

> 기준: 오늘 MVP 완성 목표  
> 기술 스택: React(Vite) + TypeScript + CSS Modules + AWS Cognito/Bedrock/DynamoDB

---

## ✅ Step 1. 프로젝트 세팅 (완료)

- [x] Vite + React + TypeScript 세팅
- [x] AWS Cognito 인증 (aws-amplify)
- [x] API Base URL 환경변수 설정 (`VITE_API_BASE_URL`)
- [x] `authHeaders()` 헬퍼 구현
- [x] ErrorBoundary 컴포넌트
- [x] 상단 탭바 + 모바일 하단 탭바 레이아웃

---

## ✅ Step 2. 공통 레이아웃 (완료)

- [x] `AppLayout` — 상단 탑바 + 메인 콘텐츠 + 모바일 하단 탭바
- [x] 인사말 헤더 (시간대별 인사 + 날짜)
- [x] CSS 변수 기반 테마 (`--bg`, `--card-bg`, `--border`, 등)
- [x] 반응형: 모바일 하단 5탭 네비게이션

---

## ✅ Step 3. 데이터 스키마 및 API (완료)

- [x] TasksTable (DynamoDB) — CRUD API
- [x] HabitsTable — CRUD API
- [x] GoalsTable — CRUD API
- [x] DiaryTable — CRUD API
- [x] KnowledgeTable — CRUD API
- [x] WorkoutTable — CRUD API
- [x] SessionsTable — AI 채팅 세션

---

## ✅ Step 4. Tasks 기능 (완료)

- [x] `TaskMatrix` 컴포넌트 — 아이젠하워 4분면
- [x] 태스크 추가 폼 (제목, 긴급/중요 토글, 마감일)
- [x] 완료 처리 + 삭제
- [x] 분면별 통계 뱃지
- [x] `useTasks` 훅
- [x] `tasks` API 모듈

---

## ✅ Step 5. Home 구성 (완료 + 개선)

- [x] `HomeDashboard` — 인사말 + 카드 그리드
- [x] 목표 현황 카드 (진행중/완료 수)
- [x] 습관 현황 카드 (오늘 달성/전체, 최대 streak)
- [x] 섹션 진입 카드들 (Life Wheel, 만다라트, Tasks, 프로젝트, 저널, 지식관리)
- [x] **AI 브리핑 카드** — `AiBriefing` 컴포넌트 (신규 추가)

---

## ✅ Step 6. AI 연결 (완료 + 개선)

- [x] `ChatInterface` — AI 어시스턴트 채팅 UI
- [x] 섹션별 컨텍스트 자동 주입 (`ASSISTANT_CONTEXT`)
- [x] AWS Bedrock Claude 3.5 Sonnet 연결
- [x] **`AiBriefing` 컴포넌트** — 홈 AI 브리핑 카드 (신규)
- [x] **`briefing` API** — `/assistant` 엔드포인트 재사용, 브리핑 프롬프트 빌더 (신규)

---

## ✅ Step 7. 캘린더 (신규 완성)

- [x] `CalendarView` 컴포넌트 — 월간 달력 뷰
- [x] 태스크 `dueDate` 기반 날짜별 도트 표시 (Q1=빨강, Q2=파랑, Q3=주황, Q4=회색, 완료=초록)
- [x] 날짜 클릭 → 해당일 태스크 목록 표시
- [x] 이전/다음 월 네비게이션
- [x] 상단 탭바에 📅 캘린더 탭 추가

---

## ✅ Step 8. 추가 개선 (완료)

- [x] **Quick Add 컴포넌트** — 홈에서 한 줄 태스크 빠른 추가
  - 홈 상단 입력창
  - 입력 → AI 자동 분류 → `createTask()` 직접 호출
- [x] **AI 태스크 분류** — 자연어 입력 → urgent/important 자동 판단
  - `/assistant` 엔드포인트 재사용: "이 할 일이 긴급한가요? 중요한가요?"
  - JSON 파싱 + Q2 fallback
- [x] **오늘 태스크 요약 카드** — 홈에 Q1 태스크 2~3개 표시
  - `HomeDashboard`에 Q1 태스크 인라인 표시 (이미 완료)
- [x] **습관 + 목표 연결** — 목표 카드에 관련 습관 표시
  - 키워드 매칭 기반 관련 습관 chips 표시

---

## ✅ Step 9. 에픽: Quick Add + AI 리포트 + 프로젝트 연결 (완료)

- [x] **[Issue 1] 전역 Quick Add 모달** — Ctrl+K / ⌘K 단축키, FAB 버튼
  - `src/components/QuickAdd/QuickAddModal.tsx` (신규)
  - `src/components/QuickAdd/QuickAddFab.tsx` (신규)
  - `src/components/QuickAdd/QuickAdd.module.css` (신규)
  - App.tsx에 전역 keydown 리스너 + 모달/FAB 마운트
- [x] **[Issue 2] TaskEntry에 projectId/milestoneId 필드 추가**
  - `src/types/index.ts` — `TaskEntry`, `CreateTaskRequest`, `UpdateTaskRequest`에 추가
  - `backend/functions/tasks/handler.py` — POST/PUT 저장 + GET 응답 포함
- [x] **[Issue 3] 프로젝트 마일스톤 마감일 + D-day 배지 + 진행률**
  - 마일스톤 추가 폼에 마감일 입력 추가
  - D-day 배지 (D+N, D-Day, D-N) 색상별 표시
  - 마일스톤별 태스크 진행률 바
  - 프로젝트 카드 헤더에 "마일스톤 N/M 완료" 요약
  - 빈 상태 안내 문구 개선
- [x] **[Issue 4] 태스크-프로젝트 연결 UI**
  - TaskMatrix 카드에 프로젝트 배지 표시
  - 태스크 카드에 🔗 버튼으로 프로젝트 연결 드롭다운
  - ProjectsView에 "연결된 TaskEntry 목록" 섹션
- [x] **[Issue 5] AI 주간 리포트 데이터 집계 레이어**
  - `src/api/weeklyReport.ts` (신규) — buildWeeklyReportData, buildWeeklyPrompt, generateWeeklyReport
- [x] **[Issue 6] AI 주간 리포트 UI**
  - `src/components/AI/WeeklyReport.tsx` (신규)
  - JournalView 주간 탭 상단에 임베드
  - sessionStorage 캐싱, loading skeleton, error/empty 상태
- [x] **[Issue 7] AI 월간 리포트 기본 구조**
  - `src/api/monthlyReport.ts` (신규) — buildMonthlyReportData, buildMonthlyPrompt, generateMonthlyReport
  - `src/components/AI/MonthlyReport.tsx` (신규) — 이전/다음 월 이동, 집계 수치 카드
  - JournalView 월간 탭 상단에 임베드
- [x] **[Issue 8] ProjectsView를 App.tsx 탭에 통합**
  - 상단 탭바에 🗂️ 프로젝트 탭 추가
  - HomeDashboard에 프로젝트 카드 추가 (진행중 수 표시)
- [x] **[Issue 9] Quick Add 모달에 프로젝트/마일스톤 선택 연동**
  - QuickAddModal에 프로젝트 드롭다운 + 마일스톤 드롭다운 (선택 시 표시)
  - submit 시 projectId + milestoneId 전달
- [x] **[Issue 10] 통합 QA + 문서 업데이트**
  - TypeScript 빌드 (`npm run build`) 오류 없음 ✅
  - 기존 lint 오류(HabitsTracker.tsx `Date.now`) 는 pre-existing — KNOWN_GAPS 기록
  - DB_SCHEMA.md, TODO_CHECKLIST.md 업데이트

### KNOWN_GAPS

- `HabitsTracker.tsx:88` — `Date.now` 호출이 react-hooks/purity 린트 경고 발생. 이번 에픽 범위 외 pre-existing 이슈.
- 월간 리포트의 "목표 완료" 집계는 `goal.updatedAt`을 기준으로 하므로, updatedAt이 없는 구형 데이터에서 0으로 표시될 수 있음.
- QuickAdd 모달에서 AI 자동 분류 시 긴급/중요 토글이 모두 꺼진 경우에만 AI 분류를 수행함 (토글을 켠 경우 수동 설정 우선).

---

## 🔲 Step 10. Not Today (나중에)

- [ ] Supabase 전환 (현재 DynamoDB 잘 작동)
- [ ] Google Calendar 연동
- [ ] 통계 대시보드 리빌드
- [ ] PWA/모바일 앱
- [ ] 알림/푸시
- [ ] 팀/공유 기능
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 프로젝트 삭제 시 연결 태스크의 projectId null 처리 (백엔드)

---

## 📦 생성된 파일 목록

### 신규 생성
```
docs/AI_LIFE_MANAGER_PRD.md       ← 재구성된 PRD (9단계)
docs/DB_SCHEMA.md                 ← DB 스키마 참조 문서
docs/TODO_CHECKLIST.md            ← 이 파일
src/api/briefing.ts               ← AI 브리핑 API
src/api/taskClassify.ts           ← AI 태스크 자동 분류 API (신규)
src/components/AI/AiBriefing.tsx  ← AI 브리핑 컴포넌트
src/components/AI/AiBriefing.module.css
src/components/Calendar/CalendarView.tsx  ← 캘린더 뷰
src/components/Calendar/Calendar.module.css
src/components/Home/QuickAdd.tsx  ← Quick Add 컴포넌트 (신규)
src/components/Home/QuickAdd.module.css   ← (신규)
src/data/dummyData.ts             ← 더미 데이터 예시
```

### 수정된 파일
```
src/App.tsx                              ← Calendar 섹션/탭 추가
src/components/Home/HomeDashboard.tsx    ← AiBriefing + QuickAdd 통합
src/components/Goals/GoalsList.tsx       ← 관련 습관 표시 (신규)
src/components/Goals/Goals.module.css    ← 관련 습관 스타일 (신규)
```

---

## 🏆 최종 MVP 정의

> **"사용자가 할 일을 아이젠하워 매트릭스로 분류하고, 캘린더로 일정을 확인하며, 홈에서 AI 브리핑으로 오늘의 우선순위를 즉시 파악할 수 있는 AI 라이프 매니저 웹앱"**

---

## 🔑 완료 기준

| 기능 | 완료 기준 |
|------|-----------|
| AI 브리핑 | 홈에서 버튼 클릭 시 3~5줄 브리핑 생성 |
| 캘린더 | 태스크 마감일이 달력에 색상 도트로 표시 |
| Tasks | Q1~Q4 분면에 태스크 추가/완료/삭제 가능 |
| 목표/습관 | CRUD 완전 동작 |
| AI 어시스턴트 | 섹션 컨텍스트 포함 자유 대화 가능 |
| 인증 | Cognito 로그인/로그아웃 |
| 반응형 | 모바일 하단 탭바 정상 작동 |
