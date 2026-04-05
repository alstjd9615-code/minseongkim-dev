import { useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontSize: 32 }}>
        ✨
      </div>
    );
  }

  if (!user) {
    if (showSignup) {
      return <SignupForm onSwitchToLogin={() => setShowSignup(false)} />;
    }
    return <LoginForm onSwitchToSignup={() => setShowSignup(true)} />;
  }

  return <>{children}</>;
}
