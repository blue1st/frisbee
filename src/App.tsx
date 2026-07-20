import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useFrisbeeStore } from './services/store';
import { executeTask } from './services/searchAgent';
import { QuickLauncher } from './components/QuickLauncher';
import { DogAnimator } from './components/DogAnimator';
import { FrisbeeLauncher } from './components/FrisbeeLauncher';
import { QueueList } from './components/QueueList';
import { ReviewQueue } from './components/ReviewQueue';
import { StockArchive } from './components/StockArchive';
import { SettingsModal } from './components/SettingsModal';
import { Disc, Clock, Inbox, Database, Settings, Minimize2, Minimize } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'quick' | 'full'>('quick');

  const activeTab = useFrisbeeStore((state) => state.activeTab);
  const setActiveTab = useFrisbeeStore((state) => state.setActiveTab);
  const tasks = useFrisbeeStore((state) => state.tasks);
  const activeTaskId = useFrisbeeStore((state) => state.activeTaskId);
  const reviewItems = useFrisbeeStore((state) => state.reviewItems);
  const settings = useFrisbeeStore((state) => state.settings);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const pendingReviews = reviewItems.filter((r) => r.status === 'pending');

  // Dog status state calculation
  let dogStatus: 'idle' | 'running' | 'carrying' | 'happy' = 'idle';
  if (activeTaskId && activeTask?.status === 'running') {
    dogStatus = 'running';
  } else if (pendingReviews.length > 0) {
    dogStatus = 'happy';
  }

  // Automatic Queue Runner Loop
  useEffect(() => {
    if (!settings.autoProcessQueue) return;
    if (activeTaskId) return;

    const nextTask = tasks.find((t) => t.status === 'queued');
    if (nextTask) {
      executeTask(nextTask, settings);
    }
  }, [tasks, activeTaskId, settings]);

  // Update Tray & Dock Badge Count on pendingReviews change
  useEffect(() => {
    invoke('update_tray_badge', { count: pendingReviews.length }).catch(() => {});
  }, [pendingReviews.length]);

  // Synchronous Listen to Tauri events for Tray clicks
  useEffect(() => {
    let unlistenFull: (() => void) | undefined;
    let unlistenQuick: (() => void) | undefined;

    listen('open-full-view', () => {
      setViewMode('full');
    }).then((un) => { unlistenFull = un; });

    listen('open-quick-view', () => {
      setViewMode('quick');
    }).then((un) => { unlistenQuick = un; });

    return () => {
      if (unlistenFull) unlistenFull();
      if (unlistenQuick) unlistenQuick();
    };
  }, []);

  // Handle Tray Minimize
  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.hide();
    } catch (e) {
      console.warn('Tauri hide window failed:', e);
    }
  };

  // Switch to Quick View and resize window
  const switchToQuickView = async () => {
    setViewMode('quick');
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('resize_window', { mode: 'quick' });
    } catch (e) {}
  };

  // Render Spotlight Quick Launcher View
  if (viewMode === 'quick') {
    return <QuickLauncher onClose={handleMinimize} />;
  }

  // Render Full Main App View (Classic View)
  return (
    <div className="flex flex-col h-screen bg-[#0d0f18] text-slate-100 font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* Top Header / App Bar */}
      <header
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
            getCurrentWindow().startDragging();
          }
        }}
        data-tauri-drag-region
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#131522]/90 backdrop-blur-md cursor-move select-none"
      >
        <div data-tauri-drag-region className="flex items-center gap-3 pointer-events-none">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold text-lg shadow-inner">
            🥏
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-none">
              Frisbee <span className="text-amber-400 font-['DotGothic16'] text-xs ml-1">v0.1</span>
            </h1>
            <p className="text-[11px] text-slate-400">非同期情報探索エージェント (トレイ常駐中)</p>
          </div>
        </div>

        {/* Window Controls */}
        <div
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="flex items-center gap-2"
        >
          <button
            onClick={switchToQuickView}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs border border-slate-700 transition-colors cursor-pointer"
            title="クイック入力ポップアップに戻す"
          >
            <Minimize className="w-3.5 h-3.5" />
            <span>クイックバーへ</span>
          </button>

          <button
            onClick={handleMinimize}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition-colors cursor-pointer"
            title="システムトレイに格納"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>トレイに格納</span>
          </button>
        </div>
      </header>

      {/* Top Banner: Dog Animation Hero Bar */}
      <div className="px-5 pt-4 pb-2 bg-gradient-to-b from-[#131522] to-transparent">
        <DogAnimator
          status={dogStatus}
          currentQuery={activeTask?.query}
        />
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-2 px-5 py-2 border-b border-slate-800/80 bg-[#111320]">
        {[
          { id: 'launch', label: 'フリスビー投擲', icon: Disc, badge: null },
          {
            id: 'queue',
            label: '探索キュー',
            icon: Clock,
            badge: tasks.filter((t) => t.status === 'queued' || t.status === 'running').length,
          },
          {
            id: 'review',
            label: '成果チェック',
            icon: Inbox,
            badge: pendingReviews.length,
            highlight: pendingReviews.length > 0,
          },
          { id: 'stock', label: '知識ストック', icon: Database, badge: null },
          { id: 'settings', label: '設定', icon: Settings, badge: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all relative ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
              <span>{tab.label}</span>

              {tab.badge !== null && tab.badge > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    tab.highlight
                      ? 'bg-amber-400 text-slate-950 animate-bounce'
                      : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Tab View Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'launch' && <FrisbeeLauncher />}
        {activeTab === 'queue' && <QueueList />}
        {activeTab === 'review' && <ReviewQueue />}
        {activeTab === 'stock' && <StockArchive />}
        {activeTab === 'settings' && <SettingsModal />}
      </main>
    </div>
  );
};

export default App;
