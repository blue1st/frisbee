import React, { useState } from 'react';
import { useFrisbeeStore } from '../services/store';
import { ReviewItem, StockFormat } from '../types';
import { AskDogModal } from './AskDogModal';
import { FormattedContentView } from './FormattedContentView';
import { FullDetailModal } from './FullDetailModal';
import { openExternalUrl } from '../utils/openUrl';
import { reformatItemToTable } from '../services/searchAgent';
import { Check, RefreshCw, X, ExternalLink, Tag, Sparkles, Inbox, MessageSquare, Table, List, FileText, Layers, Loader2, Wand2 } from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const reviewItems = useFrisbeeStore((state) => state.reviewItems);
  const acceptReviewItem = useFrisbeeStore((state) => state.acceptReviewItem);
  const retryTask = useFrisbeeStore((state) => state.retryTask);
  const updateReviewStatus = useFrisbeeStore((state) => state.updateReviewStatus);
  const updateReviewItemTable = useFrisbeeStore((state) => state.updateReviewItemTable);
  const setActiveTab = useFrisbeeStore((state) => state.setActiveTab);
  const settings = useFrisbeeStore((state) => state.settings);

  const pendingItems = reviewItems.filter((item) => item.status === 'pending');
  const [userNote, setUserNote] = useState<{ [id: string]: string }>({});
  const [customTagInput, setCustomTagInput] = useState<{ [id: string]: string }>({});
  const [selectedFormats, setSelectedFormats] = useState<{ [id: string]: StockFormat }>({});
  const [reformattingIds, setReformattingIds] = useState<{ [id: string]: boolean }>({});
  const [activeAskItem, setActiveAskItem] = useState<ReviewItem | null>(null);
  const [expandItem, setExpandItem] = useState<ReviewItem | null>(null);

  const handleReformatTable = async (item: ReviewItem) => {
    setReformattingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      const newTable = await reformatItemToTable(item, settings);
      updateReviewItemTable(item.id, newTable);
      setSelectedFormats((prev) => ({ ...prev, [item.id]: 'table' }));
    } catch (e) {
      console.error('Failed to reformat table:', e);
    } finally {
      setReformattingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleAccept = (item: ReviewItem, suggestedTags: string[]) => {
    const note = userNote[item.id] || '';
    const extraTag = customTagInput[item.id]?.trim();
    const finalTags = extraTag ? [...suggestedTags, extraTag] : suggestedTags;
    const format = selectedFormats[item.id] || item.format || 'full';

    acceptReviewItem(item.id, note, finalTags, format);
  };

  const handleDrop = (id: string) => {
    updateReviewStatus(id, 'dropped');
  };

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
            <Inbox className="w-7 h-7 text-amber-400" />
            成果物のユーザーチェック (咥えて帰ってきたフリスビー)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            愛犬が持ち帰った具体的成果を確認・質問し、「採択・保管(Stock)」「条件変更して再探索(Retry)」「棄却(Drop)」を選択してください。
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
          評価待ち: {pendingItems.length} 件
        </span>
      </div>

      {pendingItems.length === 0 ? (
        <div className="p-12 text-center bg-[#151824] rounded-2xl border border-slate-800 space-y-3">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">現在チェック待ちの成果物はありません。</p>
          <button
            onClick={() => setActiveTab('launch')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            新しい検索ワードを投入する 🥏
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#171a29] rounded-2xl border border-slate-700/80 p-5 space-y-4 shadow-xl relative overflow-hidden"
            >
              {/* Badge & Query Title */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      🥏 FETCH RESULT
                    </span>
                    {item.subQueries && item.subQueries.length > 1 && (
                      <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-400/30 flex items-center gap-1 animate-pulse">
                        ⚡ MULTI-ANGLE FETCH ({item.subQueries.length}角度統合)
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mt-1.5">
                    {item.query}
                  </h3>

                  {/* SubQueries Tags if Multi-Angle */}
                  {item.subQueries && item.subQueries.length > 1 ? (
                    <div className="space-y-1 mt-1.5">
                      <span className="text-[11px] text-cyan-400/90 font-bold block">
                        🔗 分解・並列探索されたサブクエリ:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.subQueries.map((sq, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-mono text-cyan-200 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded-md"
                          >
                            探{idx + 1}: {sq}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    item.optimizedQuery && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono mt-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 max-w-fit">
                        <span>🎯 最適化検索キーワード:</span>
                        <span className="font-bold">{item.optimizedQuery}</span>
                      </div>
                    )
                  )}

                  <span className="text-[11px] text-slate-500 font-mono block mt-1">
                    取得日時: {new Date(item.fetchedAt).toLocaleString('ja-JP')}
                  </span>
                </div>

                <button
                  onClick={() => setActiveAskItem(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>愛犬に質問する</span>
                </button>
              </div>

              {/* Format Selection Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111320] px-3 py-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    保存・閲覧形式の選択:
                  </span>
                  <button
                    onClick={() => handleReformatTable(item)}
                    disabled={reformattingIds[item.id]}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition-all shadow-sm disabled:opacity-50"
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
                    const currentFormat = selectedFormats[item.id] || item.format || 'full';
                    const isActive = currentFormat === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setSelectedFormats({ ...selectedFormats, [item.id]: opt.id })
                        }
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
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

              {/* Formatted Content Interactive Preview */}
              <FormattedContentView
                item={item}
                format={selectedFormats[item.id] || item.format || 'full'}
                onExpand={() => setExpandItem(item)}
              />

              {/* Source URLs */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  🔗 参照元 WEBソース ({item.sources.length} 件)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {item.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      onClick={(e) => {
                        e.preventDefault();
                        openExternalUrl(src.url);
                      }}
                      className="p-2.5 rounded-lg bg-[#111320] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs flex items-center justify-between text-slate-300 hover:text-amber-300 transition-all group cursor-pointer"
                    >
                      <div className="truncate pr-3">
                        <span className="font-semibold block truncate">{src.title}</span>
                        <span className="text-[11px] text-slate-500 truncate block">{src.url}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-amber-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Suggested Tags & User Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" /> 推奨タグ & 追加タグ
                  </label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {item.suggestedTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="+タグ追加"
                      value={customTagInput[item.id] || ''}
                      onChange={(e) =>
                        setCustomTagInput({ ...customTagInput, [item.id]: e.target.value })
                      }
                      className="bg-[#0f111a] border border-slate-700 text-xs text-slate-200 px-2 py-0.5 rounded w-24 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    ユーザー所感・メモ (ストック時に保存)
                  </label>
                  <input
                    type="text"
                    placeholder="この情報の使い道やコメント..."
                    value={userNote[item.id] || ''}
                    onChange={(e) =>
                      setUserNote({ ...userNote, [item.id]: e.target.value })
                    }
                    className="w-full bg-[#0f111a] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleDrop(item.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-semibold border border-slate-700 hover:border-red-500/40 transition-all"
                >
                  <X className="w-4 h-4" />
                  棄却 (Drop)
                </button>

                <button
                  onClick={() => retryTask(item.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs font-semibold border border-slate-700 hover:border-amber-500/40 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  再探索 (Retry)
                </button>

                <button
                  onClick={() => handleAccept(item, item.suggestedTags)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  採択・保管 (Stock)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Dog Q&A Modal */}
      {activeAskItem && (
        <AskDogModal
          item={activeAskItem}
          onClose={() => setActiveAskItem(null)}
        />
      )}

      {/* Full Detail Expand Modal */}
      {expandItem && (
        <FullDetailModal
          item={expandItem}
          initialFormat={selectedFormats[expandItem.id] || expandItem.format}
          onClose={() => setExpandItem(null)}
          onAskDog={(it) => setActiveAskItem(it as ReviewItem)}
        />
      )}
    </div>
  );
};
