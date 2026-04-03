export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt?: string | number;
}
