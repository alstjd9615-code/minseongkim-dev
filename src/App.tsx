import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { useAuth } from './contexts/useAuth';
import { AuthGuard } from './components/Auth/AuthGuard';
import { ChatInterface } from './components/Chat/ChatInterface';
import { PortfolioView } from './components/Portfolio/PortfolioView';
import { DiaryList } from './components/Diary/DiaryList';
import { Dashboard } from './components/Dashboard/Dashboard';
import { BlogList } from './components/Blog/BlogList';
import './App.css';

type Tab = 'portfolio' | 'diary' | 'dashboard' | 'blog';

function AppContent() {
  const { session, portfolio, isLoading, error, send, reset } = useChat();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');

  return (
    <div className="appLayout">
      <header className="appHeader">
        <span className="appLogo">✨</span>
        <h1 className="appTitle">AI 포트폴리오 빌더</h1>
        <nav className="appTabs">
          <button
            className={`appTab ${activeTab === 'portfolio' ? 'appTabActive' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            📄 포트폴리오
          </button>
          <button
            className={`appTab ${activeTab === 'diary' ? 'appTabActive' : ''}`}
            onClick={() => setActiveTab('diary')}
          >
            📓 일상 기록
          </button>
          <button
            className={`appTab ${activeTab === 'dashboard' ? 'appTabActive' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 대시보드
          </button>
          <button
            className={`appTab ${activeTab === 'blog' ? 'appTabActive' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            ✍️ 블로그
          </button>
        </nav>
        <div className="appUserArea">
          <span className="appUserEmail">{user?.signInDetails?.loginId ?? ''}</span>
          <button className="appLogoutBtn" onClick={() => void logout()}>로그아웃</button>
        </div>
      </header>

      <main className="appMain">
        {activeTab === 'portfolio' && (
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

        {activeTab === 'diary' && (
          <div className="fullPane">
            <DiaryList />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="fullPane">
            <Dashboard />
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="fullPane">
            <BlogList />
          </div>
        )}
      </main>
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
