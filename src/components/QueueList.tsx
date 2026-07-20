import React from 'react';
import { useFrisbeeStore } from '../services/store';
import { executeTask } from '../services/searchAgent';
import { Play, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, Disc } from 'lucide-react';

export const QueueList: React.FC = () => {
  const tasks = useFrisbeeStore((state) => state.tasks);
  const settings = useFrisbeeStore((state) => state.settings);
  const removeTask = useFrisbeeStore((state) => state.removeTask);
  const activeTaskId = useFrisbeeStore((state) => state.activeTaskId);
  const setActiveTab = useFrisbeeStore((state) => state.setActiveTab);

  const queuedTasks = tasks.filter((t) => t.status === 'queued' || t.status === 'running');
  const finishedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'failed');

  const handleRunTask = (task: typeof tasks[0]) => {
    executeTask(task, settings);
  };

  const handleRunAll = async () => {
    for (const task of tasks.filter((t) => t.status === 'queued')) {
      await executeTask(task, settings);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2 text-white">
            <Clock className="w-7 h-7 text-amber-400" />
            フリスビー探索キュー
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            愛犬が順番にWebへ飛び出して情報をとってきます (合計 {tasks.length} 件)
          </p>
        </div>

        {queuedTasks.length > 0 && (
          <button
            onClick={handleRunAll}
            disabled={!!activeTaskId}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md disabled:opacity-50 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            すべてのキューを順番に実行
          </button>
        )}
      </div>

      {/* Queued / Running Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          進行中・待機中 ({queuedTasks.length})
        </h3>

        {queuedTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#151824] rounded-2xl border border-slate-800 space-y-3">
            <Disc className="w-10 h-10 text-slate-600 mx-auto animate-bounce-slow" />
            <p className="text-slate-400 text-sm">現在待機中のフリスビーはありません。</p>
            <button
              onClick={() => setActiveTab('launch')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              新しい検索ワードを投入する 🥏
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {queuedTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  task.status === 'running'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-[#171a29] border-slate-700/70 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-base">
                        {task.query}
                      </span>
                      {task.status === 'running' && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          FETCHING...
                        </span>
                      )}
                    </div>
                    {task.note && (
                      <p className="text-xs text-slate-400 italic">💡 {task.note}</p>
                    )}
                    <p className="text-xs text-amber-400/90 font-mono mt-1">
                      🐕 {task.statusMessage}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'queued' && (
                      <button
                        onClick={() => handleRunTask(task)}
                        disabled={!!activeTaskId}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold transition-all"
                        title="今すぐ実行"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => removeTask(task.id)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {task.status === 'running' && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finished Section */}
      {finishedTasks.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            探索完了・過去履歴 ({finishedTasks.length})
          </h3>
          <div className="space-y-2">
            {finishedTasks.map((task) => (
              <div
                key={task.id}
                className={`flex flex-col p-3.5 rounded-xl border text-xs ${
                  task.status === 'completed'
                    ? 'bg-[#131522] border-slate-800 text-slate-400'
                    : 'bg-red-950/20 border-red-500/30 text-red-200 space-y-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className="font-bold text-slate-200 text-sm">{task.query}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'failed' && (
                      <button
                        onClick={() => handleRunTask(task)}
                        disabled={!!activeTaskId}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                        title="同じクエリで再探索を実行"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>再探索 (Retry)</span>
                      </button>
                    )}
                    <button
                      onClick={() => removeTask(task.id)}
                      className="p-1 hover:text-slate-200 text-slate-500"
                      title="履歴から削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {task.status === 'failed' && (
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 space-y-1.5">
                    <p className="text-[11px] font-mono text-red-300 leading-relaxed">
                      🐕 {task.statusMessage}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-red-900/40">
                      <span>💡 SearXNGサーバー復旧後に「再探索」をお試しください</span>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="text-amber-400 hover:underline font-semibold"
                      >
                        SearXNG URL設定を変更 ⚙️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
