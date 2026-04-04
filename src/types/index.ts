export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSection {
  id: string;
  type: 'intro' | 'experience' | 'skills' | 'projects' | 'education' | 'contact';
  title: string;
  content: string;
}

export interface Portfolio {
  id: string;
  sessionId: string;
  sections: PortfolioSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  message: Message;
  portfolio: Portfolio;
}

export interface ApiError {
  message: string;
  code?: string;
}
