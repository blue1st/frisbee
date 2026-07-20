import React, { useState, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useFrisbeeStore } from '../services/store';
import { Send, Sparkles, X, Move } from 'lucide-react';

interface QuickLauncherProps {
  onClose: () => void;
}

export const QuickLauncher: React.FC<QuickLauncherProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const addTasks = useFrisbeeStore((state) => state.addTasks);
  const tasks = useFrisbeeStore((state) => state.tasks);
  const reviewItems = useFrisbeeStore((state) => state.reviewItems);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pendingReviews = reviewItems.filter((r) => r.status === 'pending');
  const runningTasks = tasks.filter((t) => t.status === 'running' || t.status === 'queued');

  // Auto-focus input when popped up
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'SELECT' ||
        target.closest('button') ||
        target.closest('input')
      ) {
        return;
      }

      try {
        getCurrentWindow().startDragging();
      } catch (err) {
        console.warn('startDragging error:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmed = query.trim();
    addTasks([trimmed]);
    setQuery('');

    // Hide window to tray after throwing
    try {
      await getCurrentWindow().hide();
    } catch (e) {
      console.warn('Hide window failed:', e);
    }
  };

  return (
    <div
      onMouseDown={handleHeaderMouseDown}
      data-tauri-drag-region
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className="flex flex-col h-screen w-screen bg-[#131522]/95 text-slate-100 p-3 font-['Plus_Jakarta_Sans'] select-none backdrop-blur-2xl border border-amber-500/40 rounded-2xl shadow-xl justify-between overflow-hidden box-border cursor-move"
    >
      {/* Top Header Bar */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 cursor-move"
      >
        <div data-tauri-drag-region className="flex items-center gap-2 pointer-events-none">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xs">
            🥏
          </div>
          <span className="text-xs font-extrabold text-white tracking-wide">
            Frisbee Launcher
          </span>
          {runningTasks.length > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse flex items-center gap-1 shadow-sm">
              <span>🐕 探索中</span>
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold">{runningTasks.length}</span>
            </span>
          )}
          {pendingReviews.length > 0 && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1 shadow-sm">
              <span>成果</span>
              <span className="bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold">{pendingReviews.length}</span>
            </span>
          )}
        </div>

        <div
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="flex items-center gap-1.5 pointer-events-auto"
        >
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5 pointer-events-none font-mono">
            <Move className="w-3 h-3 text-slate-500" /> ドラッグ可
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="閉じ込む"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Quick Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="my-auto space-y-2 pointer-events-auto"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>

          <div className="relative flex items-center bg-[#0d0f18] rounded-xl border border-slate-700/80 px-3 py-1">
            <span className="text-base mr-2 select-none">🥏</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索キーワードを投げる (Enterで即探索)..."
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans py-1.5 cursor-text"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="ml-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow disabled:opacity-40 transition-all flex-shrink-0 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>投げる</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> 例:
          </span>
          {[
            'Tauri v2 高速化',
            'Rust Async Tokio',
            'SearXNG 連携',
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(preset)}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700/80 flex-shrink-0 transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>

      {/* Footer hint */}
      <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/80 pt-1 font-mono pointer-events-none">
        💡 投げると即座にトレイへ格納し、愛犬がバックグラウンドで走ります
      </div>
    </div>
  );
};
