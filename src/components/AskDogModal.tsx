import React, { useState } from 'react';
import { ReviewItem, StockItem } from '../types';
import { useFrisbeeStore } from '../services/store';
import { askQuestionAboutResult } from '../services/searchAgent';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2, Disc, Check } from 'lucide-react';

interface AskDogModalProps {
  item: ReviewItem | StockItem;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'dog';
  text: string;
  querySuggestion?: string;
}

export const AskDogModal: React.FC<AskDogModalProps> = ({ item, onClose }) => {
  const settings = useFrisbeeStore((state) => state.settings);
  const addTasks = useFrisbeeStore((state) => state.addTasks);
  const setActiveTab = useFrisbeeStore((state) => state.setActiveTab);

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [thrownQueries, setThrownQueries] = useState<{ [query: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'dog',
      text: `ワン！🐶「${item.query}」について持ってきた成果だよ！この調査結果について気になるところを何でも聞いてね！`,
    },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion('');
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: userText,
        querySuggestion: `${item.query} ${userText}`,
      },
    ]);
    setLoading(true);

    try {
      const answer = await askQuestionAboutResult(item, userText, settings);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'dog',
          text: answer,
          querySuggestion: `${item.query} ${userText}`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 2}`,
          sender: 'dog',
          text: 'クゥ〜ン... (質問の回答作成中にエラーが発生しました)',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Throw Question as New Frisbee Search Task
  const handleThrowFrisbee = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    addTasks([trimmed], `質問からの派生探索 (元テーマ: ${item.query})`);
    setThrownQueries((prev) => ({ ...prev, [searchQuery]: true }));

    setToastMessage(`🥏 「${trimmed}」を新しいフリスビーとして投げました！`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#151824] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#191d2c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-lg">
              🐕
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                愛犬エージェントに深掘り質問
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                コンテキスト: {item.query}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast Banner */}
        {toastMessage && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300 flex items-center justify-between animate-fade-in">
            <span>{toastMessage}</span>
            <button
              onClick={() => {
                onClose();
                setActiveTab('queue');
              }}
              className="underline hover:text-amber-200 text-[11px]"
            >
              探索キューを見に行く ➔
            </button>
          </div>
        )}

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-[#111320] border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" /> クイック質問:
          </span>
          {[
            '発売時期やリリースの目処は？',
            '予想価格やコストは？',
            '主な性能・スペックの特徴は？',
            'メリットと注意点をまとめて',
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setQuestion(preset)}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] flex-shrink-0 border border-slate-700 hover:border-amber-400/50 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Chat Message Trajectory */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[260px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                }`}
              >
                {msg.sender === 'user' ? '👤' : '🐕'}
              </div>

              <div className="space-y-1.5 max-w-[82%]">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-[#1e2235] border border-slate-700/80 text-slate-100 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Convert Question / Topic to New Frisbee Option */}
                {msg.querySuggestion && (
                  <div
                    className={`flex items-center gap-1 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {thrownQueries[msg.querySuggestion] ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                        <Check className="w-3 h-3" /> フリスビー投稿完了
                      </span>
                    ) : (
                      <button
                        onClick={() => handleThrowFrisbee(msg.querySuggestion!)}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-sm"
                        title="この質問テーマを新しいWeb検索タスクとして投稿"
                      >
                        <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                        <span>🥏 このキーワードで新しくフリスビーを投げる</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>愛犬がクンクン情報を調べて回答を作成中...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3.5 border-t border-slate-800 bg-[#171a29] space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="質問または新しい検索テーマを入力..."
              className="flex-1 bg-[#0d0f18] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
            
            {/* Direct Throw Button next to Send */}
            {question.trim() && (
              <button
                type="button"
                onClick={() => handleThrowFrisbee(`${item.query} ${question.trim()}`)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-xl text-xs flex items-center gap-1 font-semibold transition-all"
                title="質問をダイレクトに新フリスビーとして投げる"
              >
                <Disc className="w-4 h-4 text-amber-400" />
                🥏 投げる
              </button>
            )}

            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
              質問
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
