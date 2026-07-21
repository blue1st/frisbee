import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FrisbeeTask, ReviewItem, StockItem, AppSettings, TableData } from '../types';

interface FrisbeeState {
  // Queue
  tasks: FrisbeeTask[];
  activeTaskId: string | null;
  // Review Queue
  reviewItems: ReviewItem[];
  // Final Stock
  stockItems: StockItem[];
  // Settings
  settings: AppSettings;
  // UI States
  activeTab: 'launch' | 'queue' | 'review' | 'stock' | 'settings';

  // Actions
  addTasks: (queries: string[], note?: string) => void;
  removeTask: (id: string) => void;
  updateTaskStatus: (id: string, status: FrisbeeTask['status'], progress?: number, message?: string) => void;
  
  addReviewItem: (item: Omit<ReviewItem, 'id' | 'fetchedAt' | 'status'>) => void;
  updateReviewStatus: (id: string, status: ReviewItem['status']) => void;
  
  acceptReviewItem: (id: string, userNotes?: string, customTags?: string[], selectedFormat?: FrisbeeState['stockItems'][0]['format']) => void;
  updateStockFormat: (id: string, format: FrisbeeState['stockItems'][0]['format']) => void;
  updateReviewItemTable: (id: string, tableData: TableData) => void;
  updateStockItemTable: (id: string, tableData: TableData) => void;
  retryTask: (reviewItemId: string) => void;

  removeStockItem: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setActiveTab: (tab: FrisbeeState['activeTab']) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  searxngUrl: 'https://searx.be',
  aiProvider: 'demo',
  aiApiKey: '',
  aiEndpoint: 'https://api.openai.com/v1',
  aiModel: 'gpt-4o-mini',
  autoProcessQueue: true,
  notifyOnFetchComplete: true,
};

const INITIAL_DEMO_TASKS: FrisbeeTask[] = [
  {
    id: 'demo-task-1',
    query: 'Rust WebGPU 2026年 最新トレンド',
    note: 'グラフィックスレンダリングの最適化手法',
    createdAt: new Date().toISOString(),
    status: 'queued',
    progress: 0,
    statusMessage: 'フリスビー投擲完了！待機中...',
  }
];

const INITIAL_DEMO_REVIEWS: ReviewItem[] = [
  {
    id: 'demo-review-1',
    taskId: 'demo-task-0',
    query: 'Tauri v2 モバイルとシステムトレイ最適化',
    summary: 'Tauri v2におけるクロスプラットフォーム対応とシステムトレイ常駐の省メモリベストプラクティス。Rust側での非同期スレッド制御とEvent Emitter連携により、メモリ使用量を15MB以下に抑える設計が注目されている。',
    keyTakeaways: [
      'TrayIconBuilder を活用した常駐機能の実装',
      'Event payload の軽量化によるプロセス間通信高速化',
      'macOS / Windows / Linux それぞれの権限設定パターン'
    ],
    tableData: {
      headers: ['評価項目', 'Tauri v1', 'Tauri v2'],
      rows: [
        ['メモリ消費量', '約 30MB', '約 15MB 以下'],
        ['モバイル対応', '未対応/実験的', 'iOS / Android 公式対応'],
        ['トレイAPI', '基本トレイのみ', '動的TrayIconBuilder API'],
      ],
    },
    sources: [
      { title: 'Tauri v2 Architecture Deep Dive', url: 'https://tauri.app/blog/v2-launch', snippet: 'Exploring lightweight system tray architecture and async IPC event loops.' },
      { title: 'Rust Tray Application Best Practices', url: 'https://example.com/rust-tray', snippet: 'How to manage memory efficiently in long-running rust desktop agents.' }
    ],
    suggestedTags: ['Tauri', 'Rust', 'DesktopApp', 'Optimization'],
    fetchedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'pending',
    format: 'full',
  }
];

