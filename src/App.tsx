import { useChat } from './hooks/useChat';
import { ChatInterface } from './components/Chat/ChatInterface';
import { PortfolioView } from './components/Portfolio/PortfolioView';
import './App.css';

function App() {
  const { session, portfolio, isLoading, error, send, reset } = useChat();

  return (
    <div className="appLayout">
      <header className="appHeader">
        <span className="appLogo">✨</span>
        <h1 className="appTitle">AI 포트폴리오 빌더</h1>
        <span className="appBadge">Powered by AWS Bedrock</span>
      </header>

      <main className="appMain">
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
      </main>
    </div>
  );
}

export default App;
