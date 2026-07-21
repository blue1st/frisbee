import React, { useState } from 'react';
import { ReviewItem, StockItem, StockFormat } from '../types';
import { FormattedContentView } from './FormattedContentView';
import { openExternalUrl } from '../utils/openUrl';
import { X, Maximize2, Sparkles, Layers, Table, List, FileText, ExternalLink, Calendar, Tag, MessageSquare } from 'lucide-react';

interface FullDetailModalProps {
  item: ReviewItem | StockItem;
  initialFormat?: StockFormat;
  onClose: () => void;
  onAskDog?: (item: ReviewItem | StockItem) => void;
}

export const FullDetailModal: React.FC<FullDetailModalProps> = ({
  item,
  initialFormat = 'full',
  onClose,
  onAskDog,
}) => {
  const [currentFormat, setCurrentFormat] = useState<StockFormat>(
    initialFormat || item.format || 'full'
  );

  const FORMAT_OPTIONS: { id: StockFormat; label: string; icon: React.ReactNode }[] = [
    { id: 'full', label: '全統合ビュー', icon: <Layers className="w-4 h-4" /> },
    { id: 'table', label: 'スペック・データ表', icon: <Table className="w-4 h-4" /> },
    { id: 'bullet', label: '箇条書きポイント', icon: <List className="w-4 h-4" /> },
    { id: 'summary', label: '要約短文', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#151824] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#181c2e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Maximize2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  ナレッジ全文拡大ビュー
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {'fetchedAt' in item ? new Date(item.fetchedAt).toLocaleString('ja-JP') : new Date(item.savedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <h3 className="font-extrabold text-white text-lg mt-1 truncate max-w-xl">
                {item.query}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Format Selector Bar inside Modal */}
        <div className="px-6 py-3 bg-[#111320] border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            表示形式の切替:
          </span>
          <div className="flex items-center gap-1.5 bg-[#181c2e] p-1 rounded-xl border border-slate-800">
            {FORMAT_OPTIONS.map((opt) => {
              const isActive = currentFormat === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setCurrentFormat(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Main Content Area */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              📄 要約・構造化データ本文
            </h4>
            <FormattedContentView item={item} format={currentFormat} />
          </div>

          {/* User Notes if any */}
          {'userNotes' in item && item.userNotes && (
            <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30 text-xs text-amber-200 leading-relaxed space-y-1">
              <span className="font-bold flex items-center gap-1 text-amber-400">
                💬 ユーザーメモ・所感:
              </span>
              <p className="text-slate-200">{item.userNotes}</p>
            </div>
          )}

          {/* Referenced Web Sources Detail */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>🔗 参照元 Web ソース情報 ({item.sources.length} 件)</span>
              <span className="text-[11px] text-slate-500 font-normal">クリックで外部リンクを開きます</span>
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {item.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  onClick={(e) => {
                    e.preventDefault();
                    openExternalUrl(src.url);
                  }}
                  className="p-3 rounded-xl bg-[#111320] hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 hover:text-amber-300 transition-all group cursor-pointer block space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-100 group-hover:text-amber-300">
                    <span className="truncate pr-2">[Source {idx + 1}] {src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {src.snippet}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block truncate">{src.url}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#181c2e] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {('tags' in item ? item.tags : item.suggestedTags).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-mono"
              >
                #{t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {onAskDog && (
              <button
                onClick={() => {
                  onClose();
                  onAskDog(item);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4 text-indigo-200" />
                <span>この件について愛犬に質問する</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
