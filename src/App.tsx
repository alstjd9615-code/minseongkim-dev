import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { useAssistant } from './hooks/useAssistant';
import { useAuth } from './contexts/useAuth';
import { AuthGuard } from './components/Auth/AuthGuard';
import { ChatInterface } from './components/Chat/ChatInterface';
import { PortfolioView } from './components/Portfolio/PortfolioView';
import { DiaryList } from './components/Diary/DiaryList';
import { Dashboard } from './components/Dashboard/Dashboard';
import { BlogList } from './components/Blog/BlogList';
import { WorkoutLog } from './components/Workout/WorkoutLog';
import { KnowledgeList } from './components/Knowledge/KnowledgeList';
import { GoalsList } from './components/Goals/GoalsList';
import { LifeWheelView } from './components/LifeWheel/LifeWheelView';
import { MandalartView } from './components/Mandalart/MandalartView';
import { HabitsTracker } from './components/Habits/HabitsTracker';
import { TaskMatrix } from './components/Tasks/TaskMatrix';
import { JournalView } from './components/Journal/JournalView';
import './App.css';

type Section = 'career' | 'knowledge' | 'workout' | 'goals' | 'assistant' | 'diary' | 'dashboard' | 'lifewheel' | 'mandalart' | 'habits' | 'tasks' | 'journal';
type CareerPage = 'portfolio' | 'blog';

const SECTION_LABELS: Record<Section, string> = {
  career: '💼 커리어',
  knowledge: '🧠 지식 관리',
  workout: '💪 운동',
  goals: '🎯 목표',
  assistant: '🤖 AI 어시스턴트',
  diary: '📓 일상 기록',
  dashboard: '📊 대시보드',
  lifewheel: '🎡 Life Wheel',
  mandalart: '🏮 만다라트',
  habits: '🌱 습관 트래커',
  tasks: '⚡ 우선순위',
  journal: '📖 저널',
};

const ASSISTANT_CONTEXT: Record<Section, string> = {
  workout: '사용자가 현재 운동 관리 페이지를 보고 있습니다.',
  goals: '사용자가 현재 목표 관리 페이지를 보고 있습니다.',
  dashboard: '사용자가 현재 대시보드를 보고 있습니다.',
  diary: '사용자가 현재 일상 기록 페이지를 보고 있습니다.',
  knowledge: '사용자가 현재 지식 관리 페이지를 보고 있습니다.',
  assistant: '사용자가 AI 어시스턴트와 자유롭게 대화하고 있습니다.',
  career: '사용자가 현재 커리어/포트폴리오 페이지를 보고 있습니다.',
  lifewheel: '사용자가 인생의 수레바퀴 페이지를 보고 있습니다.',
  mandalart: '사용자가 만다라트 목표 관리 페이지를 보고 있습니다.',
  habits: '사용자가 습관 트래커 페이지를 보고 있습니다.',
  tasks: '사용자가 아이젠하워 매트릭스 우선순위 페이지를 보고 있습니다.',
  journal: '사용자가 저널 페이지를 보고 있습니다.',
};

const ASSISTANT_EMPTY_TEXT: Record<Section, string> = {
  workout: '오늘 운동 기록할까요?\n운동에 대해 무엇이든 물어보세요.',
  goals: '목표 진행상황을 분석해드릴까요?\n달성하고 싶은 것을 말씀해주세요.',
  dashboard: '전체 데이터를 분석해드릴까요?\n궁금한 것을 물어보세요.',
  diary: '오늘 하루는 어떠셨나요?\n일상을 기록해드릴게요.',
  knowledge: '학습 내용 정리를 도와드릴까요?\n배운 것을 말씀해주세요.',
  assistant: '무엇이든 물어보세요!\n당신의 AI 라이프 매니저입니다.',
  career: '커리어에 대해 궁금한 점이 있으신가요?\n포트폴리오 개선을 도와드립니다.',
  lifewheel: '인생의 수레바퀴 분석을 도와드릴까요?\n약한 영역을 말씀해주세요.',
  mandalart: '만다라트 목표 세분화를 도와드릴까요?\n핵심 목표를 말씀해주세요.',
  habits: '습관 패턴을 분석해드릴까요?\n습관에 대해 무엇이든 물어보세요.',
  tasks: '할 일 우선순위 정리를 도와드릴까요?\n오늘 할 일을 말씀해주세요.',
  journal: '회고 내용을 정리해드릴까요?\n이번 주/달을 돌아보세요.',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '🌙 좋은 새벽이에요';
  if (hour < 12) return '☀️ 좋은 아침이에요';
  if (hour < 18) return '🌤️ 좋은 오후에요';
  return '🌆 좋은 저녁이에요';
}

