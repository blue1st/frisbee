export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface FrisbeeTask {
  id: string;
  query: string;
  optimizedQuery?: string;
  subQueries?: string[];
  note?: string;
  createdAt: string;
  status: TaskStatus;
  progress: number;
  statusMessage: string;
}

export type ReviewStatus = 'pending' | 'accepted' | 'retried' | 'dropped';

export interface SourceArticle {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
}

export interface ReviewItem {
  id: string;
  taskId: string;
  query: string;
  optimizedQuery?: string;
  subQueries?: string[];
  summary: string;
  keyTakeaways: string[];
  sources: SourceArticle[];
  suggestedTags: string[];
  fetchedAt: string;
  status: ReviewStatus;
}

export interface StockItem {
  id: string;
  query: string;
  optimizedQuery?: string;
  subQueries?: string[];
  summary: string;
  keyTakeaways: string[];
  userNotes?: string;
  tags: string[];
  sources: SourceArticle[];
  savedAt: string;
}

export interface AppSettings {
  searxngUrl: string;
  aiProvider: 'demo' | 'openai' | 'ollama';
  aiApiKey: string;
  aiEndpoint: string;
  aiModel: string;
  autoProcessQueue: boolean;
  notifyOnFetchComplete: boolean;
}

declare global {
  interface Window {
    __TAURI__?: any;
    __TAURI_INTERNALS__?: any;
  }
}
