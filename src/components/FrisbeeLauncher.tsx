import React, { useState } from 'react';
import { useFrisbeeStore } from '../services/store';
import { Send, Disc, Sparkles, Plus, Layers } from 'lucide-react';

export const FrisbeeLauncher: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [note, setNote] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const addTasks = useFrisbeeStore((state) => state.addTasks);
  const setActiveTab = useFrisbeeStore((state) => state.setActiveTab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    if (isBatchMode) {
      const queries = inputQuery
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);
      if (queries.length > 0) {
        addTasks(queries, note);
      }
    } else {
      addTasks([inputQuery.trim()], note);
    }

    setInputQuery('');
    setNote('');
    setActiveTab('queue');
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2 text-white font-['Plus_Jakarta_Sans']">
            <Disc className="w-7 h-7 text-amber-400 animate-spin-slow" />
            投げたいフリスビー (検索ワード) を投入
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            気になるキーワードや調査トピックをキューに登録。愛犬エージェントがバックグラウンドで情報探索へ走ります！
          </p>
        </div>

        <button
          onClick={() => setIsBatchMode(!isBatchMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isBatchMode
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          {isBatchMode ? '一括投入モード (ON)' : '通常投入モード'}
        </button>
      </div>

      {/* Frisbee Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          
          <div className="relative bg-[#171a29] rounded-2xl p-5 border border-slate-700/80 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                {isBatchMode ? '🥏 検索キーワード (1行に1ワード入力)' : '🥏 検索キーワード・テーマ'}
              </label>

              {isBatchMode ? (
                <textarea
                  rows={4}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`例:\nRust WebGPU 2026年最新トレンド\nTauri v2 モバイル統合\nSearXNG API 連携プロトコル`}
                  className="w-full bg-[#0f111a] border border-slate-700 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono text-sm leading-relaxed"
                />
              ) : (
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="例: Next.js 15 App Router パフォーマンス最適化..."
                  className="w-full bg-[#0f111a] border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-sans text-sm"
                />
              )}
            </div>

            {/* Sub Note */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">
                メモ・調査の観点 (任意)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例: 特にメモリ最適化と実例を中心に調査してほしい"
                className="w-full bg-[#0f111a]/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="w-5 h-5" />
                <span>フリスビーを投げる！ (探索開始)</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Preset / Quick Inspiration Tags */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          クイックインスピレーション (ワンタップ追加)
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Tauri v2 実践ベストプラクティス',
            'SearXNG ローカルサーバー環境構築',
            'TypeScript 5.6 新機能まとめ',
            'LLM エージェント自律型ワークフロー 2026',
            'Rust Async Tokio スレッド安全性',
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputQuery(preset);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-xs text-slate-300 hover:text-amber-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
