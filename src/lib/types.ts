export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface Citation {
  filename: string;
  content: string;
  paragraphIndex: number;
  score: number;
}

export interface DocumentChunk {
  id: string;
  filename: string;
  content: string;
  paragraphIndex: number;
  embeddings?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatResponse {
  content: string;
  citations: Citation[];
}

export interface EvalResult {
  question: string;
  expectedSources: string[];
  actualSources: string[];
  passed: boolean;
}

export interface EvalSummary {
  totalTests: number;
  passedTests: number;
  results: EvalResult[];
}