const INITIAL_DEMO_STOCKS: StockItem[] = [
  {
    id: 'demo-stock-1',
    query: 'Vite 6 SSR & Dynamic Import 速度比較',
    summary: 'Vite 6でのビルド速度向上とダイナミックインポートのキャッシュ最適化技術についての調査結果。モジュールキャッシュ戦略によりコールドスタートが40%短縮。',
    keyTakeaways: ['Esbuild統合の高速化', 'HMR通信のWebSocket最適化', 'SSRの環境隔離強化'],
    tableData: {
      headers: ['比較指標', 'Vite 5', 'Vite 6 (最新)'],
      rows: [
        ['コールドスタート時間', '1.2 秒', '0.7 秒 (-40%)'],
        ['HMR応答速度', '45 ms', '18 ms'],
        ['SSR モジュール分離', '部分制限あり', '完全アイソレーション'],
      ],
    },
    tags: ['Vite', 'Frontend', 'Performance'],
    sources: [
      { title: 'Vite 6 Benchmark Reports', url: 'https://vitejs.dev', snippet: 'Benchmark of cold start and HMR updates.' }
    ],
    savedAt: new Date(Date.now() - 86400000).toISOString(),
    userNotes: '今後のフロントエンドプロジェクトのベース選定に利用',
    format: 'table',
  }
];

export const useFrisbeeStore = create<FrisbeeState>()(
  persist(
    (set, get) => ({
      tasks: INITIAL_DEMO_TASKS,
      activeTaskId: null,
      reviewItems: INITIAL_DEMO_REVIEWS,
      stockItems: INITIAL_DEMO_STOCKS,
      settings: DEFAULT_SETTINGS,
      activeTab: 'launch',

      addTasks: (queries, note) => {
        const newTasks: FrisbeeTask[] = queries.map((q, idx) => ({
          id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          query: q.trim(),
          note,
          createdAt: new Date().toISOString(),
          status: 'queued',
          progress: 0,
          statusMessage: 'フリスビーが投げられました！愛犬が探索待機中...',
        }));

        set((state) => ({
          tasks: [...state.tasks, ...newTasks],
        }));
      },

      removeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      updateTaskStatus: (id, status, progress, message) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              return {
                ...t,
                status,
                progress: progress !== undefined ? progress : t.progress,
                statusMessage: message !== undefined ? message : t.statusMessage,
              };
            }
            return t;
          }),
          activeTaskId: status === 'running' ? id : (state.activeTaskId === id ? null : state.activeTaskId),
        }));
      },

      addReviewItem: (itemData) => {
        const newItem: ReviewItem = {
          ...itemData,
          id: `review-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fetchedAt: new Date().toISOString(),
          status: 'pending',
          format: itemData.format || 'full',
        };

        set((state) => ({
          reviewItems: [newItem, ...state.reviewItems],
        }));
      },

      updateReviewStatus: (id, status) => {
        set((state) => ({
          reviewItems: state.reviewItems.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }));
      },

      acceptReviewItem: (id, userNotes, customTags, selectedFormat) => {
        const item = get().reviewItems.find((r) => r.id === id);
        if (!item) return;

        const newStock: StockItem = {
          id: `stock-${Date.now()}`,
          query: item.query,
          optimizedQuery: item.optimizedQuery,
          subQueries: item.subQueries,
          summary: item.summary,
          keyTakeaways: item.keyTakeaways,
          tableData: item.tableData,
          userNotes,
          tags: customTags && customTags.length > 0 ? customTags : item.suggestedTags,
          sources: item.sources,
          savedAt: new Date().toISOString(),
          format: selectedFormat || item.format || 'full',
        };

        set((state) => ({
          stockItems: [newStock, ...state.stockItems],
          reviewItems: state.reviewItems.map((r) =>
            r.id === id ? { ...r, status: 'accepted' as const } : r
          ),
        }));
      },

      updateStockFormat: (id, format) => {
        set((state) => ({
          stockItems: state.stockItems.map((s) =>
            s.id === id ? { ...s, format } : s
          ),
        }));
      },

      updateReviewItemTable: (id, tableData) => {
        set((state) => ({
          reviewItems: state.reviewItems.map((r) =>
            r.id === id ? { ...r, tableData } : r
          ),
        }));
      },

      updateStockItemTable: (id, tableData) => {
        set((state) => ({
          stockItems: state.stockItems.map((s) =>
            s.id === id ? { ...s, tableData } : s
          ),
        }));
      },

      retryTask: (reviewItemId) => {
        const item = get().reviewItems.find((r) => r.id === reviewItemId);
        if (!item) return;

        get().addTasks([item.query], `再探索 (前回評価からリトライ)`);
        get().updateReviewStatus(reviewItemId, 'retried');
      },

      removeStockItem: (id) => {
        set((state) => ({
          stockItems: state.stockItems.filter((s) => s.id !== id),
        }));
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },
    }),
    {
      name: 'frisbee-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