function formatDate(): string {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function AppContent() {
  const { session, portfolio, isLoading, error, send, reset } = useChat();
  const assistant = useAssistant();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('career');
  const [careerPage, setCareerPage] = useState<CareerPage>('portfolio');
  const [careerOpen, setCareerOpen] = useState(true);

  const email = user?.signInDetails?.loginId ?? '';
  const avatarLetter = email.charAt(0).toUpperCase();

  const handleSectionClick = (section: Section) => {
    if (section === 'career') {
      setCareerOpen(prev => !prev);
    } else {
      setActiveSection(section);
    }
  };

  const handleCareerPageClick = (page: CareerPage) => {
    setCareerPage(page);
    setActiveSection('career');
  };

  const activeSectionLabel =
    activeSection === 'career'
      ? careerPage === 'portfolio'
        ? '📄 포트폴리오'
        : '✍️ 블로그'
      : SECTION_LABELS[activeSection];

  return (
    <div className="appLayout">
      {/* ── 사이드바 ─────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebarLogo">
          <div className="sidebarLogoTitle">
            <span className="sidebarLogoIcon">🧬</span>
            <div>
              <div className="sidebarLogoText">AI 라이프 매니저</div>
              <div className="sidebarLogoSub">Personal Manager</div>
            </div>
          </div>
        </div>

        <nav className="sidebarNav">
          {/* 💼 커리어 */}
          <button
            className={`navItem ${activeSection === 'career' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('career')}
          >
            <span className="navItemIcon">💼</span>
            <span className="navItemLabel">커리어</span>
            <span className={`navItemChevron ${careerOpen ? 'navItemChevronOpen' : ''}`}>▶</span>
          </button>
          {careerOpen && (
            <div className="subNav">
              <button
                className={`subNavItem ${activeSection === 'career' && careerPage === 'portfolio' ? 'subNavItemActive' : ''}`}
                onClick={() => handleCareerPageClick('portfolio')}
              >
                📄 포트폴리오
              </button>
              <button
                className={`subNavItem ${activeSection === 'career' && careerPage === 'blog' ? 'subNavItemActive' : ''}`}
                onClick={() => handleCareerPageClick('blog')}
              >
                ✍️ 블로그
              </button>
            </div>
          )}

          {/* 🧠 지식 관리 */}
          <button
            className={`navItem ${activeSection === 'knowledge' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('knowledge')}
          >
            <span className="navItemIcon">🧠</span>
            <span className="navItemLabel">지식 관리</span>
          </button>

          {/* 💪 운동 */}
          <button
            className={`navItem ${activeSection === 'workout' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('workout')}
          >
            <span className="navItemIcon">💪</span>
            <span className="navItemLabel">운동</span>
          </button>

          {/* 🎯 목표 */}
          <button
            className={`navItem ${activeSection === 'goals' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('goals')}
          >
            <span className="navItemIcon">🎯</span>
            <span className="navItemLabel">목표</span>
          </button>

          {/* 🤖 AI 어시스턴트 */}
          <button
            className={`navItem ${activeSection === 'assistant' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('assistant')}
          >
            <span className="navItemIcon">🤖</span>
            <span className="navItemLabel">AI 어시스턴트</span>
          </button>

          {/* 구분선 */}
          <div style={{ borderTop: '1px solid var(--sidebar-border)', margin: '8px 4px' }} />

          {/* 🎡 Life Wheel */}
          <button
            className={`navItem ${activeSection === 'lifewheel' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('lifewheel')}
          >
            <span className="navItemIcon">🎡</span>
            <span className="navItemLabel">Life Wheel</span>
          </button>

          {/* 🏮 만다라트 */}
          <button
            className={`navItem ${activeSection === 'mandalart' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('mandalart')}
          >
            <span className="navItemIcon">🏮</span>
            <span className="navItemLabel">만다라트</span>
          </button>

          {/* 🌱 습관 트래커 */}
          <button
            className={`navItem ${activeSection === 'habits' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('habits')}
          >
            <span className="navItemIcon">🌱</span>
            <span className="navItemLabel">습관 트래커</span>
          </button>

          {/* ⚡ 우선순위 */}
          <button
            className={`navItem ${activeSection === 'tasks' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('tasks')}
          >
            <span className="navItemIcon">⚡</span>
            <span className="navItemLabel">우선순위</span>
          </button>

          {/* 📖 저널 */}
          <button
            className={`navItem ${activeSection === 'journal' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('journal')}
          >
            <span className="navItemIcon">📖</span>
            <span className="navItemLabel">저널</span>
          </button>

          {/* 구분선 */}
          <div style={{ borderTop: '1px solid var(--sidebar-border)', margin: '8px 4px' }} />

          {/* 📓 일상 기록 */}
          <button
            className={`navItem ${activeSection === 'diary' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('diary')}
          >
            <span className="navItemIcon">📓</span>
            <span className="navItemLabel">일상 기록</span>
          </button>

          {/* 📊 대시보드 */}
          <button
            className={`navItem ${activeSection === 'dashboard' ? 'navItemActive' : ''}`}
            onClick={() => handleSectionClick('dashboard')}
          >
            <span className="navItemIcon">📊</span>
            <span className="navItemLabel">대시보드</span>
          </button>
        </nav>

        <div className="sidebarUser">
          <div className="sidebarUserAvatar">{avatarLetter}</div>
          <div className="sidebarUserInfo">
            <div className="sidebarUserEmail">{email}</div>
          </div>
          <button className="sidebarLogoutBtn" onClick={() => void logout()}>
            나가기
          </button>
        </div>
      </aside>

      {/* ── 메인 영역 ─────────────────────────────── */}
      <div className="mainArea">
        {/* 인사말 헤더 */}
        <div className="greetingBar">
          <div className="greetingLeft">
            <div className="greetingText">{getGreeting()}</div>
            <div className="greetingDate">{formatDate()}</div>
          </div>
          <div className="greetingRight">
            <span className="sectionBadge">{activeSectionLabel}</span>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="contentPane">
          {/* 💼 커리어 > 포트폴리오 */}
          {activeSection === 'career' && careerPage === 'portfolio' && (
            <>
              <div className="chatPane">
                <ChatInterface
                  session={session}
                  isLoading={isLoading}
                  error={error}
                  onSend={send}
                  onReset={reset}
                />
              </div>
              <div className="divider" />
              <div className="portfolioPane">
                <PortfolioView portfolio={portfolio} />
              </div>
            </>
          )}

          {/* 💼 커리어 > 블로그 */}
          {activeSection === 'career' && careerPage === 'blog' && (
            <div className="fullPane">
              <BlogList />
            </div>
          )}

          {/* 🧠 지식 관리 */}
          {activeSection === 'knowledge' && (
            <div className="fullPane">
              <KnowledgeList />
            </div>
          )}

          {/* 💪 운동 */}
          {activeSection === 'workout' && (
            <div className="fullPane">
              <WorkoutLog />
            </div>
          )}

          {/* 🎯 목표 */}
          {activeSection === 'goals' && (
            <div className="fullPane">
              <GoalsList />
            </div>
          )}

          {/* 🤖 AI 어시스턴트 */}
          {activeSection === 'assistant' && (
            <div className="chatPane" style={{ flex: 1, borderRight: 'none' }}>
              <ChatInterface
                session={assistant.session}
                isLoading={assistant.isLoading}
                error={assistant.error}
                onSend={text => void assistant.send(text, ASSISTANT_CONTEXT.assistant)}
                onReset={assistant.reset}
                title="🤖 AI 어시스턴트"
                emptyStateIcon="🤖"
                emptyStateText={ASSISTANT_EMPTY_TEXT.assistant}
                placeholder="무엇이든 물어보세요..."
              />
            </div>
          )}

          {/* 📓 일상 기록 */}
          {activeSection === 'diary' && (
            <div className="fullPane">
              <DiaryList />
            </div>
          )}

          {/* 📊 대시보드 */}
          {activeSection === 'dashboard' && (
            <div className="fullPane">
              <Dashboard />
            </div>
          )}

          {/* 🎡 Life Wheel */}
          {activeSection === 'lifewheel' && (
            <div className="fullPane">
              <LifeWheelView />
            </div>
          )}

          {/* 🏮 만다라트 */}
          {activeSection === 'mandalart' && (
            <div className="fullPane">
              <MandalartView />
            </div>
          )}

          {/* 🌱 습관 트래커 */}
          {activeSection === 'habits' && (
            <div className="fullPane">
              <HabitsTracker />
            </div>
          )}

          {/* ⚡ 우선순위 매트릭스 */}
          {activeSection === 'tasks' && (
            <div className="fullPane">
              <TaskMatrix />
            </div>
          )}

          {/* 📖 저널 */}
          {activeSection === 'journal' && (
            <div className="fullPane">
              <JournalView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
}

export default App;
