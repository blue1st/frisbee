import React, { useState } from 'react';
import { useFrisbeeStore } from '../services/store';
import { StockItem, StockFormat } from '../types';
import { AskDogModal } from './AskDogModal';
import { FormattedContentView } from './FormattedContentView';
import { openExternalUrl } from '../utils/openUrl';
import { reformatItemToTable } from '../services/searchAgent';
import { Database, Search, ExternalLink, Trash2, Calendar, FileText, MessageSquare, Table, List, Layers, Sparkles, Loader2, Wand2 } from 'lucide-react';

export const StockArchive: React.FC = () => {
  const stockItems = useFrisbeeStore((state) => state.stockItems);
  const removeStockItem = useFrisbeeStore((state) => state.removeStockItem);
  const updateStockFormat = useFrisbeeStore((state) => state.updateStockFormat);
  const updateStockItemTable = useFrisbeeStore((state) => state.updateStockItemTable);
  const settings = useFrisbeeStore((state) => state.settings);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [reformattingIds, setReformattingIds] = useState<{ [id: string]: boolean }>({});
  const [activeAskItem, setActiveAskItem] = useState<StockItem | null>(null);

  const handleReformatTable = async (item: StockItem) => {
    setReformattingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      const newTable = await reformatItemToTable(item, settings);
      updateStockItemTable(item.id, newTable);
      updateStockFormat(item.id, 'table');
    } catch (e) {
      console.error('Failed to reformat stock item table:', e);
    } finally {
      setReformattingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Extract all unique tags
  const allTags = Array.from(
    new Set(stockItems.flatMap((item) => item.tags))
  );

  // Filtered list
  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userNotes && item.userNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const FORMAT_OPTIONS: { id: StockFormat; label: string; icon: React.ReactNode }[] = [
    { id: 'full', label: '全統合', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'table', label: 'データ表', icon: <Table className="w-3.5 h-3.5" /> },
    { id: 'bullet', label: '箇条書き', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'summary', label: '短文要約', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2 text-white">
            <Database className="w-7 h-7 text-amber-400" />
            知識ストック (ナレッジ倉庫)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            愛犬が持ち帰り、あなたが厳選・承認したナレッジが蓄積されています (合計 {stockItems.length} 件)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#151824] p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ストック内を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0c13] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Tag Filter Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto items-center">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              selectedTag === null
                ? 'bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            すべて
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                selectedTag === tag
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/50'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[#151824] rounded-2xl border border-slate-800 space-y-2">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">条件に一致するストックナレッジはありません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredItems.map((item) => {
            const currentFormat = item.format || 'full';

            return (
              <div
                key={item.id}
                className="bg-[#171a29] rounded-2xl border border-slate-700/80 p-5 space-y-4 hover:border-slate-600 transition-all shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{item.query}</h3>
                    {item.subQueries && item.subQueries.length > 1 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                          ⚡ マルチ比較 ({item.subQueries.length}角度): {item.subQueries.join(' | ')}
                        </span>
                      </div>
                    ) : (
                      item.optimizedQuery && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 max-w-fit">
                          <span>🎯 最適化ワード:</span>
                          <span className="font-bold">{item.optimizedQuery}</span>
                        </div>
                      )
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(item.savedAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveAskItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>質問する</span>
                    </button>

                    <button
                      onClick={() => removeStockItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* View Format Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111320] px-3 py-1.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      閲覧形式:
                    </span>
                    <button
                      onClick={() => handleReformatTable(item)}
                      disabled={reformattingIds[item.id]}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition-all shadow-sm disabled:opacity-50"
                      title="画質・価格・発売時期などの具体項目ごとの比較表にAIで再ビルドします"
                    >
                      {reformattingIds[item.id] ? (
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                      ) : (
                        <Wand2 className="w-3 h-3 text-indigo-400" />
                      )}
                      <span>AIでスペック項目表に再成形</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-[#181c2e] p-1 rounded-lg border border-slate-800">
                    {FORMAT_OPTIONS.map((opt) => {
                      const isActive = currentFormat === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => updateStockFormat(item.id, opt.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
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

                {/* Formatted Content View */}
                <FormattedContentView item={item} format={currentFormat} />

                {/* User Notes */}
                {item.userNotes && (
                  <div className="text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    💬 <span className="font-semibold">メモ:</span> {item.userNotes}
                  </div>
                )}

                {/* Tags & Sources */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-slate-800/80">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 text-[11px] font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        onClick={(e) => {
                          e.preventDefault();
                          openExternalUrl(src.url);
                        }}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
                        title={src.title}
                      >
                        <span>[Source {idx + 1}]</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ask Dog Q&A Modal */}
      {activeAskItem && (
        <AskDogModal
          item={activeAskItem}
          onClose={() => setActiveAskItem(null)}
        />
      )}
    </div>
  );
};

