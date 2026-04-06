import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './lib/auth' // initialise Amplify
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { PublicPortfolioPage } from './components/Portfolio/PublicPortfolioPage.tsx'
import { PublicBlogListPage } from './components/Blog/PublicBlogListPage.tsx'
import { PublicBlogPostPage } from './components/Blog/PublicBlogPostPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/portfolio/:portfolioId" element={<PublicPortfolioPage />} />
            <Route path="/blog/:userId" element={<PublicBlogListPage />} />
            <Route path="/blog/:userId/:postId" element={<PublicBlogPostPage />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
