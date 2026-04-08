import { useState } from 'react';
import { useChat } from './hooks/useChat';
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
import './App.css';

type Section = 'career' | 'knowledge' | 'workout' | 'goals' | 'assistant' | 'diary' | 'dashboard';
type CareerPage = 'portfolio' | 'blog';

const SECTION_LABELS: Record<Section, string> = {
  career: '💼 커리어',
  knowledge: '🧠 지식 관리',
  workout: '💪 운동',
  goals: '🎯 목표',
  assistant: '🤖 AI 어시스턴트',
  diary: '📓 일상 기록',
  dashboard: '📊 대시보드',
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
                session={session}
                isLoading={isLoading}
                error={error}
                onSend={send}
                onReset={reset}
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
